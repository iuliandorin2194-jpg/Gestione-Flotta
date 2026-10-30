/* Gestione Flotta — service worker (facoltativo)
   Serve solo ad aprire l'app senza rete. Va messo NELLA STESSA CARTELLA di index.html,
   mai nella cartella principale del sito: così non tocca le altre app su github.io.
   Strategia: prima la rete (gli aggiornamenti arrivano subito), senza rete usa la copia salvata.
   Non va ricaricato quando esce una nuova versione dell'app.
   I dati dell'app NON passano da qui: restano in IndexedDB / localStorage. */
const CACHE = 'flotta-app';

// lavora solo dentro la propria cartella e solo con la propria cache
const nellaCartella = url => url.startsWith(self.registration.scope);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html']).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // cancella solo le vecchie cache di Gestione Flotta, mai quelle delle altre app
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n.startsWith('flotta-') && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !nellaCartella(r.url)) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
        return res;
      })
      .catch(() => caches.open(CACHE).then(c =>
        c.match(r).then(m => m || c.match(new URL('index.html', self.registration.scope).href))))
  );
});
