import { Meteor } from "meteor/meteor";
import { GroupsCollection } from "./GroupsCollection";
import { TasksCollection } from "./TasksCollection";

/**
 * Publication des groupes dont l'utilisateur est membre
 */
Meteor.publish("groups", function publishGroups() {
  if (!this.userId) {
    return this.ready();
  }

  return GroupsCollection.find(
    { "members.userId": this.userId },
    {
      fields: {
        name: 1,
        description: 1,
        createdAt: 1,
        createdBy: 1,
        members: 1
      }
    }
  );
});

/**
 * Publication des détails d'un groupe spécifique (si membre)
 */
Meteor.publish("groupDetails", function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  if (!groupId) {
    return this.ready();
  }

  return GroupsCollection.find({
    _id: groupId,
    "members.userId": this.userId
  });
});

/**
 * Publication des tâches d'un groupe spécifique (si membre)
 */
Meteor.publish("tasks.inGroup", function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  if (!groupId) {
    return this.ready();
  }

  const groupCount = GroupsCollection.find({
    _id: groupId,
    "members.userId": this.userId
  }).count();

  if (groupCount === 0) {
    return this.ready();
  }

  return TasksCollection.find(
    { groupId: groupId },
    { sort: { createdAt: -1 } }
  );
});
