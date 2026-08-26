import { lireCache, ecrireCache, estEnCache } from './cache.js';
import { OFFICES_PAR_ID, HEURES } from './offices.js';
import { ajouterJours } from '../util/date.js';

const RACINE = 'https://api.aelf.org/v1';
const DELAI = 12000;

export class ErreurReseau extends Error {
  constructor(message, { horsLigne = false } = {}) {
    super(message);
    this.name = 'ErreurReseau';
    this.horsLigne = horsLigne;
  }
}

/**
 * Vrai si l'on s'autorise à sortir sur le réseau : le réglage « WiFi
 * uniquement » ne concerne que les téléchargements de fond, jamais une
 * consultation demandée explicitement par l'utilisateur.
 */
export function reseauAutorise({ wifiSeulement }) {
  if (!navigator.onLine) return false;
  if (!wifiSeulement) return true;
  const lien = navigator.connection;
  if (!lien) return true; // impossible de savoir : on laisse passer
  if (lien.saveData) return false;
  if (lien.type) return lien.type === 'wifi' || lien.type === 'ethernet';
  // Pas de `type` (cas de Chrome mobile) : on se rabat sur la qualité du lien.
  return lien.effectiveType === '4g';
}

async function recuperer(chemin) {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI);
  try {
    const reponse = await fetch(`${RACINE}${chemin}`, {
      signal: controleur.signal,
      headers: { Accept: 'application/json' },
    });
    if (!reponse.ok) throw new ErreurReseau(`AELF a répondu ${reponse.status}`);
    return await reponse.json();
  } catch (erreur) {
    if (erreur instanceof ErreurReseau) throw erreur;
    throw new ErreurReseau("Impossible de joindre l'AELF", { horsLigne: !navigator.onLine });
  } finally {
    clearTimeout(minuterie);
  }
}

/**
 * Charge un office. Les textes d'un jour donné ne changent pas : le cache est
 * donc consulté en premier, et le réseau ne sert qu'à combler un manque.
 */
export async function chargerOffice(officeId, date, region, options = {}) {
  const { forcerReseau = false, sansReseau = false } = options;
  const office = OFFICES_PAR_ID[officeId];
  if (!office) throw new Error(`Office inconnu : ${officeId}`);
  if (office.virtuel) return chargerBible(date, region, options);

  if (!forcerReseau) {
    const entree = await lireCache(officeId, date, region);
    if (entree) return { donnees: entree.donnees, source: 'cache', enregistreLe: entree.enregistreLe };
  }

  if (sansReseau) throw new ErreurReseau('Texte absent du cache', { horsLigne: true });

  const donnees = await recuperer(`/${office.api}/${date}/${region}`);
  await ecrireCache(officeId, date, region, donnees);
  return { donnees, source: 'reseau', enregistreLe: Date.now() };
}

/**
 * « Bible » n'est pas un point d'accès de l'AELF : on rassemble les péricopes
 * bibliques du jour (messe + office des lectures) en un seul document.
 */
async function chargerBible(date, region, options) {
  const [messe, lectures] = await Promise.allSettled([
    chargerOffice('messe', date, region, options),
    chargerOffice('lectures', date, region, options),
  ]);

  if (messe.status === 'rejected' && lectures.status === 'rejected') throw messe.reason;

  const informations =
    messe.value?.donnees?.informations ?? lectures.value?.donnees?.informations ?? null;

  return {
    donnees: {
      informations,
      bible: {
        messes: messe.value?.donnees?.messes ?? [],
        lectures: lectures.value?.donnees?.lectures ?? null,
      },
    },
    source: messe.value?.source === 'reseau' ? 'reseau' : 'cache',
    enregistreLe: messe.value?.enregistreLe ?? Date.now(),
  };
}

/** Offices concernés par le mode hors connexion, selon le réglage choisi. */
export function officesAPrecharger(contenu) {
  switch (contenu) {
    case 'messe':
      return ['messe'];
    case 'offices':
      return HEURES;
    case 'messe+offices':
      return ['messe', ...HEURES];
    default:
      return [];
  }
}

/**
 * Télécharge à l'avance les jours suivants. Renvoie le nombre de textes
 * effectivement ajoutés, en s'arrêtant net si le réseau se ferme.
 */
export async function precharger({ depuis, jours, region, contenu, surProgres }) {
  const offices = officesAPrecharger(contenu);
  if (!offices.length || jours <= 0) return { ajoutes: 0, total: 0 };

  const taches = [];
  for (let decalage = 0; decalage <= jours; decalage += 1) {
    const date = ajouterJours(depuis, decalage);
    for (const office of offices) taches.push({ office, date });
  }

  let faites = 0;
  let ajoutes = 0;
  for (const { office, date } of taches) {
    if (!navigator.onLine) break;
    if (!(await estEnCache(office, date, region))) {
      try {
        await chargerOffice(office, date, region);
        ajoutes += 1;
      } catch {
        // Un jour manquant ne doit pas interrompre le reste du téléchargement.
      }
    }
    faites += 1;
    surProgres?.(faites / taches.length, ajoutes);
  }

  return { ajoutes, total: taches.length };
}
