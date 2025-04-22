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

// Cette fonction stocke le nombre de notifications actuel
let currentBadgeCount = 0;
// Flag pour éviter d'afficher des notifications en boucle
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 60000; // 1 minute entre les notifications

export const updateAppBadge = async (count: number) => {
    // Si le nombre n'a pas changé, ne rien faire
    if (currentBadgeCount === count) {
        return true;
    }

    currentBadgeCount = count;

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
            // Continuer avec la méthode suivante
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
            // Continuer avec la méthode suivante
        }
    }

    // Si l'API standard n'est pas disponible, utiliser le service worker pour les notifications
    if ('serviceWorker' in navigator && document.hidden) {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Mettre à jour un état dans le service worker pour indiquer le nombre de notifications
            if (registration.active) {
                registration.active.postMessage({
                    type: 'UPDATE_BADGE',
                    count: count
                });

                // Vérifier si nous sommes en période de refroidissement
                const now = Date.now();
                if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
                    return false;
                }

                // Envoyer une notification visible uniquement si:
                // 1. On a des notifications
                // 2. On a la permission
                // 3. L'utilisateur n'est pas sur l'app
                // 4. Assez de temps s'est écoulé depuis la dernière notification
                const hasPermission = await checkNotificationPermission();
                if (count > 0 && hasPermission && document.hidden) {
                    // Fermer les notifications existantes pour éviter l'accumulation
                    const oldNotifications = await registration.getNotifications({
                        tag: 'badge-notification'
                    });
                    oldNotifications.forEach(notification => notification.close());

                    // Créer une nouvelle notification
                    await showNotification(`${count} nouvelle${count > 1 ? 's' : ''} notification${count > 1 ? 's' : ''}`, {
                        body: 'Cliquez pour voir vos notifications',
                        data: { badge: count, url: '/' },
                        tag: 'badge-notification', // Assure qu'une seule notification est affichée
                        renotify: false
                    });

                    // Mettre à jour le timestamp de la dernière notification
                    lastNotificationTime = now;
                    return true;
                }

                // Si pas de notifications, effacer les notifications précédentes
                if (count === 0) {
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