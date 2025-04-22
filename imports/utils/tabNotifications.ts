let originalTitle = document.title;
let isTabActive = true;

/**
 * Initialise le système de notification dans l'onglet
 */
export const initTabNotifications = () => {
    originalTitle = document.title;

    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;
        if (isTabActive) {
            document.title = originalTitle;
        }
    });

    window.addEventListener('focus', () => {
        isTabActive = true;
        document.title = originalTitle;
    });

    window.addEventListener('blur', () => {
        isTabActive = false;
    });
};

/**
 * Met à jour le titre de l'onglet avec des notifications
 * @param unreadMessagesCount - Nombre de messages non lus
 * @param hasGroupActivity - Indique s'il y a une activité de groupe
 */
export const updateTabTitle = (unreadMessagesCount: number, hasGroupActivity: boolean) => {
    if (isTabActive) return;

    const totalNotifications = unreadMessagesCount + (hasGroupActivity ? 1 : 0);

    if (totalNotifications > 0) {
        document.title = `(${totalNotifications}) ${originalTitle}`;
    } else {
        document.title = originalTitle;
    }
};