import { Meteor } from "meteor/meteor";
import { MessagesCollection } from "./MessagesCollection";
import { MessageInsert } from "../types/message";

Meteor.methods({
    async 'messages.send'({ receiverId, receiverUsername, content }: MessageInsert) {
        if (!this.userId) {
            throw new Meteor.Error("non-autorise", "Vous devez être connecté pour envoyer un message");
        }

        if (!content.trim()) {
            throw new Meteor.Error("contenu-vide", "Le message ne peut pas être vide");
        }

        const sender = await Meteor.users.findOneAsync(this.userId);
        const senderUsername = sender?.username || "Utilisateur inconnu";

        return MessagesCollection.insertAsync({
            senderId: this.userId,
            senderUsername,
            receiverId,
            receiverUsername,
            content,
            createdAt: new Date(),
            read: false
        });
    },

    async 'messages.markAsRead'(messageId: string) {
        if (!this.userId) {
            throw new Meteor.Error("non-autorise", "Vous devez être connecté");
        }

        const message = await MessagesCollection.findOneAsync(messageId);
        if (!message) {
            throw new Meteor.Error("message-non-trouve", "Message non trouvé");
        }

        if (message.receiverId !== this.userId) {
            throw new Meteor.Error("non-autorise", "Vous ne pouvez marquer comme lu que vos propres messages");
        }

        return MessagesCollection.updateAsync(messageId, {
            $set: { read: true }
        });
    }
});