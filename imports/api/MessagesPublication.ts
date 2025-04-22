import { Meteor } from "meteor/meteor";
import { MessagesCollection } from "./MessagesCollection";
import { GroupsCollection } from "./GroupsCollection";

Meteor.publish("messages", function () {
  if (!this.userId) {
    return this.ready();
  }


  const personalMessages = MessagesCollection.find(
    {
      $or: [{ senderId: this.userId }, { receiverId: this.userId }]
    },
    {
      sort: { createdAt: -1 },
      limit: 100
    }
  );


  const userGroupsCursor = GroupsCollection.find(
    { "members.userId": this.userId },
    { fields: { _id: 1 } }
  );

  userGroupsCursor.forEach((group) => {
    if (group && group._id) {
      const groupMessages = MessagesCollection.find(
        { groupId: group._id },
        {
          sort: { createdAt: -1 },
          limit: 100
        }
      );

      groupMessages.forEach((message) => {
        if (message._id) {
          this.added("messages", message._id, { ...message });
        }
      });
    }
  });

  return personalMessages;
});

Meteor.publish("conversationMessages", function (otherUserId) {
  if (!this.userId) {
    return this.ready();
  }

  if (!otherUserId || typeof otherUserId !== "string") {
    return this.ready();
  }

  return MessagesCollection.find(
    {
      $or: [
        { senderId: this.userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: this.userId }
      ]
    },
    {
      sort: { createdAt: 1 },
      limit: 100
    }
  );
});

Meteor.publish("groupMessages", async function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  if (!groupId || typeof groupId !== "string") {
    return this.ready();
  }

  const group = await GroupsCollection.findOneAsync({
    _id: groupId,
    "members.userId": this.userId
  });

  if (!group) {
    return this.ready();
  }

  return MessagesCollection.find(
    { groupId: groupId },
    {
      sort: { createdAt: 1 },
      limit: 100
    }
  );
});

Meteor.publish("groupMessages.all", function () {
  if (!this.userId) {
    return this.ready();
  }


  return MessagesCollection.find(
    {
      groupId: { $exists: true },
      $or: [
        { readBy: { $exists: false } },
        { readBy: { $ne: this.userId } }
      ],
      senderId: { $ne: this.userId }
    },
    {
      sort: { createdAt: -1 },
      limit: 500
    }
  );
});
