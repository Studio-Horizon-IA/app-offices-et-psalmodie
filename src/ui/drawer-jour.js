import { el, vider, $, icone, ICONES } from '../util/dom.js';
import { OFFICES } from '../data/offices.js';
import { estEnCache } from '../data/cache.js';
import { semainePsautier } from '../data/psautier.js';
import { store } from '../core/store.js';
import { ajouterJours, etiquetteDate, formatLong, capitaliser, iso } from '../util/date.js';

/** Tiroir de gauche : le jour liturgique et la liste des offices. */

let corps;
let actions;

export function initTiroirJour({ choisirOffice, choisirDate }) {
  corps = $('#drawer-jour-body');
  actions = { choisirOffice, choisirDate };
}

function enteteJour(informations) {
  const { date } = store.vue;

  const selecteur = el('input', {
    type: 'date',
    value: date,
    'aria-label': 'Choisir une date',
    onchange: (evenement) => evenement.target.value && actions.choisirDate(evenement.target.value),
  });

  const etiquette = el(
    'button.date-nav-label',
    {
      type: 'button',
      onclick: () => (selecteur.showPicker ? selecteur.showPicker() : selecteur.click()),
    },
    etiquetteDate(date)
  );

  const psautier = semainePsautier(informations);

  return el(
    'div.drawer-entete',
    {},
    el('h2', {}, informations?.ligne1 ? capitaliser(informations.ligne1) : capitaliser(formatLong(date))),
    informations?.fete ? el('p.fete', {}, informations.fete) : null,
    informations?.ligne3 ? el('p', {}, informations.ligne3) : null,
    psautier.type === 'inconnu'
      ? null
      : el('p.psautier', { title: psautier.detail }, psautier.libelle),
    el(
      'div.date-nav',
      {},
      el(
        'button',
        {
          type: 'button',
          'aria-label': 'Jour précédent',
          onclick: () => actions.choisirDate(ajouterJours(store.vue.date, -1)),
        },
        icone(ICONES.gauche)
      ),
      etiquette,
      selecteur,
      el(
        'button',
        {
          type: 'button',
          'aria-label': 'Jour suivant',
          onclick: () => actions.choisirDate(ajouterJours(store.vue.date, 1)),
        },
        icone(ICONES.droite)
      )
    ),
    date === iso()
      ? null
      : el(
          'button.bouton',
          { type: 'button', style: 'margin-top:.6rem', onclick: () => actions.choisirDate(iso()) },
          "Revenir à aujourd'hui"
        )
  );
}

function entreeOffice(office, pastille) {
  return el(
    'button.entree',
    {
      type: 'button',
      'aria-current': String(office.id === store.vue.office),
      onclick: () => actions.choisirOffice(office.id),
    },
    el('span.entree-nom', {}, office.nom),
    office.heure && office.heure !== '—' ? el('span.entree-heure', {}, office.heure) : null,
    pastille
  );
}

export function rendreTiroirJour(informations) {
  vider(corps);
  corps.append(enteteJour(informations));

  const groupes = [
    { titre: 'Le jour', offices: OFFICES.filter((o) => o.groupe === 'jour') },
    { titre: 'Liturgie des Heures', offices: OFFICES.filter((o) => o.groupe === 'heures') },
  ];

  const pastilles = new Map();
  for (const groupe of groupes) {
    const bloc = el('section.groupe', {}, el('h3.groupe-titre', {}, groupe.titre));
    for (const office of groupe.offices) {
      const pastille = el('span.pastille', { title: 'Disponible hors connexion', hidden: true });
      pastilles.set(office.id, pastille);
      bloc.append(entreeOffice(office, pastille));
    }
    corps.append(bloc);
  }

  marquerDisponibles(pastilles);
}

/** Allume une pastille verte pour les offices déjà présents dans la réserve. */
async function marquerDisponibles(pastilles) {
  const { date } = store.vue;
  const { region } = store.parametres;
  for (const [id, pastille] of pastilles) {
    if (id === 'bible') continue;
    const present = await estEnCache(id, date, region);
    if (store.vue.date !== date) return; // la vue a changé entre-temps
    pastille.hidden = !present;
    pastille.classList.toggle('est-cache', present);
  }
}
