/*
 * Shudha's Studio dashboard service worker (OD-60, OD-61). Scope: /admin only (registered by
 * src/components/admin/push/service-worker.tsx). Hand-written on purpose:
 *
 * - The only cache is the offline shell: the /admin/offline page and the icons, filled on
 *   install. Admin pages, API and server-action responses and /_next/* are never cached, so
 *   nothing from the dashboard stays on the phone after she signs out.
 * - Navigations under /admin go to the network; only when the network throws does the cached
 *   offline page answer. Every other request is left to the browser untouched.
 * - Push: shows the notification; a click focuses an open dashboard window and navigates it.
 *
 * Bump CACHE whenever the shell or the icon set changes; activate removes older caches.
 */
const CACHE = "admin-shell-v1";
const OFFLINE_URL = "/admin/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/badge-96.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/admin")) return;
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL, { cacheName: CACHE });
      return (
        cached ||
        new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
      );
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Shudha's Studio";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: payload.tag || undefined,
      // A same-tag notification replaces the earlier one silently unless renotify is set.
      renotify: !!payload.tag,
      data: { url: payload.url || "/admin" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/admin",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const open = clients.find((client) => new URL(client.url).pathname.startsWith("/admin"));
      if (open) {
        await open.focus();
        if ("navigate" in open) return open.navigate(target);
        return open;
      }
      return self.clients.openWindow(target);
    }),
  );
});
