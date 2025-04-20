import React, { useState, useEffect, useRef } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { MessagesCollection } from "../../api/MessagesCollection";
import { GroupsCollection } from "../../api/GroupsCollection";
import type { Message } from "../../types/message";
import { decryptMessage } from "../../utils/validators";

interface GroupChatProps {
    groupId: string;
    currentUserId: string;
}

export const GroupChat = ({ groupId, currentUserId }: GroupChatProps) => {
    const [messageContent, setMessageContent] = useState("");
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isLoading, messages, group } = useTracker(() => {
        const messagesHandler = Meteor.subscribe("groupMessages", groupId);
        const groupHandler = Meteor.subscribe("groupDetails", groupId);

        if (!messagesHandler.ready() || !groupHandler.ready()) {
            return { isLoading: true, messages: [], group: null };
        }

        const messagesData = MessagesCollection.find({ groupId }, { sort: { createdAt: 1 } }).fetch();

        const groupData = GroupsCollection.findOne(groupId);

        return {
            isLoading: false,
            messages: messagesData,
            group: groupData,
        };
    }, [groupId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageContent.trim()) return;

        Meteor.callAsync("messages.sendToGroup", {
            groupId,
            content: messageContent,
        })
            .then(() => {
                setMessageContent("");
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            })
            .catch((error) => {
                console.error("Erreur lors de l'envoi du message:", error);
                alert(`Erreur lors de l'envoi du message: ${error.message}`);
            });
    };

    const handleDeleteMessage = (messageId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
            Meteor.callAsync("messages.delete", messageId).catch((error) => {
                console.error("Erreur lors de la suppression du message:", error);
                alert(`Erreur lors de la suppression: ${error.message}`);
            });
        }
    };

    const formatMessageDate = (date: Date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getMemberColor = (userId: string) => {
        if (!group || !group.members) return "";

        const member = group.members.find((m: { userId: string }) => m.userId === userId);
        return member?.color || "";
    };

    const canDeleteMessage = (message: Message) => {
        return message.senderId === currentUserId;
    };

    if (isLoading) {
        return <div className="loading">Chargement du chat...</div>;
    }

    return (
        <div className="group-chat-container">
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat-message">Aucun message dans ce groupe. Soyez le premier à écrire !</div>
                ) : (
                    messages.map((message: Message) => {
                        const isCurrentUser = message.senderId === currentUserId;
                        const messageColor = getMemberColor(message.senderId);

                        return (
                            <div key={message._id} className={`chat-message ${isCurrentUser ? "sent" : "received"}`}>
                                <div className="message-content" style={!isCurrentUser ? { borderLeftColor: messageColor } : undefined}>
                                    {!isCurrentUser && (
                                        <div className="message-sender" style={{ color: messageColor }}>
                                            {message.senderUsername}
                                        </div>
                                    )}
                                    <div className="message-text">{decryptMessage(message.content)}</div>
                                    <div className="message-actions">
                                        <div className="message-time">{formatMessageDate(message.createdAt)}</div>
                                        {canDeleteMessage(message) && (
                                            <button className="delete-message-btn" onClick={() => handleDeleteMessage(message._id!)} title="Supprimer le message">
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input ref={inputRef} type="text" value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Écrivez un message dans le tchat..." maxLength={1000} className="chat-input" />
                <button type="submit" className="send-message-btn" disabled={!messageContent.trim()} aria-label="Envoyer le message" />
            </form>
        </div>
    );
};
