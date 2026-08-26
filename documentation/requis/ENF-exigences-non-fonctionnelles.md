# Exigences non fonctionnelles

Conventions d'identifiants, de priorité et de statut : voir le
[README](README.md). Les valeurs mesurées proviennent du build de production et
des essais menés sous Chromium 150 (pilotage CDP, gabarit 430 × 932, DPR 2).

## ENF-PERF — Performance et sobriété

| ID | Exigence | Cible | Prio | Statut |
| --- | --- | --- | --- | --- |
| ENF-PERF-01 | Poids du JavaScript de production | ≤ 60 ko non compressé | M | ✅ 38 ko (14 ko gzip) |
| ENF-PERF-02 | Poids de la feuille de style | ≤ 25 ko | S | ✅ 13,6 ko (3,7 ko gzip) |
| ENF-PERF-03 | Dépendances d'exécution | Aucune | M | ✅ 0 |
| ENF-PERF-04 | Affichage d'un office déjà en réserve | Sans requête réseau | M | ✅ Cache d'abord |
| ENF-PERF-05 | Poids de la coquille précachée | ≤ 150 ko | S | ✅ ≈ 60 ko, 10 fichiers |
| ENF-PERF-06 | Préchargement | Séquentiel, interrompu dès la perte du réseau | M | ✅ |
| ENF-PERF-07 | Rendu pendant le chargement | Squelette immédiat, jamais d'écran blanc | S | ✅ |
| ENF-PERF-08 | Délai maximal d'une requête | 12 s, puis erreur explicite | M | ✅ `AbortController` |
| ENF-PERF-09 | Animation | Respecte `prefers-reduced-motion` | S | ✅ |

## ENF-DISPO — Disponibilité et robustesse

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-DISPO-01 | L'application démarre sans réseau une fois la première visite terminée. | M | ✅ Vérifié réseau coupé |
| ENF-DISPO-02 | La panne d'un stockage (IndexedDB indisponible ou muet) dégrade la fonction sans bloquer l'interface. | M | ✅ Garde-fou 3 s + `horsService` |
| ENF-DISPO-03 | L'échec de `localStorage` (navigation privée) laisse les réglages fonctionner en mémoire. | S | ✅ |
| ENF-DISPO-04 | L'échec d'enregistrement du service worker laisse l'application utilisable en ligne. | S | ✅ |
| ENF-DISPO-05 | L'absence de WebAudio laisse toute la lecture disponible. | S | ✅ |
| ENF-DISPO-06 | Une réponse partielle de l'API (une source sur deux pour la vue Bible) produit tout de même un affichage. | S | ✅ `Promise.allSettled` |
| ENF-DISPO-07 | Aucune opération asynchrone ne peut laisser l'interface bloquée sur un état de chargement. | M | ✅ Tous les chemins aboutissent à un rendu ou une erreur |

## ENF-SEC — Sécurité et vie privée

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-SEC-01 | Le HTML distant n'est jamais inséré sans assainissement par liste blanche. | M | ✅ `util/sanitize.js`, aucun `innerHTML` sur contenu distant |
| ENF-SEC-02 | Aucun script, style, lien ou ressource tierce ne peut provenir des textes reçus. | M | ✅ Balises et attributs filtrés |
| ENF-SEC-03 | Aucune donnée personnelle n'est collectée, stockée ni transmise ; aucune télémétrie. | M | ✅ Seul appel sortant : `api.aelf.org` |
| ENF-SEC-04 | Aucun cookie, aucun identifiant de session, aucun compte. | M | ✅ |
| ENF-SEC-05 | Tout le trafic est en HTTPS. | M | ✅ |
| ENF-SEC-06 | Les données conservées restent locales et sont effaçables par la personne. | M | ✅ « Purger le cache » |
| ENF-SEC-07 | Aucun secret ni clé d'API dans le code livré. | M | ✅ API publique sans authentification |

## ENF-A11Y — Accessibilité

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-A11Y-01 | Toute fonction est atteignable au clavier ; les panneaux se ferment par Échap. | M | ✅ |
| ENF-A11Y-02 | Les onglets suivent le motif ARIA *tabs* : `tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, un seul onglet dans l'ordre de tabulation. | S | ✅ |
| ENF-A11Y-03 | Les boutons sans libellé visible portent un `aria-label`. | M | ✅ |
| ENF-A11Y-04 | Les interrupteurs exposent `role="switch"` et `aria-checked`. | S | ✅ |
| ENF-A11Y-05 | Les changements de contenu et les messages brefs sont annoncés (`aria-live`, `role="status"`). | S | ✅ |
| ENF-A11Y-06 | Le focus reste visible (`:focus-visible` contrasté). | M | ✅ |
| ENF-A11Y-07 | Un lien d'évitement mène directement au texte. | C | ✅ |
| ENF-A11Y-08 | La taille du texte est réglable jusqu'à 220 % sans perte de contenu ni défilement horizontal. | M | ✅ |
| ENF-A11Y-09 | Le zoom natif du navigateur reste possible lorsque le zoom applicatif est désactivé. | S | ✅ |
| ENF-A11Y-10 | La portée psalmodique porte une description textuelle. | C | ✅ `role="img"` + `aria-label` |
| ENF-A11Y-11 | Contrastes conformes AA en thème jour et en thème nuit. | S | 🟡 Palette conçue pour, non mesurée outil en main |
| ENF-A11Y-12 | Zones tactiles d'au moins 44 px. | S | ✅ Boutons de barre 44 px, entrées de liste ≥ 48 px |

## ENF-UX — Ergonomie de lecture

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-UX-01 | Un mode nuit à dominante chaude, pensé pour les offices de nuit. | M | ✅ |
| ENF-UX-02 | La couleur d'accent suit la couleur liturgique du jour. | C | ✅ Table distincte en mode nuit |
| ENF-UX-03 | Typographie à empattements pour les textes liturgiques, sans empattements pour l'interface. | S | ✅ Polices système, aucun téléchargement |
| ENF-UX-04 | Largeur de lecture limitée (≈ 42 rem) pour préserver la longueur de ligne. | S | ✅ |
| ENF-UX-05 | Prise en compte des encoches et zones sûres des appareils. | S | ✅ `env(safe-area-inset-*)` |
| ENF-UX-06 | Aucun défilement horizontal du corps de page. | M | ✅ |
| ENF-UX-07 | Le geste de balayage ne doit pas se déclencher pendant un défilement vertical. | M | ✅ Seuil directionnel `|dx| > |dy| × 1,4` |

## ENF-COMPAT — Compatibilité

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-COMPAT-01 | Navigateurs cibles : Chrome/Edge, Safari, Firefox, versions courantes sur mobile et ordinateur. | M | 🟡 Vérifié sous Chromium 150 ; Safari et Firefox non testés sur appareil |
| ENF-COMPAT-02 | Cible de compilation `es2020`. | S | ✅ |
| ENF-COMPAT-03 | Les API absentes sont détectées avant usage (`showPicker`, `requestIdleCallback`, `navigator.connection`, `navigator.storage`, `AudioContext`). | M | ✅ |
| ENF-COMPAT-04 | Fonctionnement en orientation portrait comme paysage. | S | ✅ Mise en page fluide |
| ENF-COMPAT-05 | Installation possible sans magasin d'applications. | M | ✅ |

## ENF-I18N — Langue et localisation

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-I18N-01 | Interface entièrement en français, orthographe et diacritiques compris. | M | ✅ |
| ENF-I18N-02 | Dates formatées selon `fr-CA`. | S | ✅ |
| ENF-I18N-03 | Les dates sont calculées en heure **locale**, jamais en UTC. | M | ✅ `util/date.js`, aucun `toISOString` |
| ENF-I18N-04 | Interface multilingue. | W | ⛔ Hors périmètre : les textes de l'AELF sont francophones |

## ENF-MAINT — Maintenabilité

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-MAINT-01 | Séparation stricte des couches : `data/` ignore `ui/`, `ui/` n'appelle pas le réseau. | M | ✅ |
| ENF-MAINT-02 | Le code, les commentaires et les identifiants sont en français, cohérents avec l'interface. | S | ✅ |
| ENF-MAINT-03 | Les commentaires expliquent le *pourquoi* des choix non évidents, pas le *quoi*. | S | ✅ |
| ENF-MAINT-04 | La documentation reprend les noms réels du code pour rendre les écarts visibles. | S | ✅ |
| ENF-MAINT-05 | La liste de précache est dérivée du build, jamais maintenue à la main. | M | ✅ Plugin `sw-precache-manifest` |
| ENF-MAINT-06 | Le nommage des caches porte la version du build, pour une invalidation automatique. | M | ✅ |
| ENF-MAINT-07 | Tests automatisés. | W | ⛔ Aucun harnais de test dans cette version ; vérification par pilotage de navigateur, consignée dans [SPEC-05](../specs/SPEC-05-hors-connexion.md#vérifications-effectuées) |

## ENF-EXPL — Exploitation

| ID | Exigence | Prio | Statut |
| --- | --- | --- | --- |
| ENF-EXPL-01 | Hébergement statique, sans serveur applicatif ni base de données. | M | ✅ |
| ENF-EXPL-02 | Servi en HTTPS, à la racine d'un domaine comme sous un sous-chemin. | M | ✅ Base relative, les deux modes vérifiés sur la réplique nginx |
| ENF-EXPL-03 | Aucune configuration serveur particulière (pas de réécriture d'URL). | S | ✅ Navigation dans le fragment |
| ENF-EXPL-04 | Un déploiement invalide la coquille sans toucher aux textes conservés. | M | ✅ Caches séparés |
| ENF-EXPL-05 | Le service worker n'est pas actif en développement. | S | ✅ |
| ENF-EXPL-06 | Journalisation ou supervision côté serveur. | W | ⛔ Sans objet : aucun serveur applicatif |

## Dépendance externe assumée

L'application repose entièrement sur la disponibilité de `api.aelf.org`, service
tiers sans engagement de service contractuel. Les atténuations en place sont le
cache d'abord, le préchargement anticipé et la durée de conservation
paramétrable : une indisponibilité passagère de l'API laisse consultables tous
les textes déjà en réserve.
