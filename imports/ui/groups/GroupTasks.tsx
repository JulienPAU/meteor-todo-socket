import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import Sortable from "sortablejs";

import { TasksCollection } from "../../api/TasksCollection";
import type { Task as TaskType } from "../../types/task";
import { Task } from "../Task";
import { TaskForm } from "../TaskForm";
import { AddTaskModal } from "../AddTaskModal";

interface GroupTasksProps {
    groupId: string;
    currentUserId: string;
    onVisibilityChange?: (showAll: boolean) => void;
    disableMobileControls?: boolean;
}

// Définir l'interface exposée via ref
export interface GroupTasksRefHandle {
    toggleHideCompleted: () => void;
}

export const GroupTasks = forwardRef<GroupTasksRefHandle, GroupTasksProps>(({ groupId, currentUserId, onVisibilityChange, disableMobileControls = false }, ref) => {
    const [hideCompleted, setHideCompleted] = useState(false);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const groupTasksListRef = useRef<HTMLUListElement>(null);
    const sortableRef = useRef<Sortable | null>(null);

    // Exposer la méthode toggleHideCompleted via ref
    useImperativeHandle(ref, () => ({
        toggleHideCompleted: () => {
            toggleHideCompleted();
        },
    }));

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
            { sort: { isChecked: 1, isUrgent: -1, position: 1, createdAt: -1 } }
        ).fetch();

        const pendingTasksCount = TasksCollection.find({
            groupId: groupId,
            isChecked: { $ne: true },
        }).count();

        return { tasks, pendingTasksCount, isLoading: false };
    }, [groupId, hideCompleted, currentUserId]);

    useEffect(() => {
        if (groupTasksListRef.current && tasks.length > 0) {
            if (sortableRef.current) {
                sortableRef.current.destroy();
            }

            sortableRef.current = new Sortable(groupTasksListRef.current, {
                animation: 150,
                handle: ".drag-handle",
                ghostClass: "sortable-ghost",
                chosenClass: "sortable-chosen",
                dragClass: "sortable-drag",
                onEnd: (evt) => {
                    const newTaskIds = Array.from(evt.to.children)
                        .map((item) => item.getAttribute("data-id"))
                        .filter((id): id is string => id !== null);

                    if (newTaskIds.length > 0) {
                        Meteor.callAsync("tasks.updatePosition", newTaskIds, groupId).catch((error) => {
                            console.error("Erreur lors de la mise à jour des positions de tâches de groupe:", error);
                        });
                    }
                },
            });
        }

        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
                sortableRef.current = null;
            }
        };
    }, [tasks, groupId]);

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
            <div className="filter">
                <TaskForm groupId={groupId} />
                <button type="button" onClick={toggleHideCompleted}>
                    {hideCompleted ? "Montrer toutes les tâches" : "Masquer les tâches terminées"}
                </button>
                <span className="pending-count">
                    {pendingTasksCount} tâche{pendingTasksCount !== 1 ? "s" : ""} en attente
                </span>
            </div>

            {tasks.length > 0 ? (
                <>
                    <ul className="tasks" ref={groupTasksListRef}>
                        {tasks.map((task: TaskType) => (
                            <Task key={task._id} task={task} onCheckboxClick={toggleChecked} onDeleteClick={deleteTask} showCreator={true} groupId={groupId} />
                        ))}
                    </ul>
                    <div className="tasks-edit-hint">
                        <em>Astuce : Utilisez le bouton de glisser-déposer pour réordonner les tâches du groupe</em>
                    </div>
                </>
            ) : (
                <div className="empty-tasks-message">
                    <p>{hideCompleted ? "Aucune tâche en attente dans ce groupe." : "Aucune tâche n'a encore été créée dans ce groupe."}</p>
                    <p>{hideCompleted ? "Toutes les tâches ont été complétées !" : "Utilisez le formulaire ci-dessus pour ajouter votre première tâche collaborative!"}</p>
                </div>
            )}

            {!disableMobileControls && showAddTaskModal && <AddTaskModal isOpen={true} onClose={() => setShowAddTaskModal(false)} groupId={groupId} />}

            {!disableMobileControls && (
                <>
                    <button className="mobile-add-task-button group-mobile-add-task-button" onClick={() => setShowAddTaskModal(true)}>
                        +
                    </button>
                    <button className="mobile-visibility-toggle group-mobile-visibility-toggle" onClick={toggleHideCompleted} title={hideCompleted ? "Afficher toutes les tâches" : "Masquer les tâches terminées"}>
                        <img src={hideCompleted ? "/icons/eye/open.png" : "/icons/eye/closed.png"} alt={hideCompleted ? "Afficher toutes les tâches" : "Masquer les tâches terminées"} />
                    </button>
                </>
            )}
        </div>
    );
});
