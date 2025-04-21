import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { MessagesCollection } from "./MessagesCollection";
import { MessageInsert, GroupMessageInsert } from "../types/message";
import { encryptMessage, validateChatMessage } from "../utils/validators";
import { MongoInternals } from "meteor/mongo";
import { GroupsCollection } from "./GroupsCollection";
import { TasksCollection } from "./TasksCollection";

const ObjectId = MongoInternals.NpmModules.mongodb.module.ObjectId;

Meteor.methods({
  async "messages.send"({
    receiverId,
    receiverUsername,
    groupId,
    content
  }: MessageInsert) {
    if (!this.userId) {
      throw new Meteor.Error(
        "non-autorise",
        "Vous devez être connecté pour envoyer un message"
      );
    }

    const contentValidation = validateChatMessage(content);
    if (!contentValidation.isValid) {
      throw new Meteor.Error("contenu-invalide", contentValidation.error);
    }

    const sender = await Meteor.users.findOneAsync(this.userId);
    const senderUsername = sender?.username || "Utilisateur inconnu";

    const encryptedContent = encryptMessage(content);

    if (groupId) {
      const group = await GroupsCollection.findOneAsync({
        _id: groupId,
        "members.userId": this.userId
      });

      if (!group) {
        throw new Meteor.Error(
          "non-autorise",
          "Vous n'êtes pas membre de ce groupe"
        );
      }

      return MessagesCollection.insertAsync({
        senderId: this.userId,
        senderUsername,
        groupId,
        content: encryptedContent,
        createdAt: new Date(),
        read: false
      });
    }

    if (!receiverId || !receiverUsername) {
      throw new Meteor.Error(
        "destinataire-requis",
        "Le destinataire est requis pour un message privé"
      );
    }

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

  async "messages.markAsRead"(messageId: string) {
    if (!this.userId) {
      throw new Meteor.Error("non-autorise", "Vous devez être connecté");
    }

    check(messageId, String);

    const message = await MessagesCollection.findOneAsync({ _id: messageId });
    if (!message) {
      throw new Meteor.Error("message-non-trouve", "Message non trouvé");
    }

    if (message.groupId) {
      return;
    }

    if (message.receiverId !== this.userId) {
      throw new Meteor.Error(
        "non-autorise",
        "Vous ne pouvez marquer comme lu que les messages que vous avez reçus"
      );
    }

    if (message.read) {
      return;
    }

    return MessagesCollection.updateAsync(
      { _id: messageId },
      { $set: { read: true } }
    );
  },

  async "messages.markGroupMessagesAsRead"(groupId: string) {
    if (!this.userId) {
      throw new Meteor.Error("non-autorise", "Vous devez être connecté");
    }

    check(groupId, String);

    const group = await GroupsCollection.findOneAsync({
      _id: groupId,
      "members.userId": this.userId
    });

    if (!group) {
      throw new Meteor.Error(
        "non-autorise",
        "Vous n'êtes pas membre de ce groupe"
      );
    }

    try {

      await MessagesCollection.updateAsync(
        { groupId: groupId },
        {
          $addToSet: {
            readBy: this.userId
          }
        },
        { multi: true }
      );

      await Meteor.users.updateAsync(
        { _id: this.userId },
        {
          $set: {
            [`lastReadTimestamps.groups.${groupId}`]: new Date()
          }
        }
      );

      return true;
    } catch (error) {
      console.error("Erreur lors du marquage des messages comme lus:", error);
      throw new Meteor.Error(
        "erreur-interne",
        "Erreur lors du marquage des messages comme lus"
      );
    }
  },

  async "messages.delete"(messageId: string) {
    if (!this.userId) {
      throw new Meteor.Error(
        "non-autorise",
        "Vous devez être connecté pour supprimer un message"
      );
    }

    let idToUse = messageId;

    try {
      const message = await MessagesCollection.findOneAsync({ _id: idToUse });

      if (!message) {
        throw new Meteor.Error("message-non-trouve", "Message non trouvé");
      }

      if (message.groupId) {
        const group = await GroupsCollection.findOneAsync({
          _id: message.groupId,
          "members.userId": this.userId
        });

        if (!group) {
          throw new Meteor.Error(
            "non-autorise",
            "Vous n'êtes pas membre de ce groupe"
          );
        }

        const isAdmin = group.members.some(
          (member) => member.userId === this.userId && member.role === "admin"
        );

        if (message.senderId !== this.userId && !isAdmin) {
          throw new Meteor.Error(
            "non-autorise",
            "Vous ne pouvez supprimer que vos propres messages ou être administrateur du groupe"
          );
        }
      }
      else if (
        message.senderId !== this.userId &&
        message.receiverId !== this.userId
      ) {
        throw new Meteor.Error(
          "non-autorise",
          "Vous ne pouvez supprimer que vos propres messages ou les messages que vous avez reçus"
        );
      }

      return MessagesCollection.removeAsync({ _id: idToUse });
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);
      throw new Meteor.Error(
        "erreur-suppression",
        "Erreur lors de la suppression du message"
      );
    }
  },

  async "messages.sendToGroup"({ groupId, content }: GroupMessageInsert) {
    if (!this.userId) {
      throw new Meteor.Error(
        "non-autorise",
        "Vous devez être connecté pour envoyer un message"
      );
    }

    check(groupId, String);
    check(content, String);

    const contentValidation = validateChatMessage(content);
    if (!contentValidation.isValid) {
      throw new Meteor.Error("contenu-invalide", contentValidation.error);
    }

    const group = await GroupsCollection.findOneAsync({
      _id: groupId,
      "members.userId": this.userId
    });

    if (!group) {
      throw new Meteor.Error(
        "non-autorise",
        "Vous n'êtes pas membre de ce groupe"
      );
    }

    const sender = await Meteor.users.findOneAsync(this.userId);
    const senderUsername = sender?.username || "Utilisateur inconnu";

    const encryptedContent = encryptMessage(content);

    return MessagesCollection.insertAsync({
      senderId: this.userId,
      senderUsername,
      groupId,
      content: encryptedContent,
      createdAt: new Date(),
      read: false
    });
  },

  async "messages.checkGroupActivity"() {
    if (!this.userId) {
      throw new Meteor.Error("non-autorise", "Vous devez être connecté");
    }

    const userGroups = await GroupsCollection.find({
      "members.userId": this.userId
    }).fetchAsync();

    const groupsWithActivity = [];

    for (const group of userGroups) {
      if (!group._id) continue;

      const unreadMessages = await MessagesCollection.find({
        groupId: group._id,
        $or: [{ readBy: { $exists: false } }, { readBy: { $ne: this.userId } }],
        senderId: { $ne: this.userId }
      }).countAsync();

      const pendingTasks = await TasksCollection.find({
        groupId: group._id,
        isChecked: { $ne: true }
      }).countAsync();

      if (unreadMessages > 0 || pendingTasks > 0) {
        groupsWithActivity.push(group._id);
      }
    }

    return {
      hasActivity: groupsWithActivity.length > 0,
      groupsWithActivity
    };
  }
});
