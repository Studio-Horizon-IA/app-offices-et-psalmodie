import { defineConfig } from 'vite';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, resolve, posix, sep } from 'node:path';

const PRECACHE_TOKEN = '__PRECACHE_MANIFEST__';
const VERSION_TOKEN = '__BUILD_ID__';

/** Dossier de sortie du build. */
const DOSSIER_SORTIE = 'docs';

/**
 * Fichiers jamais utiles hors connexion : sources de cartes, fichiers texte, et
 * marqueurs cachés comme `.nojekyll` (qui n'existe que pour GitHub Pages).
 */
const SKIP = /\.(map|txt)$|(^|\/)\.[^/]+$/;

/**
 * Chemins relatifs (`./assets/…`) et non absolus : dans le service worker ils
 * sont résolus par rapport à `sw.js`, donc au préfixe réel de publication.
 */
function listFiles(dir, root = dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full, root);
    return ['./' + relative(root, full).split(sep).join(posix.sep)];
  });
}

/**
 * Le service worker vit dans `public/sw.js` : il n'est donc pas bundlé et reste
 * lisible tel quel. Ce plugin y injecte, après le build, la liste réelle des
 * fichiers émis (noms hachés compris) pour que le shell soit précaché en entier.
 */
function serviceWorkerManifest() {
  let dossier = null;

  return {
    name: 'sw-precache-manifest',
    apply: 'build',
    // Le dossier de sortie est lu dans la configuration résolue plutôt que
    // codé en dur : le plugin suit `build.outDir` quel qu'il soit.
    configResolved(config) {
      dossier = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const swPath = join(dossier, 'sw.js');
      const assets = listFiles(dossier)
        .filter((f) => f !== './sw.js' && !SKIP.test(f))
        .sort();
      const source = readFileSync(swPath, 'utf8')
        .replace(`'${PRECACHE_TOKEN}'`, JSON.stringify(['./', ...assets]))
        .replace(VERSION_TOKEN, String(Date.now()));
      writeFileSync(swPath, source);
      // eslint-disable-next-line no-console
      console.log(`\n  sw.js — ${assets.length} fichiers précachés`);
    },
  };
}

export default defineConfig({
  // Base relative : le site fonctionne à la racine d'un domaine comme sous un
  // préfixe (`<compte>.github.io/<dépôt>/`), sans build spécifique à l'hôte.
  base: './',
  plugins: [serviceWorkerManifest()],
  server: { port: 5173 },
  build: { target: 'es2020', sourcemap: true, outDir: DOSSIER_SORTIE, emptyOutDir: true },
});
