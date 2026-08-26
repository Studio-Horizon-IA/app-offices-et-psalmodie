/**
 * Cache des textes en IndexedDB : c'est lui qui rend l'application utilisable
 * sans réseau, et c'est lui que purgent les réglages « hors connexion ».
 */

const BASE = 'offices-textes';
const MAGASIN = 'textes';
const VERSION = 1;
const DELAI_OUVERTURE = 3000;

let promesseBase = null;
let horsService = false;

/**
 * Ouvre la base — avec un garde-fou : en navigation privée ou lorsque le
 * stockage est bridé, `indexedDB.open` peut rester muet indéfiniment. On
 * abandonne alors le cache plutôt que de bloquer la lecture des offices, et on
 * ne réessaie plus pour le reste de la session.
 */
function ouvrir() {
  if (promesseBase) return promesseBase;
  if (horsService) return Promise.reject(new Error('IndexedDB hors service'));
  if (!('indexedDB' in globalThis) || !globalThis.indexedDB) {
    horsService = true;
    return Promise.reject(new Error('IndexedDB indisponible'));
  }

  promesseBase = new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE, VERSION);
    const minuterie = setTimeout(
      () => rejeter(new Error('IndexedDB ne répond pas')),
      DELAI_OUVERTURE
    );
    const terminer = (action, valeur) => {
      clearTimeout(minuterie);
      action(valeur);
    };

    requete.onupgradeneeded = () => {
      const db = requete.result;
      if (!db.objectStoreNames.contains(MAGASIN)) {
        const magasin = db.createObjectStore(MAGASIN, { keyPath: 'cle' });
        magasin.createIndex('enregistreLe', 'enregistreLe');
      }
    };
    requete.onsuccess = () => terminer(resoudre, requete.result);
    requete.onerror = () => terminer(rejeter, requete.error);
    requete.onblocked = () => terminer(rejeter, new Error('IndexedDB bloquée'));
  }).catch((erreur) => {
    promesseBase = null;
    horsService = true;
    throw erreur;
  });
  return promesseBase;
}

function transaction(mode, action) {
  return ouvrir().then(
    (db) =>
      new Promise((resoudre, rejeter) => {
        const tx = db.transaction(MAGASIN, mode);
        const resultat = action(tx.objectStore(MAGASIN));
        // `resultat.result` vaut `undefined` pour une clé absente : il faut
        // tester le type de la requête, pas la valeur, sinon on renvoie
        // l'objet IDBRequest lui-même — truthy et trompeur.
        tx.oncomplete = () =>
          resoudre(resultat instanceof IDBRequest ? resultat.result : resultat);
        tx.onerror = () => rejeter(tx.error);
        tx.onabort = () => rejeter(tx.error);
      })
  );
}

export function cleCache(office, date, region) {
  return `${office}|${date}|${region}`;
}

export async function lireCache(office, date, region) {
  try {
    const entree = await transaction('readonly', (magasin) =>
      magasin.get(cleCache(office, date, region))
    );
    return entree?.donnees ? entree : null;
  } catch {
    return null;
  }
}

export async function ecrireCache(office, date, region, donnees) {
  try {
    await transaction('readwrite', (magasin) =>
      magasin.put({
        cle: cleCache(office, date, region),
        office,
        date,
        region,
        donnees,
        enregistreLe: Date.now(),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function estEnCache(office, date, region) {
  return (await lireCache(office, date, region)) !== null;
}

/** Nombre d'entrées et poids approximatif du cache. */
export async function statistiquesCache() {
  let entrees = 0;
  let octets = 0;
  try {
    entrees = await transaction('readonly', (magasin) => magasin.count());
  } catch {
    return { entrees: 0, octets: 0 };
  }
  if (navigator.storage?.estimate) {
    const { usage } = await navigator.storage.estimate();
    octets = usage ?? 0;
  }
  return { entrees, octets };
}

/** Supprime les entrées plus vieilles que `jours` (0 = conservation illimitée). */
export async function purgerExpires(jours) {
  if (!jours) return 0;
  const limite = Date.now() - jours * 86400000;
  const db = await ouvrir().catch(() => null);
  if (!db) return 0;
  return new Promise((resoudre, rejeter) => {
    let supprimes = 0;
    const tx = db.transaction(MAGASIN, 'readwrite');
    const index = tx.objectStore(MAGASIN).index('enregistreLe');
    index.openCursor(IDBKeyRange.upperBound(limite)).onsuccess = (evenement) => {
      const curseur = evenement.target.result;
      if (!curseur) return;
      curseur.delete();
      supprimes += 1;
      curseur.continue();
    };
    tx.oncomplete = () => resoudre(supprimes);
    tx.onerror = () => rejeter(tx.error);
  });
}

export async function viderCache() {
  try {
    await transaction('readwrite', (magasin) => magasin.clear());
  } catch {
    /* rien à vider si la base n'est pas accessible */
  }
  if ('caches' in window) {
    const noms = await caches.keys();
    await Promise.all(noms.filter((n) => n.startsWith('aelf-')).map((n) => caches.delete(n)));
  }
}
