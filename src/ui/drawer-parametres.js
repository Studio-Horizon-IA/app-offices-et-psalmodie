import { el, vider, $ } from '../util/dom.js';
import { store, reglerParametre } from '../core/store.js';
import { REGIONS } from '../data/offices.js';
import { TONS } from '../audio/tons.js';
import { INSTRUMENTS } from '../audio/synthese.js';
import { statistiquesCache } from '../data/cache.js';
import { appliquerTheme, appliquerTaille, appliquerTouchAction } from './coquille.js';

/** Tiroir de droite : tous les réglages du croquis. */

let corps;
let actions;
let barreProgres = null;

export function initTiroirParametres({ rafraichir, telecharger, purger }) {
  corps = $('#drawer-parametres-body');
  actions = { rafraichir, telecharger, purger };
}

/* --- Briques de base --- */

function titre(texte) {
  return el('h3.groupe-titre', {}, texte);
}

function ligneBascule(nom, aide, valeur, surChangement) {
  const bouton = el('button.bascule', {
    type: 'button',
    role: 'switch',
    'aria-checked': String(valeur),
    'aria-label': nom,
    onclick: () => {
      const nouveau = bouton.getAttribute('aria-checked') !== 'true';
      bouton.setAttribute('aria-checked', String(nouveau));
      surChangement(nouveau);
    },
  });

  return el(
    'div.reglage',
    {},
    el(
      'span.reglage-texte',
      {},
      el('span.reglage-nom', {}, nom),
      aide ? el('span.reglage-aide', {}, aide) : null
    ),
    bouton
  );
}

function ligneAction(nom, aide, valeur, surClic, { danger = false } = {}) {
  return el(
    `button.reglage${danger ? '.danger' : ''}`,
    { type: 'button', onclick: surClic },
    el(
      'span.reglage-texte',
      {},
      el('span.reglage-nom', {}, nom),
      aide ? el('span.reglage-aide', {}, aide) : null
    ),
    valeur ? el('span.reglage-valeur', {}, valeur) : null
  );
}

function ligneChoix(nom, aide, options, valeurCourante, surChangement) {
  const select = el('select', {
    'aria-label': nom,
    onchange: (evenement) => surChangement(evenement.target.value),
  });
  for (const option of options) {
    select.append(el('option', { value: option.id, selected: option.id === valeurCourante }, option.nom));
  }
  return el('div.champ-ligne', { style: 'padding:0 1.1rem' }, el('label', {}, nom), select);
}

function segments(nom, options, valeurCourante, surChangement) {
  const groupe = el('div.segments', { role: 'group', 'aria-label': nom });
  for (const option of options) {
    groupe.append(
      el(
        'button',
        {
          type: 'button',
          'aria-pressed': String(option.id === valeurCourante),
          onclick: () => surChangement(option.id),
        },
        option.nom
      )
    );
  }
  return groupe;
}

/* --- Le tiroir --- */

export function rendreTiroirParametres() {
  const p = store.parametres;
  vider(corps);

  corps.append(el('div.drawer-entete', {}, el('h2', {}, 'Paramètres')));

  /* Lectures */
  corps.append(
    el(
      'section.groupe',
      {},
      titre('Lectures'),
      ligneChoix('Région', null, REGIONS, p.region, (region) => {
        reglerParametre({ region });
        actions.rafraichir();
      }),
      el(
        'p.reglage-aide',
        { style: 'padding:.15rem 1.1rem .5rem' },
        'Calendrier et traductions propres à la conférence épiscopale choisie.'
      )
    )
  );

  /* Psalmodie */
  corps.append(
    el(
      'section.groupe',
      {},
      titre('Psalmodie'),
      ligneChoix(
        'Ton',
        null,
        TONS.map((t) => ({ id: t.id, nom: `${t.nom} — ${t.mode}` })),
        p.ton,
        (ton) => reglerParametre({ ton })
      ),
      ligneChoix('Instrument', null, INSTRUMENTS, p.instrument, (instrument) =>
        reglerParametre({ instrument })
      )
    )
  );

  /* Affichage */
  const apercu = el(
    'p.curseur-apercu',
    {},
    'Le Seigneur est mon berger : je ne manque de rien.'
  );
  const curseur = el('input', {
    type: 'range',
    min: '0.8',
    max: '2.2',
    step: '0.05',
    value: String(p.tailleTexte),
    'aria-label': 'Taille du texte',
    oninput: (evenement) => {
      reglerParametre({ tailleTexte: Number(evenement.target.value) });
      appliquerTaille();
    },
  });

  corps.append(
    el(
      'section.groupe',
      {},
      titre('Affichage'),
      ligneBascule(
        'Mode nuit',
        'Fond sombre et encre chaude pour les offices de nuit.',
        document.documentElement.dataset.theme === 'nuit',
        (valeur) => {
          reglerParametre({ nuit: valeur });
          appliquerTheme();
        }
      ),
      el('div.reglage', {}, el('span.reglage-texte', {}, el('span.reglage-nom', {}, 'Taille du texte'))),
      el('div.curseur', {}, curseur, apercu),
      ligneBascule(
        'Zoom à deux doigts',
        'Pincer sur le texte pour ajuster la taille.',
        p.zoomDeuxDoigts,
        (valeur) => {
          reglerParametre({ zoomDeuxDoigts: valeur });
          appliquerTouchAction();
        }
      )
    )
  );

  /* Hors connexion */
  const progres = el('div.progres', { hidden: true }, el('span', { style: 'width:0%' }));
  barreProgres = progres;

  const boutonTelecharger = ligneAction(
    "Télécharger à l'avance",
    `Les ${p.prechargerJours} prochains jours, en une fois.`,
    'Lancer',
    () => actions.telecharger()
  );

  const infoCache = ligneAction('Purger le cache', 'Calcul…', 'Vider', () => actions.purger(), {
    danger: true,
  });

  corps.append(
    el(
      'section.groupe',
      {},
      titre('Mode hors connexion'),
      el(
        'div.reglage',
        {},
        el(
          'span.reglage-texte',
          {},
          el('span.reglage-nom', {}, 'Contenu conservé'),
          el('span.reglage-aide', {}, 'Ce qui est gardé sur l’appareil pour être lu sans réseau.')
        )
      ),
      segments(
        'Contenu conservé',
        [
          { id: 'aucun', nom: 'Aucun' },
          { id: 'messe', nom: 'Messe' },
          { id: 'offices', nom: 'Offices' },
          { id: 'messe+offices', nom: 'Messe + Offices' },
        ],
        p.contenuHorsLigne,
        (contenuHorsLigne) => {
          reglerParametre({ contenuHorsLigne });
          rendreTiroirParametres();
        }
      ),
      boutonTelecharger,
      segments(
        "Jours téléchargés à l'avance",
        [
          { id: 0, nom: 'Aujourd’hui' },
          { id: 1, nom: '+1 j' },
          { id: 3, nom: '+3 j' },
          { id: 7, nom: '+7 j' },
        ],
        p.prechargerJours,
        (prechargerJours) => {
          reglerParametre({ prechargerJours });
          rendreTiroirParametres();
        }
      ),
      progres,
      el(
        'div.reglage',
        {},
        el(
          'span.reglage-texte',
          {},
          el('span.reglage-nom', {}, 'Conserver les textes'),
          el('span.reglage-aide', {}, 'Au-delà, les textes anciens sont effacés automatiquement.')
        )
      ),
      segments(
        'Durée de conservation',
        [
          { id: 7, nom: '7 jours' },
          { id: 30, nom: '30 jours' },
          { id: 90, nom: '90 jours' },
          { id: 0, nom: 'Toujours' },
        ],
        p.conserverJours,
        (conserverJours) => {
          reglerParametre({ conserverJours });
          rendreTiroirParametres();
        }
      ),
      ligneBascule(
        'WiFi uniquement',
        'Les téléchargements de fond attendent un réseau non mesuré.',
        p.wifiSeulement,
        (wifiSeulement) => reglerParametre({ wifiSeulement })
      ),
      infoCache
    )
  );

  corps.append(
    el(
      'section.groupe',
      {},
      el(
        'p.reglage-aide',
        { style: 'padding:.4rem 1.1rem 0' },
        'Textes liturgiques © AELF — api.aelf.org. Les formules psalmodiques sont des aides à l’intonation, simplifiées.'
      )
    )
  );

  majStatistiques(infoCache);
}

async function majStatistiques(ligne) {
  const { entrees, octets } = await statistiquesCache();
  const poids = octets ? ` · ${(octets / 1048576).toFixed(1)} Mo` : '';
  const aide = ligne.querySelector('.reglage-aide');
  if (aide) aide.textContent = `${entrees} texte${entrees > 1 ? 's' : ''} en réserve${poids}.`;
}

/** Avancement du téléchargement anticipé (0 → 1, ou null pour masquer). */
export function majProgres(fraction) {
  if (!barreProgres) return;
  if (fraction === null) {
    barreProgres.hidden = true;
    return;
  }
  barreProgres.hidden = false;
  barreProgres.firstElementChild.style.width = `${Math.round(fraction * 100)}%`;
}
