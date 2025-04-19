import { Mongo } from 'meteor/mongo';

export interface UserActivity {
    sessionId: string;
    username: string;
    action: 'typing' | 'editing';
    targetId?: string;
    timestamp: Date;
}

export const UserActivityCollection = new Mongo.Collection<UserActivity>('userActivity');