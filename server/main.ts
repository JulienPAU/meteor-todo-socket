import { Meteor } from "meteor/meteor";
import { TasksCollection } from "/imports/api/TasksCollection";
import "../imports/api/TasksPublication";
import "../imports/api/tasksMethods";



const insertTask = (taskText: string) =>
  TasksCollection.insertAsync({
    text: taskText,
    createdAt: new Date(),
  });

Meteor.startup(async () => {
  if ((await TasksCollection.find().countAsync()) === 0) {
    [
      "First Task",
      "Second Task",
      "Third Task",
      "Fourth Task",
      "Fifth Task",
      "Sixth Task",
      "Seventh Task",
    ].forEach(insertTask);
  }
});