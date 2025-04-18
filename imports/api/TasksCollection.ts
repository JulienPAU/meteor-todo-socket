import { Mongo } from "meteor/mongo";
import { Task } from "/imports/types/task";

export const TasksCollection = new Mongo.Collection<Task>("tasks");