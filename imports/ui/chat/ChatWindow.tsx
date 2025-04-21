import React, { useEffect, useRef, useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { Message } from "/imports/types/message";
import { MessageInput } from "./MessageInput";
import { decryptMessage } from "../../utils/validators";
import { ConfirmationModal } from "../ConfirmationModal";

interface ChatWindowProps {
    selectedUserId: string;
    selectedUsername: string;
    currentUserId: string;
}

export const ChatWindow = ({ selectedUserId, selectedUsername, currentUserId }: ChatWindowProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const isLoading = useSubscribe("conversationMessages", selectedUserId);

    const messages = useTracker(() => {
        if (!selectedUserId) return [];

        return MessagesCollection.find(
            {
                $or: [
                    { senderId: currentUserId, receiverId: selectedUserId },
                    { senderId: selectedUserId, receiverId: currentUserId },
                ],
            },
            {
                sort: { createdAt: 1 },
            }
        ).fetch();
    });

    useEffect(() => {
        const markMessagesAsRead = async () => {
            const unreadMessages = messages.filter((msg: Message) => msg.receiverId === currentUserId && !msg.read);

            for (const message of unreadMessages) {
                await Meteor.callAsync("messages.markAsRead", message._id);
            }
        };

        markMessagesAsRead();
    }, [messages, currentUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const formatMessageTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDecryptedContent = (message: Message): string => {
        return decryptMessage(message.content);
    };

    const handleDeleteClick = (messageId: string | undefined) => {
        if (!messageId) return;
        setMessageToDelete(messageId);
        setShowConfirmation(true);
    };

    const handleConfirmDelete = async () => {
        if (!messageToDelete) return;

        try {
            await Meteor.callAsync("messages.delete", messageToDelete);
            setShowConfirmation(false);
            setMessageToDelete(null);
        } catch (error) {
            console.error("Erreur lors de la suppression du message:", error);
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmation(false);
        setMessageToDelete(null);
    };

    if (isLoading()) {
        return (
            <div className="chat-window">
                <div className="chat-header">
                    <h3>{selectedUsername}</h3>
                </div>
                <div className="loading-container">
                    <p>Chargement des messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window">
            <div className="chat-header">
                <h3>{selectedUsername}</h3>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>Aucun message dans cette conversation</p>
                        <p>Envoyez votre premier message !</p>
                    </div>
                ) : (
                    messages.map((message: Message) => (
                        <div key={message._id} className={`message ${message.senderId === currentUserId ? "sent" : "received"}`}>
                            <div className="message-content">{getDecryptedContent(message)}</div>
                            <div className="message-actions">
                                <div className="message-time">{formatMessageTime(message.createdAt)}</div>
                                {message.senderId === currentUserId && (
                                    <button className="delete-message-btn" onClick={() => handleDeleteClick(message._id)} title="Supprimer le message">
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <MessageInput receiverId={selectedUserId} receiverUsername={selectedUsername} />

            <ConfirmationModal isOpen={showConfirmation} message="Êtes-vous sûr de vouloir supprimer ce message ?" onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
        </div>
    );
};
