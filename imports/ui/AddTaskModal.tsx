import React, { useState, useEffect, useRef } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { TaskInsert } from "/imports/types/task";
import { validateTaskText } from "../utils/validators";
import { UserActivityCollection, UserActivity } from "../api/UserActivityCollection";
import "../types/meteor-extensions";

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId?: string;
}

export const AddTaskModal = ({ isOpen, onClose, groupId }: AddTaskModalProps) => {
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUser = useTracker(() => Meteor.user());
    const currentSessionId = Meteor.connection?._lastSessionId || "";
    const modalRef = useRef<HTMLDivElement>(null);

    const userActivities = useTracker(() => {
        if (groupId) {
            const handle = Meteor.subscribe("groupActivity", groupId);
            return UserActivityCollection.find(
                {
                    action: "typing",
                    groupId,
                },
                { sort: { timestamp: -1 } }
            ).fetch();
        }

        const handle = Meteor.subscribe("userActivity");
        return UserActivityCollection.find(
            {
                action: "typing",
                groupId: { $exists: false },
            },
            { sort: { timestamp: -1 } }
        ).fetch();
    }, [groupId]);

    const otherUserTyping = userActivities.filter((activity: UserActivity) => {
        return activity.sessionId !== currentSessionId && activity.userId !== Meteor.userId();
    });

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setText(newText);

        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        if (newText.trim() && currentUser) {
            if (groupId) {
                Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "typing", undefined, groupId);
            } else {
                Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "typing");
            }

            typingTimeout.current = setTimeout(() => {
                Meteor.call("userActivity.clear", "typing");
            }, 10000);
        } else {
            Meteor.call("userActivity.clear", "typing");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const textValidation = validateTaskText(text);
        if (!textValidation.isValid) {
            setError(textValidation.error || "Texte invalide");
            return;
        }

        // Ne pas inclure groupId s'il est undefined
        const taskData: TaskInsert = {
            text: text.trim(),
        };

        // Ajouter groupId seulement s'il existe pour éviter l'erreur "undefined"
        if (groupId) {
            taskData.groupId = groupId;
        }

        try {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            Meteor.call("userActivity.clear", "typing");

            await Meteor.callAsync("tasks.insert", taskData);
            setText("");
            onClose();
        } catch (err: any) {
            console.error("Erreur lors de l'ajout de la tâche:", err);
            setError((err as { reason?: string }).reason || "Erreur lors de l'ajout de la tâche");
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            Meteor.call("userActivity.clear", "typing");
        };
    }, []);

    const getTypingMessage = () => {
        if (otherUserTyping.length === 0) return null;

        if (otherUserTyping.length === 1) {
            return (
                <em>
                    <span
                        style={{
                            color: groupId && otherUserTyping[0].color ? otherUserTyping[0].color : undefined,
                        }}
                    >
                        {otherUserTyping[0].username || "Quelqu'un"}
                    </span>{" "}
                    est en train d'écrire...
                </em>
            );
        }

        return (
            <em>
                <span
                    style={{
                        color: groupId && otherUserTyping[0].color ? otherUserTyping[0].color : undefined,
                    }}
                >
                    {otherUserTyping[0].username}
                </span>{" "}
                et {otherUserTyping.length - 1} autre(s) sont en train d'écrire...
            </em>
        );
    };

    // Fermer la modale si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content add-task-modal" ref={modalRef}>
                <div className="modal-header">
                    <h2>{groupId ? "Ajouter une tâche au groupe" : "Ajouter une tâche"}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-field">
                        <input type="text" placeholder={groupId ? "Nouvelle tâche de groupe" : "Nouvelle tâche personnelle"} value={text} onChange={handleTextChange} maxLength={280} autoFocus />
                    </div>

                    {otherUserTyping.length > 0 && (
                        <div
                            className="typing-indicator"
                            style={{
                                borderLeft: groupId && otherUserTyping[0].color ? `3px solid ${otherUserTyping[0].color}` : undefined,
                            }}
                        >
                            {getTypingMessage()}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="submit-btn" disabled={!text.trim()}>
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
