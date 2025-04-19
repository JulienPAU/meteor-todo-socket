/**
 * Utilitaires de validation pour sécuriser les inputs
 */

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