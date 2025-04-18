export interface Task {
    _id?: string;
    text: string;
    userId: string;
    createdAt: Date;
    isChecked?: boolean;
}

export interface TaskInsert {
    text: string;
}

export interface TaskToggle {
    _id: string;
    isChecked: boolean;
}

export interface TaskDelete {
    _id: string;
}