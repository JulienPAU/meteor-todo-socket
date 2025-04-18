import React from "react";

interface TaskProps {
    task: { text: string; isChecked?: boolean };
    onCheckboxClick: (task: any) => void;
    onDeleteClick: (task: any) => void;
}

export const Task = ({ task, onCheckboxClick, onDeleteClick }: TaskProps) => {
    return (
        <li className={task.isChecked ? "checked" : ""}>
            <input type="checkbox" checked={!!task.isChecked} onChange={() => onCheckboxClick(task)} className="task-checkbox" />
            <span className={task.isChecked ? "text-completed" : ""}>{task.text}</span>
            <button onClick={() => onDeleteClick(task)} className="delete-btn">
                &times;
            </button>
        </li>
    );
};
