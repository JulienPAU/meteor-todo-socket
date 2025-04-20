import React, { useState, useEffect } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";

import { TasksCollection } from "../../api/TasksCollection";
import type { Task as TaskType } from "../../types/task";
import { Task } from "../Task";
import { TaskForm } from "../TaskForm";

interface GroupTasksProps {
    groupId: string;
    currentUserId: string;
    onVisibilityChange?: (showAll: boolean) => void;
}

export const GroupTasks = ({ groupId, currentUserId, onVisibilityChange }: GroupTasksProps) => {
    const [hideCompleted, setHideCompleted] = useState(false);

    const { tasks, pendingTasksCount, isLoading } = useTracker(() => {
        const noDataAvailable = {
            tasks: [],
            pendingTasksCount: 0,
            isLoading: true,
        };

        if (!currentUserId) {
            return noDataAvailable;
        }

        const handler = Meteor.subscribe("tasks.inGroup", groupId);

        if (!handler.ready()) {
            return { ...noDataAvailable, isLoading: true };
        }

        const tasks = TasksCollection.find(
            hideCompleted
                ? {
                      groupId: groupId,
                      isChecked: { $ne: true },
                  }
                : { groupId: groupId },
            { sort: { createdAt: -1 } }
        ).fetch();

        const pendingTasksCount = TasksCollection.find({
            groupId: groupId,
            isChecked: { $ne: true },
        }).count();

        return { tasks, pendingTasksCount, isLoading: false };
    }, [groupId, hideCompleted, currentUserId]);

    useEffect(() => {
        if (onVisibilityChange) {
            onVisibilityChange(!hideCompleted);
        }
    }, [hideCompleted, onVisibilityChange]);

    const toggleChecked = ({ _id, isChecked }: Pick<TaskType, "_id" | "isChecked">) => {
        Meteor.callAsync("tasks.toggle", { _id, isChecked });
    };

    const deleteTask = ({ _id }: Pick<TaskType, "_id">) => {
        Meteor.callAsync("tasks.delete", { _id });
    };

    const toggleHideCompleted = () => {
        setHideCompleted(!hideCompleted);
    };

    if (isLoading) {
        return <div className="loading">Chargement des tâches...</div>;
    }

    return (
        <div className="group-tasks-container">
            <h3>Tâches collaboratives</h3>

            <TaskForm groupId={groupId} />

            <div className="filter">
                <button type="button" onClick={toggleHideCompleted}>
                    {hideCompleted ? "Montrer toutes les tâches" : "Masquer les tâches terminées"}
                </button>
                <span className="pending-count">
                    {pendingTasksCount} tâche{pendingTasksCount !== 1 ? "s" : ""} en attente
                </span>
            </div>

            {tasks.length > 0 ? (
                <ul className="tasks">
                    {tasks.map((task: TaskType) => (
                        <Task key={task._id} task={task} onCheckboxClick={toggleChecked} onDeleteClick={deleteTask} showCreator={true} groupId={groupId} />
                    ))}
                </ul>
            ) : (
                <div className="empty-tasks-message">
                    <p>{hideCompleted ? "Aucune tâche en attente dans ce groupe." : "Aucune tâche n'a encore été créée dans ce groupe."}</p>
                    <p>{hideCompleted ? "Toutes les tâches ont été complétées !" : "Utilisez le formulaire ci-dessus pour ajouter votre première tâche collaborative!"}</p>
                </div>
            )}
        </div>
    );
};
