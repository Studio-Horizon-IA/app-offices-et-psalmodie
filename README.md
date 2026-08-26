# Offices & Psalmodie

Application web installable (PWA) pour prier la Liturgie des Heures et suivre les
lectures de la messe, avec un rappel sonore des tons psalmodiques et une lecture
possible sans réseau.

Réalisée d'après le croquis `documentation/croquis/PXL_20260825_232044626.jpg`.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produit docs/
npm run preview    # sert docs/ (nécessaire pour tester le service worker)
```

Le service worker n'est **pas** enregistré en développement : testez le mode hors
connexion avec `npm run build && npm run preview`.

Le build sort dans `docs/` (`build.outDir` de `vite.config.js`), dossier que
GitHub Pages sait servir directement. Le fichier vide `docs/.nojekyll` (issu de
`public/.nojekyll`) empêche Pages de faire passer le site par Jekyll, qui
ignorerait les fichiers commençant par `_`.

## Publier : réplique locale de GitHub Pages

`Dockerfile` sert `docs/` avec nginx en reproduisant le comportement de Pages —
site statique, `404.html`, aucun repli SPA, `Cache-Control: max-age=600`,
`Access-Control-Allow-Origin: *`, gzip, `ETag`.

```bash
npm run build
docker build -t offices-pages .
docker run --rm -p 8080:8080 -p 8081:8081 offices-pages
```

| Adresse | Mode Pages reproduit | Résultat |
| --- | --- | --- |
| <http://localhost:8080/> | Page d'utilisateur/organisation (`<compte>.github.io`) ou domaine personnalisé | ✅ L'application fonctionne, service worker compris |
| <http://localhost:8081/> | Page de projet (`<compte>.github.io/<dépôt>/`) | ✅ L'application fonctionne, service worker compris |

Les deux modes fonctionnent parce que **rien n'est référencé de façon absolue** :
`base: './'` dans `vite.config.js`, `%BASE_URL%` dans `index.html`, `start_url`
et `scope` relatifs dans le manifeste, service worker enregistré sur
`${import.meta.env.BASE_URL}sw.js`, et liste de précache en `./…` résolue par
rapport à l'emplacement de `sw.js`. Le port 8081 sert à vérifier ce point avant
chaque publication : un seul chemin absolu qui réapparaît et la page de projet
casse.

`localhost` étant un contexte sécurisé, le service worker et l'installation PWA
fonctionnent sans HTTPS : la réplique ne gère donc pas TLS.

## Ce que fait l'application

| Élément du croquis | Réalisation |
| --- | --- |
| ☰ **Titre du jour** ⋮ | Barre du haut : tiroir gauche (jour et offices), titre liturgique cliquable, note de musique (psalmodie), tiroir droit (paramètres) |
| **SCT 1 · SCT 2 · SCT 3 (slide G/D)** | Onglets de sections de l'office, changés au balayage horizontal, aux flèches ←/→ ou au clic |
| **[LITURGIE]** | Zone de lecture : antiennes, psaumes (syllabes accentuées mises en évidence), hymnes, lectures, oraisons |
| **☰ Jour** | Jour liturgique, fête, navigation de date (précédent / calendrier / suivant), Messe, Bible, puis les sept heures ; une pastille verte signale ce qui est déjà lisible hors connexion |
| **Lectures ▸ Région** | Zone AELF : calendrier romain, France, Canada, Belgique, Luxembourg, Suisse, Afrique |
| **Ton ▸ Instru [Piano]** | Huit tons grégoriens + *tonus peregrinus*, portée de repère, écoute au piano, à l'orgue ou à la voix, transposition |
| **Croquis 2 : apprendre la psalmodie** | Chaque psaume et cantique s'affiche **pointé** — trait de récitation sur la teneur, nom des notes au-dessus des syllabes de cadence, marques `+` (flexe) et `*` (médiante) — avec un bouton **Chanter** par psaume et un ▶ par verset, qui suivent le texte syllabe après syllabe |
| **Repères d'usage** | La semaine du psautier (I à IV, ou « Psaumes propres » aux fêtes) accompagne le jour ; le ton est mémorisé par office ; un dépliant explique que c'est l'antienne qui commande le ton — voir [`documentation/fondations/`](documentation/fondations/psautier-et-tons.md) |
| **Affichage : Mode nuit / Taille du texte / Zoom à 2 doigts** | Thème sombre (suit le système par défaut), curseur de taille, pincement à deux doigts sur le texte |
| **Mode hors connexion** | Contenu conservé (Aucun / Messe / Offices / Messe + Offices), téléchargement à l'avance (jusqu'à 7 jours), durée de conservation, WiFi uniquement, purge du cache |

L'onglet **Bible** rassemble les péricopes bibliques du jour (lectures de la messe
et lecture de l'office des lectures) : l'AELF n'expose pas de point d'accès
« Bible » complet, c'est donc une vue composée, pas une bible intégrale.

## Source des textes

Les textes proviennent de l'**API publique de l'AELF** (`https://api.aelf.org/v1`),
interrogée directement depuis le navigateur (CORS ouvert, aucune clé requise) :

```
/v1/{messes|lectures|laudes|tierce|sexte|none|vepres|complies}/{AAAA-MM-JJ}/{zone}
```

Textes liturgiques © AELF. Les formules psalmodiques embarquées sont des aides à
l'intonation, volontairement simplifiées (une cadence courante par ton, pas
l'ensemble des différences).

## Architecture

Vite + JavaScript natif, sans dépendance d'exécution.

```
index.html               coquille de l'application (barre, onglets, tiroirs, feuille)
public/
  sw.js                  service worker (précache injecté au build)
  manifest.webmanifest   manifeste PWA, icônes, raccourcis Laudes/Vêpres/Complies/Messe
src/
  main.js                démarrage, adresse #/office/date/section, chargement, entretien
  core/store.js          état et paramètres persistés (localStorage)
  data/
    aelf.js              client API, stratégie cache d'abord, préchargement
    cache.js             réserve IndexedDB (lecture, écriture, purge, statistiques)
    offices.js           catalogue des offices, régions, couleurs liturgiques
    sections.js          découpage d'une réponse AELF en sections et blocs
  ui/
    coquille.js          tiroirs, thème, taille du texte, zoom, messages
    liturgie.js          rendu des sections, onglets, balayage
    drawer-jour.js       tiroir gauche
    drawer-parametres.js tiroir droit
    psalmodie.js         feuille du bas : ton, portée, écoute
  audio/
    tons.js              formules des huit tons + peregrinus
    synthese.js          synthèse WebAudio (piano, orgue, voix)
  util/                  DOM, dates, assainissement HTML
```

Quelques partis pris :

- **Le HTML de l'AELF n'est jamais injecté tel quel.** `util/sanitize.js`
  reconstruit l'arbre avec une liste blanche de balises et la seule classe utile
  (`verse_number`).
- **Cache d'abord.** Les textes d'un jour donné ne changent pas : la réserve
  IndexedDB répond en premier, le réseau ne comble qu'un manque. Si IndexedDB est
  indisponible (navigation privée, stockage bridé), la lecture continue en ligne
  au lieu de se bloquer.
- **Deux caches distincts.** Le service worker garde la coquille et les réponses
  réseau ; IndexedDB garde les textes et c'est lui que pilotent les réglages hors
  connexion (durée de conservation, purge).
- **Pas de bibliothèque** : rendu DOM, portée SVG et synthèse sonore tiennent en
  quelques dizaines de lignes chacun.

## Icônes

`public/icons/` contient les sources SVG et les PNG dérivés (180, 192, 512 et une
version *maskable*). Pour les régénérer après modification du SVG :

```bash
cd public/icons
for s in 180 192 512; do inkscape icon.svg -w $s -h $s -o icon-$s.png; done
inkscape icon-maskable.svg -w 512 -h 512 -o icon-maskable-512.png
```
