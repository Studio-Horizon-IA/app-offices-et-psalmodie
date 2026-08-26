# SPEC-01 — Interface

## Disposition générale

```
┌────────────────────────────────────────────┐
│ ☰   Titre du jour liturgique      ♪    ⋮   │  barre fixe (3,5 rem + encoche)
│     Aujourd'hui · Laudes · S. Louis        │
├────────────────────────────────────────────┤
│ OUVERTURE  PS 1  PS 2  PS 3  PAROLE  …     │  onglets, défilement horizontal
├────────────────────────────────────────────┤
│                                            │
│                 [ LITURGIE ]               │  zone de lecture, défilement
│                                            │
└────────────────────────────────────────────┘
   tiroir gauche ← · feuille du bas ↑ · tiroir droit →
```

Correspondance avec le croquis d'origine : ☰ = tiroir « Jour », ⋮ = tiroir
« Paramètres », ♪ = feuille « Psalmodie », `SCT 1 · SCT 2 · SCT 3 (slide G/D)` =
les onglets de sections, `[LITURGIE]` = la zone de lecture.

## Barre du haut

| Élément | Contenu | Action |
| --- | --- | --- |
| Bouton ☰ | Icône trois traits | Ouvre/ferme le tiroir « Jour » |
| Titre, ligne 1 | `informations.ligne1` capitalisée, sinon la date longue | Ouvre le tiroir « Jour » |
| Titre, ligne 2 | `étiquette de date · nom de l'office · fête`, en petites capitales, teinte liturgique | idem |
| Bouton ♪ | Note de musique | Ouvre/ferme la feuille « Psalmodie » |
| Bouton ⋮ | Trois points | Ouvre/ferme le tiroir « Paramètres » |

L'étiquette de date affiche « Aujourd'hui », « Demain », « Hier », sinon la date
courte `fr-CA` (ex. « ven. 28 août »). Les deux lignes sont tronquées par
ellipse ; le titre complet reste accessible dans le tiroir « Jour ».

## Onglets de sections

- Un onglet par section de l'office courant, libellé court (`Ouverture`, `Ps 1`,
  `Parole`, `Cantique`, `Prières`, `1ʳᵉ lecture`, `Psaume`, `Évangile`…), le
  libellé long servant d'infobulle.
- L'onglet actif est en teinte liturgique, en gras, souligné d'un trait de 2 px.
- La bande défile horizontalement ; l'onglet actif est ramené au centre
  (`scrollIntoView({inline:'center'})`).
- Sémantique : `role="tablist"` sur la piste, `role="tab"` + `aria-selected` +
  `aria-controls="liturgie-inner"` sur chaque onglet, `role="tabpanel"` +
  `aria-labelledby` sur la zone de lecture. Seul l'onglet actif est dans l'ordre
  de tabulation (`tabindex="0"`, les autres `-1`).

### Changement de section

| Geste | Condition retenue |
| --- | --- |
| Clic / activation clavier d'un onglet | Immédiat |
| Flèches ← et → | Hors champ de saisie (`input`, `select`, `textarea`) |
| Balayage horizontal | Direction décidée après 12 px de mouvement, si `|dx| > |dy| × 1,4` ; validé si `|dx| > 80 px`, ou `|dx| > 40 px` en moins de 500 ms |

Aux extrémités, le mouvement est sans effet (pas de rebouclage sur l'office
voisin). Chaque changement remonte la zone de lecture en haut et pousse une
entrée d'historique.

## Zone de lecture

Ordre d'affichage :

1. **Bandeau hors connexion**, si `navigator.onLine` est faux : « Hors
   connexion — texte lu depuis la réserve locale. » (ou « Hors connexion. » si le
   texte vient du réseau).
2. **En-tête d'office** : nom de l'office, puis
   `date longue · fête · titre de la section`.
3. **Blocs** de la section (voir [SPEC-02](SPEC-02-donnees.md)).

Rendu d'un bloc :

| Partie | Style |
| --- | --- |
| Étiquette (`ANTIENNE`, `PSAUME`, `HYMNE`…) | Petites capitales, teinte liturgique |
| Titre | Serif, semi-gras |
| Référence | Italique, encre atténuée |
| Corps | Serif, taille `--lecture-taille`, interligne 1,62 |
| Source (auteur — éditeur, ou intro lue) | Petit, encre atténuée |

Traitements particuliers du corps :

- `<u>` (syllabe accentuée dans les psaumes AELF) : **jamais souligné**, rendu en
  gras teinté — c'est l'accent tonique servant à psalmodier.
- `.verse_number` : numéro de verset en exposant, non sélectionnable, police sans
  empattement.
- Antiennes et refrains : encadré à filet gauche en teinte liturgique, fond
  atténué, italique.

Les blocs marqués `psalmodiable` (psaumes, cantiques évangéliques, psaume
responsorial) s'affichent **pointés** : trait de récitation sur la teneur, nom
des notes au-dessus des syllabes de cadence, marques `+` et `*` mises en
évidence, un bouton ▶ devant chaque verset et une barre **« Chanter »** sous le
psaume. Voir [SPEC-04](SPEC-04-psalmodie.md#pointage-et-chant-du-texte). Si le
pointage n'aboutit pas, le bloc retombe sur l'affichage ordinaire et le simple
bouton « Donner le ton ».

### États

| État | Affichage |
| --- | --- |
| Chargement | En-tête avec le nom de l'office + 9 lignes squelette animées |
| Erreur | Titre, explication, bouton « Réessayer » (voir [architecture 05](../architecture/05-etats.md)) |
| Section vide | « Rien à afficher — Ce texte est vide pour ce jour. » |

## Tiroir « Jour » (gauche)

```
┌──────────────────────────────┐
│ Mardi 21ᵉ Semaine du T. O.   │  ligne1
│ S. Louis                     │  fête, teinte liturgique
│ Mémoire                      │  ligne3
│ [ ‹ ] [ Aujourd'hui ] [ › ]  │  navigation de date
│ [ Revenir à aujourd'hui ]    │  seulement si date ≠ aujourd'hui
├──────────────────────────────┤
│ LE JOUR                      │
│ Messe                     ●  │
│ Bible                        │
├──────────────────────────────┤
│ LITURGIE DES HEURES          │
│ Office des lectures       ●  │
│ Laudes               06 h ●  │
│ Tierce               09 h ●  │
│ Sexte                12 h ●  │
│ None                 15 h ●  │
│ Vêpres               18 h ●  │
│ Complies             21 h ●  │
└──────────────────────────────┘
```

- Le bouton central de la navigation ouvre le sélecteur de date natif
  (`showPicker()`, repli sur un clic sur l'`input[type=date]` masqué).
- La pastille verte signale un texte présent dans la réserve locale. Elle est
  calculée après le rendu, entrée par entrée, et le calcul s'interrompt si la
  date change entre-temps. L'entrée « Bible » n'en porte pas (vue composée).
- L'office courant est mis en évidence (`aria-current="true"`, fond teinté).
- Choisir un office ferme le tiroir et déclenche le chargement.

## Tiroir « Paramètres » (droite)

| Groupe | Réglage | Contrôle | Valeurs |
| --- | --- | --- | --- |
| **Lectures** | Région | Liste déroulante | Calendrier romain, France, Canada, Belgique, Luxembourg, Suisse, Afrique |
| **Psalmodie** | Ton | Liste déroulante | Tons I à VIII, Tonus peregrinus (avec le mode : « Ré, teneur La »…) |
| | Instrument | Liste déroulante | Piano, Orgue, Voix |
| **Affichage** | Mode nuit | Interrupteur | Reflète le thème effectif ; le premier basculement fige un choix explicite |
| | Taille du texte | Curseur 0,80 → 2,20 (pas 0,05) | Aperçu vivant sous le curseur |
| | Zoom à deux doigts | Interrupteur | Actif par défaut |
| **Mode hors connexion** | Contenu conservé | Segments | Aucun · Messe · Offices · Messe + Offices |
| | Télécharger à l'avance | Bouton « Lancer » + barre de progression | Aide : « Les N prochains jours, en une fois. » |
| | Jours téléchargés à l'avance | Segments | Aujourd'hui · +1 j · +3 j · +7 j |
| | Conserver les textes | Segments | 7 jours · 30 jours · 90 jours · Toujours |
| | WiFi uniquement | Interrupteur | Ne concerne que les téléchargements de fond |
| | Purger le cache | Bouton (accent d'alerte) | Demande confirmation ; l'aide affiche « N textes en réserve · X,X Mo » |

Un pied de tiroir rappelle la source : « Textes liturgiques © AELF —
api.aelf.org. Les formules psalmodiques sont des aides à l'intonation,
simplifiées. »

Changer la région relance le chargement de l'office affiché. Tout autre réglage
prend effet immédiatement, sans rechargement.

## Feuille « Psalmodie » (bas)

Contenu : titre `Ton II — Ré, teneur Fa`, sous-titre en noms français
(`do–ré–fa · teneur fa · fa–mi–ré–do–ré`), portée SVG, puis les champs **Ton**,
**Instrument**, **Hauteur** (−5 à +5 demi-tons) et le bouton **« Écouter le
ton »** / **« Arrêter »**.

Détails :

- La feuille se remplit **avant** de s'ouvrir (l'écouteur de rendu est enregistré
  avant celui de la coquille).
- Changer de ton redessine la feuille ; changer d'instrument ou de hauteur agit
  à la prochaine écoute.
- Le bouton retrouve son libellé « Écouter le ton » à la fin naturelle comme à
  l'arrêt manuel (rappel `surFin`).
- Sans WebAudio disponible : message « Le son n'est pas disponible sur cet
  appareil. »

## Gestes transversaux

| Geste | Effet |
| --- | --- |
| Glissé vers l'extérieur sur un tiroir (> 70 px) | Ferme le tiroir |
| Glissé vers le bas sur la feuille (> 70 px, dominante verticale) | Ferme la feuille |
| Clic sur le voile | Ferme le panneau ouvert |
| Touche Échap | Ferme le panneau ouvert |
| Pincement à deux doigts sur le texte | Ajuste la taille entre 0,80 et 2,20 ; la valeur est persistée au relâchement |

Quand « Zoom à deux doigts » est désactivé, `touch-action` repasse à `auto` et le
pincement natif du navigateur reprend la main.

## Messages brefs

Zone unique en bas d'écran (`role="status"`), 2,6 s par défaut :

| Situation | Message |
| --- | --- |
| Téléchargement terminé | « N textes téléchargés. » ou « Tout était déjà en réserve. » |
| Téléchargement sans réseau | « Aucune connexion pour le moment. » |
| Téléchargement sans contenu choisi | « Choisissez d'abord un contenu à conserver. » |
| Réseau mesuré, lancement manuel | « Réseau mesuré : téléchargement lancé quand même. » |
| Purge effectuée | « Réserve locale vidée. » |
| Nouvelle version installée | « Nouvelle version installée — elle s'appliquera à la prochaine ouverture. » (4 s) |
