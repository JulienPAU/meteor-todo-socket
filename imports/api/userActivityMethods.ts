import { Meteor } from "meteor/meteor";
import { UserActivityCollection } from "./UserActivityCollection";
import { Random } from "meteor/random";
import { GroupsCollection } from "./GroupsCollection";

const sessionStorage = new Map<string, string>();

const getUserColorInGroup = async (
  userId: string,
  groupId: string
): Promise<string | null> => {
  const group = await GroupsCollection.findOneAsync(
    { _id: groupId, "members.userId": userId },
    { fields: { "members.$": 1 } }
  );

  if (group?.members?.[0]?.color) {
    return group.members[0].color;
  }

  return null;
};

Meteor.methods({
  "userActivity.setTyping": async function (
    username: string,
    action: "typing" | "editing",
    targetId?: string,
    groupId?: string
  ) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const connectionId = this.connection?.id || Random.id();
    let sessionId = sessionStorage.get(connectionId);
    if (!sessionId) {
      sessionId = Random.id();
      sessionStorage.set(connectionId, sessionId);
    }

    let color: string | undefined = undefined;
    if (groupId) {
      const colorResult = await getUserColorInGroup(this.userId, groupId);
      color = colorResult || undefined;
    }

    await UserActivityCollection.upsertAsync(
      { sessionId, action },
      {
        $set: {
          sessionId,
          userId: this.userId,
          username,
          action,
          targetId,
          groupId,
          color,
          timestamp: new Date()
        }
      }
    );

    if (action === "typing") {
      Meteor.setTimeout(async () => {
        await UserActivityCollection.removeAsync({
          sessionId,
          action: "typing"
        });
      }, 3000);
    } else if (action === "editing") {
      Meteor.setTimeout(async () => {
        const activity = await UserActivityCollection.findOneAsync({
          sessionId,
          action: "editing",
          targetId
        });

        if (
          activity &&
          new Date().getTime() - activity.timestamp.getTime() > 300000
        ) {
          await UserActivityCollection.removeAsync({
            sessionId,
            action: "editing",
            targetId
          });
        }
      }, 300000);
    }
  },

  "userActivity.setCursor": async function (
    groupId: string,
    taskId: string,
    position: { x: number; y: number }
  ) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const group = await GroupsCollection.findOneAsync({
      _id: groupId,
      "members.userId": this.userId
    });

    if (!group) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous n'êtes pas membre de ce groupe"
      );
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    const username = currentUser?.username || "Utilisateur";

    const connectionId = this.connection?.id || Random.id();
    let sessionId = sessionStorage.get(connectionId);
    if (!sessionId) {
      sessionId = Random.id();
      sessionStorage.set(connectionId, sessionId);
    }

    const member = group.members.find((m) => m.userId === this.userId);
    const color = member?.color || "#666";

    await UserActivityCollection.upsertAsync(
      { sessionId, action: "cursor" },
      {
        $set: {
          sessionId,
          userId: this.userId,
          username,
          action: "cursor",
          targetId: taskId,
          groupId,
          position,
          color,
          timestamp: new Date()
        }
      }
    );

    Meteor.setTimeout(async () => {
      const activity = await UserActivityCollection.findOneAsync({
        sessionId,
        action: "cursor",
        targetId: taskId
      });

      if (
        activity &&
        new Date().getTime() - activity.timestamp.getTime() > 10000
      ) {
        await UserActivityCollection.removeAsync({
          sessionId,
          action: "cursor",
          targetId: taskId
        });
      }
    }, 10000);
  },

  "userActivity.setSelection": async function (
    groupId: string,
    taskId: string,
    selection: { start: number; end: number }
  ) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const group = await GroupsCollection.findOneAsync({
      _id: groupId,
      "members.userId": this.userId
    });

    if (!group) {
      throw new Meteor.Error(
        "not-authorized",
        "Vous n'êtes pas membre de ce groupe"
      );
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    const username = currentUser?.username || "Utilisateur";

    const connectionId = this.connection?.id || Random.id();
    let sessionId = sessionStorage.get(connectionId);
    if (!sessionId) {
      sessionId = Random.id();
      sessionStorage.set(connectionId, sessionId);
    }

    const member = group.members.find((m) => m.userId === this.userId);
    const color = member?.color || "#666";

    await UserActivityCollection.upsertAsync(
      { sessionId, action: "selection", targetId: taskId },
      {
        $set: {
          sessionId,
          userId: this.userId,
          username,
          action: "selection",
          targetId: taskId,
          groupId,
          selection,
          color,
          timestamp: new Date()
        }
      }
    );
  },

  "userActivity.clear": async function (
    action?: "typing" | "editing" | "cursor" | "selection"
  ) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const connectionId = this.connection?.id;
    if (connectionId) {
      const sessionId = sessionStorage.get(connectionId);
      if (sessionId) {
        if (action) {
          await UserActivityCollection.removeAsync({
            sessionId,
            action,
            userId: this.userId
          });
        } else {
          await UserActivityCollection.removeAsync({
            sessionId,
            userId: this.userId
          });
        }
      }
    }

    if (action) {
      await UserActivityCollection.removeAsync({
        userId: this.userId,
        action
      });
    }
  }
});

Meteor.onConnection((connection) => {
  connection.onClose(async () => {
    const sessionId = sessionStorage.get(connection.id);
    if (sessionId) {
      await UserActivityCollection.removeAsync({ sessionId });
      sessionStorage.delete(connection.id);
    }
  });
});
