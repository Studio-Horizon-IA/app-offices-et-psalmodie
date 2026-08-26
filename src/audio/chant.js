import { syllabesDe } from '../data/pointage.js';

/**
 * Attribution des notes aux syllabes d'un verset.
 *
 * Modèle enseigné, volontairement simple :
 *   1. le premier verset commence par l'intonation, qui monte jusqu'à la teneur ;
 *   2. tout se récite ensuite sur la teneur — c'est le « — » du pointage ;
 *   3. à la flexe (« + »), la voix descend d'un degré après l'accent ;
 *   4. à l'accent marqué du premier hémistiche (« * »), on chante la médiante ;
 *   5. à l'accent marqué du dernier hémistiche, on chante la terminaison.
 *
 * L'accent qui déclenche la cadence est celui que l'AELF souligne.
 */

const DUREES = {
  recitation: 0.26,
  cadence: 0.34,
  finLigne: 0.62,
  silenceMediante: 0.3,
  silenceFlexe: 0.18,
  silenceVerset: 0.5,
};

/**
 * Index de la syllabe qui porte la cadence : celle que l'AELF souligne.
 * Le psaume de la messe n'est pas pointé — on prend alors les trois dernières
 * syllabes, longueur habituelle d'une cadence.
 */
function indexAccent(syllabes) {
  for (let i = syllabes.length - 1; i >= 0; i -= 1) {
    if (syllabes[i].accent) return i;
  }
  return Math.max(0, syllabes.length - 3);
}

/**
 * Étale une formule de cadence sur les syllabes qui restent depuis l'accent.
 * La dernière note tombe toujours sur la dernière syllabe.
 *
 * Chaque élément garde l'`index` de la note dans la formule d'origine : c'est
 * lui qui permet d'allumer la bonne tête sur la portée pendant le chant.
 */
function etalerFormule(formule, nombre) {
  const dernier = formule.length - 1;
  if (nombre <= 0) return [];
  if (nombre === 1) return [{ note: formule[dernier], index: dernier }];

  if (nombre >= formule.length) {
    const complement = Array.from({ length: nombre - formule.length }, () => ({
      note: formule[dernier],
      index: dernier,
    }));
    return [...formule.map((note, index) => ({ note, index })), ...complement];
  }

  return [
    ...formule.slice(0, nombre - 1).map((note, index) => ({ note, index })),
    { note: formule[dernier], index: dernier },
  ];
}

function notesDeLigne(ligne, ton, teneur, avecIntonation, groupeTeneur) {
  const syllabes = syllabesDe(ligne);
  if (!syllabes.length) return [];

  const accent = indexAccent(syllabes);
  const notes = new Array(syllabes.length).fill(teneur);
  const roles = new Array(syllabes.length).fill('teneur');
  const positions = new Array(syllabes.length).fill(null).map(() => ({ groupe: groupeTeneur }));

  if (avecIntonation) {
    const portee = Math.min(ton.intonation.length, Math.max(1, accent));
    for (let i = 0; i < portee; i += 1) {
      notes[i] = ton.intonation[i];
      roles[i] = 'intonation';
      positions[i] = { groupe: 'intonation', index: i };
    }
  }

  if (ligne.cadence === 'flexe') {
    // L'accent reste sur la teneur, la voix fléchit sur ce qui suit.
    for (let i = accent + 1; i < syllabes.length; i += 1) {
      notes[i] = ton.flexa;
      roles[i] = 'flexe';
      positions[i] = { groupe: 'flexe', index: 0 };
    }
  } else if (ligne.cadence === 'mediante' || ligne.cadence === 'finale') {
    const groupe = ligne.cadence === 'mediante' ? 'mediante' : 'terminaison';
    const formule = ligne.cadence === 'mediante' ? ton.mediante : ton.terminaison;
    etalerFormule(formule, syllabes.length - accent).forEach(({ note, index }, decalage) => {
      notes[accent + decalage] = note;
      roles[accent + decalage] = ligne.cadence;
      positions[accent + decalage] = { groupe, index };
    });
  }

  return syllabes.map((syllabe, i) => ({
    syllabe,
    note: notes[i],
    role: roles[i],
    position: positions[i],
    duree:
      i === syllabes.length - 1
        ? DUREES.finLigne
        : roles[i] === 'teneur' || roles[i] === 'intonation'
          ? DUREES.recitation
          : DUREES.cadence,
  }));
}

/** Étapes d'un verset : suite de syllabes chantées et de silences. */
export function planVerset(verset, ton, { intonation = false } = {}) {
  const etapes = [];
  let teneur = ton.teneur;
  let groupeTeneur = 'teneur';
  let premiereLigne = true;

  for (const ligne of verset.lignes) {
    if (ligne.vide) continue;

    etapes.push(
      ...notesDeLigne(ligne, ton, teneur, intonation && premiereLigne, groupeTeneur)
    );
    premiereLigne = false;

    if (ligne.cadence === 'mediante') {
      etapes.push({ syllabe: null, note: null, role: 'silence', duree: DUREES.silenceMediante });
      // Le tonus peregrinus change de teneur au second hémistiche.
      teneur = ton.teneurSeconde ?? ton.teneur;
      groupeTeneur = 'teneur2';
    } else if (ligne.cadence === 'flexe') {
      etapes.push({ syllabe: null, note: null, role: 'silence', duree: DUREES.silenceFlexe });
    }
  }

  etapes.push({ syllabe: null, note: null, role: 'silence', duree: DUREES.silenceVerset });
  return etapes;
}

/** Étapes d'un psaume entier : l'intonation n'est chantée qu'au premier verset. */
export function planPsaume(versets, ton) {
  return versets.flatMap((verset, index) =>
    planVerset(verset, ton, { intonation: index === 0 })
  );
}
