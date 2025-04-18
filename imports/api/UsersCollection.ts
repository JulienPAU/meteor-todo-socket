import { Mongo } from "meteor/mongo";

export interface UserCredentials {
    username: string;
    hashedPassword: string;
    createdAt: Date;
}

export const UsersCredentialsCollection = new Mongo.Collection<UserCredentials>("usersCredentials");