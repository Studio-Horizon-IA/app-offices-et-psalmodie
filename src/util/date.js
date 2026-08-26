const FORMAT_LONG = new Intl.DateTimeFormat('fr-CA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FORMAT_COURT = new Intl.DateTimeFormat('fr-CA', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Date locale au format AAAA-MM-JJ (jamais toISOString : décalage UTC). */
export function iso(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function depuisIso(valeur) {
  const [a, m, j] = valeur.split('-').map(Number);
  return new Date(a, m - 1, j);
}

export function ajouterJours(valeurIso, jours) {
  const date = depuisIso(valeurIso);
  date.setDate(date.getDate() + jours);
  return iso(date);
}

export function formatLong(valeurIso) {
  return FORMAT_LONG.format(depuisIso(valeurIso));
}

export function formatCourt(valeurIso) {
  return FORMAT_COURT.format(depuisIso(valeurIso));
}

/** Étiquette relative lisible : « Aujourd'hui », « Demain », sinon la date. */
export function etiquetteDate(valeurIso) {
  const aujourdhui = iso();
  if (valeurIso === aujourdhui) return "Aujourd'hui";
  if (valeurIso === ajouterJours(aujourdhui, 1)) return 'Demain';
  if (valeurIso === ajouterJours(aujourdhui, -1)) return 'Hier';
  return formatCourt(valeurIso);
}

export function capitaliser(texte = '') {
  return texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte;
}
