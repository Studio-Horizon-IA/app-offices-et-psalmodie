import { aDuContenu, texteBrut } from '../util/sanitize.js';
import { OFFICES_PAR_ID } from './offices.js';

/**
 * Découpe une réponse de l'AELF en sections (les onglets « SCT 1, SCT 2… » du
 * croquis) contenant des blocs prêts à afficher.
 *
 * Un bloc : { genre, etiquette, titre, ref, html, source, psalmodiable }
 */

const NOTRE_PERE = `<p>Notre Père, qui es aux cieux,<br />
que ton nom soit sanctifié,<br />
que ton règne vienne,<br />
que ta volonté soit faite sur la terre comme au ciel.<br />
Donne-nous aujourd’hui notre pain de ce jour.<br />
Pardonne-nous nos offenses,<br />
comme nous pardonnons aussi à ceux qui nous ont offensés.<br />
Et ne nous laisse pas entrer en tentation,<br />
mais délivre-nous du Mal.</p>`;

const CHAMPS = {
  introduction: { etiquette: 'Introduction', genre: 'introduction' },
  antienne_invitatoire: { etiquette: 'Antienne invitatoire', genre: 'antienne' },
  psaume_invitatoire: { etiquette: 'Psaume invitatoire', genre: 'psaume', psalmodiable: true },
  hymne: { etiquette: 'Hymne', genre: 'hymne' },
  antienne_1: { etiquette: 'Antienne', genre: 'antienne' },
  antienne_2: { etiquette: 'Antienne', genre: 'antienne' },
  antienne_3: { etiquette: 'Antienne', genre: 'antienne' },
  psaume_1: { etiquette: 'Psaume', genre: 'psaume', psalmodiable: true },
  psaume_2: { etiquette: 'Psaume', genre: 'psaume', psalmodiable: true },
  psaume_3: { etiquette: 'Psaume', genre: 'psaume', psalmodiable: true },
  verset_psaume: { etiquette: 'Verset', genre: 'repons' },
  pericope: { etiquette: 'Parole de Dieu', genre: 'lecture' },
  repons: { etiquette: 'Répons', genre: 'repons' },
  lecture: { etiquette: 'Lecture', genre: 'lecture' },
  repons_lecture: { etiquette: 'Répons', genre: 'repons' },
  texte_patristique: { etiquette: 'Lecture patristique', genre: 'lecture' },
  repons_patristique: { etiquette: 'Répons', genre: 'repons' },
  te_deum: { etiquette: 'Te Deum', genre: 'hymne' },
  antienne_zacharie: { etiquette: 'Antienne', genre: 'antienne' },
  cantique_zacharie: { etiquette: 'Cantique de Zacharie', genre: 'psaume', psalmodiable: true },
  antienne_magnificat: { etiquette: 'Antienne', genre: 'antienne' },
  cantique_mariale: { etiquette: 'Cantique de la Vierge Marie', genre: 'psaume', psalmodiable: true },
  antienne_symeon: { etiquette: 'Antienne', genre: 'antienne' },
  cantique_symeon: { etiquette: 'Cantique de Syméon', genre: 'psaume', psalmodiable: true },
  intercession: { etiquette: 'Intercession', genre: 'priere' },
  notre_pere: { etiquette: 'Notre Père', genre: 'priere', texteFixe: NOTRE_PERE },
  oraison: { etiquette: 'Oraison', genre: 'priere' },
  benediction: { etiquette: 'Bénédiction', genre: 'priere' },
  hymne_mariale: { etiquette: 'Hymne mariale', genre: 'hymne' },
};

const PLAN_OFFICE = [
  { titre: 'Ouverture', court: 'Ouverture', cles: ['introduction', 'antienne_invitatoire', 'psaume_invitatoire', 'hymne'] },
  { titre: 'Premier psaume', court: 'Ps 1', cles: ['antienne_1', 'psaume_1'] },
  { titre: 'Deuxième psaume', court: 'Ps 2', cles: ['antienne_2', 'psaume_2'] },
  { titre: 'Troisième psaume', court: 'Ps 3', cles: ['antienne_3', 'psaume_3'] },
  { titre: 'Parole de Dieu', court: 'Parole', cles: ['verset_psaume', 'pericope', 'repons'] },
  { titre: 'Lecture biblique', court: 'Lecture', cles: ['lecture', 'repons_lecture'] },
  { titre: 'Lecture patristique', court: 'Patristique', cles: ['texte_patristique', 'repons_patristique', 'te_deum'] },
  {
    titre: 'Cantique évangélique',
    court: 'Cantique',
    cles: [
      'antienne_zacharie', 'cantique_zacharie',
      'antienne_magnificat', 'cantique_mariale',
      'antienne_symeon', 'cantique_symeon',
    ],
  },
  { titre: 'Prières', court: 'Prières', cles: ['intercession', 'notre_pere', 'oraison', 'benediction', 'hymne_mariale'] },
];

const TYPES_MESSE = {
  lecture_1: '1ʳᵉ lecture',
  lecture_2: '2ᵉ lecture',
  lecture_3: '3ᵉ lecture',
  lecture_4: '4ᵉ lecture',
  psaume: 'Psaume',
  cantique: 'Cantique',
  sequence: 'Séquence',
  evangile: 'Évangile',
};

function blocDepuisChamp(cle, valeur) {
  const meta = CHAMPS[cle];
  if (!meta) return null;

  const objet = valeur && typeof valeur === 'object' ? valeur : null;
  const brut = meta.texteFixe ?? (objet ? objet.texte : valeur);
  if (!aDuContenu(brut)) return null;

  let etiquette = meta.etiquette;
  const reference = objet?.reference ? String(objet.reference) : '';
  // L'AELF loge parfois un cantique dans un champ « psaume_n ».
  if (/^cantique/i.test(reference)) etiquette = 'Cantique';

  return {
    genre: meta.genre,
    etiquette,
    titre: objet?.titre ?? null,
    ref: reference ? formaterReference(reference) : null,
    html: brut,
    source: objet?.auteur ? [objet.auteur, objet.editeur].filter(Boolean).join(' — ') : null,
    psalmodiable: Boolean(meta.psalmodiable),
  };
}

function formaterReference(reference) {
  const texte = texteBrut(reference);
  if (/^\d+$/.test(texte)) return `Psaume ${texte}`;
  return texte.replace(/^CANTIQUE\s*/i, 'Cantique ');
}

function sectionsOffice(contenu) {
  const sections = [];
  for (const etape of PLAN_OFFICE) {
    const blocs = [];
    for (const cle of etape.cles) {
      if (!(cle in contenu)) continue;
      const bloc = blocDepuisChamp(cle, contenu[cle]);
      if (bloc) blocs.push(bloc);
    }
    if (!blocs.length) continue;

    // Le titre de la lecture patristique vit dans un champ à part.
    if (etape.court === 'Patristique' && contenu.titre_patristique) {
      const cible = blocs.find((b) => b.genre === 'lecture');
      if (cible) cible.titre = texteBrut(contenu.titre_patristique);
    }
    sections.push({ titre: etape.titre, court: etape.court, blocs });
  }
  return sections;
}

function blocsLecture(lecture) {
  const blocs = [];
  const etiquette = TYPES_MESSE[lecture.type] ?? 'Lecture';

  if (aDuContenu(lecture.refrain_psalmique)) {
    blocs.push({
      genre: 'antienne',
      etiquette: 'Refrain',
      titre: null,
      ref: lecture.ref_refrain ? texteBrut(lecture.ref_refrain) : null,
      html: lecture.refrain_psalmique,
      psalmodiable: false,
    });
  }

  if (aDuContenu(lecture.verset_evangile)) {
    blocs.push({
      genre: 'antienne',
      etiquette: 'Acclamation',
      titre: null,
      ref: lecture.ref_verset ? texteBrut(lecture.ref_verset) : null,
      html: lecture.verset_evangile,
      psalmodiable: false,
    });
  }

  blocs.push({
    genre: lecture.type === 'psaume' ? 'psaume' : 'lecture',
    etiquette,
    titre: lecture.titre ? texteBrut(lecture.titre) : null,
    ref: lecture.ref ? texteBrut(lecture.ref) : null,
    html: lecture.contenu,
    source: lecture.intro_lue ? texteBrut(lecture.intro_lue) : null,
    psalmodiable: lecture.type === 'psaume',
  });

  return blocs;
}

function sectionsMesse(messes) {
  const sections = [];
  const plusieurs = messes.length > 1;

  for (const messe of messes) {
    for (const lecture of messe.lectures ?? []) {
      const etiquette = TYPES_MESSE[lecture.type] ?? 'Lecture';
      sections.push({
        titre: plusieurs ? `${messe.nom} — ${etiquette}` : etiquette,
        court: etiquette,
        blocs: blocsLecture(lecture),
      });
    }
  }
  return sections;
}

function sectionsBible(bible) {
  const sections = [];

  for (const messe of bible.messes ?? []) {
    for (const lecture of messe.lectures ?? []) {
      if (lecture.type === 'sequence') continue;
      const etiquette = TYPES_MESSE[lecture.type] ?? 'Lecture';
      sections.push({
        titre: lecture.ref ? texteBrut(lecture.ref) : etiquette,
        court: etiquette,
        blocs: blocsLecture(lecture),
      });
    }
  }

  const patristique = bible.lectures?.lecture;
  if (patristique && aDuContenu(patristique.texte)) {
    sections.push({
      titre: patristique.reference ? texteBrut(patristique.reference) : 'Office des lectures',
      court: 'Lectures',
      blocs: [blocDepuisChamp('lecture', patristique)].filter(Boolean),
    });
  }

  return sections;
}

/** Point d'entrée : renvoie les sections d'un office déjà chargé. */
export function decouper(officeId, donnees) {
  if (!donnees) return [];
  if (officeId === 'bible') return sectionsBible(donnees.bible ?? {});
  if (officeId === 'messe') return sectionsMesse(donnees.messes ?? []);

  const cle = OFFICES_PAR_ID[officeId]?.api ?? officeId;
  const contenu = donnees[cle];
  if (!contenu) return [];
  return sectionsOffice(contenu);
}
