# Exigences — Offices & Psalmodie

Exigences fonctionnelles et non fonctionnelles de l'application, reconstituées à
partir du croquis d'origine et de l'implémentation livrée.

| Document | Contenu |
| --- | --- |
| [Exigences fonctionnelles](EF-exigences-fonctionnelles.md) | Ce que l'application doit faire (EF-*) |
| [Exigences non fonctionnelles](ENF-exigences-non-fonctionnelles.md) | Comment elle doit se comporter (ENF-*) |
| [Matrice de traçabilité](matrice-tracabilite.md) | Exigence → code → vérification |

Documents liés : [architecture](../architecture/README.md) ·
[spécifications](../specs/README.md).

## Conventions

**Identifiants.** `EF-<DOMAINE>-<NN>` pour le fonctionnel,
`ENF-<CATÉGORIE>-<NN>` pour le reste. Les numéros ne sont jamais réattribués :
une exigence retirée devient « Abandonnée ».

**Priorité** (MoSCoW) :

| Niveau | Sens |
| --- | --- |
| **M** (*must*) | Sans quoi l'application ne remplit pas son office |
| **S** (*should*) | Attendu, mais l'application reste utile sans |
| **C** (*could*) | Confort, réalisé si le coût est faible |
| **W** (*won't*) | Hors périmètre de cette version, consigné pour mémoire |

**Origine** :

| Code | Sens |
| --- | --- |
| `Croquis` | Explicitement dessiné ou écrit sur le croquis d'ensemble `documentation/croquis/PXL_20260825_232044626.jpg` |
| `Croquis 2` | Issu du second croquis `documentation/croquis/PXL_20260826_010051286.webp`, consacré à l'apprentissage de la psalmodie |
| `Déduit` | Conséquence nécessaire du croquis (une PWA hors connexion implique un cache, une purge, des états d'erreur) |
| `Technique` | Imposé par la plateforme ou par une décision d'architecture |

**Statut** :

| Code | Sens |
| --- | --- |
| ✅ Réalisé | Implémenté et vérifié |
| 🟡 Partiel | Implémenté avec une limite documentée |
| ⛔ Non réalisé | Consigné, non implémenté dans cette version |

## Périmètre

Dans le périmètre : lecture des offices et de la messe du jour, navigation dans
le temps, réglages d'affichage et de zone liturgique, aide à l'intonation
psalmodique, lecture hors connexion, installation sur l'appareil.

Hors périmètre de cette version : compte utilisateur, synchronisation entre
appareils, annotations personnelles, notifications d'heure d'office, bible
intégrale, partition complète des psaumes, textes en d'autres langues.
