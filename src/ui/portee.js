import { degreDiatonique, nomFrancais } from '../audio/tons.js';

/**
 * Portée d'un ton psalmodique, partagée par la feuille « Psalmodie » et par le
 * bandeau de partition.
 *
 * Le rendu renvoie aussi de quoi retrouver chaque tête de note à partir de sa
 * place dans la formule — c'est ce qui permet d'allumer, pendant le chant, la
 * note que l'on est en train d'entendre.
 */

const ESPACE = 11;
const HAUT = 14;

function svg(nom, attributs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', nom);
  for (const [cle, valeur] of Object.entries(attributs)) node.setAttribute(cle, valeur);
  return node;
}

/** Les moments de la formule, dans l'ordre où on les chante. */
export function groupesDuTon(ton) {
  const teneurSeconde = ton.teneurSeconde ?? ton.teneur;
  return [
    { groupe: 'intonation', label: 'Intonation', notes: ton.intonation },
    { groupe: 'teneur', label: 'Teneur', notes: [ton.teneur, ton.teneur], teneur: true },
    { groupe: 'flexe', label: 'Flexe', notes: [ton.flexa] },
    { groupe: 'mediante', label: 'Médiante', notes: ton.mediante },
    { groupe: 'teneur2', label: 'Teneur', notes: [teneurSeconde, teneurSeconde], teneur: true },
    { groupe: 'terminaison', label: 'Terminaison', notes: ton.terminaison },
  ];
}

/**
 * Dessine la portée. `compacte` supprime les étiquettes : le bandeau est bas de
 * plafond, la feuille a la place de nommer les moments.
 *
 * Renvoie `{ element, tetes }`, où `tetes` est une Map « groupe:index » → cercle.
 */
export function rendrePortee(ton, { compacte = false, pasX = 26 } = {}) {
  const groupes = groupesDuTon(ton);
  const total = groupes.reduce((somme, g) => somme + g.notes.length, 0);
  const largeur = 30 + total * pasX + groupes.length * 12;
  const hauteur = HAUT + 4 * ESPACE + (compacte ? 12 : 34);
  const baseY = HAUT + 4 * ESPACE;

  // La portée est centrée sur l'ambitus du ton : selon le mode, la formule
  // descend au do grave ou monte au ré aigu, et doit rester lisible.
  const degres = groupes.flatMap((g) => g.notes).map(degreDiatonique);
  const baseDegre = Math.round((Math.min(...degres) + Math.max(...degres)) / 2) - 4;

  const element = svg('svg', {
    class: 'portee',
    viewBox: `0 0 ${largeur} ${hauteur}`,
    role: 'img',
    'aria-label': `Formule du ${ton.nom}, teneur ${nomFrancais(ton.teneur)}`,
  });

  for (let i = 0; i < 5; i += 1) {
    const y = HAUT + i * ESPACE;
    element.append(svg('line', { class: 'ligne', x1: 8, x2: largeur - 8, y1: y, y2: y }));
  }

  const tetes = new Map();
  let x = 24;

  for (const groupe of groupes) {
    const debut = x;
    groupe.notes.forEach((note, index) => {
      const degre = degreDiatonique(note);
      const y = baseY - (degre - baseDegre) * (ESPACE / 2);
      if (degre <= baseDegre - 2) {
        element.append(
          svg('line', { class: 'ligne', x1: x - 8, x2: x + 8, y1: baseY + ESPACE, y2: baseY + ESPACE })
        );
      }
      const tete = svg('ellipse', {
        class: `note${groupe.teneur ? ' teneur' : ''}`,
        cx: x,
        cy: y,
        rx: 5.2,
        ry: 4,
      });
      tetes.set(`${groupe.groupe}:${index}`, tete);
      element.append(tete);
      x += pasX;
    });

    if (!compacte) {
      const etiquette = svg('text', {
        class: 'etiquette',
        x: (debut + x - pasX) / 2,
        y: hauteur - 8,
        'text-anchor': 'middle',
      });
      etiquette.textContent = groupe.label;
      element.append(etiquette);
    }
    x += 12;
  }

  return { element, tetes };
}

/**
 * Allume la tête correspondant à une étape chantée et éteint les autres.
 * `position` vient de `audio/chant.js` : `{ groupe, index }`.
 */
export function eclairer(tetes, position) {
  for (const tete of tetes.values()) tete.classList.remove('joue');
  if (!position) return;

  // Sans index, tout le groupe s'allume : la récitation tient sur une seule
  // note, que la portée figure par deux têtes accolées.
  for (const [cle, tete] of tetes) {
    const correspond =
      position.index === undefined || position.index === null
        ? cle.startsWith(`${position.groupe}:`)
        : cle === `${position.groupe}:${position.index}`;
    if (correspond) tete.classList.add('joue');
  }
}
