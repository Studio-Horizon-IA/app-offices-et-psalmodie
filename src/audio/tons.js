/**
 * Formules psalmodiques simplifiées des huit tons grégoriens (plus le tonus
 * peregrinus). Elles servent de repère sonore pour entonner un psaume : ce sont
 * les cadences les plus courantes, pas l'intégralité des différences.
 *
 * Les notes sont écrites en notation anglaise avec octave (A4 = la du diapason).
 */

export const TONS = [
  {
    id: 'I',
    nom: 'Ton I',
    mode: 'Ré, teneur La',
    intonation: ['D4', 'F4', 'G4', 'A4'],
    teneur: 'A4',
    mediante: ['A4', 'G4', 'F4', 'G4'],
    terminaison: ['A4', 'G4', 'F4', 'E4', 'D4'],
  },
  {
    id: 'II',
    nom: 'Ton II',
    mode: 'Ré, teneur Fa',
    intonation: ['C4', 'D4', 'F4'],
    teneur: 'F4',
    mediante: ['F4', 'E4', 'D4', 'F4'],
    terminaison: ['F4', 'E4', 'D4', 'C4', 'D4'],
  },
  {
    id: 'III',
    nom: 'Ton III',
    mode: 'Mi, teneur Do',
    intonation: ['G4', 'A4', 'C5'],
    teneur: 'C5',
    mediante: ['C5', 'B4', 'C5', 'A4'],
    terminaison: ['C5', 'B4', 'A4', 'G4', 'A4'],
  },
  {
    id: 'IV',
    nom: 'Ton IV',
    mode: 'Mi, teneur La',
    intonation: ['E4', 'F4', 'G4', 'A4'],
    teneur: 'A4',
    mediante: ['A4', 'G4', 'F4', 'G4'],
    terminaison: ['G4', 'A4', 'G4', 'F4', 'E4'],
  },
  {
    id: 'V',
    nom: 'Ton V',
    mode: 'Fa, teneur Do',
    intonation: ['F4', 'A4', 'C5'],
    teneur: 'C5',
    mediante: ['C5', 'B4', 'C5', 'A4'],
    terminaison: ['C5', 'A4', 'G4', 'F4'],
  },
  {
    id: 'VI',
    nom: 'Ton VI',
    mode: 'Fa, teneur La',
    intonation: ['F4', 'G4', 'A4'],
    teneur: 'A4',
    mediante: ['A4', 'G4', 'F4', 'G4'],
    terminaison: ['G4', 'F4', 'E4', 'F4'],
  },
  {
    id: 'VII',
    nom: 'Ton VII',
    mode: 'Sol, teneur Ré',
    intonation: ['G4', 'A4', 'B4', 'D5'],
    teneur: 'D5',
    mediante: ['D5', 'C5', 'B4', 'C5'],
    terminaison: ['D5', 'C5', 'B4', 'A4', 'G4'],
  },
  {
    id: 'VIII',
    nom: 'Ton VIII',
    mode: 'Sol, teneur Do',
    intonation: ['G4', 'A4', 'C5'],
    teneur: 'C5',
    mediante: ['C5', 'B4', 'C5', 'A4'],
    terminaison: ['C5', 'B4', 'A4', 'G4'],
  },
  {
    id: 'peregrinus',
    nom: 'Tonus peregrinus',
    mode: 'Ré, deux teneurs',
    intonation: ['G4', 'A4', 'C5'],
    teneur: 'A4',
    teneurSeconde: 'G4',
    mediante: ['C5', 'B4', 'A4'],
    terminaison: ['G4', 'F4', 'E4', 'D4'],
  },
];

export const TONS_PAR_ID = Object.fromEntries(TONS.map((t) => [t.id, t]));

const DEGRES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** « A4 » → 69 (numéro MIDI). */
export function midi(note) {
  const [, lettre, alteration, octave] = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  const demi = DEGRES[lettre] + (alteration === '#' ? 1 : alteration === 'b' ? -1 : 0);
  return (Number(octave) + 1) * 12 + demi;
}

export function frequence(note, transposition = 0) {
  return 440 * 2 ** ((midi(note) + transposition - 69) / 12);
}

/** Nom français d'une note, pour l'affichage sous la portée. */
export function nomFrancais(note) {
  const noms = { C: 'do', D: 'ré', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si' };
  return noms[note[0]];
}

/**
 * Développe un ton en une suite de notes jouable : intonation, teneur répétée
 * (la récitation), médiante, teneur, puis terminaison.
 */
export function sequence(ton) {
  const recitation = (hauteur, fois) => Array.from({ length: fois }, () => ({ note: hauteur, duree: 0.28 }));
  const formule = (notes, duree = 0.5) => notes.map((note) => ({ note, duree }));

  return [
    ...formule(ton.intonation, 0.45),
    ...recitation(ton.teneur, 4),
    ...formule(ton.mediante, 0.5),
    { note: null, duree: 0.35 }, // respiration au milieu du verset
    ...recitation(ton.teneurSeconde ?? ton.teneur, 5),
    ...formule(ton.terminaison, 0.55),
  ];
}
