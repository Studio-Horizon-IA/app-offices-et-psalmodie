import { el, vider, icone, ICONES } from '../util/dom.js';
import { texteBrut } from '../util/sanitize.js';
import { pointerPsaume } from '../data/pointage.js';
import { planVerset, planPsaume } from '../audio/chant.js';
import { TONS_PAR_ID, TONS, nomFrancais } from '../audio/tons.js';
import { jouerSequence, arreter, audioDisponible } from '../audio/synthese.js';
import { store, tonCourant } from '../core/store.js';
import { message } from './coquille.js';

/**
 * Vue psalmodique d'un psaume : le texte pointé de l'AELF, les notes posées
 * au-dessus des syllabes, et une lecture chantée qui suit syllabe par syllabe.
 *
 * C'est le cœur pédagogique de l'application : montrer, en même temps, ce qu'on
 * lit et ce qu'on chante.
 */

const NOMS_CADENCE = { mediante: 'Médiante', flexe: 'Flexe' };

let ouvrirFeuille = () => {};
let enCours = null; // { spans, image, handle }

export function initChant({ ouvrirPsalmodie }) {
  ouvrirFeuille = ouvrirPsalmodie;
}

/* --- Rendu du texte pointé --- */

function rendreLigne(ligne, notes, spans) {
  const fragment = document.createDocumentFragment();

  // Les syllabes récitées sur la teneur sont regroupées, avec la ponctuation
  // qui les sépare, pour porter un trait continu — le « — » du pointage.
  let recitatif = null;
  let enAttente = [];

  const cible = () => recitatif ?? fragment;
  const viderAttente = (dans) => {
    for (const texte of enAttente) dans.append(texte);
    enAttente = [];
  };
  const fermerRecitatif = () => {
    if (!recitatif) return;
    fragment.append(recitatif);
    recitatif = null;
  };

  for (const jeton of ligne.jetons) {
    if (jeton.type === 'syllabe') {
      const plan = notes.get(jeton);
      const span = el('span.syl', {}, jeton.texte);
      if (jeton.accent) span.classList.add('accent');
      if (plan) {
        span.classList.add(`r-${plan.role}`);
        if (plan.role !== 'teneur') span.dataset.note = nomFrancais(plan.note);
      }
      spans.set(jeton, span);

      if (plan?.role === 'teneur') {
        recitatif ??= el('span.recitatif');
        viderAttente(recitatif);
        recitatif.append(span);
      } else {
        viderAttente(cible());
        fermerRecitatif();
        fragment.append(span);
      }
      continue;
    }

    // Fragment brut : on isole la marque de pointage pour la rendre lisible.
    const marque = ligne.marque;
    if (marque && jeton === ligne.jetons.at(-1) && jeton.texte.includes(marque)) {
      const position = jeton.texte.lastIndexOf(marque);
      viderAttente(cible());
      cible().append(jeton.texte.slice(0, position));
      fermerRecitatif();
      fragment.append(
        el(
          'abbr.marque',
          { title: `${NOMS_CADENCE[ligne.cadence] ?? 'Pointage'} — ${legende(ligne.cadence)}` },
          marque
        )
      );
      fragment.append(jeton.texte.slice(position + marque.length));
      continue;
    }
    // Mis en attente : ce fragment rejoint la récitation si la syllabe
    // suivante s'y trouve encore, sinon il sortira du trait.
    enAttente.push(jeton.texte);
  }

  viderAttente(cible());
  fermerRecitatif();
  return fragment;
}

function legende(cadence) {
  if (cadence === 'flexe') return 'la voix descend d’un degré';
  if (cadence === 'mediante') return 'fin du premier hémistiche';
  return 'cadence';
}

/** Associe chaque syllabe à son étape chantée. */
function tableDesNotes(etapes) {
  const table = new Map();
  for (const etape of etapes) {
    if (etape.syllabe) table.set(etape.syllabe, etape);
  }
  return table;
}

function rendreVerset(verset, notes, index, surChanterVerset, spans) {
  const paragraphe = el('p.verset');

  const bouton = el(
    'button.verset-play',
    {
      type: 'button',
      'aria-label': `Chanter le verset ${verset.numero ?? index + 1}`,
      onclick: () => surChanterVerset(index),
    },
    icone(ICONES.play, 24)
  );
  paragraphe.append(bouton);

  if (verset.numero) paragraphe.append(el('span.verse_number', {}, verset.numero));

  let premiere = true;
  for (const ligne of verset.lignes) {
    if (ligne.vide) continue;
    if (!premiere) paragraphe.append(el('br'));
    premiere = false;
    const span = el('span.ligne', { dataset: { cadence: ligne.cadence ?? 'recitatif' } });
    span.append(rendreLigne(ligne, notes, spans));
    paragraphe.append(span);
  }
  return paragraphe;
}

/* --- Lecture chantée --- */

function arreterSuivi() {
  if (!enCours) return;
  for (const span of enCours.spans.values()) span.classList.remove('chante');
  enCours.bouton?.classList.remove('en-lecture');
  if (enCours.bouton) majBouton(enCours.bouton, false);
  enCours = null;
}

export function arreterChant() {
  arreter();
  arreterSuivi();
}

function suivre(handle, spans) {
  let curseur = 0;
  let precedent = null;

  const boucle = () => {
    if (!enCours || enCours.handle !== handle) return;
    const maintenant = handle.ctx.currentTime;

    while (curseur < handle.jalons.length && handle.jalons[curseur].fin <= maintenant) {
      curseur += 1;
    }
    const jalon = handle.jalons[curseur];
    const span = jalon?.etape.syllabe ? spans.get(jalon.etape.syllabe) : null;

    if (span !== precedent) {
      precedent?.classList.remove('chante');
      span?.classList.add('chante');
      if (span) garderEnVue(span);
      precedent = span;
    }

    if (curseur < handle.jalons.length) requestAnimationFrame(boucle);
  };

  requestAnimationFrame(boucle);
}

function garderEnVue(span) {
  const cadre = span.getBoundingClientRect();
  const marge = 96;
  if (cadre.top < marge || cadre.bottom > window.innerHeight - marge) {
    span.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function majBouton(bouton, actif) {
  vider(bouton);
  bouton.append(icone(actif ? ICONES.stop : ICONES.play, 24), actif ? 'Arrêter' : 'Chanter');
}

/* --- Montage d'un bloc --- */

/**
 * Remplace le corps d'un psaume par sa version pointée. Renvoie `false` si le
 * texte ne se reconstruit pas à l'identique : on préfère alors l'affichage
 * ordinaire à un texte abîmé.
 */
export function monterPsalmodie(article, bloc) {
  const versets = pointerPsaume(bloc.html);
  if (!versets.length) return false;

  const ton = TONS_PAR_ID[tonCourant()] ?? TONS[0];
  const spans = new Map();

  const corps = el('div.bloc-corps.psalmodie-texte');
  const notes = tableDesNotes(planPsaume(versets, ton));

  const chanterVerset = (index) => {
    lancer(planVerset(versets[index], ton, { intonation: index === 0 }));
  };

  versets.forEach((verset, index) => {
    corps.append(rendreVerset(verset, notes, index, chanterVerset, spans));
  });

  // Garde-fou : le texte affiché doit rester rigoureusement celui de l'AELF.
  // La comparaison ignore les blancs — le passage à la ligne et l'espacement
  // des strophes nous appartiennent — mais aucune lettre ne peut changer.
  const sansBlancs = (texte) => texte.replace(/\s+/gu, '');
  if (sansBlancs(texteBrut(bloc.html)) !== sansBlancs(corps.textContent)) return false;

  const boutonChant = el('button.bouton.primaire.chant-play', {
    type: 'button',
    onclick: () => {
      if (enCours) {
        arreterChant();
        return;
      }
      lancer(planPsaume(versets, ton));
    },
  });
  majBouton(boutonChant, false);

  function lancer(etapes) {
    arreterChant();
    if (!audioDisponible()) {
      message('Le son n’est pas disponible sur cet appareil.');
      return;
    }
    const handle = jouerSequence(etapes, {
      instrument: store.parametres.instrument,
      allure: store.parametres.allureChant ?? 1,
      surFin: arreterSuivi,
    });
    if (!handle) return;
    enCours = { spans, handle, bouton: boutonChant };
    majBouton(boutonChant, true);
    suivre(handle, spans);
  }

  const barre = el(
    'div.psalmodie-barre',
    {},
    boutonChant,
    el(
      'button.psalmodie-lien',
      { type: 'button', onclick: () => ouvrirFeuille() },
      icone(ICONES.note, 24),
      ton.nom
    )
  );

  // Le corps d'origine cède la place au texte pointé.
  article.querySelector('.bloc-corps')?.replaceWith(corps);
  article.append(barre);
  article.classList.add('psalmodie');
  if (store.parametres.afficherNotes === false) article.classList.add('sans-notes');

  return true;
}
