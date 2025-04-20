import { Mongo } from "meteor/mongo";
import { Group } from "../types/group";

export const GroupsCollection = new Mongo.Collection<Group>("groups");