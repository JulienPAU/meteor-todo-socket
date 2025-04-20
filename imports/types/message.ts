export interface Message {
  _id?: string;
  senderId: string;
  senderUsername: string;
  receiverId?: string;
  receiverUsername?: string;
  groupId?: string;
  content: string;
  createdAt: Date;
  read: boolean;
  readBy?: string[];
}

export interface MessageInsert {
  receiverId?: string;
  receiverUsername?: string;
  groupId?: string;
  content: string;
}

export interface GroupMessageInsert {
  groupId: string;
  content: string;
}
