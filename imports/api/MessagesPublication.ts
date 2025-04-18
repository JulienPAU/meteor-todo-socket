import { Meteor } from "meteor/meteor";
import { MessagesCollection } from "./MessagesCollection";

Meteor.publish('messages', function () {
    if (!this.userId) {
        return this.ready();
    }

    return MessagesCollection.find({
        $or: [
            { senderId: this.userId },
            { receiverId: this.userId }
        ]
    }, {
        sort: { createdAt: -1 },
        limit: 100
    });
});

Meteor.publish('conversationMessages', function (otherUserId) {
    if (!this.userId) {
        return this.ready();
    }

    if (!otherUserId || typeof otherUserId !== 'string') {
        return this.ready();
    }

    return MessagesCollection.find({
        $or: [
            { senderId: this.userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: this.userId }
        ]
    }, {
        sort: { createdAt: -1 },
        limit: 50
    });
});