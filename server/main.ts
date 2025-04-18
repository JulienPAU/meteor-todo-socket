import { Meteor } from "meteor/meteor";
import { TasksCollection } from "/imports/api/TasksCollection";
import { UsersCredentialsCollection } from "/imports/api/UsersCollection";
import "../imports/api/TasksPublication";
import "../imports/api/tasksMethods";
import "../imports/api/authMethods";

const hashPassword = (password: string): string => {
  return Array.from(password).reduce(
    (hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) | 0,
    0
  ).toString();
};

const SEED_USERNAME = "demo";
const SEED_PASSWORD = "password123";

const insertTask = (taskText: string, userId: string) =>
  TasksCollection.insertAsync({
    text: taskText,
    userId,
    createdAt: new Date(),
  });

Meteor.startup(async () => {
  const existingUser = await Meteor.users.findOneAsync({ username: SEED_USERNAME });

  let userId: string;

  if (!existingUser) {
    console.log('Création de l\'utilisateur de démo...');

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

    console.log(`Utilisateur de démo créé avec l'ID: ${userId}`);
  } else {
    userId = existingUser._id;
  }

  const tasksCount = await TasksCollection.find({ userId }).countAsync();

  if (tasksCount === 0) {
    console.log('Création des tâches par défaut...');
    [
      "Bienvenue dans l'application Todo",
      "Cliquez sur la case à cocher pour marquer comme terminé",
      "Cliquez sur × pour supprimer une tâche",
      "Entrez du texte et cliquez sur Ajouter pour créer une tâche",
      "Cette application est construite avec Meteor et React"
    ].forEach(text => insertTask(text, userId));
    console.log('Tâches par défaut créées.');
  }
});