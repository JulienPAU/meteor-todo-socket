import { Meteor } from "meteor/meteor";
import { TasksCollection } from "./TasksCollection";
import { GroupsCollection } from "./GroupsCollection";

Meteor.publish("tasks", function () {
  if (!this.userId) {
    return this.ready();
  }

  return TasksCollection.find({
    userId: this.userId,
    groupId: { $exists: false }
  });
});

Meteor.publish("tasks.inGroup", function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  return TasksCollection.find({ groupId: groupId });
});

Meteor.publish("tasks.allGroupTasks", function () {
  if (!this.userId) {
    return this.ready();
  }

  const userId = this.userId;

  return TasksCollection.find({
    groupId: {
      $exists: true
    }
  });
});
