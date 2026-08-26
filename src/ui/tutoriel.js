import { el, vider, $, icone, ICONES } from '../util/dom.js';
import { store, reglerParametre } from '../core/store.js';

/**
 * Mode tutoriel : ce qui manque à qui découvre la psalmodie, c'est la
 * signification des signes. Le mode ajoute donc deux choses, et rien de plus —
 *
 *   • une légende permanente sous le premier psaume de la section ;
 *   • une visite guidée qui pointe chaque élément à l'écran, une fois.
 *
 * Il s'active et se désactive dans les paramètres, et ne modifie jamais le
 * texte liturgique lui-même.
 */

const ETAPES = [
  {
    cible: '.bandeau-partition',
    titre: 'La partition du ton',
    texte:
      'Elle reste sous vos yeux. De gauche à droite : l’intonation qui monte, la teneur ' +
      'sur laquelle on récite, la flexe, la médiante, puis la terminaison. Pendant le ' +
      'chant, la note entendue s’allume ici.',
  },
  {
    cible: '.psalmodie-texte .syl.r-teneur',
    titre: 'Le trait : on récite',
    texte:
      'Sous ce trait, toutes les syllabes se chantent sur une seule note, la teneur. ' +
      'Il n’y a rien à mémoriser : on lit au rythme de la parole.',
  },
  {
    cible: '.psalmodie-texte .syl[data-note]',
    titre: 'Les points : la mélodie',
    texte:
      'À la fin de chaque hémistiche, la voix bouge. Chaque point est une note, placée ' +
      'à sa hauteur réelle : plus bas, la voix descend. La syllabe en gras est l’accent ' +
      'qui déclenche la cadence.',
  },
  {
    cible: '.psalmodie-texte .marque',
    titre: 'Les signes du texte',
    texte:
      '« * » ferme le premier hémistiche : c’est la médiante, on respire. « + » marque ' +
      'la flexe : la voix descend d’un degré, puis reprend la teneur.',
  },
  {
    cible: '.verset-play',
    titre: 'Essayer un seul verset',
    texte:
      'Ce bouton chante ce verset-là. C’est la bonne façon d’apprendre : un verset, ' +
      'puis le même en chantant avec.',
  },
  {
    cible: '.chant-play',
    titre: 'Chanter le psaume entier',
    texte:
      'La syllabe en cours se surligne au fil du chant. Dans les paramètres, l’allure ' +
      'peut être ralentie le temps de prendre le pli.',
  },
  {
    cible: '#btn-psalmodie',
    titre: 'Changer de ton',
    texte:
      'Le ton se choisit ici, et l’application le retient pour cet office. En usage, ' +
      'c’est l’antienne du jour qui le commande — la feuille l’explique.',
  },
];

let visite = null;
let premierPsaume = true;

export function initTutoriel() {
  document.addEventListener('keydown', (evenement) => {
    if (!visite) return;
    if (evenement.key === 'Escape') terminerVisite();
    if (evenement.key === 'ArrowRight') allerA(visite.index + 1);
    if (evenement.key === 'ArrowLeft') allerA(visite.index - 1);
  });
}

export function tutorielActif() {
  return store.parametres.modeTutoriel !== false;
}

/** À appeler au rendu d'une section : la légende ne s'affiche qu'une fois. */
export function reinitialiserTutoriel() {
  premierPsaume = true;
  terminerVisite();
}

/* --- Légende permanente --- */

function exemple(classe, contenu) {
  return el(`span.legende-signe.${classe}`, {}, contenu);
}

/**
 * Légende des signes, posée sous le premier psaume de la section. Renvoie
 * `null` si le mode est éteint ou si la légende a déjà été placée.
 */
export function legendePsalmodie() {
  if (!tutorielActif() || !premierPsaume) return null;
  premierPsaume = false;

  return el(
    'aside.psalmodie-legende',
    {},
    el(
      'ul',
      {},
      el('li', {}, exemple('trait', ''), 'on récite sur la teneur'),
      el('li', {}, exemple('point', ''), 'une note, à sa hauteur'),
      el('li', {}, exemple('signe', '+'), 'flexe : la voix descend'),
      el('li', {}, exemple('signe', '*'), 'médiante : on respire'),
    ),
    el(
      'button.bouton',
      { type: 'button', onclick: () => lancerVisite() },
      icone(ICONES.aide, 24),
      'Visite guidée'
    )
  );
}

/* --- Visite guidée --- */

function construireCadre() {
  const trou = el('div.tutoriel-trou');
  const bulle = el('div.tutoriel-bulle', { role: 'dialog', 'aria-modal': 'true' });
  const cadre = el('div.tutoriel', {}, trou, bulle);
  document.body.append(cadre);
  return { cadre, trou, bulle };
}

export function lancerVisite() {
  terminerVisite();
  const etapes = ETAPES.filter((etape) => document.querySelector(etape.cible));
  if (!etapes.length) return;

  visite = { ...construireCadre(), etapes, index: -1 };
  visite.cadre.addEventListener('click', (evenement) => {
    if (evenement.target === visite?.cadre) terminerVisite();
  });
  allerA(0);
}

export function terminerVisite() {
  visite?.cadre.remove();
  visite = null;
}

function allerA(index) {
  if (!visite) return;
  if (index < 0) return;
  if (index >= visite.etapes.length) {
    reglerParametre({ tutorielVu: true });
    terminerVisite();
    return;
  }

  visite.index = index;
  const etape = visite.etapes[index];
  const cible = document.querySelector(etape.cible);
  if (!cible) {
    allerA(index + 1);
    return;
  }

  cible.scrollIntoView({ block: 'center', behavior: 'smooth' });
  // Le défilement doux doit s'achever avant qu'on mesure la cible.
  setTimeout(() => placer(etape, cible), 260);
}

function placer(etape, cible) {
  if (!visite) return;
  const cadre = cible.getBoundingClientRect();
  const marge = 6;

  Object.assign(visite.trou.style, {
    top: `${cadre.top - marge}px`,
    left: `${cadre.left - marge}px`,
    width: `${cadre.width + marge * 2}px`,
    height: `${cadre.height + marge * 2}px`,
  });

  const dernier = visite.index === visite.etapes.length - 1;
  vider(visite.bulle).append(
    el('p.tutoriel-etape', {}, `${visite.index + 1} / ${visite.etapes.length}`),
    el('h2', {}, etape.titre),
    el('p', {}, etape.texte),
    el(
      'div.tutoriel-actions',
      {},
      el(
        'button.bouton',
        { type: 'button', onclick: () => terminerVisite() },
        'Quitter'
      ),
      visite.index > 0
        ? el('button.bouton', { type: 'button', onclick: () => allerA(visite.index - 1) }, 'Précédent')
        : null,
      el(
        'button.bouton.primaire',
        { type: 'button', onclick: () => allerA(visite.index + 1) },
        dernier ? 'Terminer' : 'Suivant'
      )
    )
  );

  // La bulle se place du côté où il reste de la place.
  const dessous = cadre.bottom + 16;
  const hauteurBulle = visite.bulle.offsetHeight;
  const place = window.innerHeight - dessous > hauteurBulle + 16;
  visite.bulle.style.top = place
    ? `${dessous}px`
    : `${Math.max(16, cadre.top - hauteurBulle - 16)}px`;
}

/**
 * Propose la visite une seule fois, quand le mode est actif et qu'un psaume est
 * à l'écran. On ne l'impose jamais deux fois.
 */
export function proposerVisite() {
  if (!tutorielActif() || store.parametres.tutorielVu) return;
  if (!document.querySelector('.psalmodie-texte')) return;
  // Marqué dès la proposition : quitter en route vaut refus, et l'offre ne
  // doit pas revenir à chaque section. La visite reste rejouable à la demande.
  reglerParametre({ tutorielVu: true });
  setTimeout(() => lancerVisite(), 700);
}
