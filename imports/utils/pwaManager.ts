export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            return registration;
        } catch (error) {
            return null;
        }
    }
    return null;
};

export const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showNotification = async (title: string, options: NotificationOptions) => {
    const swRegistration = await navigator.serviceWorker.ready;

    if (!swRegistration) {
        return false;
    }

    try {
        await swRegistration.showNotification(title, options);
        return true;
    } catch (error) {
        return false;
    }
};

export const updateAppBadge = async (count: number) => {
    if (!('setAppBadge' in navigator)) {
        return false;
    }

    try {
        if (count > 0) {
            await navigator.setAppBadge(count);
        } else {
            await navigator.clearAppBadge();
        }
        return true;
    } catch {
        return false;
    }
};