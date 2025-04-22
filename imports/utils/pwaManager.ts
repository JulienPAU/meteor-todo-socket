// Types pour les API du navigateur qui peuvent ne pas être reconnues par TypeScript
declare global {
    interface Navigator {
        setAppBadge?: (count: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
    }

    interface NotificationOptions {
        vibrate?: number[];
        badge?: string;
        silent?: boolean | null;
        data?: any;
    }
}

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
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const swRegistration = await navigator.serviceWorker.ready;

        if (!swRegistration) {
            return false;
        }

        await swRegistration.showNotification(title, {
            ...options,
            badge: '/icons/app-icon.png',
            icon: '/icons/app-icon.png',
            vibrate: [200, 100, 200]
        });
        return true;
    } catch (error) {
        return false;
    }
};

let currentBadgeCount = 0;

export const updateAppBadge = async (count: number) => {
    currentBadgeCount = count;

    const badgingAPIAvailable = 'setAppBadge' in navigator && typeof navigator.setAppBadge === 'function';

    if (badgingAPIAvailable) {
        try {
            if (count > 0 && navigator.setAppBadge) {
                await navigator.setAppBadge(count);
            } else if (navigator.clearAppBadge) {
                await navigator.clearAppBadge();
            }
            return true;
        } catch (error) {
        }
    }

    if ('serviceWorker' in navigator && count > 0) {
        try {
            const registration = await navigator.serviceWorker.ready;

            if (registration.active) {
                registration.active.postMessage({
                    type: 'UPDATE_BADGE',
                    count: count
                });

                const hasPermission = await checkNotificationPermission();
                if (count > 0 && hasPermission) {
                    await showNotification(`${count} nouvelles notifications`, {
                        silent: true,
                        data: { badge: count }
                    });
                }
                return true;
            }
        } catch (error) {
            return false;
        }
    }

    return false;
};

export const getCurrentBadgeCount = () => {
    return currentBadgeCount;
};