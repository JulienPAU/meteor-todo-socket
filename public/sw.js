const CACHE_NAME = "todo-socket-v1";
const urlsToCache = ["/", "/manifest.json", "/icons/app-icon.png"];

// Variable pour stocker le nombre de notifications
let notificationBadgeCount = 0;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
    // Force l'activation immédiate du service worker
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    // Prendre le contrôle immédiatement sans attendre le rechargement
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).catch(() => {
                if (event.request.mode === "navigate") {
                    return caches.match("/");
                }
            });
        })
    );
});

// Écouter les messages de l'application principale
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "UPDATE_BADGE") {
        notificationBadgeCount = event.data.count;
    }
});

self.addEventListener("push", (event) => {
    let payload = {};

    try {
        if (event.data) {
            payload = event.data.json();
        }
    } catch (e) {
        payload = {
            title: "Nouvelle notification",
            body: "Vous avez reçu une nouvelle notification",
            badge: notificationBadgeCount,
        };
    }

    const title = payload.title || "Nouvelle notification";
    const options = {
        body: payload.body || "Vous avez reçu une nouvelle notification",
        icon: "/icons/app-icon.png",
        badge: "/icons/app-icon.png",
        data: {
            url: payload.url || "/",
            badge: payload.badge || notificationBadgeCount || 1,
        },
        vibrate: [100, 50, 100],
        tag: payload.tag || "notification",
        renotify: true,
        requireInteraction: true,
        actions: [
            {
                action: "view",
                title: "Voir",
            },
        ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    // Action spécifique si l'utilisateur clique sur le bouton "Voir"
    if (event.action === "view" || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: "window" }).then((clientList) => {
                // Si une fenêtre est déjà ouverte, la focus
                for (const client of clientList) {
                    if (client.url && "focus" in client) {
                        return client.focus();
                    }
                }
                // Sinon, ouvrir une nouvelle fenêtre
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url || "/");
                }
            })
        );
    }
});
