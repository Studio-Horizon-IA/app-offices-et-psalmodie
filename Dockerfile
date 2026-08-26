# Réplique locale de GitHub Pages pour « Offices & Psalmodie ».
#
# GitHub Pages ne construit rien : il sert le contenu versionné du dossier
# publié (ici `docs/`). Cette image fait exactement pareil — il faut donc
# lancer `npm run build` avant de la construire.
#
#   docker build -t offices-pages .
#   docker run --rm -p 8080:8080 -p 8081:8081 offices-pages
#
#   http://localhost:8080/  → site à la racine (page d'utilisateur, domaine perso)
#   http://localhost:8081/  → site sous /<dépôt>/ (page de projet)

FROM nginx:1.29-alpine

# Nom du dépôt, qui devient le préfixe d'URL du mode « page de projet ».
ARG REPO=app-offices-et-psalmodie

# Page 404 de repli, utilisée seulement si le site n'en fournit pas.
COPY docker/404.html /usr/share/nginx/html/404-defaut.html

# Le site tel qu'il serait publié.
COPY docs/ /usr/share/nginx/html/

# Mode « page de projet » : même contenu, servi sous un préfixe.
RUN mkdir -p /usr/share/nginx/projet \
    && ln -s /usr/share/nginx/html "/usr/share/nginx/projet/${REPO}"

COPY docker/pages-commun.conf /etc/nginx/pages-commun.conf
COPY docker/pages.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__REPO__|${REPO}|g" /etc/nginx/conf.d/default.conf \
    && nginx -t

EXPOSE 8080 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=2s \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
