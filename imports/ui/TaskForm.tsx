import React, { useState, useEffect, useRef } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { TaskInsert } from "/imports/types/task";
import { validateTaskText } from "../utils/validators";
import { UserActivityCollection, UserActivity } from "../api/UserActivityCollection";
import "../types/meteor-extensions";

export const TaskForm = () => {
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUser = useTracker(() => Meteor.user());

    const userActivities = useTracker(() => {
        const handle = Meteor.subscribe("userActivity");
        const activities = UserActivityCollection.find({ action: "typing" }, { sort: { timestamp: -1 } }).fetch();

        return activities;
    });

    const otherUserTyping = userActivities.filter((activity: UserActivity) => {
        return activity.sessionId !== (Meteor.connection?._lastSessionId || "");
    });

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setText(newText);

        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        if (newText.trim() && currentUser) {
            Meteor.call("userActivity.setTyping", currentUser.username || "Quelqu'un", "typing");

            typingTimeout.current = setTimeout(() => {
                Meteor.call("userActivity.clear");
            }, 2000);
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
        };

        try {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            Meteor.call("userActivity.clear");

            await Meteor.callAsync("tasks.insert", taskData);
            setText("");
        } catch (err: any) {
            setError(err.reason || "Erreur lors de l'ajout de la tâche");
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            Meteor.call("userActivity.clear");
        };
    }, []);

    return (
        <div className="task-form-container">
            <form className="task-form" onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <input type="text" placeholder="Saisissez une nouvelle tâche" value={text} onChange={handleTextChange} maxLength={280} />

                <button type="submit">Ajouter</button>
            </form>

            {otherUserTyping.length > 0 && (
                <div className="typing-indicator">
                    <em>Quelqu'un est en train d'écrire...</em>
                </div>
            )}
        </div>
    );
};
