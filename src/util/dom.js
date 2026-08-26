/** Fabrique un élément : el('button.icon-btn', { type: 'button' }, 'Texte'). */
export function el(selector, props = {}, ...enfants) {
  const [tag, ...classes] = selector.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');

  for (const [cle, valeur] of Object.entries(props)) {
    if (valeur === null || valeur === undefined || valeur === false) continue;
    if (cle === 'dataset') Object.assign(node.dataset, valeur);
    else if (cle === 'html') node.innerHTML = valeur;
    else if (cle.startsWith('on') && typeof valeur === 'function') {
      node.addEventListener(cle.slice(2).toLowerCase(), valeur);
    } else if (cle in node && cle !== 'list' && typeof valeur !== 'boolean') {
      node[cle] = valeur;
    } else {
      node.setAttribute(cle, valeur === true ? '' : valeur);
    }
  }

  ajouter(node, enfants);
  return node;
}

function ajouter(parent, enfants) {
  for (const enfant of enfants.flat(Infinity)) {
    if (enfant === null || enfant === undefined || enfant === false) continue;
    parent.append(enfant instanceof Node ? enfant : document.createTextNode(String(enfant)));
  }
}

export function vider(node) {
  node.replaceChildren();
  return node;
}

export function $(selecteur, racine = document) {
  return racine.querySelector(selecteur);
}

/** Icône SVG au trait, dessinée à partir d'un chemin. */
export function icone(chemins, taille = 24) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${taille} ${taille}`);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of [].concat(chemins)) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export const ICONES = {
  gauche: 'M15 5l-7 7 7 7',
  droite: 'M9 5l7 7-7 7',
  note: [
    'M9 18V5l10-2v13',
    'M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
    'M19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  ],
  telecharger: 'M12 3v12m0 0l-4-4m4 4l4-4M4 19h16',
  corbeille: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13',
  play: 'M8 5l11 7-11 7z',
  stop: 'M7 7h10v10H7z',
};
