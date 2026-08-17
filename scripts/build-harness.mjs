#!/usr/bin/env node
// scripts/build-harness.mjs
// Génère l'extension pi et le fragment de roster SSSF à partir du
// catalogue, sur le modèle de build-skills.mjs.
//
// Sortie : harness/adws/adw_data/harness_engineering/coach-os.ts
//          harness/adws/adw_sssf_config/coach-os.roster.yaml
//
// La sortie va dans `harness/`, pas à la racine : ces fichiers sont
// destinés à être copiés dans un dépôt CIBLE déjà stampé par SSSF, pas
// à cohabiter avec les sources de coach-os.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

const { buildHarness } = await import('../dist/tooling/adapters/harness.js');
const { registerAll } = await import('../dist/tooling/catalog/index.js');
registerAll();

const outDir = path.join(root, 'harness');

for (const fichier of buildHarness()) {
  const cible = path.join(outDir, fichier.path);
  // mkdir avant write : `writeFile` ne crée pas les dossiers parents et
  // échoue sur un chemin profond.
  await mkdir(path.dirname(cible), { recursive: true });
  await writeFile(cible, fichier.content, 'utf8');
  console.log(`[tooling:harness] ${fichier.path} — ${fichier.content.split('\n').length} lignes`);
}

console.log('[tooling:harness] OK');
console.log('');
console.log('Pour installer dans un dépôt stampé SSSF :');
console.log('  cp -r harness/adws/. <depot>/adws/');
console.log('  puis fusionner coach-os.roster.yaml dans sssf.config.yaml');
console.log('');
console.log("L'extension attend COACH_OS_TENANT, COACH_OS_ACTOR et COACH_OS_ROLE");
console.log("dans l'environnement du run. Sans eux, chaque appel est refusé.");
