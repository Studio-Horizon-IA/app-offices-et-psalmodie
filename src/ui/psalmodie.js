import { el, vider, $, icone, ICONES } from '../util/dom.js';
import { store, reglerParametre } from '../core/store.js';
import { TONS, TONS_PAR_ID, nomFrancais } from '../audio/tons.js';
import { INSTRUMENTS, jouerTon, arreter, enLecture, audioDisponible } from '../audio/synthese.js';
import { message } from './coquille.js';

/** Feuille du bas : choix du ton, portée de repère et écoute. */

const ESPACE = 11;
const HAUT = 14;
const DEGRES = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

let corps;
let boutonJouer = null;

export function initPsalmodie() {
  corps = $('#panneau-psalmodie-body');
}

function positionDiatonique(note) {
  const [lettre, octave] = [note[0], Number(note.slice(-1))];
  return octave * 7 + DEGRES[lettre];
}

function svg(nom, attributs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', nom);
  for (const [cle, valeur] of Object.entries(attributs)) node.setAttribute(cle, valeur);
  return node;
}

/**
 * Portée de repère : les cinq lignes habituelles, la teneur mise en couleur,
 * et les quatre moments de la formule annotés dessous.
 */
function portee(ton) {
  const groupes = [
    { label: 'Intonation', notes: ton.intonation },
    { label: 'Teneur', notes: [ton.teneur, ton.teneur], teneur: true },
    { label: 'Médiante', notes: ton.mediante },
    { label: 'Teneur', notes: [ton.teneurSeconde ?? ton.teneur, ton.teneurSeconde ?? ton.teneur], teneur: true },
    { label: 'Terminaison', notes: ton.terminaison },
  ];

  const total = groupes.reduce((somme, g) => somme + g.notes.length, 0);
  const pasX = 26;
  const largeur = 30 + total * pasX + groupes.length * 12;
  const hauteur = HAUT + 4 * ESPACE + 34;
  const baseY = HAUT + 4 * ESPACE; // ligne du bas de la portée

  // La portée est centrée sur l'ambitus du ton : selon le mode, la formule
  // descend jusqu'au do grave ou monte au ré aigu, et doit rester lisible.
  const degres = groupes.flatMap((g) => g.notes).map(positionDiatonique);
  const milieuAmbitus = Math.round((Math.min(...degres) + Math.max(...degres)) / 2);
  const baseDegre = milieuAmbitus - 4;

  const dessin = svg('svg', {
    class: 'portee',
    viewBox: `0 0 ${largeur} ${hauteur}`,
    role: 'img',
    'aria-label': `Formule du ${ton.nom}, teneur ${nomFrancais(ton.teneur)}`,
  });

  for (let i = 0; i < 5; i += 1) {
    dessin.append(
      svg('line', { class: 'ligne', x1: 8, x2: largeur - 8, y1: HAUT + i * ESPACE, y2: HAUT + i * ESPACE })
    );
  }

  let x = 24;
  for (const groupe of groupes) {
    const debut = x;
    for (const note of groupe.notes) {
      const degre = positionDiatonique(note);
      const y = baseY - (degre - baseDegre) * (ESPACE / 2);
      if (degre <= baseDegre - 2) {
        dessin.append(
          svg('line', { class: 'ligne', x1: x - 8, x2: x + 8, y1: baseY + ESPACE, y2: baseY + ESPACE })
        );
      }
      dessin.append(
        svg('ellipse', {
          class: `note${groupe.teneur ? ' teneur' : ''}`,
          cx: x,
          cy: y,
          rx: 5.2,
          ry: 4,
        })
      );
      x += pasX;
    }
    const milieu = (debut + x - pasX) / 2;
    const etiquette = svg('text', {
      class: 'etiquette',
      x: milieu,
      y: hauteur - 8,
      'text-anchor': 'middle',
    });
    etiquette.textContent = groupe.label;
    dessin.append(etiquette);
    x += 12;
  }

  return dessin;
}

function libelleNotes(ton) {
  const suite = [
    ton.intonation.map(nomFrancais).join('–'),
    `teneur ${nomFrancais(ton.teneur)}`,
    ton.terminaison.map(nomFrancais).join('–'),
  ];
  return suite.join(' · ');
}

export function rendrePsalmodie() {
  const p = store.parametres;
  const ton = TONS_PAR_ID[p.ton] ?? TONS[0];
  vider(corps);

  corps.append(
    el('h2.psalmodie-titre', {}, `${ton.nom} — ${ton.mode}`),
    el('p.psalmodie-soustitre', {}, libelleNotes(ton)),
    portee(ton)
  );

  const choixTon = el('select', {
    'aria-label': 'Ton psalmodique',
    onchange: (evenement) => {
      reglerParametre({ ton: evenement.target.value });
      rendrePsalmodie();
    },
  });
  for (const t of TONS) {
    choixTon.append(el('option', { value: t.id, selected: t.id === p.ton }, t.nom));
  }

  const choixInstrument = el('select', {
    'aria-label': 'Instrument',
    onchange: (evenement) => reglerParametre({ instrument: evenement.target.value }),
  });
  for (const i of INSTRUMENTS) {
    choixInstrument.append(el('option', { value: i.id, selected: i.id === p.instrument }, i.nom));
  }

  const transposition = el('input', {
    type: 'range',
    min: '-5',
    max: '5',
    step: '1',
    value: '0',
    'aria-label': 'Transposition en demi-tons',
  });

  corps.append(
    el('div.champ-ligne', {}, el('label', {}, 'Ton'), choixTon),
    el('div.champ-ligne', {}, el('label', {}, 'Instrument'), choixInstrument),
    el('div.champ-ligne', {}, el('label', {}, 'Hauteur'), transposition)
  );

  boutonJouer = el(
    'button.bouton.primaire',
    {
      type: 'button',
      onclick: () => basculerLecture(ton, Number(transposition.value)),
    },
    icone(ICONES.play, 24),
    'Écouter le ton'
  );

  corps.append(el('div.psalmodie-actions', {}, boutonJouer));
  majBoutonJouer();
}

function basculerLecture(ton, transposition) {
  if (enLecture()) {
    arreter();
    majBoutonJouer();
    return;
  }
  if (!audioDisponible()) {
    message('Le son n’est pas disponible sur cet appareil.');
    return;
  }
  jouerTon(ton, {
    instrument: store.parametres.instrument,
    transposition,
    surFin: majBoutonJouer,
  });
  majBoutonJouer();
}

function majBoutonJouer() {
  if (!boutonJouer) return;
  const actif = enLecture();
  vider(boutonJouer);
  boutonJouer.append(icone(actif ? ICONES.stop : ICONES.play, 24), actif ? 'Arrêter' : 'Écouter le ton');
}
