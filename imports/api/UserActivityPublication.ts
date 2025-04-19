import { Meteor } from 'meteor/meteor';
import { UserActivityCollection } from './UserActivityCollection';

Meteor.publish('userActivity', function () {
    if (!this.userId) {
        return this.ready();
    }

    return UserActivityCollection.find(
        {},
        {
            fields: { sessionId: 1, username: 1, action: 1, targetId: 1, timestamp: 1 },
            sort: { timestamp: -1 }
        }
    );
});