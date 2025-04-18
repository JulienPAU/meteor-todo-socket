export interface Message {
    _id?: string;
    senderId: string;
    senderUsername: string;
    receiverId: string;
    receiverUsername: string;
    content: string;
    createdAt: Date;
    read: boolean;
}

export interface MessageInsert {
    receiverId: string;
    receiverUsername: string;
    content: string;
}