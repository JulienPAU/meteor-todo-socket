import { Meteor } from "meteor/meteor";

export const encryptMessage = (message: string): string => {
    if (!message) return '';

    const encrypted = Array.from(message).reduce(
        (result, char, index) => {
            const shifted = String.fromCharCode(char.charCodeAt(0) + (index % 7) + 3);
            return result + shifted;
        },
        ''
    );

    return encrypted;
};

export const decryptMessage = (encrypted: string): string => {
    if (!encrypted) return '';

    const decrypted = Array.from(encrypted).reduce(
        (result, char, index) => {
            const unshifted = String.fromCharCode(char.charCodeAt(0) - (index % 7) - 3);
            return result + unshifted;
        },
        ''
    );

    return decrypted;
};

export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
    if (!username || username.trim() === '') {
        return { isValid: false, error: 'Le nom d\'utilisateur est requis' };
    }

    if (username.length < 3) {
        return { isValid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
    }

    if (username.length > 20) {
        return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères' };
    }

    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(username)) {
        return { isValid: false, error: 'Le nom d\'utilisateur ne peut contenir que des lettres, des chiffres, des tirets et des underscores' };
    }

    return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
    if (!password) {
        return { isValid: false, error: 'Le mot de passe est requis' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    if (password.length > 50) {
        return { isValid: false, error: 'Le mot de passe est trop long' };
    }

    return { isValid: true };
};

export const validateTaskText = (text: string): { isValid: boolean; error?: string } => {
    if (!text || text.trim() === '') {
        return { isValid: false, error: 'Le texte de la tâche est requis' };
    }

    if (text.length > 280) {
        return { isValid: false, error: 'Le texte de la tâche ne peut pas dépasser 280 caractères' };
    }

    const sanitizedText = text.replace(/<[^>]*>/g, '');

    if (sanitizedText !== text) {
        return { isValid: false, error: 'Le texte contient des caractères non autorisés' };
    }

    return { isValid: true };
};

export const validateChatMessage = (message: string): { isValid: boolean; error?: string } => {
    if (!message || message.trim() === '') {
        return { isValid: false, error: 'Le message ne peut pas être vide' };
    }

    if (message.length > 500) {
        return { isValid: false, error: 'Le message ne peut pas dépasser 500 caractères' };
    }

    return { isValid: true };
};

export const randomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export const formatDate = (date: Date): string => {
    if (!date) return '';

    const pad = (num: number): string => num < 10 ? `0${num}` : `${num}`;

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

export const checkTaskPermission = async (taskId: string, userId: string, GroupsCollection: any, TasksCollection: any) => {
    if (!userId) {
        throw new Meteor.Error("not-authorized", "Vous devez être connecté pour modifier une tâche");
    }

    const task = await TasksCollection.findOneAsync({ _id: taskId });

    if (!task) {
        throw new Meteor.Error("task-not-found", "Tâche non trouvée");
    }

    if (task.groupId) {
        const group = await GroupsCollection.findOneAsync({
            _id: task.groupId,
            "members.userId": userId
        });

        if (!group) {
            throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre du groupe de cette tâche");
        }
    }
    else if (task.userId !== userId) {
        throw new Meteor.Error("not-authorized", "Vous pouvez modifier uniquement vos propres tâches");
    }

    return task;
};

export const hashPassword = (password: string): string => {
    return Array.from(password)
        .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
        .toString();
};

export const checkGroupMembership = async (
    groupId: string,
    userId: string,
    GroupsCollection: any
): Promise<{ members: { userId: string; role: string }[] }> => {
    if (!userId) {
        throw new Meteor.Error("not-authorized", "Vous devez être connecté");
    }

    const group = await GroupsCollection.findOneAsync({
        _id: groupId,
        "members.userId": userId
    });

    if (!group) {
        throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre de ce groupe");
    }

    return group;
};

export const checkMessagePermission = async (
    messageId: string,
    userId: string,
    MessagesCollection: any,
    GroupsCollection: any
): Promise<any> => {
    if (!userId) {
        throw new Meteor.Error("not-authorized", "Vous devez être connecté");
    }

    const message = await MessagesCollection.findOneAsync({ _id: messageId });

    if (!message) {
        throw new Meteor.Error("message-not-found", "Message non trouvé");
    }

    if (message.groupId) {
        const group = await GroupsCollection.findOneAsync({
            _id: message.groupId,
            "members.userId": userId
        });

        if (!group) {
            throw new Meteor.Error("not-authorized", "Vous n'êtes pas membre de ce groupe");
        }

        const isAdmin = group.members.some(
            (member: { userId: string; role: string }) => member.userId === userId && member.role === "admin"
        );

        if (message.senderId !== userId && !isAdmin) {
            throw new Meteor.Error(
                "not-authorized",
                "Vous ne pouvez supprimer que vos propres messages ou être administrateur du groupe"
            );
        }
    }
    else if (message.senderId !== userId && message.receiverId !== userId) {
        throw new Meteor.Error(
            "not-authorized",
            "Vous ne pouvez supprimer que vos propres messages ou les messages que vous avez reçus"
        );
    }

    return message;
};

export const checkGroupAdminPermission = async (
    groupId: string,
    userId: string,
    GroupsCollection: any
): Promise<any> => {
    if (!userId) {
        throw new Meteor.Error("not-authorized", "Vous devez être connecté");
    }

    const group = await GroupsCollection.findOneAsync(groupId);
    if (!group) {
        throw new Meteor.Error("group-not-found", "Groupe non trouvé");
    }

    const isAdmin = group.members.some(
        (member: { userId: string; role: string }) => member.userId === userId && member.role === "admin"
    );

    if (!isAdmin) {
        throw new Meteor.Error(
            "not-authorized",
            "Seul un administrateur peut effectuer cette action"
        );
    }

    return group;
};