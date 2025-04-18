export interface User {
    _id: string;
    username?: string;
    profile?: {
        name?: string;
        defaultTasksCreated?: boolean;
    };
    status?: {
        online: boolean;
        lastActivity?: Date;
    };
}

export interface UserCredentials {
    username: string;
    hashedPassword: string;
    createdAt: Date;
}