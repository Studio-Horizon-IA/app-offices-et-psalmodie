# 05 — États de l'interface et navigation

## État applicatif

L'état vit en un seul endroit, `core/store.js`, et se divise en trois :

```mermaid
flowchart TB
    S["store"]
    P["store.parametres<br/>region · ton · instrument<br/>nuit · tailleTexte · zoomDeuxDoigts<br/>contenuHorsLigne · prechargerJours<br/>conserverJours · wifiSeulement"]
    V["store.vue<br/>office · date · section"]
    J["store.jour · store.source<br/>réponse AELF courante"]
    E["store.chargement · store.erreur · store.horsLigne<br/>état transitoire"]

    S --> P
    S --> V
    S --> J
    S --> E

    P -.->|"persisté"| LS[("localStorage")]
    V -.->|"reflété"| URL["adresse #/office/date/section"]
    J -.->|"rechargé"| API["data/aelf.js"]
```

`sections` (le résultat de `decouper()`) n'est **pas** dans le store : c'est une
valeur dérivée, détenue par `main.js` et recalculée à chaque chargement.

Deux fonctions de mutation, deux notifications :

| Fonction | Effet | Raison notifiée |
| --- | --- | --- |
| `reglerParametre(champs)` | Fusionne, persiste, notifie | `'parametres'` |
| `reglerVue(champs)` | Fusionne, notifie | `'vue'` |

## Cycle de vie de la vue de lecture

```mermaid
stateDiagram-v2
    [*] --> Chargement: charger()
    Chargement --> Affiche: réponse (cache ou réseau)
    Chargement --> Erreur: ErreurReseau
    Erreur --> Chargement: « Réessayer » / retour du réseau
    Affiche --> Affiche: changerSection() (onglet, balayage, ←/→)
    Affiche --> Chargement: choisirOffice() / choisirDate() / changement de région
    Affiche --> VideSection: office sans section exploitable

    note right of Chargement
        jeton = ++compteur.
        Une réponse dont le jeton
        n'est plus courant est ignorée :
        aucun écrasement par une
        requête lente abandonnée.
    end note
```

L'écran d'erreur distingue deux causes, parce que le remède diffère :

| Condition | Titre | Conseil donné |
| --- | --- | --- |
| `erreur.horsLigne` ou `!navigator.onLine` | Texte indisponible hors connexion | Se reconnecter, ou activer le téléchargement à l'avance |
| Sinon | Texte indisponible | L'AELF n'a pas répondu, réessayer |

## Panneaux : un seul ouvert à la fois

```mermaid
stateDiagram-v2
    [*] --> Ferme
    Ferme --> Jour: ☰ / clic sur le titre
    Ferme --> Parametres: ⋮
    Ferme --> Psalmodie: ♪ / « Donner le ton »
    Jour --> Ferme: choix d'un office · voile · Échap · glissé ←
    Parametres --> Ferme: voile · Échap · glissé →
    Psalmodie --> Ferme: voile · Échap · glissé ↓
    Jour --> Parametres: ⋮ (fermeture avec garderScrim)
    Parametres --> Jour: ☰
    Psalmodie --> Jour: ☰
```

`ouvrirPanneau()` retarde d'une frame l'ajout de la classe `is-open` pour que la
transition parte de l'état fermé. Cette frame est mémorisée dans `panneau.frame`
et **annulée** par `fermerPanneau()` : sans cela, ouvrir puis refermer dans la
même frame — choisir un office aussitôt après avoir ouvert le tiroir — laissait
le tiroir ouvert alors que l'état interne le croyait fermé.

Le passage direct d'un panneau à l'autre utilise `fermerPanneau({garderScrim:
true})` afin que le voile ne clignote pas.

## Navigation par adresse

Format : `#/{office}/{AAAA-MM-JJ}/{section}` — par exemple
`#/vepres/2026-08-25/3`.

```mermaid
flowchart LR
    A["Action utilisateur"] --> B{"nature"}
    B -->|"changement de section"| C["reglerVue + ecrireAdresse<br/>(pushState)"]
    C --> D["rendu local, aucun chargement"]
    B -->|"office ou date"| E["reglerVue + ecrireAdresse<br/>+ charger()"]
    F["hashchange<br/>(retour arrière, lien, raccourci)"] --> G{"même office et même date ?"}
    G -->|oui| D
    G -->|non| E
```

Règles de lecture (`lireAdresse()`), tolérantes par construction :

| Élément absent ou invalide | Valeur retenue |
| --- | --- |
| Office | `officeDuMoment()` selon l'heure locale |
| Date | Aujourd'hui (date **locale**, jamais UTC) |
| Section | `0` |

Les raccourcis du manifeste (`./#/laudes`, `./#/vepres`, `./#/complies`,
`./#/messe`) exploitent cette tolérance : ils ne donnent que l'office, la date et
la section sont déduites.

## Thème et couleur liturgique

```mermaid
flowchart LR
    S["parametres.nuit"] --> T{"valeur"}
    T -->|null| SYS["prefers-color-scheme"]
    T -->|true / false| CHOIX["choix explicite"]
    SYS & CHOIX --> D["data-theme = 'nuit' | 'jour'"]
    D --> C["appliquerCouleurLiturgique()"]
    J["store.jour.informations.couleur<br/>(vert, blanc, rouge, violet, rose, noir)"] --> C
    C --> V["--liturgique<br/>(table COULEURS ou COULEURS_NUIT)"]
    V --> UI["accents : onglet actif, étiquettes,<br/>antiennes, curseurs, syllabes accentuées"]
```

La couleur du jour vient de la réponse AELF ; en mode nuit une table éclaircie
prend le relais pour rester lisible sur fond sombre. En l'absence de couleur
connue, l'accent revient à l'or par défaut.
