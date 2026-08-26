/**
 * Les textes de l'AELF arrivent en HTML. On ne les injecte jamais tels quels :
 * on reconstruit l'arbre en ne gardant qu'une liste blanche de balises et le
 * seul attribut utile (`class`, qui porte `verse_number`).
 */

const BALISES = new Set([
  'p', 'br', 'span', 'u', 'i', 'b', 'em', 'strong', 'sup', 'sub',
  'blockquote', 'div', 'ul', 'ol', 'li', 'h3', 'h4', 'small',
]);

const CLASSES = new Set(['verse_number', 'ref', 'red']);

function nettoyerNoeud(source, cible, doc) {
  for (const enfant of source.childNodes) {
    if (enfant.nodeType === Node.TEXT_NODE) {
      cible.append(doc.createTextNode(enfant.nodeValue));
      continue;
    }
    if (enfant.nodeType !== Node.ELEMENT_NODE) continue;

    const nom = enfant.tagName.toLowerCase();
    if (!BALISES.has(nom)) {
      // Balise inconnue : on garde son contenu, pas son enveloppe.
      nettoyerNoeud(enfant, cible, doc);
      continue;
    }

    const propre = doc.createElement(nom);
    const classes = (enfant.getAttribute('class') || '')
      .split(/\s+/)
      .filter((c) => CLASSES.has(c));
    if (classes.length) propre.setAttribute('class', classes.join(' '));

    nettoyerNoeud(enfant, propre, doc);
    cible.append(propre);
  }
}

/** Renvoie un fragment DOM sûr à partir du HTML brut de l'API. */
export function htmlSur(brut) {
  const fragment = document.createDocumentFragment();
  if (!brut) return fragment;

  const doc = new DOMParser().parseFromString(String(brut), 'text/html');
  nettoyerNoeud(doc.body, fragment, document);
  return fragment;
}

/** Version texte brut, pour les titres et les mesures de longueur. */
export function texteBrut(brut) {
  if (!brut) return '';
  const doc = new DOMParser().parseFromString(String(brut), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Vrai si le champ contient autre chose que du vide ou des balises creuses. */
export function aDuContenu(brut) {
  return texteBrut(brut).length > 0;
}
