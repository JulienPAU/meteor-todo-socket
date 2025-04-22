// Types pour les API du navigateur qui peuvent ne pas être reconnues par TypeScript
declare global {
    interface Navigator {
        setAppBadge?: (count: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
        setExperimentalAppBadge?: (count: number) => Promise<void>;
        clearExperimentalAppBadge?: () => Promise<void>;
    }

    interface NotificationOptions {
        vibrate?: number[];
        badge?: string;
        silent?: boolean | null;
        data?: any;
        actions?: { action: string, title: string }[];
        renotify?: boolean;
        requireInteraction?: boolean;
        tag?: string;
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
    if (currentBadgeCount === count) {
        return true;
    }

    currentBadgeCount = count;

    const standardBadgingAvailable = 'setAppBadge' in navigator && typeof navigator.setAppBadge === 'function';

    if (standardBadgingAvailable) {
        try {
            if (count > 0) {
                if (navigator.setAppBadge) {
                    await navigator.setAppBadge(count);
                }
                return true;
            } else {
                if (navigator.clearAppBadge) {
                    await navigator.clearAppBadge();
                }
                return true;
            }
        } catch (error) {
        }
    }

    const experimentalBadgingAvailable = 'setExperimentalAppBadge' in navigator &&
        typeof navigator.setExperimentalAppBadge === 'function';

    if (experimentalBadgingAvailable) {
        try {
            if (count > 0 && navigator.setExperimentalAppBadge) {
                await navigator.setExperimentalAppBadge(count);
                return true;
            } else if (navigator.clearExperimentalAppBadge) {
                await navigator.clearExperimentalAppBadge();
                return true;
            }
        } catch (error) {
        }
    }

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;

            if (registration.active) {
                registration.active.postMessage({
                    type: 'UPDATE_BADGE',
                    count: count
                });
                return true;
            }
        } catch (error) {
        }
    }

    try {
        const originalTitle = document.title.replace(/^\(\d+\)\s/, '');
        if (count > 0) {
            document.title = `(${count}) ${originalTitle}`;
        } else {
            document.title = originalTitle;
        }
        return true;
    } catch (error) {
        return false;
    }
};

export const getCurrentBadgeCount = () => {
    return currentBadgeCount;
};