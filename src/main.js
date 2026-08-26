import './styles/index.css';

import { $ } from './util/dom.js';
import { iso, etiquetteDate, capitaliser, formatLong } from './util/date.js';
import { store, reglerVue, abonner } from './core/store.js';
import { OFFICES_PAR_ID, officeDuMoment } from './data/offices.js';
import { chargerOffice, precharger, reseauAutorise, ErreurReseau } from './data/aelf.js';
import { decouper } from './data/sections.js';
import { purgerExpires, viderCache } from './data/cache.js';
import {
  initCoquille,
  ouvrirPanneau,
  fermerPanneau,
  appliquerCouleurLiturgique,
  message,
} from './ui/coquille.js';
import { initLecture, rendreOnglets, rendreSection, rendreChargement, rendreErreur } from './ui/liturgie.js';
import { initTiroirJour, rendreTiroirJour } from './ui/drawer-jour.js';
import { initTiroirParametres, rendreTiroirParametres, majProgres } from './ui/drawer-parametres.js';
import { initPsalmodie, rendrePsalmodie } from './ui/psalmodie.js';
import { enregistrerServiceWorker } from './pwa/enregistrement.js';

let sections = [];
let jeton = 0; // évite qu'un chargement lent n'écrase un chargement récent

/* --- Adresse (#/office/date/section) --- */

function lireAdresse() {
  const [, office, date, section] = (location.hash || '').split('/');
  const valide = office && OFFICES_PAR_ID[office];
  return {
    office: valide ? office : officeDuMoment(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ? date : iso(),
    section: Number.isFinite(Number(section)) ? Math.max(0, Number(section)) : 0,
  };
}

function ecrireAdresse({ remplacer = false } = {}) {
  const { office, date, section } = store.vue;
  const adresse = `#/${office}/${date}/${section}`;
  if (location.hash === adresse) return;
  if (remplacer) history.replaceState(null, '', adresse);
  else history.pushState(null, '', adresse);
}

/* --- Titre de la barre du haut --- */

function majTitre() {
  const office = OFFICES_PAR_ID[store.vue.office];
  const informations = store.jour?.informations;
  $('#titre-jour').textContent = informations?.ligne1
    ? capitaliser(informations.ligne1)
    : capitaliser(formatLong(store.vue.date));
  $('#titre-fete').textContent = [etiquetteDate(store.vue.date), office?.nom, informations?.fete]
    .filter(Boolean)
    .join(' · ');
}

/* --- Chargement et rendu --- */

async function charger({ forcerReseau = false } = {}) {
  const mien = ++jeton;
  const { office: officeId, date } = store.vue;
  const office = OFFICES_PAR_ID[officeId];
  const { region } = store.parametres;

  store.chargement = true;
  rendreChargement(office);
  majTitre();

  try {
    const { donnees, source } = await chargerOffice(officeId, date, region, { forcerReseau });
    if (mien !== jeton) return;

    store.jour = donnees;
    store.erreur = null;
    store.source = source;
    sections = decouper(officeId, donnees);

    if (store.vue.section >= sections.length) reglerVue({ section: Math.max(0, sections.length - 1) });

    appliquerCouleurLiturgique();
    majTitre();
    rendreOnglets(sections, store.vue.section);
    rendreVueCourante();
    rendreTiroirJour(donnees.informations);
  } catch (erreur) {
    if (mien !== jeton) return;
    store.erreur = erreur;
    const horsLigne = erreur instanceof ErreurReseau && (erreur.horsLigne || !navigator.onLine);
    rendreErreur({
      titre: horsLigne ? 'Texte indisponible hors connexion' : 'Texte indisponible',
      detail: horsLigne
        ? "Ce jour n'a pas été téléchargé. Reconnectez-vous, ou activez le téléchargement à l'avance dans les paramètres."
        : "L'AELF n'a pas répondu. Réessayez dans un instant.",
      actionTexte: 'Réessayer',
      action: () => charger({ forcerReseau: true }),
    });
    rendreTiroirJour(null);
  } finally {
    if (mien === jeton) store.chargement = false;
  }
}

function rendreVueCourante() {
  rendreSection({
    section: sections[store.vue.section],
    office: OFFICES_PAR_ID[store.vue.office],
    informations: store.jour?.informations,
    date: store.vue.date,
    source: store.source,
    horsLigne: !navigator.onLine,
  });
}

/* --- Actions --- */

function changerSection(valeur, mode) {
  if (!sections.length) return;
  const cible = mode === 'relatif' ? store.vue.section + valeur : valeur;
  if (cible < 0 || cible >= sections.length) return;
  reglerVue({ section: cible });
  ecrireAdresse();
  rendreOnglets(sections, cible);
  rendreVueCourante();
}

function choisirOffice(officeId) {
  reglerVue({ office: officeId, section: 0 });
  ecrireAdresse();
  fermerPanneau();
  charger();
}

function choisirDate(date) {
  reglerVue({ date, section: 0 });
  ecrireAdresse();
  charger();
}

async function telechargerMaintenant() {
  const { region, contenuHorsLigne, prechargerJours, wifiSeulement } = store.parametres;
  if (!navigator.onLine) {
    message('Aucune connexion pour le moment.');
    return;
  }
  if (contenuHorsLigne === 'aucun') {
    message('Choisissez d’abord un contenu à conserver.');
    return;
  }
  if (wifiSeulement && !reseauAutorise({ wifiSeulement })) {
    message('Réseau mesuré : téléchargement lancé quand même.');
  }

  majProgres(0);
  const { ajoutes } = await precharger({
    depuis: store.vue.date,
    jours: prechargerJours,
    region,
    contenu: contenuHorsLigne,
    surProgres: (fraction) => majProgres(fraction),
  });
  majProgres(1);
  setTimeout(() => majProgres(null), 800);
  message(ajoutes ? `${ajoutes} texte${ajoutes > 1 ? 's' : ''} téléchargé${ajoutes > 1 ? 's' : ''}.` : 'Tout était déjà en réserve.');
  rendreTiroirParametres();
  rendreTiroirJour(store.jour?.informations);
}

async function purgerCache() {
  if (!confirm('Effacer tous les textes conservés sur cet appareil ?')) return;
  await viderCache();
  message('Réserve locale vidée.');
  rendreTiroirParametres();
  rendreTiroirJour(store.jour?.informations);
}

/* --- Entretien de fond --- */

async function entretien() {
  const { conserverJours, contenuHorsLigne, prechargerJours, region, wifiSeulement } = store.parametres;

  try {
    await purgerExpires(conserverJours);
  } catch {
    /* le cache reste utilisable même si la purge échoue */
  }

  if (contenuHorsLigne === 'aucun' || prechargerJours <= 0) return;
  if (!reseauAutorise({ wifiSeulement })) return;

  await precharger({
    depuis: iso(),
    jours: prechargerJours,
    region,
    contenu: contenuHorsLigne,
  });
  rendreTiroirJour(store.jour?.informations);
}

/* --- Démarrage --- */

function init() {
  Object.assign(store.vue, lireAdresse());

  initPsalmodie();
  // Ces écouteurs précèdent ceux de la coquille : le panneau est donc rempli
  // avant d'être ouvert, jamais après.
  $('#btn-psalmodie').addEventListener('click', () => rendrePsalmodie());
  $('#btn-parametres').addEventListener('click', () => rendreTiroirParametres());

  initCoquille();
  initLecture({ changerSection, ouvrirPsalmodie: ouvrirFeuillePsalmodie });
  initTiroirJour({ choisirOffice, choisirDate });
  initTiroirParametres({
    rafraichir: () => charger({ forcerReseau: false }),
    telecharger: telechargerMaintenant,
    purger: purgerCache,
  });
  $('#btn-titre').addEventListener('click', () => ouvrirPanneau('jour'));

  abonner((_, raison) => {
    if (raison === 'parametres') majTitre();
  });

  window.addEventListener('hashchange', () => {
    const adresse = lireAdresse();
    const memeTexte = adresse.office === store.vue.office && adresse.date === store.vue.date;
    Object.assign(store.vue, adresse);
    if (memeTexte) {
      rendreOnglets(sections, store.vue.section);
      rendreVueCourante();
    } else {
      charger();
    }
  });

  window.addEventListener('online', () => {
    store.horsLigne = false;
    if (store.erreur) charger({ forcerReseau: true });
    else rendreVueCourante();
  });

  window.addEventListener('offline', () => {
    store.horsLigne = true;
    rendreVueCourante();
  });

  ecrireAdresse({ remplacer: true });
  rendreTiroirParametres();
  rendreTiroirJour(null);
  charger().then(() => {
    // L'entretien attend que la lecture du jour soit affichée.
    const lancer = () => entretien();
    if ('requestIdleCallback' in window) requestIdleCallback(lancer, { timeout: 4000 });
    else setTimeout(lancer, 2500);
  });

  enregistrerServiceWorker();
}

function ouvrirFeuillePsalmodie() {
  rendrePsalmodie();
  ouvrirPanneau('psalmodie');
}

init();
