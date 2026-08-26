# 03 — Flux

## Démarrage de l'application

```mermaid
sequenceDiagram
    autonumber
    participant N as Navigateur
    participant M as main.js
    participant C as ui/coquille.js
    participant S as core/store.js
    participant D as data/aelf.js
    participant SW as pwa/enregistrement.js

    N->>M: exécution du module
    M->>M: lireAdresse() → #/office/date/section
    Note over M: adresse absente ⇒ officeDuMoment()<br/>selon l'heure locale
    M->>S: Object.assign(store.vue, adresse)
    M->>C: initPsalmodie, initCoquille, initLecture, initTiroir*
    C->>C: appliquerTheme() · appliquerTaille() · appliquerTouchAction()
    M->>M: ecrireAdresse({remplacer:true})
    M->>M: rendreTiroirParametres() · rendreTiroirJour(null)
    M->>D: charger()
    D-->>M: {donnees, source}
    M->>M: entretien() (requestIdleCallback, délai max 4 s)
    M->>SW: enregistrerServiceWorker()
    Note over SW: production seulement —<br/>en dev le cache gênerait le rechargement à chaud
```

## Lecture d'un office — cache d'abord

```mermaid
sequenceDiagram
    autonumber
    participant U as Personne
    participant M as main.js
    participant A as data/aelf.js
    participant K as data/cache.js
    participant SW as Service worker
    participant API as api.aelf.org
    participant X as data/sections.js
    participant L as ui/liturgie.js

    U->>M: choisit « Vêpres »
    M->>L: rendreChargement() (squelette)
    M->>A: chargerOffice('vepres', date, region)
    A->>K: lireCache(office, date, region)

    alt Texte en réserve
        K-->>A: {donnees, enregistreLe}
        A-->>M: {donnees, source:'cache'}
    else Réserve vide
        K-->>A: null
        A->>SW: fetch /v1/vepres/{date}/{zone}
        SW->>API: requête réseau
        API-->>SW: 200 JSON
        SW->>SW: cache aelf-textes-v1.put()
        SW-->>A: réponse
        A->>K: ecrireCache(...)
        A-->>M: {donnees, source:'reseau'}
    end

    M->>X: decouper(office, donnees)
    X-->>M: Section[]
    M->>L: rendreOnglets() puis rendreSection()
    M->>M: appliquerCouleurLiturgique() (couleur du jour)
```

Le délai réseau est de 12 s (`AbortController`). Toute erreur — abandon, statut
non-2xx, hôte injoignable — est convertie en `ErreurReseau`, avec l'indicateur
`horsLigne` positionné quand `navigator.onLine` est faux.

## Cas particulier : l'entrée « Bible »

```mermaid
flowchart LR
    B["chargerOffice('bible')"] --> V{"office.virtuel ?"}
    V -->|oui| CB["chargerBible()"]
    CB --> P["Promise.allSettled"]
    P --> M1["chargerOffice('messe')"]
    P --> M2["chargerOffice('lectures')"]
    M1 & M2 --> J["{ bible: { messes, lectures } }"]
    J --> S["sectionsBible()<br/>péricopes bibliques du jour"]
    P -.->|"les deux rejetées"| E["propage l'erreur de la messe"]
```

L'AELF n'expose pas de point d'accès « Bible » : la vue est composée des
lectures bibliques de la messe (hors séquence) et de la lecture de l'office des
lectures. Si une seule des deux sources répond, la vue s'affiche quand même.

## Préchargement (téléchargement à l'avance)

```mermaid
sequenceDiagram
    autonumber
    participant M as main.js
    participant A as data/aelf.js
    participant K as data/cache.js
    participant API as api.aelf.org
    participant P as ui/drawer-parametres.js

    M->>A: precharger({depuis, jours, region, contenu, surProgres})
    A->>A: officesAPrecharger(contenu) × (jours + 1) dates
    loop chaque couple (office, date)
        A->>A: navigator.onLine ? sinon arrêt net
        A->>K: estEnCache(office, date, region)
        alt absent
            A->>API: GET /v1/{office}/{date}/{zone}
            API-->>A: JSON (échec ⇒ on passe au suivant)
            A->>K: ecrireCache(...)
        end
        A-->>P: surProgres(fraction, ajoutes)
        P->>P: majProgres() (barre du tiroir)
    end
    A-->>M: {ajoutes, total}
    M->>M: message() + redessin des pastilles
```

Deux déclencheurs :

| Déclencheur | Respecte « WiFi uniquement » | Point de départ |
| --- | --- | --- |
| Entretien au démarrage (`entretien()`) | **Oui** — `reseauAutorise()` bloque sinon | Aujourd'hui |
| Bouton « Lancer » du tiroir | Non — geste explicite, un message avertit simplement | Date affichée |

`reseauAutorise()` : hors ligne ⇒ non ; réglage inactif ⇒ oui ; `saveData` ⇒
non ; `connection.type` connu ⇒ `wifi`/`ethernet` seulement ; sinon repli sur
`effectiveType === '4g'`.

## Hors connexion

```mermaid
sequenceDiagram
    autonumber
    participant U as Personne
    participant SW as Service worker
    participant CA as Cache API
    participant M as main.js
    participant K as IndexedDB

    U->>SW: ouverture de l'application (sans réseau)
    SW->>SW: requête de navigation ⇒ fetch échoue
    SW->>CA: match('/index.html') puis match('/')
    CA-->>U: coquille servie
    U->>M: démarrage normal
    M->>K: lireCache(office, date, region)
    alt texte présent
        K-->>M: affichage, bandeau « lu depuis la réserve locale »
    else absent
        M->>U: écran « Texte indisponible hors connexion »<br/>+ bouton Réessayer
    end
```

Au retour du réseau (`window.online`), `main.js` relance `charger({forcerReseau:
true})` si le dernier chargement avait échoué, sinon il se contente de
redessiner la section pour retirer le bandeau.

## Mise à jour de l'application

```mermaid
stateDiagram-v2
    [*] --> Aucun: première visite
    Aucun --> Installation: register('/sw.js')
    Installation --> Actif: addAll(PRECACHE) + skipWaiting
    Actif --> NouvelleVersion: déploiement d'un nouveau build
    NouvelleVersion --> Installe: updatefound + state='installed'
    Installe --> Signale: message « Nouvelle version installée »
    Signale --> Actif: prochaine ouverture (activate supprime coquille-*)
```

Le nom du cache de coquille contient l'horodatage du build (`coquille-<BUILD_ID>`) :
un nouveau build crée donc un nouveau cache, et `activate` supprime les
précédents. Le cache des textes (`aelf-textes-v1`) survit aux déploiements.
