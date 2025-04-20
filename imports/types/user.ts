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
    lastLogin?: {
      date: Date;
    };
  };
  lastReadTimestamps?: {
    groups: {
      [groupId: string]: Date;
    };
  };
}

export interface UserCredentials {
  username: string;
  hashedPassword: string;
  createdAt: Date;
}
