import { $ } from '../util/dom.js';
import { store, reglerParametre } from '../core/store.js';
import { COULEURS, COULEURS_NUIT } from '../data/offices.js';

/** Ouverture/fermeture des tiroirs, thème, taille du texte, zoom, messages. */

const preferenceSysteme = window.matchMedia('(prefers-color-scheme: dark)');

const panneaux = new Map();
let ouvert = null;
let scrim = null;

export function initCoquille() {
  scrim = $('#scrim');

  enregistrerPanneau('jour', $('#drawer-jour'), $('#btn-jour'));
  enregistrerPanneau('parametres', $('#drawer-parametres'), $('#btn-parametres'));
  enregistrerPanneau('psalmodie', $('#panneau-psalmodie'), $('#btn-psalmodie'));

  scrim.addEventListener('click', () => fermerPanneau());
  document.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Escape' && ouvert) fermerPanneau();
  });

  preferenceSysteme.addEventListener('change', appliquerTheme);
  glisserPourFermer();
  appliquerTheme();
  appliquerTaille();
  initZoomDeuxDoigts();
}

function enregistrerPanneau(nom, element, bouton) {
  panneaux.set(nom, { element, bouton });
  bouton?.addEventListener('click', () => basculerPanneau(nom));
}

export function basculerPanneau(nom) {
  if (ouvert === nom) fermerPanneau();
  else ouvrirPanneau(nom);
}

export function ouvrirPanneau(nom) {
  const panneau = panneaux.get(nom);
  if (!panneau) return;
  if (ouvert && ouvert !== nom) fermerPanneau({ garderScrim: true });

  ouvert = nom;
  panneau.element.hidden = false;
  scrim.hidden = false;
  // Une frame d'écart, sinon la transition ne part pas depuis l'état fermé.
  // La frame est mémorisée : si l'on referme avant qu'elle ne s'exécute (choix
  // d'un office aussitôt après l'ouverture), elle rouvrirait le tiroir.
  panneau.frame = requestAnimationFrame(() => {
    panneau.frame = null;
    panneau.element.classList.add('is-open');
    scrim.classList.add('is-open');
  });
  panneau.bouton?.setAttribute('aria-expanded', 'true');
  panneau.element.querySelector('button, [href], select, input')?.focus({ preventScroll: true });
}

export function fermerPanneau({ garderScrim = false } = {}) {
  if (!ouvert) return;
  const panneau = panneaux.get(ouvert);
  if (panneau.frame) {
    cancelAnimationFrame(panneau.frame);
    panneau.frame = null;
  }
  panneau.element.classList.remove('is-open');
  panneau.bouton?.setAttribute('aria-expanded', 'false');
  const element = panneau.element;
  setTimeout(() => {
    if (!element.classList.contains('is-open')) element.hidden = true;
  }, 280);

  if (!garderScrim) {
    scrim.classList.remove('is-open');
    setTimeout(() => {
      if (!scrim.classList.contains('is-open')) scrim.hidden = true;
    }, 280);
  }
  ouvert = null;
}

/** Fermeture au glissé : vers l'extérieur pour un tiroir, vers le bas pour la feuille. */
function glisserPourFermer() {
  for (const [nom, { element }] of panneaux) {
    let depart = null;
    const vertical = nom === 'psalmodie';
    const sens = nom === 'parametres' ? 1 : -1;

    element.addEventListener(
      'touchstart',
      (evenement) => {
        depart = evenement.touches[0];
      },
      { passive: true }
    );

    element.addEventListener(
      'touchend',
      (evenement) => {
        if (!depart) return;
        const fin = evenement.changedTouches[0];
        const dx = fin.clientX - depart.clientX;
        const dy = fin.clientY - depart.clientY;
        const franchi = vertical ? dy > 70 && Math.abs(dy) > Math.abs(dx) : dx * sens > 70;
        if (franchi) fermerPanneau();
        depart = null;
      },
      { passive: true }
    );
  }
}

/* --- Thème et typographie --- */

export function appliquerTheme() {
  const { nuit } = store.parametres;
  const sombre = nuit === null ? preferenceSysteme.matches : nuit;
  document.documentElement.dataset.theme = sombre ? 'nuit' : 'jour';
  appliquerCouleurLiturgique();

  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  const couleur = sombre ? '#14110e' : '#f6f1e7';
  if (meta) meta.content = couleur;
}

export function appliquerCouleurLiturgique() {
  const couleur = store.jour?.informations?.couleur;
  const sombre = document.documentElement.dataset.theme === 'nuit';
  const table = sombre ? COULEURS_NUIT : COULEURS;
  const valeur = table[couleur] ?? (sombre ? '#d5a852' : '#8a6a2f');
  document.documentElement.style.setProperty('--liturgique', valeur);
}

export function appliquerTaille() {
  document.documentElement.style.setProperty('--texte-scale', String(store.parametres.tailleTexte));
}

/* --- Zoom à deux doigts sur le texte --- */

const TAILLE_MIN = 0.8;
const TAILLE_MAX = 2.2;

function initZoomDeuxDoigts() {
  const zone = $('#liturgie');
  let base = null;
  let depart = 0;

  const distance = (touches) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  zone.addEventListener(
    'touchstart',
    (evenement) => {
      if (!store.parametres.zoomDeuxDoigts || evenement.touches.length !== 2) return;
      base = store.parametres.tailleTexte;
      depart = distance(evenement.touches);
    },
    { passive: true }
  );

  zone.addEventListener(
    'touchmove',
    (evenement) => {
      if (base === null || evenement.touches.length !== 2) return;
      evenement.preventDefault();
      const rapport = distance(evenement.touches) / depart;
      const taille = Math.min(TAILLE_MAX, Math.max(TAILLE_MIN, base * rapport));
      document.documentElement.style.setProperty('--texte-scale', taille.toFixed(3));
    },
    { passive: false }
  );

  const terminer = () => {
    if (base === null) return;
    const taille = Number(
      getComputedStyle(document.documentElement).getPropertyValue('--texte-scale')
    );
    base = null;
    if (Number.isFinite(taille) && taille > 0) reglerParametre({ tailleTexte: Number(taille.toFixed(2)) });
  };

  zone.addEventListener('touchend', terminer, { passive: true });
  zone.addEventListener('touchcancel', terminer, { passive: true });

  appliquerTouchAction();
}

export function appliquerTouchAction() {
  // Quand notre zoom est actif, on garde la main sur le geste à deux doigts ;
  // sinon on rend le pincement au navigateur.
  $('#liturgie').style.touchAction = store.parametres.zoomDeuxDoigts ? 'pan-y' : 'auto';
}

/* --- Messages brefs --- */

let minuterieToast = null;

export function message(texte, duree = 2600) {
  const toast = $('#toast');
  toast.textContent = texte;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('is-open'));
  clearTimeout(minuterieToast);
  minuterieToast = setTimeout(() => {
    toast.classList.remove('is-open');
    setTimeout(() => {
      toast.hidden = true;
    }, 220);
  }, duree);
}
