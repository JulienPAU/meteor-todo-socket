import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { TasksCollection } from "./TasksCollection";
import { TaskInsert, TaskToggle, TaskDelete } from "/imports/types/task";
import { validateTaskText } from "../utils/validators";
import { GroupsCollection } from "./GroupsCollection";

Meteor.methods({
    "tasks.insert": async function (taskData: TaskInsert) {
        check(taskData, {
            text: String,
            groupId: Match.Maybe(String)
        });

        if (!this.userId) {
            throw new Meteor.Error("not-authorized", "Vous devez être connecté pour créer une tâche");
        }

        const textValidation = validateTaskText(taskData.text);
        if (!textValidation.isValid) {
            throw new Meteor.Error("invalid-text", textValidation.error);
        }

        const currentUser = await Meteor.users.findOneAsync(this.userId);
        const username = currentUser?.username || "Utilisateur";

        if (taskData.groupId) {
            const group = await GroupsCollection.findOneAsync({
                _id: taskData.groupId,
                "members.userId": this.userId
            });

            if (!group) {
                throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre de ce groupe");
            }

            return await TasksCollection.insertAsync({
                text: taskData.text,
                createdAt: new Date(),
                userId: this.userId,
                groupId: taskData.groupId,
                createdBy: username
            });
        } else {
            return await TasksCollection.insertAsync({
                text: taskData.text,
                createdAt: new Date(),
                userId: this.userId
            });
        }
    },

    "tasks.toggle": async function (taskData: TaskToggle) {
        check(taskData._id, String);
        check(taskData.isChecked, Boolean);

        if (!this.userId) {
            throw new Meteor.Error("not-authorized", "Vous devez être connecté pour modifier une tâche");
        }

        const task = await TasksCollection.findOneAsync({ _id: taskData._id });

        if (!task) {
            throw new Meteor.Error("task-not-found", "Tâche non trouvée");
        }

        if (task.groupId) {
            const group = await GroupsCollection.findOneAsync({
                _id: task.groupId,
                "members.userId": this.userId
            });

            if (!group) {
                throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre du groupe de cette tâche");
            }
        }
        else if (task.userId !== this.userId) {
            throw new Meteor.Error("not-authorized", "Vous pouvez modifier uniquement vos propres tâches");
        }

        return await TasksCollection.updateAsync(
            { _id: taskData._id },
            { $set: { isChecked: taskData.isChecked } }
        );
    },

    "tasks.delete": async function (taskData: TaskDelete) {
        check(taskData._id, String);

        if (!this.userId) {
            throw new Meteor.Error("not-authorized", "Vous devez être connecté pour supprimer une tâche");
        }

        const task = await TasksCollection.findOneAsync({ _id: taskData._id });

        if (!task) {
            throw new Meteor.Error("task-not-found", "Tâche non trouvée");
        }

        if (task.groupId) {
            const group = await GroupsCollection.findOneAsync({
                _id: task.groupId,
                "members.userId": this.userId
            });

            if (!group) {
                throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre du groupe de cette tâche");
            }
        }
        else if (task.userId !== this.userId) {
            throw new Meteor.Error("not-authorized", "Vous pouvez supprimer uniquement vos propres tâches");
        }

        return await TasksCollection.removeAsync({ _id: taskData._id });
    },

    "tasks.updateText": async function (taskData: { _id: string; text: string }) {
        check(taskData._id, String);
        check(taskData.text, String);

        if (!this.userId) {
            throw new Meteor.Error("not-authorized", "Vous devez être connecté pour modifier une tâche");
        }

        const textValidation = validateTaskText(taskData.text);
        if (!textValidation.isValid) {
            throw new Meteor.Error("invalid-text", textValidation.error);
        }

        const task = await TasksCollection.findOneAsync({ _id: taskData._id });

        if (!task) {
            throw new Meteor.Error("task-not-found", "Tâche non trouvée");
        }

        if (task.groupId) {
            const group = await GroupsCollection.findOneAsync({
                _id: task.groupId,
                "members.userId": this.userId
            });

            if (!group) {
                throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre du groupe de cette tâche");
            }
        }
        else if (task.userId !== this.userId) {
            throw new Meteor.Error("not-authorized", "Vous pouvez modifier uniquement vos propres tâches");
        }

        return await TasksCollection.updateAsync(
            { _id: taskData._id },
            { $set: { text: taskData.text } }
        );
    }
});

