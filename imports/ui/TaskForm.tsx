import React, { useState, useEffect, useRef } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { TaskInsert } from "/imports/types/task";
import { validateTaskText } from "../utils/validators";
import { UserActivityCollection, UserActivity } from "../api/UserActivityCollection";
import "../types/meteor-extensions";

interface TaskFormProps {
    groupId?: string;
}

export const TaskForm = ({ groupId }: TaskFormProps) => {
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUser = useTracker(() => Meteor.user());
    const currentSessionId = Meteor.connection?._lastSessionId || "";

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

        const taskData: TaskInsert = {
            text: text.trim(),
            groupId,
        };

        try {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            Meteor.call("userActivity.clear", "typing");

            await Meteor.callAsync("tasks.insert", taskData);
            setText("");
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

    return (
        <div className="task-form-container">
            <form className="task-form" onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <input type="text" placeholder={groupId ? "Ajouter une nouvelle tâche au groupe" : "Saisissez une nouvelle tâche personnelle"} value={text} onChange={handleTextChange} maxLength={280} />

                <button type="submit">Ajouter</button>
            </form>

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
        </div>
    );
};
