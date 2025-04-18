import React, { useState } from "react";
import { Meteor } from "meteor/meteor";

interface MessageInputProps {
    receiverId: string;
    receiverUsername: string;
}

export const MessageInput = ({ receiverId, receiverUsername }: MessageInputProps) => {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) return;

        try {
            setIsSending(true);
            await Meteor.callAsync("messages.send", {
                receiverId,
                receiverUsername,
                content: message,
            });
            setMessage("");
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form className="message-input-container" onSubmit={handleSubmit}>
            <input type="text" className="message-input" placeholder="Écrivez votre message..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={isSending} />
            <button type="submit" className="send-button" disabled={!message.trim() || isSending} title="Envoyer">
                →
            </button>
        </form>
    );
};
