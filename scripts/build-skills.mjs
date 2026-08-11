#!/usr/bin/env node
// scripts/build-skills.mjs
// Génère `skills/<toolname>/SKILL.md` à partir du catalogue. Chaque
// fichier respecte le frontmatter Agent Skills (name + description)
// et un corps Quand/Comment/Erreurs/Exemples. La sortie est
// reproductible : on peut regénérer après chaque changement de
// catalogue sans toucher au repo.
//
// Sortie : skills/<toolname>/SKILL.md
//          skills/INSTALL.md (page d'installation one-shot)
//          coach-os-plugin/skills/<toolname>/SKILL.md (miroir du plugin)

import { writeFile, mkdir, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

const { list } = await import('../dist/tooling/registry.js');
const { buildSkill } = await import('../dist/tooling/adapters/skill.js');
const { registerAll } = await import('../dist/tooling/catalog/index.js');
registerAll();

const skillsDir = path.join(root, 'skills');
await mkdir(skillsDir, { recursive: true });

let count = 0;
for (const tool of list()) {
  const skill = buildSkill(tool);
  const target = path.join(skillsDir, skill.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, skill.content, 'utf8');
  count++;
}

// Page d'installation one-shot.
const install = `# Coach OS — installer le plugin

L'installation tient en une ligne que vous collez dans Claude Code,
Codex, Cursor, ou tout client qui respecte Agent Plugins 1.0.0.

## Pour Claude Code

\`\`\`
Read coach-os-plugin/plugin.json and install the Coach OS plugin for me.
\`\`\`

## Pour Codex / Cursor / Hermes

Lire \`coach-os-plugin/plugin.json\` puis suivre le README du client.
La spec Agent Plugins 1.0.0 (https://agentplugins.org) décrit le
format de manière normative — le dossier \`coach-os-plugin/\` est
conforme :

- \`plugin.json\` : manifeste avec \`$schema\`, \`name\`, \`version\`,
  \`description\`, \`license\`, \`author\`, \`repository\`.
- \`mcp.json\` : un seul serveur stdio, multiplexe les 13 outils.
- \`skills/<outil>/SKILL.md\` : ${count} skills générées par le
  générateur local, à jour avec le catalogue.

## Vérification

Après installation, ces trois commandes doivent réussir :

\`\`\`bash
# 1. Le binaire
npx coach-os --help

# 2. Le serveur MCP démarre
npx coach-os tools list

# 3. Une route REST répond
curl -X POST http://localhost:3000/api/v1/collection.list -d '{}' -H 'Content-Type: application/json'
\`\`\`

## Que fait le plugin

Les 13 outils couvrent :

- **Lecture** : \`app.list\`, \`collection.list\`, \`collection.read\`,
  \`collection.search\`, \`scenario.list\`, \`scenario.read\`.
- **Navigation** : \`app.open\`, \`section.goto\`, \`scenario.approve\`,
  \`scenario.reject\`.
- **Écriture** : \`collection.create\`, \`collection.update\`,
  \`collection.delete\` — déposent une proposition dans la file
  d'approbation. Aucune écriture directe.

C'est le rang 4 de ARCHITECTURE_V1.md : une seule définition d'outil
produit 5 surfaces (REST, MCP, CLI, Skill, in-app).
`;
await writeFile(path.join(skillsDir, 'INSTALL.md'), install, 'utf8');

// Miroir vers coach-os-plugin/skills/. Le plugin étant un livrable
// à part, on synchronise l'arbre skills entier pour qu'aucun écart
// ne passe inaperçu.
const pluginSkills = path.join(root, 'coach-os-plugin', 'skills');
await rm(pluginSkills, { recursive: true, force: true });
await mkdir(pluginSkills, { recursive: true });
async function copyTree(src, dst) {
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await mkdir(d, { recursive: true });
      await copyTree(s, d);
    } else {
      await writeFile(d, await (await import('node:fs/promises')).readFile(s), 'utf8');
    }
  }
}
await copyTree(skillsDir, pluginSkills);

console.log(`[tooling:skills] généré ${count} SKILL.md + INSTALL.md dans skills/ et coach-os-plugin/skills/`);
