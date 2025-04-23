import React, { useState, useRef, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import type { Task as TaskType } from "/imports/types/task";
import { ConfirmationModal } from "./ConfirmationModal";
import { UserActivityCollection, type UserActivity } from "../api/UserActivityCollection";
import "../types/meteor-extensions";

interface TaskProps {
    task: TaskType;
    onCheckboxClick: (task: TaskType) => void;
    onDeleteClick: (task: TaskType) => void;
    showCreator?: boolean;
    groupId?: string;
}

export const Task = ({ task, onCheckboxClick, onDeleteClick, showCreator, groupId }: TaskProps) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [localChecked, setLocalChecked] = useState(task.isChecked);
    const inputRef = useRef<HTMLInputElement>(null);
    const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUser = Meteor.user();

    useEffect(() => {
        setLocalChecked(task.isChecked);
    }, [task.isChecked]);

    useEffect(() => {
        return () => {
            if (Meteor.connection?._lastSessionId) {
                if (groupId) {
                    Meteor.call("userActivity.clear", "editing");
                } else {
                    Meteor.call("userActivity.clear");
                }
            }
        };
    }, [groupId]);

    const userEditingThisTask = useTracker(() => {
        if (groupId) {
            const handle = Meteor.subscribe("groupActivity", groupId);
            return UserActivityCollection.find({
                action: "editing",
                targetId: task._id,
                sessionId: { $ne: Meteor.connection?._lastSessionId || "" },
                groupId,
            }).fetch();
        }

        const handle = Meteor.subscribe("userActivity");
        return UserActivityCollection.findOne({
            action: "editing",
            targetId: task._id,
            sessionId: { $ne: Meteor.connection?._lastSessionId || "" },
            groupId: { $exists: false },
        });
    }, [task._id, groupId]);

    const currentUserEditing = useTracker(() => {
        if (groupId) return null;
        const sessionId = Meteor.connection?._lastSessionId;
        if (!sessionId) return null;

        const handle = Meteor.subscribe("userActivity");
        return UserActivityCollection.findOne({
            action: "editing",
            targetId: task._id,
            userId: Meteor.userId() || undefined,
            groupId: { $exists: false },
        });
    }, [task._id, groupId]);

    const userSelections = useTracker(() => {
        if (!groupId) return [];

        const handle = Meteor.subscribe("groupActivity", groupId);
        return UserActivityCollection.find({
            action: "selection",
            targetId: task._id,
            sessionId: { $ne: Meteor.connection?._lastSessionId || "" },
        }).fetch();
    }, [task._id, groupId]);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmation(true);
    };

    const handleToggleUrgent = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        Meteor.callAsync("tasks.toggleUrgent", task._id);
    };

    const handleConfirmDelete = () => {
        onDeleteClick(task);
        setShowConfirmation(false);
    };

    const handleCancelDelete = () => {
        setShowConfirmation(false);
    };

    const handleTaskTextClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setEditText(task.text);

        if (currentUser) {
            if (groupId) {
                Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "editing", task._id, groupId);
            } else {
                Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "editing", task._id);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleTaskTextClick(e as unknown as React.MouseEvent);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();

        const checkbox = e.target as HTMLInputElement;
        checkbox.checked = !checkbox.checked;

        onCheckboxClick({
            ...task,
            isChecked: !task.isChecked,
        });
    };

    const cancelEditing = () => {
        setIsEditing(false);

        if (Meteor.connection?._lastSessionId) {
            if (groupId) {
                Meteor.call("userActivity.clear", "editing");
            } else {
                Meteor.call("userActivity.clear");
            }
        }
    };

    const saveEdit = async () => {
        if (editText.trim() !== task.text) {
            try {
                if (Meteor.connection?._lastSessionId) {
                    if (groupId) {
                        Meteor.call("userActivity.clear", "editing");
                    } else {
                        Meteor.call("userActivity.clear");
                    }
                }

                await Meteor.callAsync("tasks.updateText", {
                    _id: task._id,
                    text: editText.trim(),
                });

                if (editTimeoutRef.current) {
                    clearTimeout(editTimeoutRef.current);
                }
            } catch (error) {
                console.error("Erreur lors de la mise à jour de la tâche:", error);
            }
        } else {
            if (Meteor.connection?._lastSessionId) {
                if (groupId) {
                    Meteor.call("userActivity.clear", "editing");
                } else {
                    Meteor.call("userActivity.clear");
                }
            }
        }
        setIsEditing(false);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setEditText(newText);

        if (currentUser) {
            if (groupId) {
                Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "editing", task._id, groupId);
            } else {
                Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "editing", task._id);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    const handleInputSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        if (!groupId || !currentUser) return;

        const target = e.target as HTMLInputElement;
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;

        if (start !== end) {
            Meteor.call("userActivity.setSelection", groupId, task._id, {
                start,
                end,
            });
        }
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        return () => {
            if (editTimeoutRef.current) {
                clearTimeout(editTimeoutRef.current);
                if (groupId) {
                    Meteor.call("userActivity.clear", "editing");
                } else {
                    Meteor.call("userActivity.clear");
                }
            }
        };
    }, [groupId]);

    useEffect(() => {
        if (!isEditing || !inputRef.current || !groupId) return;

        const input = inputRef.current;
        const highlightLayer = document.createElement("div");
        highlightLayer.style.position = "absolute";
        highlightLayer.style.pointerEvents = "none";
        highlightLayer.style.width = "100%";
        highlightLayer.style.height = "100%";
        highlightLayer.style.top = "0";
        highlightLayer.style.left = "0";

        const parent = input.parentElement;
        if (parent && parent.style.position !== "relative") {
            parent.style.position = "relative";
        }

        if (parent) {
            parent.appendChild(highlightLayer);

            for (const selection of userSelections) {
                if (selection.selection && selection.userId !== currentUser?._id) {
                    const highlight = document.createElement("div");
                    highlight.style.position = "absolute";
                    highlight.style.backgroundColor = `${selection.color}66`;
                    highlight.style.height = "100%";
                    highlight.style.top = "0";
                    highlight.style.pointerEvents = "none";

                    const charWidth = input.offsetWidth / input.value.length;
                    highlight.style.left = `${selection.selection.start * charWidth}px`;
                    highlight.style.width = `${(selection.selection.end - selection.selection.start) * charWidth}px`;

                    highlightLayer.appendChild(highlight);
                }
            }
        }

        return () => {
            parent?.contains(highlightLayer) && parent.removeChild(highlightLayer);
        };
    }, [userSelections, isEditing, currentUser, groupId]);

    return (
        <>
            <li className={`${task.isChecked ? "checked" : ""} ${task.isUrgent ? "urgent" : ""}`} data-id={task._id}>
                {!isEditing ? (
                    <>
                        <span>
                            <div className="task-edit-area" onClick={handleTaskTextClick} onKeyDown={handleKeyPress} role="button" tabIndex={0}>
                                <div className="task-content">
                                    {task.isUrgent && (
                                        <span className="urgent-indicator" title="Tâche urgente">
                                            ⚠️
                                        </span>
                                    )}
                                    <span className={task.isChecked ? "task-text text-completed" : "task-text"}>{task.text}</span>
                                </div>
                                {showCreator && task.createdBy && (
                                    <div className="task-creator">
                                        <small>Créée par: {task.createdBy}</small>
                                    </div>
                                )}
                            </div>

                            <div className="task-controls">
                                <button onClick={handleToggleUrgent} className={`urgent-btn ${task.isUrgent ? "active" : ""}`} type="button" title={task.isUrgent ? "Retirer l'urgence" : "Marquer comme urgent"}>
                                    <img src="/icons/siren.png" alt="Urgence" className="urgent-icon" />
                                </button>
                                <input type="checkbox" checked={!!task.isChecked} onClick={handleCheckboxClick} onChange={() => {}} className="task-checkbox" />
                                <button onClick={handleDeleteClick} className="delete-btn" type="button">
                                    &times;
                                </button>
                                <div className="drag-handle">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                        <circle cx="5" cy="4" r="2.5" fill="currentColor" />
                                        <circle cx="12" cy="4" r="2.5" fill="currentColor" />
                                        <circle cx="19" cy="4" r="2.5" fill="currentColor" />
                                        <circle cx="5" cy="12" r="2.5" fill="currentColor" />
                                        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                                        <circle cx="19" cy="12" r="2.5" fill="currentColor" />
                                        <circle cx="5" cy="20" r="2.5" fill="currentColor" />
                                        <circle cx="12" cy="20" r="2.5" fill="currentColor" />
                                        <circle cx="19" cy="20" r="2.5" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                        </span>

                        {Array.isArray(userEditingThisTask)
                            ? userEditingThisTask.length > 0 &&
                              userEditingThisTask.map((activity: UserActivity, index: number) => (
                                  <div
                                      key={`editing-${activity.sessionId || index}`}
                                      className="editing-indicator"
                                      style={{
                                          borderLeft: `3px solid ${activity.color || "#666"}`,
                                          backgroundColor: `${activity.color || "#666"}22`,
                                      }}
                                  >
                                      <em>{activity.username || "Quelqu'un"} modifie cette tâche...</em>
                                  </div>
                              ))
                            : userEditingThisTask && (
                                  <div className="editing-indicator">
                                      <em>Quelqu'un modifie cette tâche...</em>
                                  </div>
                              )}

                        {!groupId && (isEditing || currentUserEditing) && (
                            <div className="editing-indicator self-editing">
                                <em>Vous êtes en train de modifier cette tâche...</em>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="edit-controls">
                            <input ref={inputRef} type="text" value={editText} onChange={handleEditChange} onKeyDown={handleKeyDown} onSelect={groupId ? handleInputSelect : undefined} maxLength={280} className="edit-task-input" />
                            <div className="edit-buttons">
                                <button onClick={saveEdit} className="save-btn" type="button">
                                    ✓
                                </button>
                                <button onClick={cancelEditing} className="cancel-btn" type="button">
                                    ✕
                                </button>
                            </div>
                        </div>

                        {!groupId && (
                            <div className="editing-indicator self-editing">
                                <em>Vous êtes en train de modifier cette tâche...</em>
                            </div>
                        )}
                    </>
                )}
            </li>

            <ConfirmationModal isOpen={showConfirmation} message={`Êtes-vous sûr de vouloir supprimer la tâche "${task.text}" ?`} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} confirmText="Supprimer" cancelText="Annuler" />
        </>
    );
};
