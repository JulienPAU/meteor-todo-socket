import { Mongo } from "meteor/mongo";

export interface Task {
    _id?: string;
    text: string;
    userId: string;
    createdAt: Date;
    isChecked?: boolean;
}

export const TasksCollection = new Mongo.Collection<Task>("tasks");