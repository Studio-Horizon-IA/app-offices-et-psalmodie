# Vibe coding ...

avec Claude Opus 5

## Premier prompt à partir du croquis

 @documentation/croquis/PXL_20260825_232044626.jpg
  utilise vite, vanille (html + js + html). N'utilise pas de
  librairie lorsqu'il n'y a pas d'avantage flagrant.

## second prompt pour générer la documentation technique

à partir du code produit, générer la documentation technique:
  diagrames d'architecture ( @documentation/architecture ),
  spécification ( @documentation/specs ) et requis fonctionnels et
  non fonctionnels ( @documentation/requis ).

## troisième prompt pour rendre l'application publiable dur Github Pages

reconfigure vite pour générer le code dans doc plutôt que dans
  dist