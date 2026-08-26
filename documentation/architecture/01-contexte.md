# 01 — Contexte et conteneurs

## Contexte système

```mermaid
flowchart LR
    orant["Personne qui prie<br/>(mobile, tablette, ordinateur)"]

    subgraph systeme["Offices &amp; Psalmodie (PWA)"]
        app["Application monopage<br/>installable"]
    end

    aelf[("API AELF<br/>api.aelf.org/v1<br/>textes liturgiques")]
    heberg[["Hébergement statique<br/>(fichiers de docs/)"]]

    orant -->|"lit un office,<br/>écoute un ton"| app
    app -->|"HTTPS GET, JSON, CORS ouvert"| aelf
    heberg -.->|"sert index.html, JS, CSS,<br/>manifeste, sw.js"| app

    classDef ext fill:#f3efe6,stroke:#c6b99f,color:#241f18
    class aelf,heberg ext
```

Aucun compte, aucune authentification, aucune télémétrie : le seul appel sortant
est la lecture des textes chez l'AELF. Les préférences et les textes conservés
restent dans le navigateur de la personne.

## Conteneurs d'exécution

```mermaid
flowchart TB
    subgraph navigateur["Navigateur"]
        subgraph fenetre["Contexte de la page"]
            ui["Interface<br/>src/ui/*"]
            noyau["Noyau applicatif<br/>src/main.js, src/core/store.js"]
            donnees["Accès aux données<br/>src/data/*"]
            audio["Synthèse psalmodique<br/>src/audio/*"]
        end

        sw["Service worker<br/>public/sw.js<br/>(contexte séparé)"]

        idb[("IndexedDB<br/>offices-textes")]
        cacheapi[("Cache API<br/>coquille-BUILD_ID<br/>aelf-textes-v1")]
        ls[("localStorage<br/>offices.parametres.v1")]
    end

    aelf[("API AELF")]

    ui --> noyau
    noyau --> donnees
    ui --> audio
    donnees --> idb
    noyau --> ls
    donnees -->|fetch| sw
    sw --> cacheapi
    sw -->|réseau| aelf

    classDef stock fill:#f0e5cd,stroke:#8a6a2f,color:#241f18
    class idb,cacheapi,ls stock
```

Le service worker s'interpose sur **toutes** les requêtes de la page une fois
actif : les appels de `data/aelf.js` passent donc par lui, ce qui ajoute un
second filet de sécurité hors connexion (voir [04 — Stockage](04-stockage.md)).

## Vue de déploiement

```mermaid
flowchart LR
    dev["Poste de développement"] -->|"npm run build"| dist["docs/<br/>index.html · assets/*.hachés<br/>sw.js · manifest · icônes"]
    dist -->|"copie"| cdn[["Hébergement statique HTTPS<br/>(racine du domaine)"]]
    cdn --> nav["Navigateur"]
    nav -->|"install PWA"| ecran["Icône sur l'écran d'accueil"]
```

Contraintes de déploiement :

- **HTTPS obligatoire** (ou `localhost`) : sans lui, ni service worker ni
  installation PWA.
- **Servi à la racine** du domaine : `start_url`, `scope` et l'enregistrement du
  service worker valent `/`. Un déploiement en sous-répertoire demanderait
  d'ajuster `manifest.webmanifest`, `enregistrerServiceWorker()` et `base` dans
  `vite.config.js`.
- **Aucune configuration serveur** : pas de réécriture d'URL nécessaire, la
  navigation interne se fait dans le fragment (`#/…`).

## Chaîne de construction

```mermaid
flowchart LR
    src["src/ + index.html"] -->|"Vite (rollup)"| bundle["assets/index-HASH.js<br/>assets/index-HASH.css"]
    pub["public/*<br/>(sw.js, manifeste, icônes)"] -->|"copie telle quelle"| dist2["docs/"]
    bundle --> dist2
    dist2 -->|"plugin sw-precache-manifest<br/>(closeBundle)"| swfinal["docs/sw.js<br/>PRECACHE = liste réelle<br/>VERSION = horodatage"]
```

Le plugin `serviceWorkerManifest()` de `vite.config.js` lit l'arborescence de
`docs/` après l'écriture du bundle, en retire `sw.js` et les fichiers `.map` /
`.txt`, puis remplace dans `sw.js` les deux marqueurs `'__PRECACHE_MANIFEST__'`
et `__BUILD_ID__`. En développement les marqueurs restent en place : la liste est
inerte et le service worker n'est de toute façon pas enregistré.
