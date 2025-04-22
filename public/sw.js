const CACHE_NAME = "todo-socket-v1";
const urlsToCache = ["/", "/manifest.json", "/icons/app-icon.png"];

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

self.addEventListener("push", (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: "/icons/app-icon.png",
        badge: "/icons/app-icon.png",
        data: {
            url: data.url,
        },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
