import { el, vider } from '../util/dom.js';
import { nomFrancais } from '../audio/tons.js';
import { rendrePortee, eclairer } from './portee.js';

/**
 * Bandeau de partition, fixé en bas de l'écran dès qu'un psaume est à l'écran.
 *
 * Pour qui apprend, le nom d'une note ne dit pas grand-chose tant qu'on ne l'a
 * pas vue sur une portée : la formule du ton reste donc affichée en
 * permanence, et la tête de note s'allume au moment où on l'entend, en regard
 * de la syllabe chantée.
 */

let bandeau = null;
let tetes = null;
let zoneSyllabe = null;
let zoneNote = null;
let surClic = () => {};

function construire() {
  if (bandeau) return bandeau;

  zoneSyllabe = el('span.bandeau-syllabe', {}, '—');
  zoneNote = el('span.bandeau-note');

  bandeau = el(
    'aside.bandeau-partition',
    { hidden: true, 'aria-label': 'Partition du ton' },
    el(
      'button.bandeau-ouvrir',
      { type: 'button', 'aria-label': 'Ouvrir la psalmodie', onclick: () => surClic() },
      el('span.bandeau-titre'),
      el('span.bandeau-chante', {}, zoneSyllabe, zoneNote)
    ),
    el('div.bandeau-portee')
  );

  document.body.append(bandeau);
  return bandeau;
}

export function initBandeau({ ouvrirPsalmodie }) {
  surClic = ouvrirPsalmodie;
  construire();
}

/** Affiche la portée d'un ton. À appeler dès qu'une section montre un psaume. */
export function afficherBandeau(ton) {
  construire();
  const rendu = rendrePortee(ton, { compacte: true, pasX: 22 });
  tetes = rendu.tetes;

  bandeau.querySelector('.bandeau-titre').textContent = `${ton.nom} · teneur ${nomFrancais(ton.teneur)}`;
  vider(bandeau.querySelector('.bandeau-portee')).append(rendu.element);
  reinitialiserChante();
  bandeau.hidden = false;
  document.body.classList.add('avec-bandeau');
}

export function masquerBandeau() {
  if (!bandeau) return;
  bandeau.hidden = true;
  tetes = null;
  document.body.classList.remove('avec-bandeau');
}

function reinitialiserChante() {
  zoneSyllabe.textContent = '—';
  zoneNote.textContent = '';
  if (tetes) eclairer(tetes, null);
}

/**
 * Met le bandeau au diapason de l'étape en cours. `etape` vaut `null` entre
 * deux versets et à l'arrêt.
 */
export function suivreEtape(etape) {
  if (!bandeau || bandeau.hidden || !tetes) return;

  if (!etape?.syllabe) {
    eclairer(tetes, null);
    zoneNote.textContent = '';
    return;
  }

  eclairer(tetes, etape.position);
  zoneSyllabe.textContent = etape.syllabe.texte;
  zoneNote.textContent = nomFrancais(etape.note);
}

export function reposBandeau() {
  if (bandeau && !bandeau.hidden) reinitialiserChante();
}
