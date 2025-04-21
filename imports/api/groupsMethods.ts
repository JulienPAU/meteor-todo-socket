import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { GroupsCollection } from "./GroupsCollection";
import { TasksCollection } from "./TasksCollection";
import {
  Group,
  GroupCreate,
  GroupAddMember,
  GroupRemoveMember,
  GroupChangeMemberRole
} from "../types/group";
import { randomColor } from "../utils/validators";

Meteor.methods({
  "groups.create": async function (groupData: GroupCreate) {
    if (!this.userId) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous devez être connecté pour créer un groupe"
      );
    }

    check(groupData, {
      name: String,
      description: Match.Maybe(String)
    });

    check(
      groupData.name,
      Match.Where((name) => {
        return name.trim().length > 0 && name.trim().length <= 50;
      })
    );

    if (groupData.description) {
      check(
        groupData.description,
        Match.Where((desc) => {
          return desc.length <= 200;
        })
      );
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    if (!user || !user.username) {
      throw new Meteor.Error("user-not-found", "Utilisateur non trouvé");
    }

    const username = user.username;

    const groupId = await GroupsCollection.insertAsync({
      name: groupData.name.trim(),
      description: groupData.description?.trim(),
      createdAt: new Date(),
      createdBy: {
        userId: this.userId,
        username
      },
      members: [
        {
          userId: this.userId,
          username,
          role: "admin",
          joinedAt: new Date(),
          color: randomColor()
        }
      ]
    } as Group);

    return groupId;
  },

  "groups.delete": async function (groupId: string) {
    if (!this.userId) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous devez être connecté pour supprimer un groupe"
      );
    }

    check(groupId, String);

    const group = await GroupsCollection.findOneAsync(groupId);
    if (!group) {
      throw new Meteor.Error("group-not-found", "Groupe non trouvé");
    }

    const isAdmin = group.members.some(
      (member) => member.userId === this.userId && member.role === "admin"
    );

    if (!isAdmin) {
      throw new Meteor.Error(
        "not-authorized",
        "Seul un administrateur peut supprimer le groupe"
      );
    }

    await TasksCollection.removeAsync({ groupId });

    return GroupsCollection.removeAsync(groupId);
  },

  "groups.addMember": async function (data: GroupAddMember) {
    if (!this.userId) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous devez être connecté pour ajouter un membre"
      );
    }

    check(data, {
      groupId: String,
      userId: String,
      username: String,
      role: Match.Maybe(String)
    });

    if (data.role && !["admin", "member"].includes(data.role)) {
      throw new Meteor.Error("invalid-role", "Rôle invalide");
    }

    const group = await GroupsCollection.findOneAsync(data.groupId);
    if (!group) {
      throw new Meteor.Error("group-not-found", "Groupe non trouvé");
    }

    const isAdmin = group.members.some(
      (member) => member.userId === this.userId && member.role === "admin"
    );

    if (!isAdmin) {
      throw new Meteor.Error(
        "not-authorized",
        "Seul un administrateur peut ajouter un membre"
      );
    }

    const isMember = group.members.some(
      (member) => member.userId === data.userId
    );
    if (isMember) {
      throw new Meteor.Error(
        "already-member",
        "Cet utilisateur est déjà membre du groupe"
      );
    }

    const userToAdd = await Meteor.users.findOneAsync(data.userId);
    if (!userToAdd) {
      throw new Meteor.Error("user-not-found", "Utilisateur non trouvé");
    }

    return GroupsCollection.updateAsync(
      { _id: data.groupId },
      {
        $push: {
          members: {
            userId: data.userId,
            username: data.username,
            role: data.role || "member",
            joinedAt: new Date(),
            color: randomColor()
          }
        }
      }
    );
  },

  "groups.removeMember": async function (data: GroupRemoveMember) {
    if (!this.userId) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous devez être connecté pour retirer un membre"
      );
    }

    check(data, {
      groupId: String,
      userId: String
    });

    const group = await GroupsCollection.findOneAsync(data.groupId);
    if (!group) {
      throw new Meteor.Error("group-not-found", "Groupe non trouvé");
    }

    if (data.userId !== this.userId) {
      const isAdmin = group.members.some(
        (member) => member.userId === this.userId && member.role === "admin"
      );

      if (!isAdmin) {
        throw new Meteor.Error(
          "not-authorized",
          "Seul un administrateur peut retirer un membre"
        );
      }
    }

    const memberToRemove = group.members.find(
      (member) => member.userId === data.userId
    );
    if (!memberToRemove) {
      throw new Meteor.Error(
        "not-member",
        "Cet utilisateur n'est pas membre du groupe"
      );
    }

    if (memberToRemove.role === "admin") {
      const adminCount = group.members.filter(
        (member) => member.role === "admin"
      ).length;
      if (adminCount === 1) {
        throw new Meteor.Error(
          "last-admin",
          "Impossible de retirer le dernier administrateur du groupe"
        );
      }
    }

    return GroupsCollection.updateAsync(
      { _id: data.groupId },
      {
        $pull: {
          members: { userId: data.userId }
        }
      }
    );
  },

  "groups.changeMemberRole": async function (data: GroupChangeMemberRole) {
    if (!this.userId) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous devez être connecté pour modifier le rôle d'un membre"
      );
    }

    check(data, {
      groupId: String,
      userId: String,
      role: String
    });

    if (!["admin", "member"].includes(data.role)) {
      throw new Meteor.Error("invalid-role", "Rôle invalide");
    }

    const group = await GroupsCollection.findOneAsync(data.groupId);
    if (!group) {
      throw new Meteor.Error("group-not-found", "Groupe non trouvé");
    }

    const isAdmin = group.members.some(
      (member) => member.userId === this.userId && member.role === "admin"
    );

    if (!isAdmin) {
      throw new Meteor.Error(
        "not-authorized",
        "Seul un administrateur peut modifier le rôle d'un membre"
      );
    }

    if (data.userId === this.userId) {
      throw new Meteor.Error(
        "cannot-change-own-role",
        "Vous ne pouvez pas modifier votre propre rôle"
      );
    }

    const memberToUpdate = group.members.find(
      (member) => member.userId === data.userId
    );
    if (!memberToUpdate) {
      throw new Meteor.Error(
        "not-member",
        "Cet utilisateur n'est pas membre du groupe"
      );
    }

    if (memberToUpdate.role === "admin" && data.role === "member") {
      const adminCount = group.members.filter(
        (member) => member.role === "admin"
      ).length;
      if (adminCount === 1) {
        throw new Meteor.Error(
          "last-admin",
          "Impossible de rétrograder le dernier administrateur du groupe"
        );
      }
    }

    return GroupsCollection.updateAsync(
      { _id: data.groupId, "members.userId": data.userId },
      {
        $set: {
          "members.$.role": data.role
        }
      }
    );
  }
});
