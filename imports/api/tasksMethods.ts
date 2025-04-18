import { Meteor } from "meteor/meteor";
import { TasksCollection } from "./TasksCollection";

interface TaskInsert {
    text: string;
}

interface TaskToggle {
    _id: string;
    isChecked: boolean;
}

interface TaskDelete {
    _id: string;
}

Meteor.methods({
    "tasks.insert"(doc: TaskInsert) {
        if (!this.userId) {
            throw new Meteor.Error("Non autorisé", "Vous devez être connecté pour créer une tâche");
        }

        return TasksCollection.insertAsync({
            ...doc,
            userId: this.userId,
            createdAt: new Date(),
        });
    },

    "tasks.toggleChecked"({ _id, isChecked }: TaskToggle) {
        if (!this.userId) {
            throw new Meteor.Error("Non autorisé", "Vous devez être connecté pour modifier une tâche");
        }

        // Vérification optionnelle que l'utilisateur est propriétaire de la tâche
        const task = TasksCollection.findOneAsync({ _id, userId: this.userId });
        if (!task) {
            throw new Meteor.Error("Non autorisé", "Vous ne pouvez modifier que vos propres tâches");
        }

        return TasksCollection.updateAsync(_id, {
            $set: { isChecked: !isChecked },
        });
    },

    "tasks.delete"({ _id }: TaskDelete) {
        if (!this.userId) {
            throw new Meteor.Error("Non autorisé", "Vous devez être connecté pour supprimer une tâche");
        }

        // Vérification optionnelle que l'utilisateur est propriétaire de la tâche
        const task = TasksCollection.findOneAsync({ _id, userId: this.userId });
        if (!task) {
            throw new Meteor.Error("Non autorisé", "Vous ne pouvez supprimer que vos propres tâches");
        }

        return TasksCollection.removeAsync(_id);
    },
});

