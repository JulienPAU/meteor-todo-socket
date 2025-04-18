import React, { useState } from "react";
import { Task as TaskType } from "/imports/api/TasksCollection";
import { ConfirmationModal } from "./ConfirmationModal";

interface TaskProps {
    task: TaskType;
    onCheckboxClick: (task: TaskType) => void;
    onDeleteClick: (task: TaskType) => void;
}

export const Task = ({ task, onCheckboxClick, onDeleteClick }: TaskProps) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleDeleteClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmDelete = () => {
        onDeleteClick(task);
        setShowConfirmation(false);
    };

    const handleCancelDelete = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            <li className={task.isChecked ? "checked" : ""}>
                <input type="checkbox" checked={!!task.isChecked} onChange={() => onCheckboxClick(task)} className="task-checkbox" />
                <span className={task.isChecked ? "text-completed" : ""}>{task.text}</span>
                <button onClick={handleDeleteClick} className="delete-btn">
                    &times;
                </button>
            </li>

            <ConfirmationModal isOpen={showConfirmation} message={`Êtes-vous sûr de vouloir supprimer la tâche "${task.text}" ?`} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
        </>
    );
};
