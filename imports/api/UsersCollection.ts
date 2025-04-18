import { Mongo } from "meteor/mongo";
import { UserCredentials } from "/imports/types/user";

export const UsersCredentialsCollection = new Mongo.Collection<UserCredentials>("users_credentials");