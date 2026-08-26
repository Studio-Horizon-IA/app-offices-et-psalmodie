import { frequence, sequence } from './tons.js';

/**
 * Petite synthèse WebAudio : trois timbres suffisent à donner le ton, et cela
 * évite d'embarquer des échantillons (l'application doit rester légère et
 * fonctionner hors connexion).
 */

export const INSTRUMENTS = [
  { id: 'piano', nom: 'Piano' },
  { id: 'orgue', nom: 'Orgue' },
  { id: 'voix', nom: 'Voix' },
];

const TIMBRES = {
  // [rang harmonique, poids] + enveloppe
  piano: {
    partiels: [[1, 1], [2, 0.32], [3, 0.14], [4, 0.06]],
    forme: 'triangle',
    attaque: 0.006,
    chute: 0.28,
    tenue: 0.25,
    relache: 0.35,
  },
  orgue: {
    partiels: [[1, 0.8], [2, 0.5], [3, 0.25], [4, 0.2], [6, 0.1]],
    forme: 'sine',
    attaque: 0.06,
    chute: 0.08,
    tenue: 0.85,
    relache: 0.22,
  },
  voix: {
    partiels: [[1, 1], [2, 0.18], [3, 0.08]],
    forme: 'sine',
    attaque: 0.09,
    chute: 0.12,
    tenue: 0.8,
    relache: 0.3,
    vibrato: { taux: 5, profondeur: 3.2 },
  },
};

let contexte = null;

function audio() {
  const Constructeur = window.AudioContext || window.webkitAudioContext;
  if (!Constructeur) return null;
  contexte ??= new Constructeur();
  if (contexte.state === 'suspended') contexte.resume();
  return contexte;
}

export function audioDisponible() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

function jouerNote(ctx, sortie, hertz, debut, duree, timbre) {
  const enveloppe = ctx.createGain();
  enveloppe.connect(sortie);

  const pic = 0.9;
  const fin = debut + duree;
  enveloppe.gain.setValueAtTime(0.0001, debut);
  enveloppe.gain.exponentialRampToValueAtTime(pic, debut + timbre.attaque);
  enveloppe.gain.exponentialRampToValueAtTime(
    Math.max(pic * timbre.tenue, 0.0002),
    debut + timbre.attaque + timbre.chute
  );
  enveloppe.gain.exponentialRampToValueAtTime(0.0001, fin + timbre.relache);

  const oscillateurs = [];
  for (const [rang, poids] of timbre.partiels) {
    const osc = ctx.createOscillator();
    osc.type = timbre.forme;
    osc.frequency.setValueAtTime(hertz * rang, debut);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(poids, debut);
    osc.connect(gain).connect(enveloppe);

    if (timbre.vibrato && rang === 1) {
      const lfo = ctx.createOscillator();
      const profondeur = ctx.createGain();
      lfo.frequency.setValueAtTime(timbre.vibrato.taux, debut);
      profondeur.gain.setValueAtTime(0, debut);
      profondeur.gain.linearRampToValueAtTime(timbre.vibrato.profondeur, debut + 0.25);
      lfo.connect(profondeur).connect(osc.frequency);
      lfo.start(debut);
      lfo.stop(fin + timbre.relache);
      oscillateurs.push(lfo);
    }

    osc.start(debut);
    osc.stop(fin + timbre.relache);
    oscillateurs.push(osc);
  }
  return oscillateurs;
}

let lecture = null;

export function arreter() {
  if (!lecture) return;
  const { sortie, ctx, surFin } = lecture;
  const maintenant = ctx.currentTime;
  sortie.gain.cancelScheduledValues(maintenant);
  sortie.gain.setValueAtTime(sortie.gain.value, maintenant);
  sortie.gain.linearRampToValueAtTime(0.0001, maintenant + 0.08);
  clearTimeout(lecture.minuterie);
  lecture = null;
  surFin?.();
}

export function enLecture() {
  return lecture !== null;
}

/**
 * Joue la formule d'un ton. `surFin` est appelé à la fin naturelle comme à
 * l'arrêt manuel, pour que l'interface reste synchronisée.
 */
export function jouerTon(ton, { instrument = 'piano', transposition = 0, allure = 1, surFin } = {}) {
  const ctx = audio();
  if (!ctx) return false;
  arreter();

  const timbre = TIMBRES[instrument] ?? TIMBRES.piano;
  const sortie = ctx.createGain();
  sortie.gain.setValueAtTime(0.16, ctx.currentTime);
  sortie.connect(ctx.destination);

  let curseur = ctx.currentTime + 0.06;
  for (const { note, duree } of sequence(ton)) {
    const longueur = duree / allure;
    if (note) jouerNote(ctx, sortie, frequence(note, transposition), curseur, longueur, timbre);
    curseur += longueur;
  }

  const total = (curseur - ctx.currentTime + timbre.relache) * 1000;
  lecture = {
    ctx,
    sortie,
    surFin,
    minuterie: setTimeout(() => {
      lecture = null;
      surFin?.();
    }, total),
  };
  return true;
}
