import React, { useState, useEffect } from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { TasksCollection } from "/imports/api/TasksCollection";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { Task as TaskComponent } from "./Task";
import { TaskForm } from "./TaskForm";
import { LoginForm } from "./auth/LoginForm";
import { RegisterForm } from "./auth/RegisterForm";
import { ChatContainer } from "./chat/ChatContainer";
import { Meteor } from "meteor/meteor";
import { User } from "/imports/types/user";
import { Task } from "/imports/types/task";

export const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [showChat, setShowChat] = useState(false);

    const isTasksLoading = useSubscribe("tasks");
    const isMessagesLoading = useSubscribe("messages"); // Nécessaire pour les notifications de chat
    const [hideCompleted, setHideCompleted] = useState(false);

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
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("Meteor.userId");
        localStorage.removeItem("Meteor.loginToken");
        setUser(null);
    };

    const toggleChat = () => {
        setShowChat(!showChat);
    };

    const handleToggleChecked = ({ _id, isChecked }: Task) => Meteor.callAsync("tasks.toggleChecked", { _id, isChecked });

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

        return TasksCollection.find(hideCompleted ? hideCompletedFilter : {}, {
            sort: { createdAt: -1 },
        }).fetch();
    });

    const unreadMessagesCount = useTracker(() => {
        if (!user || showChat) {
            return 0;
        }

        return MessagesCollection.find({
            receiverId: user._id,
            read: false,
        }).count();
    });

    if (!user) {
        return (
            <div className="app">
                <header>
                    <div className="app-bar">
                        <div className="app-header">
                            <h1>📝️ To Do List</h1>
                        </div>
                    </div>
                </header>
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
                <header>
                    <div className="app-bar">
                        <div className="app-header">
                            <h1>📝️ To Do List</h1>
                        </div>
                    </div>
                </header>
                <div className="main">
                    <div className="loading-container">
                        <p>Chargement de vos tâches...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (showChat && user) {
        return (
            <div className="app">
                <header>
                    <div className="app-bar">
                        <div className="app-header">
                            <h1>💬 Chat</h1>
                        </div>
                        <div className="user-menu">
                            <button onClick={toggleChat} className="back-button" style={{ backgroundColor: "var(--secondary-color)" }}>
                                Retour aux tâches
                            </button>
                            <button onClick={handleLogout} className="logout-button">
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </header>
                <div className="main">
                    <ChatContainer userId={user._id} />
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <header>
                <div className="app-bar">
                    <div className="app-header">
                        <h1>
                            📝️ To Do List
                            {pendingTasksTitle}
                        </h1>
                    </div>
                    <div className="user-menu">
                        <button onClick={toggleChat} style={{ backgroundColor: "var(--primary-color)", position: "relative" }}>
                            💬 Chat
                            {unreadMessagesCount > 0 && (
                                <span className="chat-notification" title={`${unreadMessagesCount} message(s) non lu(s)`}>
                                    {unreadMessagesCount}
                                </span>
                            )}
                        </button>
                        <span>Bonjour, {user.username || "Utilisateur"}</span>
                        <button onClick={handleLogout} className="logout-button">
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>
            <div className="main">
                <TaskForm />

                <div className="filter">
                    <button onClick={() => setHideCompleted(!hideCompleted)}>{hideCompleted ? "Afficher tout" : "Masquer les terminées"}</button>
                </div>

                <ul className="tasks">
                    {tasks.map((task: Task) => (
                        <TaskComponent key={task._id} task={task} onCheckboxClick={handleToggleChecked} onDeleteClick={handleDelete} />
                    ))}
                </ul>

                {tasks.length === 0 && (
                    <div className="empty-tasks-message">
                        <p>{hideCompleted ? "Pas de tâches en cours" : "Pas de tâches pour le moment"}</p>
                        <p>Ajoutez votre première tâche ci-dessus!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
