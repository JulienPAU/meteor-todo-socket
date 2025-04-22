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
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'Voir'
                }
            ]
        });
        return true;
    } catch (error) {
        return false;
    }
};

// Cette fonction stocke le nombre de notifications actuel
let currentBadgeCount = 0;
// Flag pour savoir si on a affiché une notification pour forcer le badge
let notificationShown = false;

export const updateAppBadge = async (count: number) => {
    currentBadgeCount = count;

    // Si pas de notifications, réinitialiser l'état
    if (count === 0) {
        notificationShown = false;
    }

    // Essayer d'abord avec l'API Badging standard (Chrome, Edge, Safari récent)
    const standardBadgingAvailable = 'setAppBadge' in navigator && typeof navigator.setAppBadge === 'function';
    const experimentalBadgingAvailable = 'setExperimentalAppBadge' in navigator &&
        typeof navigator.setExperimentalAppBadge === 'function';

    // Tentative avec l'API standard
    if (standardBadgingAvailable) {
        try {
            if (count > 0 && navigator.setAppBadge) {
                await navigator.setAppBadge(count);
                return true;
            } else if (navigator.clearAppBadge) {
                await navigator.clearAppBadge();
                return true;
            }
        } catch (error) {
            // Passer à la méthode suivante
        }
    }

    // Tentative avec l'API expérimentale
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
            // Passer à la méthode suivante
        }
    }

    // Si l'API standard n'est pas disponible, utiliser le service worker pour les notifications
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Mettre à jour un état dans le service worker pour indiquer le nombre de notifications
            if (registration.active) {
                registration.active.postMessage({
                    type: 'UPDATE_BADGE',
                    count: count
                });

                // Envoyer une notification visible pour forcer l'apparition du badge sur certains appareils
                const hasPermission = await checkNotificationPermission();
                if (count > 0 && hasPermission && !notificationShown) {
                    // Sur certains appareils, seule une notification visible forcera l'apparition d'un badge
                    await showNotification(`${count} nouvelle${count > 1 ? 's' : ''} notification${count > 1 ? 's' : ''}`, {
                        body: 'Cliquez pour voir vos notifications',
                        data: { badge: count, url: '/' },
                        silent: false,
                        requireInteraction: false,  // Se ferme automatiquement
                        tag: 'badge-notification' // Permet de remplacer une notification précédente
                    });
                    notificationShown = true;
                    return true;
                }

                // Si notification déjà montrée ou pas de notifications, simplement mettre à jour
                if (count === 0) {
                    // Effacer les notifications précédentes si le compteur est à zéro
                    registration.getNotifications({ tag: 'badge-notification' })
                        .then(notifications => {
                            notifications.forEach(notification => notification.close());
                        });
                }
            }
        } catch (error) {
            return false;
        }
    }

    return false;
};

// Fonction pour récupérer le nombre actuel de notifications
export const getCurrentBadgeCount = () => {
    return currentBadgeCount;
};