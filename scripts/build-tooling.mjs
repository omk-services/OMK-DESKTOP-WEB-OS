// scripts/build-tooling.mjs
// Compile le module tooling vers dist/tooling/, puis patche les
// imports ESM pour qu'ils portent l'extension .js explicite
// (Node ESM n'autorise pas l'omission, contrairement au bundler).
//
// Sortie : `dist/tooling/**/*.js` est consommable par Node depuis
// `cli/coach-os.mjs` et `mcp/server.mjs` sans bundler.

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile, writeFile, readdir } from 'node:fs/promises';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

console.log('[tooling:build] tsc compile src/lib/tooling → dist/tooling');
execSync(
  `node ./node_modules/typescript/bin/tsc -p tsconfig.tooling.json`,
  { stdio: 'inherit', cwd: root },
);

const toolingDir = path.join(root, 'dist', 'tooling');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const importRe = /from\s+(['"])(\.{1,2}\/[^'"]+)\1/g;

let patched = 0;
for await (const file of walk(toolingDir)) {
  if (!file.endsWith('.js')) continue;
  const src = await readFile(file, 'utf8');
  const out = src.replace(importRe, (match, quote, spec) => {
    if (spec.endsWith('.js') || spec.endsWith('.mjs')) return match;
    return `from ${quote}${spec}.js${quote}`;
  });
  if (out !== src) {
    await writeFile(file, out, 'utf8');
    patched++;
  }
}

console.log(`[tooling:build] patché ${patched} fichiers (ajout de l'extension .js aux imports)`);
console.log('[tooling:build] OK');
