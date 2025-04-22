import { Meteor } from "meteor/meteor";
import { TasksCollection } from "/imports/api/TasksCollection";
import { UsersCredentialsCollection } from "/imports/api/UsersCollection";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { UserActivityCollection } from "/imports/api/UserActivityCollection";
import { GroupsCollection } from "/imports/api/GroupsCollection";
import "../imports/api/TasksPublication";
import "../imports/api/tasksMethods";
import "../imports/api/authMethods";
import "../imports/api/MessagesPublication";
import "../imports/api/messagesMethods";
import "../imports/api/UsersPublication";
import "../imports/api/userActivityMethods";
import "../imports/api/UserActivityPublication";
import "../imports/api/groupsMethods";
import "../imports/api/GroupsPublication";

const hashPassword = (password: string): string => {
  return Array.from(password)
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString();
};

const isRailwayEnvironment = (): boolean => {
  return (
    !!process.env.RAILWAY_ENVIRONMENT ||
    !!process.env.RAILWAY_SERVICE_ID ||
    !!process.env.RAILWAY_PROJECT_ID
  );
};

const resetDatabase = async (): Promise<void> => {
  console.log("🔄 Réinitialisation de la base de données en cours...");

  const activityCount = await UserActivityCollection.find().countAsync();
  if (activityCount > 0) {
    await UserActivityCollection.removeAsync({});
    console.log(`✅ ${activityCount} activités utilisateur supprimées`);
  }

  const messagesCount = await MessagesCollection.find().countAsync();
  if (messagesCount > 0) {
    await MessagesCollection.removeAsync({});
    console.log(`✅ ${messagesCount} messages supprimés`);
  }

  const groupsCount = await GroupsCollection.find().countAsync();
  if (groupsCount > 0) {
    await GroupsCollection.removeAsync({});
    console.log(`✅ ${groupsCount} groupes supprimés`);
  }

  const tasksCount = await TasksCollection.find().countAsync();
  if (tasksCount > 0) {
    await TasksCollection.removeAsync({});
    console.log(`✅ ${tasksCount} tâches supprimées`);
  }

  const usersCount = await Meteor.users.find().countAsync();
  if (usersCount > 0) {
    await Meteor.users.removeAsync({});
    console.log(`✅ ${usersCount} utilisateurs supprimés`);
  }

  const credentialsCount = await UsersCredentialsCollection.find().countAsync();
  if (credentialsCount > 0) {
    await UsersCredentialsCollection.removeAsync({});
    console.log(`✅ ${credentialsCount} identifications supprimées`);
  }

  console.log("🎉 Réinitialisation de la base de données terminée!");
};

Meteor.startup(async () => {
  if (isRailwayEnvironment() || process.env.RESET_DATABASE === "true" || process.env.RESET_DATABASE === "1") {
    await resetDatabase();
  }

  if (await UserActivityCollection.find().countAsync() === 0) {
    await UserActivityCollection.insertAsync({
      sessionId: "initialization-session",
      username: "system",
      action: "cursor",
      timestamp: new Date()
    });
    console.log("Collection user_activity initialisée");
  }

  if (await GroupsCollection.find().countAsync() === 0) {
    await GroupsCollection.insertAsync({
      name: "Initialisation",
      description: "Document d'initialisation de la collection",
      createdAt: new Date(),
      members: [],
      createdBy: {
        userId: "system",
        username: "system"
      }
    });
    console.log("Collection groups initialisée");
  }

  if (await MessagesCollection.find().countAsync() === 0) {
    await MessagesCollection.insertAsync({
      senderId: "system",
      senderUsername: "system",
      content: "Initialisation de la collection",
      createdAt: new Date(),
      read: false
    });
    console.log("Collection messages initialisée");
  }
});

Meteor.startup(() => {
  Meteor.setInterval(async () => {
    try {
      const twoMinutesAgo = new Date(new Date().getTime() - 2 * 60 * 1000);
      await UserActivityCollection.removeAsync({
        action: "typing",
        timestamp: { $lt: twoMinutesAgo }
      });

      const tenMinutesAgo = new Date(new Date().getTime() - 10 * 60 * 1000);
      await UserActivityCollection.removeAsync({
        action: "editing",
        timestamp: { $lt: tenMinutesAgo }
      });
    } catch (error) {
      console.error("Erreur lors du nettoyage des activités:", error);
    }
  }, 5 * 60 * 1000);
});
