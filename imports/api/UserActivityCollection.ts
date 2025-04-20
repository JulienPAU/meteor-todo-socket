import { Mongo } from 'meteor/mongo';

export interface UserActivity {
    sessionId: string;
    userId?: string;
    username: string;
    action: 'typing' | 'editing' | 'cursor' | 'selection';
    targetId?: string;
    groupId?: string;
    position?: {
        x: number;
        y: number;
    };
    selection?: {
        start: number;
        end: number;
    };
    color?: string;
    timestamp: Date;
}

export const UserActivityCollection = new Mongo.Collection<UserActivity>('userActivity');