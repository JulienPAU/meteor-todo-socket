import { Meteor } from "meteor/meteor";
import { TasksCollection } from "/imports/api/TasksCollection";
import { UsersCredentialsCollection } from "/imports/api/UsersCollection";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { UserActivityCollection } from "/imports/api/UserActivityCollection";
import { GroupsCollection } from "/imports/api/GroupsCollection";
import { hashPassword } from "/imports/utils/validators";
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
import { Mongo } from "meteor/mongo";

import { Document } from "mongodb";

const isRailwayEnvironment = (): boolean => {
  return (
    !!process.env.RAILWAY_ENVIRONMENT ||
    !!process.env.RAILWAY_SERVICE_ID ||
    !!process.env.RAILWAY_PROJECT_ID
  );
};

const resetCollection = async <T extends Document>(
  collection: Mongo.Collection<T>,
  name: string
): Promise<number> => {
  const count = await collection.find().countAsync();
  if (count > 0) {
    await collection.removeAsync({});
    console.log(`✅ ${count} ${name} supprimés`);
  }
  return count;
};

const initializeCollectionIfEmpty = async <T extends Document>(
  collection: Mongo.Collection<T>,
  name: string,
  initialData: Partial<T>
): Promise<void> => {
  if (await collection.find().countAsync() === 0) {
    await collection.insertAsync(initialData as any);
    console.log(`Collection ${name} initialisée`);
  }
};

const resetDatabase = async (): Promise<void> => {
  console.log("🔄 Réinitialisation de la base de données en cours...");

  await resetCollection(UserActivityCollection, "activités utilisateur");
  await resetCollection(MessagesCollection, "messages");
  await resetCollection(GroupsCollection, "groupes");
  await resetCollection(TasksCollection, "tâches");

  const usersCount = await Meteor.users.find().countAsync();
  if (usersCount > 0) {
    await Meteor.users.removeAsync({});
    console.log(`✅ ${usersCount} utilisateurs supprimés`);
  }

  await resetCollection(UsersCredentialsCollection, "identifications");

  console.log("🎉 Réinitialisation de la base de données terminée!");
};

Meteor.startup(async () => {
  if (isRailwayEnvironment() || process.env.RESET_DATABASE === "true" || process.env.RESET_DATABASE === "1") {
    await resetDatabase();
  }

  await initializeCollectionIfEmpty(
    UserActivityCollection,
    "user_activity",
    {
      sessionId: "initialization-session",
      username: "system",
      action: "cursor",
      timestamp: new Date()
    }
  );

  await initializeCollectionIfEmpty(
    GroupsCollection,
    "groups",
    {
      name: "Initialisation",
      description: "Document d'initialisation de la collection",
      createdAt: new Date(),
      members: [],
      createdBy: {
        userId: "system",
        username: "system"
      }
    }
  );

  await initializeCollectionIfEmpty(
    MessagesCollection,
    "messages",
    {
      senderId: "system",
      senderUsername: "system",
      content: "Initialisation de la collection",
      createdAt: new Date(),
      read: false
    }
  );
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
