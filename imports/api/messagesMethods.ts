import { Meteor } from "meteor/meteor";
import { MessagesCollection } from "./MessagesCollection";
import { MessageInsert } from "../types/message";
import { encryptMessage } from "../utils/validators";
import { MongoInternals } from 'meteor/mongo';

const ObjectId = MongoInternals.NpmModules.mongodb.module.ObjectId;

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

        const encryptedContent = encryptMessage(content);

        return MessagesCollection.insertAsync({
            senderId: this.userId,
            senderUsername,
            receiverId,
            receiverUsername,
            content: encryptedContent,
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
    },

    async 'messages.delete'(messageId: string) {
        if (!this.userId) {
            throw new Meteor.Error("non-autorise", "Vous devez être connecté pour supprimer un message");
        }

        let idToUse;

        try {
            idToUse = messageId;

            if (typeof messageId === 'string' && messageId.length === 24) {
                try {
                    idToUse = new ObjectId(messageId);
                } catch (e) {
                    console.log("Conversion en ObjectId impossible, utilisation de l'ID original");
                }
            }
        } catch (error) {
            console.error("Erreur lors de la manipulation de l'ID:", error);
            throw new Meteor.Error("id-invalide", "L'identifiant du message n'est pas valide");
        }

        try {
            const message = await MessagesCollection.findOneAsync({ _id: idToUse.toString() });

            if (!message) {
                throw new Meteor.Error("message-non-trouve", "Message non trouvé");
            }

            if (message.senderId !== this.userId && message.receiverId !== this.userId) {
                throw new Meteor.Error("non-autorise", "Vous ne pouvez supprimer que vos propres messages ou les messages que vous avez reçus");
            }

            return MessagesCollection.removeAsync({ _id: idToUse.toString() });
        } catch (error) {
            console.error("Erreur lors de la suppression du message:", error);
            throw new Meteor.Error("erreur-suppression", "Erreur lors de la suppression du message");
        }
    }
});