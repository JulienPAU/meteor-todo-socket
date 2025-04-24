import React, { useState, useEffect, useRef } from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { TasksCollection } from "/imports/api/TasksCollection";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { Task as TaskComponent } from "./Task";
import { TaskForm } from "./TaskForm";
import { AddTaskModal } from "./AddTaskModal";
import { LoginForm } from "./auth/LoginForm";
import { RegisterForm } from "./auth/RegisterForm";
import { ChatContainer } from "./chat/ChatContainer";
import { GroupsContainer } from "./groups/GroupsContainer";
import { Navbar } from "./Navbar";
import { NotificationPermissionRequest } from "./NotificationPermissionRequest";
import { Meteor } from "meteor/meteor";
import { User } from "/imports/types/user";
import { Task } from "/imports/types/task";
import { GroupsCollection } from "/imports/api/GroupsCollection";
import { initTabNotifications, updateTabTitle } from "/imports/utils/tabNotifications";
import { registerServiceWorker, updateAppBadge, checkNotificationPermission, showNotification } from "/imports/utils/pwaManager";
import Sortable from "sortablejs";

type AppMode = "tasks" | "chat" | "groups";

export const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [appMode, setAppMode] = useState<AppMode>("tasks");
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    const prevNotificationsRef = useRef({ messages: 0, groups: false });
    const isInitialLoadRef = useRef(true);
    const tasksListRef = useRef<HTMLUListElement>(null);
    const sortableRef = useRef<Sortable | null>(null);

    const isTasksLoading = useSubscribe("tasks");
    const isMessagesLoading = useSubscribe("messages");
    const isGroupsLoading = useSubscribe("groups");
    const isAllGroupTasksLoading = useSubscribe("tasks.allGroupTasks");
    const isAllGroupMessagesLoading = useSubscribe("groupMessages.all");
    const [hideCompleted, setHideCompleted] = useState(false);

    const hasGroupActivity = useTracker(() => {
        if (!user || appMode === "groups") {
            return false;
        }

        const userGroups = GroupsCollection.find({ "members.userId": user._id }).fetch();

        for (const group of userGroups) {
            const groupId = group._id;

            const hasUnreadMessages =
                MessagesCollection.find({
                    groupId: groupId,
                    senderId: { $ne: user._id },
                    $or: [{ readBy: { $exists: false } }, { readBy: { $ne: user._id } }],
                }).count() > 0;

            const hasPendingTasks =
                TasksCollection.find({
                    groupId: groupId,
                    isChecked: { $ne: true },
                }).count() > 0;

            if (hasUnreadMessages || hasPendingTasks) {
                return true;
            }
        }

        return false;
    }, [user, appMode]);

    const unreadMessagesCount = useTracker(() => {
        if (!user || appMode === "chat") {
            return 0;
        }

        return MessagesCollection.find({
            receiverId: user._id,
            read: false,
        }).count();
    });

    useEffect(() => {
        const userId = localStorage.getItem("Meteor.userId");
        const token = localStorage.getItem("Meteor.loginToken");

        if (userId && token) {
            Meteor.callAsync("auth.getUserInfo", { userId })
                .then((userInfo) => {
                    if (userInfo) {
                        setUser({ _id: userId, username: userInfo.username });

                        if (Notification.permission === "default") {
                            setShowPermissionRequest(true);
                        }
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la récupération des infos utilisateur:", error);
                    handleLogout();
                });
        }

        const init = async () => {
            const registration = await registerServiceWorker();

            if (registration && navigator.serviceWorker) {
                navigator.serviceWorker.addEventListener("message", (event) => {
                    if (event.data && event.data.type === "BADGE_UPDATED") {
                        if ("setAppBadge" in navigator && typeof navigator.setAppBadge === "function") {
                            try {
                                if (event.data.count > 0) {
                                    navigator.setAppBadge(event.data.count);
                                } else {
                                    if ("clearAppBadge" in navigator && typeof navigator.clearAppBadge === "function") {
                                        navigator.clearAppBadge();
                                    }
                                }
                            } catch (error) {
                                console.error("Erreur lors de la mise à jour directe du badge:", error);
                            }
                        }
                    }
                });
            }

            checkNotificationPermission();
        };

        init();
    }, []);

    useEffect(() => {
        initTabNotifications();
    }, []);

    useEffect(() => {
        if (!user) return;

        updateTabTitle(unreadMessagesCount, hasGroupActivity);

        const totalNotifications = unreadMessagesCount + (hasGroupActivity ? 1 : 0);

        const messagesChanged = unreadMessagesCount !== prevNotificationsRef.current.messages;
        const groupsChanged = hasGroupActivity !== prevNotificationsRef.current.groups;
        const notificationsChanged = messagesChanged || groupsChanged;

        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            prevNotificationsRef.current = {
                messages: unreadMessagesCount,
                groups: hasGroupActivity,
            };
            updateAppBadge(totalNotifications);
            return;
        }

        if (notificationsChanged) {
            updateAppBadge(totalNotifications);

            prevNotificationsRef.current = {
                messages: unreadMessagesCount,
                groups: hasGroupActivity,
            };

            if (Notification.permission === "granted" && document.hidden) {
                if (messagesChanged && unreadMessagesCount > 0) {
                    showNotification(`${unreadMessagesCount} nouveau${unreadMessagesCount > 1 ? "x" : ""} message${unreadMessagesCount > 1 ? "s" : ""}`, {
                        body: `Vous avez ${unreadMessagesCount} message${unreadMessagesCount > 1 ? "s non lus" : " non lu"}`,
                        data: { url: "/", type: "messages" },
                    });
                }

                if (groupsChanged && hasGroupActivity) {
                    showNotification(`Activité dans vos groupes`, {
                        body: `Vous avez de nouvelles activités dans vos groupes collaboratifs`,
                        data: { url: "/", type: "groups" },
                    });
                }

                if (totalNotifications > 0 && !messagesChanged && !groupsChanged) {
                    showNotification(`${totalNotifications} notification${totalNotifications > 1 ? "s" : ""}`, {
                        body: "Vous avez des notifications non lues",
                        data: { url: "/" },
                    });
                }
            }
        }
    }, [user, unreadMessagesCount, hasGroupActivity]);

    const handleLogout = () => {
        localStorage.removeItem("Meteor.userId");
        localStorage.removeItem("Meteor.loginToken");
        setUser(null);
    };

    const toggleChat = () => {
        setAppMode(appMode === "chat" ? "tasks" : "chat");
    };

    const toggleGroups = () => {
        setAppMode(appMode === "groups" ? "tasks" : "groups");
    };

    const handleToggleChecked = ({ _id, isChecked }: Task) => Meteor.callAsync("tasks.toggle", { _id, isChecked });

    const handleDelete = ({ _id }: Task) => Meteor.callAsync("tasks.delete", { _id });

    const hideCompletedFilter = { isChecked: { $ne: true } };

    const pendingTasksCount = useTracker(() => {
        if (!user) {
            return 0;
        }
        return TasksCollection.find(hideCompletedFilter).count();
    });

    const pendingTasksTitle = `${pendingTasksCount ? ` (${pendingTasksCount})` : ""}`;

    const tasks = useTracker(() => {
        if (!user) {
            return [];
        }

        return TasksCollection.find(hideCompleted ? { ...hideCompletedFilter, groupId: { $exists: false } } : { groupId: { $exists: false } }, {
            sort: { isChecked: 1, isUrgent: -1, position: 1, createdAt: -1 },
        }).fetch();
    });

    useEffect(() => {
        if (tasksListRef.current && appMode === "tasks" && tasks.length > 0) {
            if (sortableRef.current) {
                sortableRef.current.destroy();
            }

            sortableRef.current = new Sortable(tasksListRef.current, {
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
                        Meteor.callAsync("tasks.updatePosition", newTaskIds, undefined).catch((error) => {
                            console.error("Erreur lors de la mise à jour des positions:", error);
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
    }, [tasks, appMode]);

    if (!user) {
        return (
            <div className="app">
                <Navbar user={null} title="📝️ To Do List" appMode="tasks" onToggleChat={() => {}} onToggleGroups={() => {}} onLogout={() => {}} />
                <div className="auth-container">
                    {showLogin ? (
                        <>
                            <LoginForm setUser={setUser} />
                            <p>
                                Pas encore inscrit ?{" "}
                                <button className="link-button" onClick={() => setShowLogin(false)}>
                                    Créer un compte
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <RegisterForm setUser={setUser} />
                            <p>
                                Déjà inscrit ?{" "}
                                <button className="link-button" onClick={() => setShowLogin(true)}>
                                    Se connecter
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (isTasksLoading()) {
        return (
            <div className="app">
                <Navbar user={user} title="📝️ To Do List" appMode="tasks" onToggleChat={toggleChat} onToggleGroups={toggleGroups} onLogout={handleLogout} />
                <div className="main">
                    <div className="loading-container">
                        <p>Chargement de vos données...</p>
                    </div>
                </div>
            </div>
        );
    }

    const getTitle = () => {
        switch (appMode) {
            case "chat":
                return "💬 Chat";
            case "groups":
                return "👥 Groupes Collaboratifs";
            case "tasks":
            default:
                return `📝️ To Do List${pendingTasksTitle}`;
        }
    };

    const renderContent = () => {
        switch (appMode) {
            case "chat":
                return <ChatContainer userId={user._id} />;

            case "groups":
                return <GroupsContainer user={user} />;

            case "tasks":
            default:
                return (
                    <>
                        <h2 className="task-title"> Mes tâches</h2>
                        <div className="filter">
                            <TaskForm />
                            <button onClick={() => setHideCompleted(!hideCompleted)}>{hideCompleted ? "Afficher tout" : "Masquer les tâches terminées"}</button>
                        </div>

                        <ul className="tasks" ref={tasksListRef}>
                            {tasks.map((task: Task) => (
                                <TaskComponent key={task._id} task={task} onCheckboxClick={handleToggleChecked} onDeleteClick={handleDelete} />
                            ))}
                        </ul>

                        <div className="tasks-edit-hint">
                            <em>Astuce : Cliquez sur le texte d'une tâche pour la modifier</em>
                            <br />
                            <em>Astuce : Utilisez le bouton de glisser-déposer pour réordonner vos tâches</em>
                        </div>

                        {tasks.length === 0 && (
                            <div className="empty-tasks-message">
                                <p>{hideCompleted ? "Pas de tâches en cours" : "Pas de tâches pour le moment"}</p>
                                <p>Ajoutez votre première tâche ci-dessus!</p>
                            </div>
                        )}
                    </>
                );
        }
    };

    return (
        <div className="app">
            <Navbar user={user} title={getTitle()} unreadMessagesCount={unreadMessagesCount} hasGroupActivity={hasGroupActivity} appMode={appMode} onToggleChat={toggleChat} onToggleGroups={toggleGroups} onLogout={handleLogout} />
            <div className="main">{renderContent()}</div>
            {user && showPermissionRequest && <NotificationPermissionRequest />}

            {/* N'afficher les contrôles mobiles que dans la vue des tâches personnelles */}
            {appMode === "tasks" && (
                <>
                    {showAddTaskModal && <AddTaskModal isOpen={true} onClose={() => setShowAddTaskModal(false)} />}
                    <button className="mobile-add-task-button" onClick={() => setShowAddTaskModal(true)}>
                        +
                    </button>
                    <button className="mobile-visibility-toggle" onClick={() => setHideCompleted(!hideCompleted)} title={hideCompleted ? "Afficher toutes les tâches" : "Masquer les tâches terminées"}>
                        <img src={hideCompleted ? "/icons/eye/open.png" : "/icons/eye/closed.png"} alt={hideCompleted ? "Afficher toutes les tâches" : "Masquer les tâches terminées"} />
                    </button>
                </>
            )}
        </div>
    );
};
