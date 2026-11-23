/* Einkauf: Service Worker (Offline-Betrieb). Bei Änderungen an dieser Datei die Version erhöhen. */
const V = 'einkauf-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
async function put(key, r){ if (r && (r.ok || r.type === 'opaque')){ const c = await caches.open(V); await c.put(key, r.clone()); } }
function withTimeout(p, ms){ return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); }); }
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (req.mode === 'navigate'){
      e.respondWith(withTimeout(fetch(req), 4000).then(r => { put(new Request('./index.html'), r); return r; }).catch(() => caches.match('./index.html')));
    } else if (/\/icons\//.test(url.pathname) || url.pathname.endsWith('.webmanifest')){
      e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { put(req, r); return r; })));
    }
  } else if (FONT_HOSTS.includes(url.hostname)){
    e.respondWith(caches.match(req).then(m => { const n = fetch(req).then(r => { put(req, r); return r; }).catch(() => null); return m || n.then(r => r || Response.error()); }));
  }
  // GitHub-Speicher und alles andere gehen unverändert ins Netz
});
