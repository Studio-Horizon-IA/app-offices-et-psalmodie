/**
 * Semaine du psautier.
 *
 * Les psaumes des offices tournent sur quatre semaines (PGLH n° 126). Le cycle
 * repart à la semaine I au premier dimanche de l'Avent, à la première semaine
 * du Temps ordinaire, au premier dimanche de Carême et à Pâques ; « pendant le
 * Temps ordinaire, le cycle du psautier suit la série des semaines » (n° 133).
 * D'où le calcul, à partir du numéro de semaine liturgique.
 *
 * Aux solennités et aux fêtes, le psautier est mis de côté : « il y a des
 * psaumes propres, avec leurs antiennes propres » (n° 62).
 *
 * Voir documentation/fondations/psautier-et-tons.md.
 */

const ROMAINS = ['I', 'II', 'III', 'IV'];

const INCONNU = { type: 'inconnu' };

/** L'AELF indique parfois elle-même la semaine, entre crochets. */
function mentionExplicite(informations) {
  const champs = [informations?.ligne3, informations?.ligne2, informations?.ligne1];
  for (const champ of champs) {
    const trouve = /psautier\s*:?\s*semaine\s*(propre|[IV]+|\d)/i.exec(String(champ ?? ''));
    if (!trouve) continue;
    const valeur = trouve[1].toLowerCase();
    if (valeur === 'propre') {
      return { type: 'propre', libelle: 'Psaumes propres', detail: 'Semaine du psautier propre à ces jours.' };
    }
    const numero = /^\d$/.test(valeur) ? Number(valeur) : ROMAINS.indexOf(valeur.toUpperCase()) + 1;
    if (numero >= 1 && numero <= 4) return psautier(numero, 'indiquée par l’AELF');
  }
  return null;
}

function psautier(numero, origine) {
  return {
    type: 'psautier',
    numero,
    romain: ROMAINS[numero - 1],
    libelle: `Psautier ${ROMAINS[numero - 1]}`,
    detail: `Semaine ${ROMAINS[numero - 1]} du psautier de quatre semaines (${origine}).`,
  };
}

/**
 * Détermine la semaine du psautier d'un jour, à partir du bloc `informations`
 * de l'AELF. Renvoie `{ type: 'inconnu' }` plutôt que de deviner quand le
 * calendrier ne permet pas de conclure — Temps de Noël, jours après les Cendres.
 */
export function semainePsautier(informations) {
  if (!informations) return INCONNU;

  const explicite = mentionExplicite(informations);
  if (explicite) return explicite;

  const degre = String(informations.degre ?? '');
  if (/solennit|fête|fete/i.test(degre)) {
    return {
      type: 'propre',
      libelle: 'Psaumes propres',
      detail: 'Aux solennités et aux fêtes, les psaumes et les antiennes sont propres (PGLH n° 62).',
    };
  }

  const numero = /^(\d+)/.exec(String(informations.semaine ?? '').trim());
  if (!numero) return INCONNU;

  return psautier(((Number(numero[1]) - 1) % 4) + 1, 'calculée sur la semaine liturgique');
}
