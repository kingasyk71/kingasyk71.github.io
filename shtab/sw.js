/* Офлайн-оболочка Штаба: свои файлы берём из сети, без сети — из кэша. Данные Supabase не кэшируются здесь. */
const V = 'shtab-v5';
const SHELL = ['./', './index.html', './backend.js', './epochs.js', './scenes.js', './dos.js', './fx.js', './config.js', './vendor/supabase-2.89.0.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const fonts = u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com';
  if (u.origin !== location.origin && !fonts) return;
  if (fonts) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
