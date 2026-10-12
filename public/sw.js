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
    icon: "/__l5e/assets-v1/2cd6a4d8-9ccf-47da-8b6b-d5f8ab6aa0e2/app-icon-192-white.png",
    badge: "/__l5e/assets-v1/2cd6a4d8-9ccf-47da-8b6b-d5f8ab6aa0e2/app-icon-192-white.png",
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
