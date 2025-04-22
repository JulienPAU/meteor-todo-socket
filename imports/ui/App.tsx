import React, { useState, useEffect } from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { TasksCollection } from "/imports/api/TasksCollection";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { Task as TaskComponent } from "./Task";
import { TaskForm } from "./TaskForm";
import { LoginForm } from "./auth/LoginForm";
import { RegisterForm } from "./auth/RegisterForm";
import { ChatContainer } from "./chat/ChatContainer";
import { GroupsContainer } from "./groups/GroupsContainer";
import { Navbar } from "./Navbar";
import { Meteor } from "meteor/meteor";
import { User } from "/imports/types/user";
import { Task } from "/imports/types/task";
import { GroupsCollection } from "/imports/api/GroupsCollection";
import { initTabNotifications, updateTabTitle } from "/imports/utils/tabNotifications";
import { registerServiceWorker, updateAppBadge, checkNotificationPermission } from "/imports/utils/pwaManager";

type AppMode = "tasks" | "chat" | "groups";

export const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [appMode, setAppMode] = useState<AppMode>("tasks");

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
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la récupération des infos utilisateur:", error);
                    handleLogout();
                });
        }

        registerServiceWorker();
        checkNotificationPermission();
    }, []);

    useEffect(() => {
        initTabNotifications();
    }, []);

    useEffect(() => {
        if (user) {
            updateTabTitle(unreadMessagesCount, hasGroupActivity);

            const totalNotifications = unreadMessagesCount + (hasGroupActivity ? 1 : 0);
            updateAppBadge(totalNotifications);
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
            sort: { createdAt: -1 },
        }).fetch();
    });

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
                        <TaskForm />

                        <div className="filter">
                            <button onClick={() => setHideCompleted(!hideCompleted)}>{hideCompleted ? "Afficher tout" : "Masquer les tâches terminées"}</button>
                        </div>

                        <ul className="tasks">
                            {tasks.map((task: Task) => (
                                <TaskComponent key={task._id} task={task} onCheckboxClick={handleToggleChecked} onDeleteClick={handleDelete} />
                            ))}
                        </ul>

                        <div className="tasks-edit-hint">
                            <em>Astuce : Cliquez sur le texte d'une tâche pour la modifier</em>
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
        </div>
    );
};
