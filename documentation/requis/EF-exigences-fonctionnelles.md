# Exigences fonctionnelles

Conventions d'identifiants, de priorité et de statut : voir le
[README](README.md).

## EF-LIT — Lecture de la liturgie

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-LIT-01 | L'application affiche les textes de la Liturgie des Heures du jour : office des lectures, laudes, tierce, sexte, none, vêpres, complies. | M | Croquis | ✅ |
| EF-LIT-02 | Elle affiche les lectures de la messe du jour, y compris lorsque plusieurs messes sont proposées. | M | Croquis | ✅ |
| EF-LIT-03 | Elle propose une entrée « Bible » donnant les péricopes bibliques du jour. | S | Croquis | 🟡 L'AELF n'expose pas de bible intégrale : la vue rassemble les lectures de la messe et celle de l'office des lectures. |
| EF-LIT-04 | Chaque office est découpé en sections consultables une à une. | M | Croquis (`SCT 1 · SCT 2 · SCT 3`) | ✅ |
| EF-LIT-05 | Les sections sans contenu pour un jour donné n'apparaissent pas. | M | Déduit | ✅ |
| EF-LIT-06 | Le passage d'une section à l'autre se fait par balayage horizontal, par les onglets et par les flèches du clavier. | M | Croquis (`slide G/D`) | ✅ |
| EF-LIT-07 | Les antiennes, refrains, hymnes, psaumes, lectures et oraisons sont visuellement distincts. | S | Déduit | ✅ |
| EF-LIT-08 | Les syllabes accentuées des psaumes (balise `<u>` de l'AELF) sont mises en évidence sans être soulignées, comme repère de psalmodie. | S | Déduit | ✅ |
| EF-LIT-09 | Les numéros de versets sont affichés discrètement et exclus de la sélection de texte. | C | Déduit | ✅ |
| EF-LIT-10 | Le texte intégral du Notre Père est affiché là où l'API ne renvoie que sa mention. | C | Déduit | ✅ |

## EF-NAV — Navigation et jour liturgique

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-NAV-01 | La barre du haut affiche le titre du jour liturgique et la fête éventuelle. | M | Croquis (`TITRE JOUR`) | ✅ |
| EF-NAV-02 | Un tiroir gauche liste le jour, les saints et l'ensemble des offices. | M | Croquis (`☰ Jour`) | ✅ |
| EF-NAV-03 | La personne peut consulter un autre jour : jour précédent, jour suivant, choix dans un calendrier, retour à aujourd'hui. | M | Déduit | ✅ |
| EF-NAV-04 | À l'ouverture sans destination précise, l'office proposé correspond à l'heure locale. | S | Déduit | ✅ |
| EF-NAV-05 | L'office, la date et la section sont reflétés dans l'adresse, de sorte qu'un lien profond soit partageable et que le retour arrière fonctionne. | S | Technique | ✅ |
| EF-NAV-06 | Le tiroir indique quels offices sont déjà lisibles hors connexion. | S | Déduit | ✅ |
| EF-NAV-07 | Les heures sont accompagnées de leur horaire indicatif. | C | Déduit | ✅ |
| EF-NAV-08 | L'application propose des raccourcis d'ouverture directe (Laudes, Vêpres, Complies, Messe) depuis l'icône installée. | C | Déduit | ✅ |

## EF-PARAM — Réglages

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-PARAM-01 | Un tiroir droit rassemble tous les réglages. | M | Croquis (`⋮ Paramètres`) | ✅ |
| EF-PARAM-02 | La zone liturgique des lectures est choisie parmi les zones de l'AELF. | M | Croquis (`Lectures › [Région]`) | ✅ |
| EF-PARAM-03 | Changer de zone recharge l'office affiché. | M | Déduit | ✅ |
| EF-PARAM-04 | Un mode nuit est disponible. | M | Croquis (`Affichage › [Mode Nuit]`) | ✅ |
| EF-PARAM-05 | Par défaut, le thème suit la préférence du système ; un basculement manuel fige le choix. | S | Déduit | ✅ |
| EF-PARAM-06 | La taille du texte est réglable par un curseur, avec aperçu immédiat. | M | Croquis (`[Taille du texte]` + *slider*) | ✅ |
| EF-PARAM-07 | Le zoom à deux doigts sur le texte est activable et désactivable. | M | Croquis (`[Zoom à 2 doigts]`) | ✅ |
| EF-PARAM-08 | Désactiver ce zoom rend le pincement natif du navigateur. | S | Déduit | ✅ |
| EF-PARAM-09 | Les réglages sont conservés d'une session à l'autre. | M | Déduit | ✅ |
| EF-PARAM-10 | La source des textes et la nature simplifiée des formules psalmodiques sont indiquées dans l'interface. | S | Déduit | ✅ |

## EF-PSAL — Psalmodie

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-PSAL-01 | La personne choisit un ton psalmodique parmi les huit tons grégoriens et le tonus peregrinus. | M | Croquis (`Ton › [Ton]`) | ✅ |
| EF-PSAL-02 | Elle choisit l'instrument qui donne le ton. | M | Croquis (`Instru [Piano]`) | ✅ Piano, orgue, voix |
| EF-PSAL-03 | La formule du ton est jouable à la demande. | M | Déduit | ✅ |
| EF-PSAL-04 | La formule est aussi représentée visuellement, avec ses moments nommés (intonation, teneur, médiante, terminaison). | S | Croquis (esquisse de notation en haut de la feuille) | ✅ Portée SVG |
| EF-PSAL-05 | La hauteur est transposable pour s'adapter à la voix de l'assemblée. | C | Déduit | ✅ ±5 demi-tons |
| EF-PSAL-06 | Le ton est accessible depuis la barre du haut et depuis chaque psaume ou cantique. | S | Croquis (♪ dans la barre) | ✅ |
| EF-PSAL-07 | Une écoute en cours peut être arrêtée, et une nouvelle écoute interrompt la précédente. | S | Déduit | ✅ |
| EF-PSAL-08 | Les formules complètes (toutes les différences par mode) sont proposées. | W | Déduit | ⛔ Une cadence courante par ton ; limite énoncée dans l'interface. |

## EF-OFF — Mode hors connexion

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-OFF-01 | Les textes déjà consultés restent lisibles sans réseau. | M | Croquis (`Mode hors connexion`) | ✅ |
| EF-OFF-02 | La personne choisit ce qui est conservé : rien, la messe, les offices, ou les deux. | M | Croquis (`[Messe + Offices]`) | ✅ |
| EF-OFF-03 | Les jours à venir peuvent être téléchargés à l'avance. | M | Croquis (`[Télécharger à l'avance]`) | ✅ Jusqu'à 7 jours |
| EF-OFF-04 | Le téléchargement anticipé se lance aussi automatiquement au démarrage. | S | Déduit | ✅ |
| EF-OFF-05 | Une durée de conservation est configurable, au-delà de laquelle les textes anciens sont effacés. | M | Croquis (`[Conserver les textes pendant …]`) | ✅ 7 / 30 / 90 jours / toujours |
| EF-OFF-06 | Un réglage limite les téléchargements de fond aux réseaux non mesurés. | M | Croquis (`[WiFi Uniquement]`) | ✅ |
| EF-OFF-07 | La réserve locale peut être vidée sur demande, après confirmation. | M | Croquis (`[Purger le cache]`) | ✅ |
| EF-OFF-08 | L'avancement d'un téléchargement est visible. | S | Déduit | ✅ Barre de progression |
| EF-OFF-09 | L'état de la réserve (nombre de textes, poids) est affiché. | C | Déduit | ✅ |
| EF-OFF-10 | Hors connexion, un texte absent de la réserve donne lieu à un message explicite et à un conseil. | M | Déduit | ✅ |
| EF-OFF-11 | Purger le cache n'empêche pas l'application de se lancer hors connexion. | S | Déduit | ✅ La coquille est conservée |

## EF-PWA — Application installable

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-PWA-01 | L'application est installable sur l'écran d'accueil et s'ouvre en mode autonome. | M | Croquis (« application web PWA ») | ✅ |
| EF-PWA-02 | Elle démarre sans réseau une fois installée. | M | Déduit | ✅ |
| EF-PWA-03 | Elle possède une icône propre, y compris en version *maskable*. | S | Déduit | ✅ 180, 192, 512 px + SVG |
| EF-PWA-04 | La couleur de la barre système suit le thème. | C | Déduit | ✅ |
| EF-PWA-05 | L'arrivée d'une nouvelle version est signalée sans interrompre la lecture en cours. | S | Déduit | ✅ Message ; application à la prochaine ouverture |

## EF-ERR — Erreurs et cas limites

| ID | Exigence | Prio | Origine | Statut |
| --- | --- | --- | --- | --- |
| EF-ERR-01 | Une indisponibilité de l'API donne un écran d'erreur distinct d'une absence de réseau, avec un conseil adapté. | M | Déduit | ✅ |
| EF-ERR-02 | Toute erreur affichée propose de réessayer. | M | Déduit | ✅ |
| EF-ERR-03 | Le retour du réseau relance automatiquement un chargement qui avait échoué. | S | Déduit | ✅ |
| EF-ERR-04 | Un office sans section exploitable affiche un message plutôt qu'une page vide. | S | Déduit | ✅ |
| EF-ERR-05 | Un chargement lent abandonné ne peut pas écraser l'affichage d'un office choisi entre-temps. | M | Technique | ✅ Jeton de concurrence |
| EF-ERR-06 | L'indisponibilité du stockage local (navigation privée, quota) ne bloque pas la lecture en ligne. | M | Technique | ✅ Garde-fou de 3 s |
