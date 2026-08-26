# Spécifications — Offices & Psalmodie

Description détaillée du comportement réalisé, telle qu'implémentée dans `src/`.
Là où l'architecture explique *comment c'est bâti*, ces documents disent
*ce que ça fait exactement*.

| Document | Contenu |
| --- | --- |
| [SPEC-01 — Interface](SPEC-01-interface.md) | Barre du haut, onglets et balayage, zone de lecture, tiroirs, feuille psalmodie, messages |
| [SPEC-02 — Modèle de données](SPEC-02-donnees.md) | Paramètres, vue, entrée de cache, `Section`/`Bloc`, règles de découpage |
| [SPEC-03 — Intégration AELF](SPEC-03-aelf.md) | Contrat de l'API externe, zones, erreurs, assainissement du HTML reçu |
| [SPEC-04 — Psalmodie](SPEC-04-psalmodie.md) | Tons, formules, portée, synthèse sonore |
| [SPEC-05 — Hors connexion](SPEC-05-hors-connexion.md) | Stratégies de cache, préchargement, conservation, purge, mises à jour |

Documents liés : [architecture](../architecture/README.md) ·
[exigences](../requis/README.md) · croquis d'origine
`documentation/croquis/PXL_20260825_232044626.jpg`.

## Conventions

- Les identifiants entre `crochets de code` sont ceux du code source.
- « Office » désigne indifféremment une heure de l'office divin, la messe ou la
  vue Bible : ce sont les neuf entrées du catalogue `data/offices.js`.
- Les durées sont en millisecondes lorsqu'elles proviennent du code.
- Les libellés d'interface sont cités **exactement** tels qu'ils s'affichent.
