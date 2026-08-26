import { el, vider, $, icone, ICONES } from '../util/dom.js';
import { htmlSur } from '../util/sanitize.js';
import { formatLong, capitaliser } from '../util/date.js';
import { initChant, monterPsalmodie, arreterChant } from './chant-psaume.js';
import { masquerBandeau } from './bandeau-partition.js';
import { reinitialiserTutoriel, proposerVisite } from './tutoriel.js';
import { semainePsautier } from '../data/psautier.js';

/** Affichage des sections d'un office, avec onglets et balayage gauche/droite. */

let onglets;
let zone;
let contenu;
let surSection = () => {};
let surPsalmodie = () => {};

export function initLecture({ changerSection, ouvrirPsalmodie }) {
  onglets = $('#sections-track');
  zone = $('#liturgie');
  contenu = $('#liturgie-inner');
  surSection = changerSection;
  surPsalmodie = ouvrirPsalmodie;
  initChant({ ouvrirPsalmodie });

  brancherBalayage();

  document.addEventListener('keydown', (evenement) => {
    if (evenement.target.closest('input, select, textarea')) return;
    if (evenement.key === 'ArrowRight') surSection(+1, 'relatif');
    if (evenement.key === 'ArrowLeft') surSection(-1, 'relatif');
  });
}

function brancherBalayage() {
  let depart = null;
  let horizontal = null;

  zone.addEventListener(
    'touchstart',
    (evenement) => {
      if (evenement.touches.length !== 1) {
        depart = null;
        return;
      }
      depart = { x: evenement.touches[0].clientX, y: evenement.touches[0].clientY, t: Date.now() };
      horizontal = null;
    },
    { passive: true }
  );

  zone.addEventListener(
    'touchmove',
    (evenement) => {
      if (!depart || evenement.touches.length !== 1) return;
      const dx = evenement.touches[0].clientX - depart.x;
      const dy = evenement.touches[0].clientY - depart.y;
      if (horizontal === null && Math.abs(dx) + Math.abs(dy) > 12) {
        horizontal = Math.abs(dx) > Math.abs(dy) * 1.4;
      }
    },
    { passive: true }
  );

  zone.addEventListener(
    'touchend',
    (evenement) => {
      if (!depart || !horizontal) {
        depart = null;
        return;
      }
      const dx = evenement.changedTouches[0].clientX - depart.x;
      const rapide = Date.now() - depart.t < 500 && Math.abs(dx) > 40;
      if (Math.abs(dx) > 80 || rapide) surSection(dx < 0 ? +1 : -1, 'relatif');
      depart = null;
    },
    { passive: true }
  );
}

export function rendreOnglets(sections, actif) {
  vider(onglets);
  sections.forEach((section, index) => {
    const bouton = el(
      'button.section-tab',
      {
        type: 'button',
        role: 'tab',
        id: `onglet-${index}`,
        'aria-controls': 'liturgie-inner',
        'aria-selected': String(index === actif),
        tabindex: index === actif ? '0' : '-1',
        title: section.titre,
        onclick: () => surSection(index, 'absolu'),
      },
      section.court
    );
    onglets.append(bouton);
  });

  const selectionne = onglets.children[actif];
  selectionne?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  if (selectionne) contenu.setAttribute('aria-labelledby', selectionne.id);
}

function blocVersElement(bloc) {
  const article = el(`article.bloc.${bloc.genre}`);

  if (bloc.etiquette) article.append(el('p.bloc-etiquette', {}, bloc.etiquette));
  if (bloc.titre) article.append(el('h2.bloc-titre', {}, bloc.titre));
  if (bloc.ref) article.append(el('p.bloc-ref', {}, bloc.ref));

  const corps = el('div.bloc-corps');
  corps.append(htmlSur(bloc.html));
  article.append(corps);

  if (bloc.source) article.append(el('p.bloc-source', {}, bloc.source));

  // Un psaume s'affiche pointé — syllabes, notes et lecture chantée — et
  // retombe sur le simple rappel du ton si le pointage n'aboutit pas.
  if (bloc.psalmodiable && monterPsalmodie(article, bloc)) return article;

  if (bloc.psalmodiable) {
    article.append(
      el(
        'button.psalmodie-lien',
        { type: 'button', onclick: () => surPsalmodie() },
        icone(ICONES.note, 24),
        'Donner le ton'
      )
    );
  }

  return article;
}

export function rendreSection({ section, office, informations, date, source, horsLigne }) {
  arreterChant(); // on ne chante pas par-dessus la section suivante
  masquerBandeau(); // un psaume dans la section le fera réapparaître
  reinitialiserTutoriel();
  vider(contenu);

  if (horsLigne) {
    contenu.append(
      el(
        'p.bandeau-hors-ligne',
        {},
        source === 'cache'
          ? 'Hors connexion — texte lu depuis la réserve locale.'
          : 'Hors connexion.'
      )
    );
  }

  const psautier = semainePsautier(informations);
  const entete = el('header.office-entete');
  entete.append(el('h1', {}, office.nom));
  entete.append(
    el(
      'p',
      {},
      [
        capitaliser(formatLong(date)),
        informations?.fete,
        psautier.type === 'inconnu' ? null : psautier.libelle,
        section?.titre,
      ]
        .filter(Boolean)
        .join(' · ')
    )
  );
  contenu.append(entete);

  if (!section) {
    contenu.append(
      el('div.etat', {}, el('h2', {}, 'Rien à afficher'), el('p', {}, 'Ce texte est vide pour ce jour.'))
    );
    return;
  }

  for (const bloc of section.blocs) contenu.append(blocVersElement(bloc));

  zone.scrollTo({ top: 0, behavior: 'auto' });
  proposerVisite();
}

export function rendreChargement(office) {
  vider(onglets);
  vider(contenu);
  const squelette = el('div.squelette');
  for (let i = 0; i < 9; i += 1) squelette.append(el('div'));
  contenu.append(el('header.office-entete', {}, el('h1', {}, office?.nom ?? 'Chargement…')), squelette);
}

export function rendreErreur({ titre, detail, actionTexte, action }) {
  vider(onglets);
  vider(contenu);
  contenu.append(
    el(
      'div.etat',
      {},
      el('h2', {}, titre),
      el('p', {}, detail),
      action ? el('button.bouton', { type: 'button', onclick: action }, actionTexte) : null
    )
  );
}
