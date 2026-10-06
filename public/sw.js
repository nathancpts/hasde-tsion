/* Hasdé Tsion — service worker (notifications push) */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Hasdé Tsion", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Hasdé Tsion 🕍";
  const options = {
    body: payload.body || "",
    icon: "/__l5e/assets-v1/c7560a28-d102-4434-b627-28a67a44a80b/app-icon-192-gold.png",
    badge: "/__l5e/assets-v1/c7560a28-d102-4434-b627-28a67a44a80b/app-icon-192-gold.png",
    tag: payload.tag || undefined,
    data: { url: payload.url || "/" },
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
