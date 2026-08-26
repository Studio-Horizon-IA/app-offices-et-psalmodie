import { syllaber, estLettre } from './syllabes.js';

/**
 * Pointage d'un psaume : transforme le HTML de l'AELF en versets prêts à
 * chanter.
 *
 * L'AELF fournit déjà tout ce qu'il faut pour psalmodier :
 *   • un `<br>` par hémistiche, un `<br><br>` entre les strophes ;
 *   • `<span class="verse_number">` au début de chaque verset ;
 *   • `<u>` autour de la voyelle de l'accent qui porte la cadence ;
 *   • « * » à la fin du premier hémistiche (médiante) ;
 *   • « + » à la fin d'une flexe.
 *
 * On ne fait donc qu'expliciter ce pointage, syllabe par syllabe.
 */

const MARQUES = { '*': 'mediante', '+': 'flexe', '†': 'flexe' };

/** Aplatit le document en caractères porteurs de leur état (accent, saut…). */
function aplatir(noeud, sortie) {
  for (const enfant of noeud.childNodes) {
    if (enfant.nodeType === Node.TEXT_NODE) {
      const accent = sortie.accent;
      for (const c of enfant.nodeValue) sortie.items.push({ type: 'texte', c, accent });
      continue;
    }
    if (enfant.nodeType !== Node.ELEMENT_NODE) continue;

    const nom = enfant.tagName.toLowerCase();
    if (nom === 'br') {
      sortie.items.push({ type: 'saut' });
      continue;
    }
    if (nom === 'span' && enfant.classList.contains('verse_number')) {
      sortie.items.push({ type: 'numero', valeur: enfant.textContent.trim() });
      continue;
    }
    if (nom === 'p' || nom === 'div') {
      if (sortie.items.length) sortie.items.push({ type: 'saut' });
      aplatir(enfant, sortie);
      sortie.items.push({ type: 'saut' });
      continue;
    }
    if (nom === 'u') {
      sortie.accent = true;
      aplatir(enfant, sortie);
      sortie.accent = false;
      continue;
    }
    aplatir(enfant, sortie);
  }
}

/** Découpe une ligne (caractères + accents) en syllabes et fragments bruts. */
function jetonsDeLigne(caracteres) {
  const jetons = [];
  let mot = [];

  const viderMot = () => {
    if (!mot.length) return;
    const texte = mot.map((x) => x.c).join('');
    let position = 0;
    for (const syllabe of syllaber(texte)) {
      const accent = mot
        .slice(position, position + syllabe.length)
        .some((x) => x.accent);
      jetons.push({ type: 'syllabe', texte: syllabe, accent });
      position += syllabe.length;
    }
    mot = [];
  };

  for (const item of caracteres) {
    if (estLettre(item.c)) mot.push(item);
    else {
      viderMot();
      const dernier = jetons.at(-1);
      if (dernier?.type === 'brut') dernier.texte += item.c;
      else jetons.push({ type: 'brut', texte: item.c });
    }
  }
  viderMot();
  return jetons;
}

/**
 * Attribue sa cadence à chaque ligne d'un verset.
 *
 * Les marques de l'AELF font foi ; à défaut, un verset de deux lignes se chante
 * médiante puis terminaison, ce qui est le cas le plus courant.
 */
function attribuerCadences(lignes) {
  const chantees = lignes.filter((l) => !l.vide);
  if (!chantees.length) return;

  for (const ligne of chantees) ligne.cadence = MARQUES[ligne.marque] ?? null;

  if (chantees.some((l) => l.cadence === 'mediante')) {
    // Le « * » fait foi : il ferme le premier hémistiche, la dernière ligne
    // porte la terminaison, et ce qui précède le « * » se récite.
    chantees.at(-1).cadence = 'finale';
  } else {
    // Sans « * », l'AELF regroupe souvent plusieurs versets sous un même
    // numéro : on les chante deux à deux, médiante puis terminaison.
    for (let i = 0; i < chantees.length; i += 2) {
      const premiere = chantees[i];
      const seconde = chantees[i + 1];
      if (seconde) {
        premiere.cadence ??= 'mediante';
        seconde.cadence = 'finale';
      } else {
        premiere.cadence = 'finale';
      }
    }
  }

  for (const ligne of chantees) ligne.cadence ??= 'recitatif';
}

/**
 * Point d'entrée : renvoie les versets d'un psaume.
 * Chaque verset porte son numéro et ses lignes ; chaque ligne, ses syllabes.
 */
export function pointerPsaume(html) {
  const doc = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
  const sortie = { items: [], accent: false };
  aplatir(doc.body, sortie);

  // 1. Découpage en lignes.
  const lignes = [];
  let courante = { numero: null, caracteres: [] };
  for (const item of sortie.items) {
    if (item.type === 'saut') {
      lignes.push(courante);
      courante = { numero: null, caracteres: [] };
    } else if (item.type === 'numero') {
      if (courante.caracteres.length) {
        lignes.push(courante);
        courante = { numero: null, caracteres: [] };
      }
      courante.numero = item.valeur;
    } else {
      courante.caracteres.push(item);
    }
  }
  lignes.push(courante);

  // 2. Mise en forme de chaque ligne.
  const preparees = lignes.map((ligne) => {
    const texte = ligne.caracteres.map((x) => x.c).join('').trim();
    if (!texte) return { vide: true };
    const marque = texte.at(-1) in MARQUES ? texte.at(-1) : null;
    return {
      numero: ligne.numero,
      marque,
      jetons: jetonsDeLigne(ligne.caracteres),
    };
  });

  // 3. Regroupement en versets : sur les numéros quand l'AELF en donne
  // (offices), sinon sur les strophes (psaume responsorial de la messe).
  const parNumeros = preparees.some((l) => l.numero);
  const versets = [];
  let verset = null;

  for (const ligne of preparees) {
    if (ligne.vide) {
      if (!parNumeros) verset = null;
      else verset?.lignes.push(ligne);
      continue;
    }
    if (!verset || (parNumeros && ligne.numero)) {
      verset = { numero: ligne.numero, lignes: [] };
      versets.push(verset);
    }
    verset.lignes.push(ligne);
  }

  for (const v of versets) attribuerCadences(v.lignes);
  return versets.filter((v) => v.lignes.some((l) => !l.vide));
}

/** Toutes les syllabes chantées d'une ligne, dans l'ordre. */
export function syllabesDe(ligne) {
  return ligne.jetons.filter((j) => j.type === 'syllabe');
}
