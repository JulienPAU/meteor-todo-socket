import React, { useState } from "react";
import { Meteor } from "meteor/meteor";

export const TaskForm = () => {
    const [text, setText] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!text) return;

        await Meteor.callAsync("tasks.insert", {
            text: text.trim(),
        });

        setText("");
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Type to add new tasks" value={text} onChange={(e) => setText(e.target.value)} />

            <button type="submit">Add Task</button>
        </form>
    );
};
