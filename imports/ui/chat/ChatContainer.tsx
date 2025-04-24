import React, { useState, useEffect } from "react";
import { useSubscribe } from "meteor/react-meteor-data";
import { UsersList } from "./UsersList";
import { ChatWindow } from "./ChatWindow";

interface ChatContainerProps {
    userId: string;
}

export const ChatContainer = ({ userId }: ChatContainerProps) => {
    const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 767);
    const [showUsersList, setShowUsersList] = useState(true);

    const usersLoading = useSubscribe("onlineUsers");

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 767);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleSelectUser = (userId: string, username: string) => {
        setSelectedUser({
            id: userId,
            username: username,
        });

        // En vue mobile, masquer la liste des utilisateurs
        if (isMobileView) {
            setShowUsersList(false);
        }
    };

    const handleBackToUsersList = () => {
        if (isMobileView) {
            setShowUsersList(true);
        }
    };

    if (usersLoading()) {
        return (
            <div className="chat-container">
                <div className="loading-container">
                    <p>Chargement des utilisateurs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-container ${isMobileView && selectedUser && !showUsersList ? "mobile-chat-active" : ""}`}>
            {(!isMobileView || !selectedUser || showUsersList) && <UsersList currentUserId={userId} selectedUserId={selectedUser?.id || null} onSelectUser={handleSelectUser} />}

            {selectedUser && (!isMobileView || !showUsersList) ? (
                <ChatWindow selectedUserId={selectedUser.id} selectedUsername={selectedUser.username} currentUserId={userId} isMobileView={isMobileView} onBackToUsersList={handleBackToUsersList} />
            ) : (
                !showUsersList && (
                    <div className="chat-main-area">
                        <div className="no-conversation">
                            <h3>Bienvenue dans le chat</h3>
                            <p>Sélectionnez un utilisateur pour commencer une conversation.</p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
