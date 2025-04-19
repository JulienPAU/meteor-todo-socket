import React, { useState, useRef, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Task as TaskType } from "/imports/types/task";
import { ConfirmationModal } from "./ConfirmationModal";
import { UserActivityCollection } from "../api/UserActivityCollection";
import "../types/meteor-extensions";

interface TaskProps {
    task: TaskType;
    onCheckboxClick: (task: TaskType) => void;
    onDeleteClick: (task: TaskType) => void;
}

export const Task = ({ task, onCheckboxClick, onDeleteClick }: TaskProps) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const inputRef = useRef<HTMLInputElement>(null);
    const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUser = Meteor.user();

    const userEditingThisTask = useTracker(() => {
        const handle = Meteor.subscribe("userActivity");
        return UserActivityCollection.findOne({
            action: "editing",
            targetId: task._id,
            sessionId: { $ne: Meteor.connection?._lastSessionId || "" },
        });
    });

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmation(true);
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
            Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "editing", task._id);
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onCheckboxClick({
            ...task,
            isChecked: !task.isChecked,
        });
    };

    const cancelEditing = () => {
        setIsEditing(false);

        Meteor.call("userActivity.clear");
    };

    const saveEdit = async () => {
        if (editText.trim() !== task.text) {
            try {
                Meteor.call("userActivity.clear");

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
            Meteor.call("userActivity.clear");
        }
        setIsEditing(false);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setEditText(newText);

        if (currentUser) {
            Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "editing", task._id);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEditing();
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
                Meteor.call("userActivity.clear");
            }
        };
    }, []);

    return (
        <>
            <li className={task.isChecked ? "checked" : ""}>
                {!isEditing ? (
                    <>
                        <span className={task.isChecked ? "text-completed" : ""}>
                            <div className="task-edit-area" onClick={handleTaskTextClick}>
                                {task.text}
                            </div>
                        </span>
                        <div className="task-controls">
                            <input type="checkbox" checked={!!task.isChecked} onChange={handleCheckboxChange} className="task-checkbox" />
                            <button onClick={handleDeleteClick} className="delete-btn">
                                &times;
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="edit-controls">
                            <input ref={inputRef} type="text" value={editText} onChange={handleEditChange} onKeyDown={handleKeyDown} maxLength={280} className="edit-task-input" />
                            <div className="edit-buttons">
                                <button onClick={saveEdit} className="save-btn">
                                    ✓
                                </button>
                                <button onClick={cancelEditing} className="cancel-btn">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {userEditingThisTask && !isEditing && (
                    <div className="editing-indicator">
                        <em>Quelqu'un modifie cette tâche...</em>
                    </div>
                )}
            </li>

            <ConfirmationModal isOpen={showConfirmation} message={`Êtes-vous sûr de vouloir supprimer la tâche "${task.text}" ?`} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
        </>
    );
};
