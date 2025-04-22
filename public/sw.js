const CACHE_NAME = "todo-socket-v1";
const urlsToCache = ["/", "/manifest.json", "/icons/app-icon.png"];

let notificationBadgeCount = 0;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
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
        tag: "notification",
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

    event.waitUntil(
        clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && "focus" in client) return client.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || "/");
            }
        })
    );
});
