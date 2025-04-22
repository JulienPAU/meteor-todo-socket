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
            console.log('Service Worker enregistré avec succès:', registration);
            return registration;
        } catch (error) {
            console.error('Erreur d\'enregistrement du Service Worker:', error);
            return null;
        }
    }
    return null;
};

export const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('Les notifications ne sont pas supportées sur ce navigateur');
        return false;
    }

    if (Notification.permission === 'granted') {
        console.log('Permission de notification déjà accordée');
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        console.log('Résultat de la demande de permission:', permission);
        return permission === 'granted';
    }

    console.log('Permission de notification refusée précédemment');
    return false;
};

export const showNotification = async (title: string, options: NotificationOptions) => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker non supporté');
        return false;
    }

    try {
        const swRegistration = await navigator.serviceWorker.ready;

        if (!swRegistration) {
            console.log('Service Worker non disponible');
            return false;
        }

        await swRegistration.showNotification(title, {
            ...options,
            badge: '/icons/app-icon.png',
            icon: '/icons/app-icon.png',
            vibrate: [200, 100, 200]
        });
        console.log('Notification affichée avec succès');
        return true;
    } catch (error) {
        console.error('Erreur d\'affichage de notification:', error);
        return false;
    }
};

let currentBadgeCount = 0;

export const updateAppBadge = async (count: number) => {
    console.log('Mise à jour du badge avec le compteur:', count);

    if (currentBadgeCount === count) {
        console.log('Compteur de badge inchangé, aucune action nécessaire');
        return true;
    }

    currentBadgeCount = count;

    // Vérifier si les API de badge sont disponibles
    const standardBadgingAvailable = 'setAppBadge' in navigator && typeof navigator.setAppBadge === 'function';
    const experimentalBadgingAvailable = 'setExperimentalAppBadge' in navigator &&
        typeof navigator.setExperimentalAppBadge === 'function';

    console.log('API de badge standard disponible:', standardBadgingAvailable);
    console.log('API de badge expérimental disponible:', experimentalBadgingAvailable);

    // Essayer d'abord l'API standard
    if (standardBadgingAvailable) {
        try {
            if (count > 0 && navigator.setAppBadge) {
                await navigator.setAppBadge(count);
                console.log('Badge défini avec l\'API standard');
                return true;
            } else if (navigator.clearAppBadge) {
                await navigator.clearAppBadge();
                console.log('Badge effacé avec l\'API standard');
                return true;
            }
        } catch (error) {
            console.error('Erreur avec l\'API standard de badge:', error);
        }
    }

    // Si l'API standard échoue, essayer l'API expérimentale
    if (experimentalBadgingAvailable) {
        try {
            if (count > 0 && navigator.setExperimentalAppBadge) {
                await navigator.setExperimentalAppBadge(count);
                console.log('Badge défini avec l\'API expérimentale');
                return true;
            } else if (navigator.clearExperimentalAppBadge) {
                await navigator.clearExperimentalAppBadge();
                console.log('Badge effacé avec l\'API expérimentale');
                return true;
            }
        } catch (error) {
            console.error('Erreur avec l\'API expérimentale de badge:', error);
        }
    }

    // Fallback au service worker si les deux APIs échouent
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;

            if (registration.active) {
                registration.active.postMessage({
                    type: 'UPDATE_BADGE',
                    count: count
                });
                console.log('Message de mise à jour de badge envoyé au Service Worker');
                return true;
            } else {
                console.log('Service Worker actif non disponible pour la mise à jour du badge');
            }
        } catch (error) {
            console.error('Erreur lors de la communication avec le Service Worker:', error);
        }
    } else {
        console.log('Service Worker non supporté pour la mise à jour du badge');
    }

    // Dans le cas où toutes les méthodes échouent, mettre à jour le titre de la page
    if (count > 0) {
        const originalTitle = document.title.replace(/^\(\d+\)\s/, '');
        document.title = `(${count}) ${originalTitle}`;
        console.log('Mise à jour du titre de la page comme fallback');
        return true;
    }

    return false;
};

export const getCurrentBadgeCount = () => {
    return currentBadgeCount;
};