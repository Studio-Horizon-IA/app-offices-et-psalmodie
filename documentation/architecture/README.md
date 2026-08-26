# Architecture — Offices & Psalmodie

Documentation d'architecture de l'application, dérivée du code de `src/`,
`public/` et `vite.config.js` (version : première implémentation, août 2026).

| Document | Contenu |
| --- | --- |
| [01 — Contexte et conteneurs](01-contexte.md) | Périmètre du système, acteurs, conteneurs d'exécution, déploiement |
| [02 — Modules](02-modules.md) | Carte des modules `src/`, dépendances et règles de couches |
| [03 — Flux](03-flux.md) | Séquences : démarrage, lecture d'un office, préchargement, hors connexion, mise à jour |
| [04 — Stockage et caches](04-stockage.md) | Les trois stockages du navigateur, clés, durées de vie, purge |
| [05 — États de l'interface](05-etats.md) | États de la vue de lecture, cycle des panneaux, navigation par adresse |

Documents liés : [fondations liturgiques](../fondations/README.md) ·
[spécifications](../specs/README.md) · [exigences](../requis/README.md).

## Le système en une phrase

Une application monopage sans serveur applicatif : le navigateur interroge
directement l'API publique de l'AELF, conserve les textes obtenus dans
IndexedDB, et un service worker garde la coquille afin que l'ensemble reste
lisible sans réseau.

## Décisions structurantes

| # | Décision | Motif | Conséquence |
| --- | --- | --- | --- |
| D1 | **Aucun serveur applicatif** ; appel direct de `api.aelf.org` depuis le navigateur | L'API est publique, ouverte en CORS, sans clé | Hébergement statique ; aucune donnée utilisateur ne quitte l'appareil |
| D2 | **Aucune bibliothèque d'exécution** (rendu, portée, son écrits à la main) | Poids et durée de vie : un office se lit hors connexion, la charge doit rester minimale | ~38 ko de JS minifié, 14 ko gzip ; pas de mises à jour de dépendances subies |
| D3 | **Cache d'abord** pour les textes | Les textes d'un jour donné sont immuables | Affichage instantané en relecture, fonctionnement hors connexion naturel |
| D4 | **Deux caches séparés** : Cache API (coquille) et IndexedDB (textes) | Les réglages « hors connexion » doivent piloter les textes, pas le code | Purge et durée de conservation ne touchent jamais la coquille |
| D5 | **Service worker écrit à la main**, liste de précache injectée au build | `vite-plugin-pwa` apporterait une configuration et une dépendance pour ~100 lignes | Plugin de 30 lignes dans `vite.config.js` |
| D6 | **HTML de l'API assaini par liste blanche** avant insertion | Le contenu distant est du HTML libre | `util/sanitize.js` reconstruit l'arbre ; aucune injection possible |
| D7 | **État applicatif dans l'adresse** (`#/office/date/section`) | Partage, retour arrière, raccourcis du manifeste | Rechargement d'un lien profond sans serveur |

## Convention des diagrammes

Les diagrammes sont en [Mermaid](https://mermaid.js.org/) dans les fichiers
Markdown : ils se rendent tels quels sur GitHub/GitLab et restent lisibles en
texte brut. Les libellés reprennent les noms réels du code (`chargerOffice`,
`decouper`, `store.vue`…) pour que le diagramme et la source ne divergent pas
en silence.
