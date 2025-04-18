import { Meteor } from "meteor/meteor";
import { TasksCollection } from "/imports/api/TasksCollection";
import { UsersCredentialsCollection } from "/imports/api/UsersCollection";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { UserActivityCollection } from "/imports/api/UserActivityCollection";
import "../imports/api/TasksPublication";
import "../imports/api/tasksMethods";
import "../imports/api/authMethods";
import "../imports/api/MessagesPublication";
import "../imports/api/messagesMethods";
import "../imports/api/UsersPublication";
import "../imports/api/userActivityMethods";
import "../imports/api/UserActivityPublication";

const hashPassword = (password: string): string => {
  return Array.from(password).reduce(
    (hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) | 0,
    0
  ).toString();
};

const SEED_USERNAME = "demo";
const SEED_PASSWORD = "password123";

const isRailwayEnvironment = (): boolean => {
  return !!process.env.RAILWAY_ENVIRONMENT ||
    !!process.env.RAILWAY_SERVICE_ID ||
    !!process.env.RAILWAY_PROJECT_ID;
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

  const tasksCount = await TasksCollection.find().countAsync();
  if (tasksCount > 0) {
    await TasksCollection.removeAsync({});
    console.log(`✅ ${tasksCount} tâches supprimées`);
  }

  const usersCount = await Meteor.users.find({ username: { $ne: SEED_USERNAME } }).countAsync();
  if (usersCount > 0) {
    await Meteor.users.removeAsync({ username: { $ne: SEED_USERNAME } });
    console.log(`✅ ${usersCount} utilisateurs supprimés`);
  }

  const credentialsCount = await UsersCredentialsCollection.find({ username: { $ne: SEED_USERNAME } }).countAsync();
  if (credentialsCount > 0) {
    await UsersCredentialsCollection.removeAsync({ username: { $ne: SEED_USERNAME } });
    console.log(`✅ ${credentialsCount} identifications supprimées`);
  }

  console.log("🎉 Réinitialisation de la base de données terminée!");
};

const insertTask = (taskText: string, userId: string) =>
  TasksCollection.insertAsync({
    text: taskText,
    userId,
    createdAt: new Date(),
  });

Meteor.startup(async () => {
  if (isRailwayEnvironment() && (process.env.RESET_DATABASE === "true" || process.env.RESET_DATABASE === "1")) {
    await resetDatabase();
  }

  const existingUser = await Meteor.users.findOneAsync({ username: SEED_USERNAME });
  const existingCredentials = await UsersCredentialsCollection.findOneAsync({ username: SEED_USERNAME });

  let userId: string | null = null;

  if (!existingUser && existingCredentials) {
    console.log(`Suppression des identifiants orphelins pour l'utilisateur: ${SEED_USERNAME}`);
    await UsersCredentialsCollection.removeAsync({ username: SEED_USERNAME });
  }

  if (existingUser && !existingCredentials) {
    console.log(`Suppression de l'utilisateur orphelin: ${SEED_USERNAME}`);
    await Meteor.users.removeAsync({ username: SEED_USERNAME });
  }

  const syncedUser = await Meteor.users.findOneAsync({ username: SEED_USERNAME });

  if (!syncedUser) {
    console.log(`Création du compte de démonstration: ${SEED_USERNAME}`);
    userId = await Meteor.users.insertAsync({
      username: SEED_USERNAME,
      profile: { name: 'Utilisateur Démo' },
      createdAt: new Date()
    });

    await UsersCredentialsCollection.insertAsync({
      username: SEED_USERNAME,
      hashedPassword: hashPassword(SEED_PASSWORD),
      createdAt: new Date()
    });
  } else {
    userId = syncedUser._id;
  }

  if (userId) {
    const tasksCount = await TasksCollection.find({ userId }).countAsync();

    if (tasksCount === 0) {
      console.log('Création des tâches par défaut...');
      [
        "Bienvenue dans l'application Todo",
        "Cliquez sur la case à cocher pour marquer comme terminé",
        "Cliquez sur × pour supprimer une tâche",
        "Entrez du texte et cliquez sur Ajouter pour créer une tâche",
        "Cette application est construite avec Meteor et React"
      ].forEach(text => insertTask(text, userId as string));
      console.log('Tâches par défaut créées.');
    }
  }
});



