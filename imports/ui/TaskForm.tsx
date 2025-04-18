import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { TaskInsert } from "/imports/types/task";
import { validateTaskText } from "../utils/validators";

export const TaskForm = () => {
    const [text, setText] = useState("");
    const [error, setError] = useState("");

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
            await Meteor.callAsync("tasks.insert", taskData);
            setText("");
        } catch (err: any) {
            setError(err.reason || "Erreur lors de l'ajout de la tâche");
        }
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <input type="text" placeholder="Type to add new tasks" value={text} onChange={(e) => setText(e.target.value)} maxLength={280} />

            <button type="submit">Add Task</button>
        </form>
    );
};
