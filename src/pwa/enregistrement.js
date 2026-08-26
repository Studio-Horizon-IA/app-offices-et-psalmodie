import { message } from '../ui/coquille.js';

/**
 * Enregistrement du service worker. En développement on s'en abstient : un
 * cache de coquille rendrait le rechargement à chaud illisible.
 */
export function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', async () => {
    try {
      const enregistrement = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      enregistrement.addEventListener('updatefound', () => {
        const nouveau = enregistrement.installing;
        if (!nouveau) return;
        nouveau.addEventListener('statechange', () => {
          if (nouveau.state === 'installed' && navigator.serviceWorker.controller) {
            message('Nouvelle version installée — elle s’appliquera à la prochaine ouverture.', 4000);
          }
        });
      });
    } catch {
      // Sans service worker l'application reste utilisable, simplement en ligne.
    }
  });
}
