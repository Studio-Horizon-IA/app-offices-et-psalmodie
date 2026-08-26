import { el, vider, $, icone, ICONES } from '../util/dom.js';
import { store, reglerParametre, tonCourant, reglerTonCourant } from '../core/store.js';
import { OFFICES_PAR_ID } from '../data/offices.js';
import { semainePsautier } from '../data/psautier.js';
import { TONS, TONS_PAR_ID, nomFrancais } from '../audio/tons.js';
import { rendrePortee } from './portee.js';
import { INSTRUMENTS, jouerTon, arreter, enLecture, audioDisponible } from '../audio/synthese.js';
import { message } from './coquille.js';
import { tutorielActif } from './tutoriel.js';

/** Feuille du bas : choix du ton, portée de repère et écoute. */

let corps;
let boutonJouer = null;

export function initPsalmodie() {
  corps = $('#panneau-psalmodie-body');
}

function libelleNotes(ton) {
  const suite = [
    ton.intonation.map(nomFrancais).join('–'),
    `teneur ${nomFrancais(ton.teneur)}`,
    ton.terminaison.map(nomFrancais).join('–'),
  ];
  return suite.join(' · ');
}

export function rendrePsalmodie() {
  const p = store.parametres;
  const idTon = tonCourant();
  const ton = TONS_PAR_ID[idTon] ?? TONS[0];
  const office = OFFICES_PAR_ID[store.vue.office];
  vider(corps);

  corps.append(
    el('h2.psalmodie-titre', {}, `${ton.nom} — ${ton.mode}`),
    el('p.psalmodie-soustitre', {}, libelleNotes(ton)),
    rendrePortee(ton).element
  );

  const choixTon = el('select', {
    'aria-label': 'Ton psalmodique',
    onchange: (evenement) => {
      reglerTonCourant(evenement.target.value);
      rendrePsalmodie();
    },
  });
  for (const t of TONS) {
    choixTon.append(el('option', { value: t.id, selected: t.id === idTon }, t.nom));
  }

  const choixInstrument = el('select', {
    'aria-label': 'Instrument',
    onchange: (evenement) => reglerParametre({ instrument: evenement.target.value }),
  });
  for (const i of INSTRUMENTS) {
    choixInstrument.append(el('option', { value: i.id, selected: i.id === p.instrument }, i.nom));
  }

  const transposition = el('input', {
    type: 'range',
    min: '-5',
    max: '5',
    step: '1',
    value: '0',
    'aria-label': 'Transposition en demi-tons',
  });

  corps.append(
    el('div.champ-ligne', {}, el('label', {}, 'Ton'), choixTon),
    el('div.champ-ligne', {}, el('label', {}, 'Instrument'), choixInstrument),
    el('div.champ-ligne', {}, el('label', {}, 'Hauteur'), transposition)
  );

  boutonJouer = el(
    'button.bouton.primaire',
    {
      type: 'button',
      onclick: () => basculerLecture(ton, Number(transposition.value)),
    },
    icone(ICONES.play, 24),
    'Écouter le ton'
  );

  corps.append(el('div.psalmodie-actions', {}, boutonJouer));
  if (tutorielActif()) corps.append(noteDUsage(office));
  majBoutonJouer();
}

/**
 * L'essentiel pour un néophyte : le ton ne se choisit pas au goût du jour, il
 * vient de l'antienne. On le dit dans l'application, pas seulement dans la
 * documentation.
 */
function noteDUsage(office) {
  const psaume = semainePsautier(store.jour?.informations);
  const bloc = el('details.psalmodie-note');

  bloc.append(
    el('summary', {}, 'Comment se choisit le ton ?'),
    el(
      'p',
      {},
      'En usage, c’est ',
      el('strong', {}, 'l’antienne'),
      ' qui commande le ton : son mode impose le ton du psaume, et la terminaison ' +
        'retenue ramène à la première note de l’antienne que l’on reprend. L’AELF ' +
        'publie le texte des antiennes, pas leur mélodie : le choix vous revient donc, ' +
        'et il est mémorisé par office.'
    ),
    el(
      'p',
      {},
      'Ce ton est retenu pour ',
      el('strong', {}, office?.nom ?? 'cet office'),
      '. Les autres offices gardent le leur, ou le ton par défaut des paramètres.'
    ),
    psaume.type === 'inconnu'
      ? null
      : el(
          'p',
          {},
          psaume.type === 'propre'
            ? 'Aujourd’hui, les psaumes sont propres à la fête : ils ne viennent pas du cycle des quatre semaines.'
            : `Aujourd’hui, les psaumes viennent de la semaine ${psaume.romain} du psautier de quatre semaines. La semaine décide des psaumes, jamais du ton.`
        ),
    el(
      'p',
      {},
      'Les usages diffèrent d’une communauté à l’autre : l’Église demande que chaque ' +
        'langue prépare ses propres mélodies (PGLH n° 275). Aux fêtes, aucun ton n’est ' +
        'prescrit — c’est la solennité du chant qui marque le jour.'
    )
  );
  return bloc;
}

function basculerLecture(ton, transposition) {
  if (enLecture()) {
    arreter();
    majBoutonJouer();
    return;
  }
  if (!audioDisponible()) {
    message('Le son n’est pas disponible sur cet appareil.');
    return;
  }
  jouerTon(ton, {
    instrument: store.parametres.instrument,
    transposition,
    surFin: majBoutonJouer,
  });
  majBoutonJouer();
}

function majBoutonJouer() {
  if (!boutonJouer) return;
  const actif = enLecture();
  vider(boutonJouer);
  boutonJouer.append(icone(actif ? ICONES.stop : ICONES.play, 24), actif ? 'Arrêter' : 'Écouter le ton');
}
