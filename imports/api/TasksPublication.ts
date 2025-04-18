import { Meteor } from "meteor/meteor";
import { TasksCollection } from "./TasksCollection";

Meteor.publish("tasks", function () {
    // Vérifier si l'utilisateur est connecté
    if (!this.userId) {
        return this.ready(); // Retourne une publication vide si non connecté
    }

    // Renvoyer uniquement les tâches appartenant à l'utilisateur connecté
    return TasksCollection.find({ userId: this.userId });
});