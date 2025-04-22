const CACHE_NAME = "todo-socket-v2";
const urlsToCache = ["/", "/manifest.json", "/icons/app-icon.png"];

let notificationBadgeCount = 0;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                return clients.claim();
            })
    );
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

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "UPDATE_BADGE") {
        notificationBadgeCount = event.data.count;

        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: "BADGE_UPDATED",
                    count: notificationBadgeCount,
                });
            });
        });
    }
});

self.addEventListener("push", (event) => {
    let payload = {};

    try {
        if (event.data) {
            payload = event.data.json();
        }
    } catch (e) {
        console.error("Service Worker: Erreur lors du traitement des données de notification", e);
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

    const urlToOpen = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
