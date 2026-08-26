import { defineConfig } from 'vite';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, resolve, posix, sep } from 'node:path';

const PRECACHE_TOKEN = '__PRECACHE_MANIFEST__';
const VERSION_TOKEN = '__BUILD_ID__';

/** Dossier de sortie du build. */
const DOSSIER_SORTIE = 'docs';

/** Fichiers jamais utiles hors connexion (sources de cartes, archives, etc.). */
const SKIP = /\.(map|txt)$/;

function listFiles(dir, root = dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full, root);
    return ['/' + relative(root, full).split(sep).join(posix.sep)];
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
        .filter((f) => f !== '/sw.js' && !SKIP.test(f))
        .sort();
      const source = readFileSync(swPath, 'utf8')
        .replace(`'${PRECACHE_TOKEN}'`, JSON.stringify(['/', ...assets]))
        .replace(VERSION_TOKEN, String(Date.now()));
      writeFileSync(swPath, source);
      // eslint-disable-next-line no-console
      console.log(`\n  sw.js — ${assets.length} fichiers précachés`);
    },
  };
}

export default defineConfig({
  plugins: [serviceWorkerManifest()],
  server: { port: 5173 },
  build: { target: 'es2020', sourcemap: true, outDir: DOSSIER_SORTIE, emptyOutDir: true },
});
