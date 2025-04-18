import React, { useEffect, useRef } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { Message } from "/imports/types/message";
import { MessageInput } from "./MessageInput";

interface ChatWindowProps {
    selectedUserId: string;
    selectedUsername: string;
    currentUserId: string;
}

export const ChatWindow = ({ selectedUserId, selectedUsername, currentUserId }: ChatWindowProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
                            {message.content}
                            <div className="message-time">{formatMessageTime(message.createdAt)}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <MessageInput receiverId={selectedUserId} receiverUsername={selectedUsername} />
        </div>
    );
};
