import { Meteor } from 'meteor/meteor';
import { UserActivityCollection } from './UserActivityCollection';
import { Random } from 'meteor/random';

const sessionStorage = new Map<string, string>();

Meteor.methods({
    'userActivity.setTyping': async function (username: string, action: 'typing' | 'editing', targetId?: string) {
        if (!this.userId) {
            throw new Meteor.Error('Not authorized');
        }

        const connectionId = this.connection?.id || Random.id();
        let sessionId = sessionStorage.get(connectionId);
        if (!sessionId) {
            sessionId = Random.id();
            sessionStorage.set(connectionId, sessionId);
        }

        await UserActivityCollection.upsertAsync(
            { sessionId },
            {
                $set: {
                    sessionId,
                    username,
                    action,
                    targetId,
                    timestamp: new Date()
                }
            }
        );

        if (action === 'typing') {
            Meteor.setTimeout(async () => {
                await UserActivityCollection.removeAsync({ sessionId, action: 'typing' });
            }, 3000);
        }
    },

    'userActivity.clear': async function () {
        if (!this.userId) {
            throw new Meteor.Error('Not authorized');
        }

        const connectionId = this.connection?.id;
        if (connectionId) {
            const sessionId = sessionStorage.get(connectionId);
            if (sessionId) {
                await UserActivityCollection.removeAsync({ sessionId });
            }
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