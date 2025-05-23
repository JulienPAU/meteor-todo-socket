export interface Task {
    _id?: string;
    text: string;
    userId: string;
    groupId?: string;
    createdAt: Date;
    isChecked?: boolean;
    createdBy?: string;
    position?: number;
    isUrgent?: boolean;
}

export interface TaskInsert {
    text: string;
    groupId?: string;
    isUrgent?: boolean;
}

export interface TaskToggle {
    _id: string;
    isChecked: boolean;
}

export interface TaskDelete {
    _id: string;
}

export interface TaskGroupFilter {
    groupId: string;
}