import { Mongo } from "meteor/mongo";
import { Message } from "/imports/types/message";

export const MessagesCollection = new Mongo.Collection<Message>("messages");