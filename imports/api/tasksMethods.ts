import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { TasksCollection } from "./TasksCollection";
import { TaskInsert, TaskToggle, TaskDelete } from "/imports/types/task";
import { validateTaskText } from "../utils/validators";

Meteor.methods({
    "tasks.insert": async function (taskData: TaskInsert) {
        check(taskData, {
            text: String,
        });

        if (!this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        const textValidation = validateTaskText(taskData.text);
        if (!textValidation.isValid) {
            throw new Meteor.Error("invalid-text", textValidation.error);
        }

        return await TasksCollection.insertAsync({
            text: taskData.text,
            createdAt: new Date(),
            userId: this.userId,
        });
    },

    "tasks.toggle": async function (taskData: TaskToggle) {
        check(taskData._id, String);
        check(taskData.isChecked, Boolean);

        if (!this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        const task = await TasksCollection.findOneAsync({ _id: taskData._id });

        if (!task || task.userId !== this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        return await TasksCollection.updateAsync(
            { _id: taskData._id },
            { $set: { isChecked: taskData.isChecked } }
        );
    },

    "tasks.delete": async function (taskData: TaskDelete) {
        check(taskData._id, String);

        if (!this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        const task = await TasksCollection.findOneAsync({ _id: taskData._id });

        if (!task || task.userId !== this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        return await TasksCollection.removeAsync({ _id: taskData._id });
    },

    "tasks.updateText": async function (taskData: { _id: string; text: string }) {
        check(taskData._id, String);
        check(taskData.text, String);

        if (!this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        const task = await TasksCollection.findOneAsync({ _id: taskData._id });

        if (!task || task.userId !== this.userId) {
            throw new Meteor.Error("Not authorized.");
        }

        return await TasksCollection.updateAsync(
            { _id: taskData._id },
            { $set: { text: taskData.text } }
        );
    }
});

