import { Meteor } from "meteor/meteor";
import { UserActivityCollection } from "./UserActivityCollection";
import { GroupsCollection } from "./GroupsCollection";

Meteor.publish("userActivity", function () {
  if (!this.userId) {
    return this.ready();
  }

  return UserActivityCollection.find(
    {
      groupId: { $exists: false },
      $or: [
        { userId: this.userId },
        { action: "editing" }
      ]
    },
    {
      fields: {
        sessionId: 1,
        userId: 1,
        username: 1,
        action: 1,
        targetId: 1,
        timestamp: 1,
        color: 1
      },
      sort: { timestamp: -1 }
    }
  );
});

Meteor.publish("groupActivity", async function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  const group = await GroupsCollection.findOneAsync({
    _id: groupId,
    "members.userId": this.userId
  });

  if (!group) {
    return this.ready();
  }

  return UserActivityCollection.find(
    { groupId: groupId },
    {
      fields: {
        sessionId: 1,
        userId: 1,
        username: 1,
        action: 1,
        targetId: 1,
        groupId: 1,
        position: 1,
        selection: 1,
        color: 1,
        timestamp: 1
      },
      sort: { timestamp: -1 },
      limit: 50
    }
  );
});
