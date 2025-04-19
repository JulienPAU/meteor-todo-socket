import React, { useState } from "react";
import { User } from "/imports/types/user";

interface NavbarProps {
    user: User | null;
    title: string;
    unreadMessagesCount?: number;
    showChat: boolean;
    onToggleChat: () => void;
    onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, title, unreadMessagesCount = 0, showChat, onToggleChat, onLogout }) => {
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
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>

                        <nav className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
                            <div className="navbar-start">
                                <button className="navbar-button action-button" onClick={onToggleChat}>
                                    {showChat ? (
                                        <span className="button-content">📝 Tâches</span>
                                    ) : (
                                        <span className="button-content">
                                            💬 Chat
                                            {unreadMessagesCount > 0 && <span className="notification-badge">{unreadMessagesCount}</span>}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="navbar-end">
                                <div className="navbar-user">
                                    <span>Bonjour, {user.username || "Utilisateur"}</span>
                                </div>
                                <button onClick={onLogout} className="navbar-button logout-button">
                                    Déconnexion
                                </button>
                            </div>
                        </nav>

                        {mobileMenuOpen && <div className="navbar-backdrop" onClick={() => setMobileMenuOpen(false)}></div>}
                    </>
                )}
            </div>
        </header>
    );
};
