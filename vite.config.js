import { defineConfig } from 'vite';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, posix, sep } from 'node:path';

const PRECACHE_TOKEN = '__PRECACHE_MANIFEST__';
const VERSION_TOKEN = '__BUILD_ID__';

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
  return {
    name: 'sw-precache-manifest',
    apply: 'build',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist');
      const swPath = join(outDir, 'sw.js');
      const assets = listFiles(outDir)
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
  build: { target: 'es2020', sourcemap: true },
});
