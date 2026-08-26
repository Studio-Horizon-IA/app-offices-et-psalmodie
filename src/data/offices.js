/** Catalogue des offices, tel qu'il apparaît dans le tiroir « Jour ». */

export const OFFICES = [
  { id: 'messe', nom: 'Messe', groupe: 'jour', api: 'messes' },
  { id: 'bible', nom: 'Bible', groupe: 'jour', virtuel: true },
  { id: 'lectures', nom: 'Office des lectures', groupe: 'heures', api: 'lectures', heure: '—' },
  { id: 'laudes', nom: 'Laudes', groupe: 'heures', api: 'laudes', heure: '06 h' },
  { id: 'tierce', nom: 'Tierce', groupe: 'heures', api: 'tierce', heure: '09 h' },
  { id: 'sexte', nom: 'Sexte', groupe: 'heures', api: 'sexte', heure: '12 h' },
  { id: 'none', nom: 'None', groupe: 'heures', api: 'none', heure: '15 h' },
  { id: 'vepres', nom: 'Vêpres', groupe: 'heures', api: 'vepres', heure: '18 h' },
  { id: 'complies', nom: 'Complies', groupe: 'heures', api: 'complies', heure: '21 h' },
];

export const OFFICES_PAR_ID = Object.fromEntries(OFFICES.map((o) => [o.id, o]));

/** Les heures, dans l'ordre du jour — sert au préchargement et au choix par défaut. */
export const HEURES = OFFICES.filter((o) => o.groupe === 'heures').map((o) => o.id);

export const REGIONS = [
  { id: 'romain', nom: 'Calendrier romain' },
  { id: 'france', nom: 'France' },
  { id: 'canada', nom: 'Canada' },
  { id: 'belgique', nom: 'Belgique' },
  { id: 'luxembourg', nom: 'Luxembourg' },
  { id: 'suisse', nom: 'Suisse' },
  { id: 'afrique', nom: 'Afrique' },
];

/** Couleurs liturgiques renvoyées par l'API, traduites en teinte d'accent. */
export const COULEURS = {
  vert: '#3f7d52',
  blanc: '#8a6a2f',
  rouge: '#a83a34',
  violet: '#6b4a86',
  rose: '#b56b8a',
  noir: '#4a4036',
};

export const COULEURS_NUIT = {
  vert: '#7fc191',
  blanc: '#d5a852',
  rouge: '#e08b84',
  violet: '#b394cf',
  rose: '#e3a3bd',
  noir: '#a99b8a',
};

/** Office proposé par défaut selon l'heure qu'il est. */
export function officeDuMoment(maintenant = new Date()) {
  const h = maintenant.getHours();
  if (h < 5) return 'complies';
  if (h < 8) return 'laudes';
  if (h < 11) return 'tierce';
  if (h < 14) return 'sexte';
  if (h < 17) return 'none';
  if (h < 20) return 'vepres';
  return 'complies';
}
