import { iso } from '../util/date.js';

const CLE = 'offices.parametres.v1';

const PAR_DEFAUT = {
  // Lectures
  region: 'france',
  // Psalmodie
  ton: 'II',
  instrument: 'piano',
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
