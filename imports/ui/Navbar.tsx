import React, { useState } from "react";
import { User } from "/imports/types/user";

type AppMode = "tasks" | "chat" | "groups";

interface NavbarProps {
    user: User | null;
    title: string;
    unreadMessagesCount?: number;
    hasGroupActivity?: boolean;
    appMode: AppMode;
    onToggleChat: () => void;
    onToggleGroups: () => void;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, title, unreadMessagesCount = 0, hasGroupActivity = false, appMode, onToggleChat, onToggleGroups, onLogout }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1>{title}</h1>
                </div>

                {user && (
                    <>
                        <button className="navbar-hamburger" onClick={toggleMobileMenu} aria-label="Menu">
                            <span />
                            <span />
                            <span />
                        </button>

                        <nav className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
                            <div className="navbar-start">
                                {appMode !== "tasks" && (
                                    <button
                                        type="button"
                                        className="navbar-button action-button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            if (appMode === "chat") onToggleChat();
                                            if (appMode === "groups") onToggleGroups();
                                        }}
                                    >
                                        <span className="button-content">📝 Tâches</span>
                                    </button>
                                )}

                                {appMode !== "chat" && (
                                    <button
                                        type="button"
                                        className="navbar-button action-button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            onToggleChat();
                                        }}
                                    >
                                        <span className="button-content ">
                                            💬 Chat
                                            {unreadMessagesCount > 0 && <span className="notification-badge chat-badge">{unreadMessagesCount}</span>}
                                        </span>
                                    </button>
                                )}

                                {appMode !== "groups" && (
                                    <button
                                        type="button"
                                        className="navbar-button action-button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            onToggleGroups();
                                        }}
                                    >
                                        <span className="button-content">
                                            👥 Collaboratif
                                            {hasGroupActivity && <span className="notification-badge collab-badge">!</span>}
                                        </span>
                                    </button>
                                )}
                            </div>

                            <div className="navbar-end">
                                <div className="navbar-user">
                                    <span>Bonjour, {user.username || "Utilisateur"}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        onLogout();
                                    }}
                                    className="navbar-button logout-button"
                                >
                                    Déconnexion
                                </button>
                            </div>
                        </nav>

                        {mobileMenuOpen && <div className="navbar-backdrop" onClick={() => setMobileMenuOpen(false)} />}
                    </>
                )}
            </div>
        </header>
    );
};
