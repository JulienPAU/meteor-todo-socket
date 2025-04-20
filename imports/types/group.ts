export type GroupMemberRole = "admin" | "member";

export interface GroupMember {
    userId: string;
    username: string;
    role: GroupMemberRole;
    joinedAt: Date;
    color?: string;
}

export interface Group {
    _id?: string;
    name: string;
    description?: string;
    createdAt: Date;
    members: GroupMember[];
    createdBy: {
        userId: string;
        username: string;
    };
}

export interface GroupCreate {
    name: string;
    description?: string;
}

export interface GroupAddMember {
    groupId: string;
    userId: string;
    username: string;
    role?: GroupMemberRole;
}

export interface GroupRemoveMember {
    groupId: string;
    userId: string;
}

export interface GroupChangeMemberRole {
    groupId: string;
    userId: string;
    role: GroupMemberRole;
}