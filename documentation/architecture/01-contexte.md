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
    dist -->|"copie"| cdn[["Hébergement statique HTTPS<br/>(racine ou sous-chemin)"]]
    cdn --> nav["Navigateur"]
    nav -->|"install PWA"| ecran["Icône sur l'écran d'accueil"]
```

Contraintes de déploiement :

- **HTTPS obligatoire** (ou `localhost`) : sans lui, ni service worker ni
  installation PWA.
- **Indifférent au préfixe d'URL** : `base: './'` et des références relatives
  partout (`%BASE_URL%` dans la coquille, `start_url`/`scope` relatifs dans le
  manifeste, service worker enregistré sur `${import.meta.env.BASE_URL}sw.js`,
  précache en `./…`). Le même build sert à la racine d'un domaine comme sous
  `<compte>.github.io/<dépôt>/`.
- **Aucune configuration serveur** : pas de réécriture d'URL nécessaire, la
  navigation interne se fait dans le fragment (`#/…`). C'est aussi ce qui rend
  GitHub Pages suffisant : Pages ne sait pas faire de repli SPA.
- **Jekyll désactivé** par le marqueur `docs/.nojekyll`, sans quoi Pages
  écarterait les fichiers commençant par `_`.

Une réplique locale de cet hébergement est fournie (`Dockerfile` +
`docker/pages*.conf`) : nginx y sert `docs/` avec les mêmes règles que Pages, à
la racine sur le port 8080 et sous `/<dépôt>/` sur le port 8081, afin de
vérifier les deux modes de publication avant mise en ligne.

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
