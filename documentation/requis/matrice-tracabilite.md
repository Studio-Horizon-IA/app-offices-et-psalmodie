# Matrice de traçabilité

Du croquis à l'exigence, de l'exigence au code, du code à sa vérification.

Les renvois pointent vers un **module et une fonction** plutôt que vers un
numéro de ligne, afin de rester justes après remaniement.

## Méthodes de vérification

| Code | Méthode |
| --- | --- |
| **I** | Inspection du code |
| **D** | Démonstration : parcours réel dans un navigateur (Chromium 150 piloté en CDP, gabarit mobile 430 × 932) |
| **M** | Mesure : sortie du build, taille des fichiers, journal réseau |
| **A** | Analyse : raisonnement sur la conception, sans exécution dédiée |

## Du croquis aux exigences

### Croquis d'ensemble

| Élément du croquis | Exigences |
| --- | --- |
| `OFFICES & PSALMODIE` (titre) | EF-PWA-01, EF-PWA-03 |
| `☰ TITRE JOUR ♪ ⋮` | EF-NAV-01, EF-PARAM-01, EF-PSAL-06 |
| `SCT 1 SCT 2 SCT 3 … (slide G/D)` | EF-LIT-04, EF-LIT-06 |
| `[LITURGIE]` | EF-LIT-01, EF-LIT-07 |
| `☰ Jour`, `xᵉ sem du temps ordinaire`, `Saint(e)(s) du jour` | EF-NAV-02, EF-NAV-01 |
| `> Messe`, `> Bible` | EF-LIT-02, EF-LIT-03 |
| `> Lectures … > Complies` | EF-LIT-01, EF-NAV-07 |
| `Lectures > [Région]` | EF-PARAM-02, EF-PARAM-03 |
| `Ton > [Ton]` · `Instru [Piano]` | EF-PSAL-01, EF-PSAL-02 |
| Esquisse de notation (haut de la feuille) | EF-PSAL-04 |
| `Affichage > [Mode Nuit]` (on/off) | EF-PARAM-04, EF-PARAM-05 |
| `[Taille du texte]` (*slider*) | EF-PARAM-06 |
| `[Zoom à 2 doigts]` (on/off) | EF-PARAM-07, EF-PARAM-08 |
| `Mode hors connexion > [Messe + Offices]` | EF-OFF-01, EF-OFF-02 |
| `[Télécharger à l'avance]` | EF-OFF-03, EF-OFF-08 |
| `[Conserver les textes pendant …]` | EF-OFF-05 |
| `[WiFi Uniquement]` | EF-OFF-06 |
| `[Purger le cache]` | EF-OFF-07, EF-OFF-09 |

### Croquis « psalmodie »

| Élément du croquis | Exigences |
| --- | --- |
| `Psaume 142` + antienne, verset `1 --- entends … * †` | EF-PSAL-09 (le pointage réel de l'AELF, repris tel quel) |
| `faire suivre les notes (de musique) avec les syllabes` | EF-PSAL-10 |
| `respecte la notation (—, †, *)` | EF-PSAL-09 — `—` récitation, `†`/`+` flexe, `*` médiante |
| `Ajouter "piton" "play"` | EF-PSAL-11, EF-PSAL-12 |
| `APPLIQUER À CHAQUES PARTIES DE CHAQUES OFFICE` | EF-PSAL-14 |
| `But : applis qui apprend aux néophytes la psalmodie` | EF-PSAL-13 (allure), ENF-UX-01 |

## Exigences fonctionnelles → code → vérification

| Exigence | Réalisation | Vérif. |
| --- | --- | --- |
| EF-LIT-01 | `data/offices.js › OFFICES` · `data/aelf.js › chargerOffice` · `data/sections.js › sectionsOffice` | D — laudes, vêpres, complies affichées |
| EF-LIT-02 | `data/sections.js › sectionsMesse` | D — onglets « 1ʳᵉ lecture / Psaume / Évangile » |
| EF-LIT-03 | `data/aelf.js › chargerBible` · `data/sections.js › sectionsBible` | D — onglets « 1ʳᵉ lecture / Psaume / Évangile / Lectures » |
| EF-LIT-04 | `data/sections.js › decouper` · `ui/liturgie.js › rendreOnglets` | D |
| EF-LIT-05 | `sectionsOffice` — section ignorée si aucun bloc | D — Tierce sans cantique ni intercession |
| EF-LIT-06 | `ui/liturgie.js › brancherBalayage`, écouteur `keydown` | D (onglets, flèches) · A (balayage tactile, seuils inspectés) |
| EF-LIT-07 | `styles/liturgie.css` — classes par `genre` | D |
| EF-LIT-08 | `styles/liturgie.css › .bloc-corps u` | D — accents visibles dans le psaume 23 |
| EF-LIT-09 | `styles/liturgie.css › .verse_number` | I |
| EF-LIT-10 | `data/sections.js › NOTRE_PERE` | I |
| EF-NAV-01 | `main.js › majTitre` | D |
| EF-NAV-02 | `ui/drawer-jour.js › rendreTiroirJour` | D |
| EF-NAV-03 | `ui/drawer-jour.js › enteteJour` · `main.js › choisirDate` | D (précédent/suivant) · I (`showPicker`) |
| EF-NAV-04 | `data/offices.js › officeDuMoment` | D — ouverture sans fragment ⇒ `#/complies/…` à 20 h passées |
| EF-NAV-05 | `main.js › lireAdresse / ecrireAdresse` | D — adresse mise à jour au changement d'office et de section |
| EF-NAV-06 | `ui/drawer-jour.js › marquerDisponibles` · `data/cache.js › estEnCache` | D — pastilles vertes après préchargement |
| EF-NAV-07 | `data/offices.js › OFFICES.heure` | D |
| EF-NAV-08 | `public/manifest.webmanifest › shortcuts` | I |
| EF-NAV-09 | `data/psautier.js › semainePsautier` · `ui/drawer-jour.js` · `ui/liturgie.js` | D — « Psautier I » le 25 août, « Psaumes propres » le 8 septembre, rien le 5 janvier |
| EF-PARAM-01 | `ui/drawer-parametres.js › rendreTiroirParametres` | D |
| EF-PARAM-02 | `data/offices.js › REGIONS` | D |
| EF-PARAM-03 | `main.js › initTiroirParametres({rafraichir})` | I |
| EF-PARAM-04 | `ui/coquille.js › appliquerTheme` | D — bascule effective |
| EF-PARAM-05 | `core/store.js › nuit: null` + `preferenceSysteme` | I |
| EF-PARAM-06 | `ui/drawer-parametres.js` (curseur) · `ui/coquille.js › appliquerTaille` | D |
| EF-PARAM-07 | `ui/coquille.js › initZoomDeuxDoigts` | I — événements tactiles non simulables ici |
| EF-PARAM-08 | `ui/coquille.js › appliquerTouchAction` | I |
| EF-PARAM-09 | `core/store.js › reglerParametre` | D — réglages retrouvés après rechargement |
| EF-PARAM-10 | Pied du tiroir « Paramètres » | D |
| EF-PSAL-01 | `audio/tons.js › TONS` | D — sélection du Ton VII |
| EF-PSAL-02 | `audio/synthese.js › INSTRUMENTS` | I |
| EF-PSAL-03 | `audio/synthese.js › jouerTon` | I — sortie audio non capturable sans périphérique |
| EF-PSAL-04 | `ui/psalmodie.js › portee` | D — portée rendue, centrée sur l'ambitus |
| EF-PSAL-05 | `audio/tons.js › frequence` + curseur « Hauteur » | I |
| EF-PSAL-06 | `index.html › #btn-psalmodie` · `ui/chant-psaume.js › monterPsalmodie` | D — barre « Chanter » et bouton de ton sous chaque psaume |
| EF-PSAL-07 | `audio/synthese.js › arreter`, rappel `surFin` | I |
| EF-PSAL-09 | `data/pointage.js › pointerPsaume` · `ui/chant-psaume.js › rendreLigne` | D — Ps 142 : flexe / médiante / finale conformes au texte AELF |
| EF-PSAL-10 | `audio/chant.js › planVerset` · `.syl[data-note]::before` | D — « Sei(do) gneur(ré) en(fa) … coute(fa) mes(mi) ap(ré) pels(fa) » |
| EF-PSAL-11 | `ui/chant-psaume.js › lancer/suivre` · `audio/synthese.js › jouerSequence` | D — surlignage successif « tends » → « ère » → « ta » |
| EF-PSAL-12 | `ui/chant-psaume.js › rendreVerset` | I |
| EF-PSAL-13 | `core/store.js › allureChant` | I |
| EF-PSAL-14 | `data/sections.js › psalmodiable` | D — 12 parties, 12 pointées, 0 repli |
| EF-PSAL-15 | `ui/chant-psaume.js` (comparaison hors blancs) | D — le psaume de la messe a d'abord été refusé, puis accepté après correction |
| EF-PSAL-16 | `core/store.js › tonCourant / reglerTonCourant` | D — choix du ton VIII aux vêpres : `tonsParOffice = {"vepres":"VIII"}` persisté |
| EF-PSAL-17 | `ui/psalmodie.js › noteDUsage` | D — dépliant « Comment se choisit le ton ? » |
| EF-PSAL-18 | `ui/bandeau-partition.js` · `ui/portee.js › rendrePortee` | D — bandeau présent avec 17 têtes sur la portée du ton II |
| EF-PSAL-19 | `ui/portee.js › eclairer` · `audio/chant.js` (champ `position`) | D — « ta » sur « fa », deux têtes de teneur allumées |
| EF-PSAL-20 | `ui/chant-psaume.js › poserNote` · `--degre-min` / `--pas-degre` | D — ambitus du psaume 142 : `--degre-min = -3`, hauteur 3 degrés |
| EF-OFF-01 | `data/cache.js` · `data/aelf.js › chargerOffice` | D — réseau coupé, office lu depuis la réserve |
| EF-OFF-02 | `data/aelf.js › officesAPrecharger` | I |
| EF-OFF-03 | `data/aelf.js › precharger` · bouton « Lancer » | D |
| EF-OFF-04 | `main.js › entretien` | D — journal réseau : 8 offices préchargés au démarrage |
| EF-OFF-05 | `data/cache.js › purgerExpires` | I |
| EF-OFF-06 | `data/aelf.js › reseauAutorise` | I |
| EF-OFF-07 | `data/cache.js › viderCache` · `main.js › purgerCache` | I |
| EF-OFF-08 | `ui/drawer-parametres.js › majProgres` | I |
| EF-OFF-09 | `data/cache.js › statistiquesCache` | D — « N textes en réserve » |
| EF-OFF-10 | `main.js › charger` (branche `horsLigne`) | D |
| EF-OFF-11 | Séparation des caches (`viderCache` ne touche que `aelf-*`) | I |
| EF-PWA-01 | `public/manifest.webmanifest` | I |
| EF-PWA-02 | `public/sw.js` (précache + navigation) | D — rechargement hors ligne réussi |
| EF-PWA-03 | `public/icons/*` | I |
| EF-PWA-04 | `index.html` + `ui/coquille.js › appliquerTheme` | I |
| EF-PWA-05 | `pwa/enregistrement.js` (`updatefound`) | I |
| EF-ERR-01 | `main.js › charger` (catch) | D — écran « Texte indisponible » lors d'un échec réel |
| EF-ERR-02 | `ui/liturgie.js › rendreErreur` | D |
| EF-ERR-03 | Écouteur `online` de `main.js` | I |
| EF-ERR-04 | `ui/liturgie.js › rendreSection` (section absente) | I |
| EF-ERR-05 | `main.js › jeton` | I |
| EF-ERR-06 | `data/cache.js › ouvrir` (garde-fou, `horsService`) | D — Chromium sans profil : IndexedDB muette, lecture en ligne poursuivie |

## Exigences non fonctionnelles → vérification

| Exigence | Vérif. | Élément probant |
| --- | --- | --- |
| ENF-PERF-01/02/05 | M | Sortie de build : 38,08 ko JS · 13,61 ko CSS · 10 fichiers précachés |
| ENF-PERF-03 | M | `package.json` sans `dependencies` |
| ENF-PERF-04 | D | Second affichage d'un office : aucune requête dans le journal réseau |
| ENF-PERF-08 | I | `data/aelf.js › DELAI = 12000` |
| ENF-DISPO-01 | D | Réseau coupé (`emulateNetworkConditions`) puis rechargement : application fonctionnelle |
| ENF-DISPO-02 | D | Sonde dédiée : `indexedDB.open` sans réponse ⇒ garde-fou, lecture en ligne |
| ENF-DISPO-06 | I | `chargerBible › Promise.allSettled` |
| ENF-SEC-01/02 | I | `util/sanitize.js` : reconstruction par liste blanche, aucun `innerHTML` sur contenu distant |
| ENF-SEC-03/04 | I | Journal réseau : `api.aelf.org` comme seule destination |
| ENF-A11Y-02 | D | `#liturgie-inner[aria-labelledby]` suit l'onglet actif |
| ENF-A11Y-11 | A | Palette conçue pour AA, non mesurée |
| ENF-COMPAT-01 | D/A | Chromium 150 vérifié ; Safari et Firefox par analyse des API utilisées |
| ENF-COMPAT-03 | I | Détections avant usage dans `drawer-jour.js`, `main.js`, `aelf.js`, `cache.js`, `synthese.js` |
| ENF-I18N-03 | I | `util/date.js › iso()` construit la date locale |
| ENF-MAINT-05 | M | Journal de build : « sw.js — 10 fichiers précachés » |

## Défauts trouvés en vérification et corrigés

| Défaut | Exigence concernée | Correctif |
| --- | --- | --- |
| `transaction()` renvoyait l'objet `IDBRequest` pour une clé absente : tout premier chargement échouait sur cache vide | EF-OFF-01, EF-ERR-06 | Test `resultat instanceof IDBRequest` ; `lireCache` valide `entree.donnees` |
| `indexedDB.open` sans réponse laissait l'application bloquée sur le squelette | ENF-DISPO-02 | Garde-fou de 3 s et `horsService` pour la session |
| Ouvrir puis refermer un panneau dans la même frame laissait le tiroir ouvert | EF-NAV-02, ENF-DISPO-07 | Mémorisation et annulation de la frame d'ouverture |

## Couverture

| Ensemble | Réalisé | Partiel | Non réalisé |
| --- | --- | --- | --- |
| Exigences fonctionnelles (71) | 69 | 1 (EF-LIT-03) | 1 (EF-PSAL-08, *won't*) |
| Exigences non fonctionnelles (64) | 59 | 2 (ENF-A11Y-11, ENF-COMPAT-01) | 3 (ENF-I18N-04, ENF-MAINT-07, ENF-EXPL-06, tous *won't*) |

Restes à traiter pour une mise en service : mesure effective des contrastes
(ENF-A11Y-11), essais sur appareils Safari et Firefox (ENF-COMPAT-01), et
décision sur un harnais de tests automatisés (ENF-MAINT-07).
