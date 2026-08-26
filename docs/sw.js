/*
 * Service worker de l'application.
 *
 * Ce fichier n'est pas bundlé : Vite le recopie tel quel et le plugin
 * `sw-precache-manifest` (voir vite.config.js) remplace au build les deux
 * marqueurs ci-dessous par la liste réelle des fichiers émis et un identifiant
 * de version. En développement, la liste reste vide et seul le cache d'exécution
 * fonctionne.
 */

const VERSION = '1787708377406';
const CACHE_COQUILLE = `coquille-${VERSION}`;
const CACHE_TEXTES = 'aelf-textes-v1';
const PRECACHE = ["/","/assets/index-Br1D15k7.css","/assets/index-Ersm47Vp.js","/icons/icon-180.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/icons/icon-maskable.svg","/icons/icon.svg","/index.html","/manifest.webmanifest"];

const AELF = 'https://api.aelf.org';

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    (async () => {
      if (Array.isArray(PRECACHE) && PRECACHE.length) {
        const cache = await caches.open(CACHE_COQUILLE);
        // `reload` : on ne veut pas précacher une réponse déjà périmée du navigateur.
        await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      const noms = await caches.keys();
      await Promise.all(
        noms
          .filter((nom) => nom.startsWith('coquille-') && nom !== CACHE_COQUILLE)
          .map((nom) => caches.delete(nom))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (evenement) => {
  if (evenement.data === 'passer-en-actif') self.skipWaiting();
});

/** Coquille : le réseau d'abord, le cache si le réseau manque. */
async function reseauPuisCache(requete, nomCache) {
  const cache = await caches.open(nomCache);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) cache.put(requete, reponse.clone());
    return reponse;
  } catch (erreur) {
    const enCache = await cache.match(requete);
    if (enCache) return enCache;
    throw erreur;
  }
}

/** Fichiers versionnés : le cache d'abord, c'est immuable. */
async function cachePuisReseau(requete, nomCache) {
  const enCache = await caches.match(requete);
  if (enCache) return enCache;
  const reponse = await fetch(requete);
  if (reponse.ok && requete.url.startsWith(self.location.origin)) {
    const cache = await caches.open(nomCache);
    cache.put(requete, reponse.clone());
  }
  return reponse;
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;

  const url = new URL(requete.url);

  // Navigation : on sert toujours la coquille, l'application se recompose seule.
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      (async () => {
        try {
          return await fetch(requete);
        } catch {
          const cache = await caches.open(CACHE_COQUILLE);
          return (
            (await cache.match('/index.html')) ??
            (await cache.match('/')) ??
            new Response('Hors connexion', { status: 503, headers: { 'Content-Type': 'text/plain' } })
          );
        }
      })()
    );
    return;
  }

  if (url.origin === AELF) {
    evenement.respondWith(reseauPuisCache(requete, CACHE_TEXTES));
    return;
  }

  if (url.origin === self.location.origin) {
    evenement.respondWith(cachePuisReseau(requete, CACHE_COQUILLE));
  }
});
