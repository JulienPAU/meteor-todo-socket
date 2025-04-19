import React, { useState } from "react";
import { useSubscribe } from "meteor/react-meteor-data";
import { UsersList } from "./UsersList";
import { ChatWindow } from "./ChatWindow";

interface ChatContainerProps {
    userId: string;
}

export const ChatContainer = ({ userId }: ChatContainerProps) => {
    const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);

    const usersLoading = useSubscribe("onlineUsers");

    const handleSelectUser = (userId: string, username: string) => {
        setSelectedUser({
            id: userId,
            username: username,
        });
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
        <div className="chat-container">
            <UsersList currentUserId={userId} selectedUserId={selectedUser?.id || null} onSelectUser={handleSelectUser} />

            {selectedUser ? (
                <ChatWindow selectedUserId={selectedUser.id} selectedUsername={selectedUser.username} currentUserId={userId} />
            ) : (
                <div className="chat-main-area">
                    <div className="no-conversation">
                        <h3>Bienvenue dans le chat</h3>
                        <p>Sélectionnez un utilisateur pour commencer une conversation.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
