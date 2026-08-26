/**
 * Découpage syllabique du français, à l'usage de la psalmodie.
 *
 * La précision n'a d'enjeu que sur les dernières syllabes d'un hémistiche : la
 * récitation se chante de toute façon sur une seule note. Les règles retenues
 * sont donc les règles scolaires classiques, suffisantes pour poser une cadence
 * au bon endroit, et volontairement simples à relire.
 */

const VOYELLES = 'aàâäeéèêëiîïoôöuùûüyœæ';

// Groupes de lettres qui ne forment qu'une seule émission de voix.
const GROUPES_VOCALIQUES = [
  'eau', 'œu', 'oeu', 'aie', 'ieu',
  'ai', 'aî', 'ay', 'ei', 'ey', 'au', 'ou', 'oû', 'où', 'eu', 'eû',
  'oi', 'oî', 'oy', 'ui', 'uy', 'ue', 'ua',
  'ie', 'iè', 'ié', 'ia', 'io', 'iu', 'ye', 'yeu',
];

// Consonnes qui restent soudées à la voyelle suivante.
const GROUPES_CONSONNES = [
  'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gn', 'gr',
  'ph', 'pl', 'pr', 'th', 'tr', 'vr',
];

// Digrammes qui valent une seule consonne.
const CONSONNES_DOUBLES = ['qu', 'gu', 'ch', 'ph', 'th', 'gn'];

function estVoyelle(caractere) {
  return VOYELLES.includes(caractere.toLowerCase());
}

/** Les deux dernières unités émises forment-elles un groupe consonne + l/r ? */
function apresGroupeMuetteLiquide(unitesEmises) {
  const [avant, dernier] = unitesEmises.slice(-2);
  if (!avant || !dernier || avant.type !== 'consonne' || dernier.type !== 'consonne') return false;
  return GROUPES_CONSONNES.includes((avant.texte + dernier.texte).toLowerCase());
}

/** Découpe un mot en unités : noyaux vocaliques et consonnes. */
function unites(mot) {
  const bas = mot.toLowerCase();
  const resultat = [];
  let i = 0;

  while (i < mot.length) {
    if (estVoyelle(bas[i])) {
      let groupe = GROUPES_VOCALIQUES.find((g) => bas.startsWith(g, i));
      // Loi de position : après un groupe consonne + l/r, le « i » se détache
      // au lieu de glisser — « pri-ère », « ou-bli-er », mais « pied », « bien ».
      if (groupe?.startsWith('i') && apresGroupeMuetteLiquide(resultat)) groupe = null;
      const taille = groupe ? groupe.length : 1;
      resultat.push({ type: 'voyelle', texte: mot.slice(i, i + taille) });
      i += taille;
      continue;
    }
    const double = CONSONNES_DOUBLES.find((c) => bas.startsWith(c, i));
    // « qu » et « gu » ne valent une seule consonne que devant e ou i.
    const suivante = bas[i + (double?.length ?? 1)];
    const fusionne =
      double && (!['qu', 'gu'].includes(double) || 'eéèêi'.includes(suivante ?? ''));
    const taille = fusionne ? double.length : 1;
    resultat.push({ type: 'consonne', texte: mot.slice(i, i + taille) });
    i += taille;
  }
  return resultat;
}

/**
 * Découpe un mot en syllabes. Renvoie un tableau de chaînes dont la
 * concaténation redonne exactement le mot.
 */
export function syllaber(mot) {
  if (!mot) return [];
  const morceaux = unites(mot);
  if (!morceaux.some((m) => m.type === 'voyelle')) return [mot];

  const syllabes = [];
  let courante = '';
  let i = 0;

  while (i < morceaux.length) {
    const unite = morceaux[i];
    courante += unite.texte;

    if (unite.type === 'voyelle') {
      // Combien de consonnes avant la prochaine voyelle ?
      let j = i + 1;
      while (j < morceaux.length && morceaux[j].type === 'consonne') j += 1;
      const consonnes = morceaux.slice(i + 1, j);

      if (j >= morceaux.length) {
        // Fin de mot : les consonnes restantes ferment la syllabe.
        courante += consonnes.map((c) => c.texte).join('');
        i = morceaux.length;
        break;
      }

      if (consonnes.length === 0) {
        syllabes.push(courante);
        courante = '';
      } else if (consonnes.length === 1) {
        syllabes.push(courante);
        courante = '';
      } else {
        const paire = (consonnes[0].texte + consonnes[1].texte).toLowerCase();
        const soudees = consonnes.length === 2 && GROUPES_CONSONNES.includes(paire);
        const garde = soudees ? 0 : consonnes.length - (GROUPES_CONSONNES.includes(
          (consonnes.at(-2).texte + consonnes.at(-1).texte).toLowerCase()
        ) ? 2 : 1);
        courante += consonnes.slice(0, garde).map((c) => c.texte).join('');
        syllabes.push(courante);
        courante = '';
        i += garde;
      }
      i += 1;
      continue;
    }
    i += 1;
  }

  if (courante) syllabes.push(courante);
  return fusionnerEMuet(syllabes);
}

/**
 * En français chanté, la syllabe finale en « e » muet ne porte pas de note :
 * « é-cou-te » se chante « é-coute ». On la rattache donc à la précédente.
 */
function fusionnerEMuet(syllabes) {
  if (syllabes.length < 2) return syllabes;
  const derniere = syllabes.at(-1).toLowerCase();
  const muette = /^[^aàâäeéèêëiîïoôöuùûüyœæ]*e(s|nt)?$/.test(derniere);
  if (!muette) return syllabes;
  return [...syllabes.slice(0, -2), syllabes.at(-2) + syllabes.at(-1)];
}

/** Vrai si le caractère fait partie d'un mot (lettres, apostrophes, traits). */
export function estLettre(caractere) {
  return /[\p{L}’']/u.test(caractere);
}
