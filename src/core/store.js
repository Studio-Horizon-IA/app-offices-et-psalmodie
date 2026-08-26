import { iso } from '../util/date.js';

const CLE = 'offices.parametres.v1';

const PAR_DEFAUT = {
  // Lectures
  region: 'canada',
  // Psalmodie
  ton: 'II', // ton par défaut, quand l'office n'en a pas de propre
  tonsParOffice: {}, // { laudes: 'I', vepres: 'VIII', … }
  instrument: 'piano',
  afficherNotes: true, // notes posées au-dessus des syllabes
  allureChant: 1, // 0,75 = lent (apprentissage), 1,25 = vif
  // Affichage
  nuit: null, // null = suit le système
  tailleTexte: 1,
  zoomDeuxDoigts: true,
  // Hors connexion
  contenuHorsLigne: 'messe+offices', // 'aucun' | 'messe' | 'offices' | 'messe+offices'
  prechargerJours: 3,
  conserverJours: 30,
  wifiSeulement: false,
};

function lireParametres() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...PAR_DEFAUT, ...JSON.parse(brut) } : { ...PAR_DEFAUT };
  } catch {
    return { ...PAR_DEFAUT };
  }
}

const abonnes = new Set();

export const store = {
  parametres: lireParametres(),
  vue: {
    date: iso(),
    office: 'messe',
    section: 0,
  },
  jour: null, // réponse AELF de l'office courant
  source: null, // 'cache' | 'reseau'
  chargement: false,
  erreur: null,
  horsLigne: !navigator.onLine,
};

export function abonner(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

export function notifier(raison = 'maj') {
  for (const fn of abonnes) fn(store, raison);
}

/** Modifie un ou plusieurs paramètres, les persiste et prévient les abonnés. */
export function reglerParametre(champs) {
  Object.assign(store.parametres, champs);
  try {
    localStorage.setItem(CLE, JSON.stringify(store.parametres));
  } catch {
    /* stockage plein ou navigation privée : on continue en mémoire */
  }
  notifier('parametres');
}

export function reglerVue(champs) {
  Object.assign(store.vue, champs);
  notifier('vue');
}

/**
 * Ton psalmodique de l'office affiché. En usage, c'est l'antienne du jour qui
 * commande le ton : on ne chante pas les laudes et les complies sur le même.
 * Chaque office garde donc le sien, avec le ton général comme repli.
 */
export function tonCourant() {
  const { tonsParOffice, ton } = store.parametres;
  return tonsParOffice?.[store.vue.office] ?? ton;
}

export function reglerTonCourant(id) {
  reglerParametre({
    tonsParOffice: { ...store.parametres.tonsParOffice, [store.vue.office]: id },
  });
}
