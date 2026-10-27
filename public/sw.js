/* Motaa service worker: shows push notifications (bookings, orders, chat messages…) even when the site is closed,
 * and opens the right page when one is tapped. It deliberately caches nothing, so a new build is never hidden
 * behind a stale copy. Served at /sw.js (scope "/"); keep it uncached by the host (Cache-Control: no-cache). */

const FALLBACK = { title: 'Motaa', body: 'You have a new notification.', url: '/', tag: '' };

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

function readPush(event) {
  if (!event.data) return FALLBACK;
  try {
    const data = event.data.json();
    return {
      title: (data && typeof data.title === 'string' && data.title.trim()) || FALLBACK.title,
      body: (data && typeof data.body === 'string' && data.body) || FALLBACK.body,
      url: (data && typeof data.url === 'string' && data.url) || FALLBACK.url,
      tag: (data && typeof data.tag === 'string' && data.tag) || '',
    };
  } catch (error) {
    // plain text push: use it as the message
    try { return { ...FALLBACK, body: event.data.text() || FALLBACK.body }; } catch (e) { return FALLBACK; }
  }
}

self.addEventListener('push', (event) => {
  const push = readPush(event);
  event.waitUntil(self.registration.showNotification(push.title, {
    body: push.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: push.tag || undefined,
    renotify: Boolean(push.tag), // a newer message in the same chat replaces the last one and still alerts
    data: { url: push.url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let target;
  try { target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin); }
  catch (error) { target = new URL('/', self.location.origin); }
  const sameOrigin = target.origin === self.location.origin;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (open && sameOrigin) {
      await open.focus();
      // navigate the open app (a full load of that page; the SPA handles the route)
      if ('navigate' in open) {
        try { await open.navigate(target.pathname + target.search + target.hash); return; } catch (error) { /* not controlled yet */ }
      }
      open.postMessage({ type: 'motaa:navigate', path: target.pathname + target.search + target.hash });
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});
