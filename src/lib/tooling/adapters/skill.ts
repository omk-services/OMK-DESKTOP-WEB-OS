// src/lib/tooling/adapters/skill.ts
// Adaptateur Skill. Génère `skills/<toolname>/SKILL.md`, conforme au
// frontmatter Agent Skills (name + description), plus un corps qui
// explique quand et comment utiliser l'outil.
//
// Frontmatter : name (kebab-case), description (≤ 1024 caractères, en
// prose). Le corps est divisé en sections « Quand », « Comment »,
// « Erreurs courantes » et « Exemples ». Cette forme est proche du
// modèle Lumail (cité dans ARCHITECTURE_V1 §2.4).

import { list } from '../registry';
import { readTypeName, getObjectShape } from './zod-introspect';
import type { ToolDefinition } from '../types';

export interface SkillFile {
  /** Chemin relatif à la racine du plugin / dossier skills/. */
  path: string;
  content: string;
}

export function buildSkill(tool: ToolDefinition): SkillFile {
  const path = `${tool.name}/SKILL.md`;
  const content = render(tool);
  return { path, content };
}

export function buildAllSkills(): SkillFile[] {
  return list().map(buildSkill);
}

function render(tool: ToolDefinition): string {
  const desc = tool.description;
  const schema = describeSchema(tool);
  const examples = describeExamples(tool);
  const errors = describeErrors(tool);

  const lines = [
    '---',
    `name: ${tool.name}`,
    `description: ${desc}`,
    `category: ${tool.category}`,
    '---',
    '',
    `# ${tool.name}`,
    '',
    '## Quand',
    '',
    ...whenSection(tool),
    '',
    '## Comment',
    '',
    'Appeler l\'outil avec les arguments ci-dessous. Pour les outils',
    '`ecriture`, l\'appel **ne touche jamais les données réelles** : il',
    'dépose une proposition dans la file d\'approbation. La fusion est',
    'l\'acte qui engage, pas l\'appel d\'outil.',
    '',
    '### Arguments',
    '',
    schema,
    '',
    '## Erreurs courantes',
    '',
    errors,
    '',
    '## Exemples',
    '',
    examples,
    '',
  ];
  return lines.join('\n');
}

function whenSection(tool: ToolDefinition): string[] {
  switch (tool.category) {
    case 'lecture':
      return [
        '- Pour découvrir l\'état courant : liste des apps, des collections,',
        '  d\'une collection précise, recherche textuelle.',
        '- En début de conversation : `app.list` donne les apps,',
        '  `collection.list` donne les collections.',
        '- Toute lecture est idempotente et sans effet de bord.',
      ];
    case 'navigation':
      return [
        '- Quand l\'utilisateur demande d\'ouvrir une app',
        '  (`app.open`) ou d\'aller à une section précise',
        '  (`section.goto`).',
        '- Navigation == geste d\'affichage. Pas une écriture de',
        '  données. L\'utilisateur voit bouger et corrige en un geste.',
      ];
    case 'ecriture':
      return [
        '- Quand l\'utilisateur demande de modifier le bureau',
        '  (collection, item, thème) ET qu\'un humain doit arbitrer.',
        '- **Jamais** pour court-circuiter l\'approbation. L\'outil',
        '  dépose une proposition, l\'humain tranche dans la file',
        '  (People > Approvals, ou `scenario.approve` / `scenario.reject`).',
      ];
  }
}

function describeSchema(tool: ToolDefinition): string {
  // On rend le schema en pseudo-typescript, lisible. Pas de YAML
  // (les clients de skill gèrent — on garde le markdown pur).
  const lines: string[] = ['```ts', '{'];
  const shape = getObjectShape(tool.schema);
  const keys = shape ? Object.keys(shape) : [];
  for (const k of keys) {
    const node = shape?.[k] as { description?: string } | undefined;
    const typeName = readTypeName(shape?.[k]);
    const human = humanType(typeName);
    const desc = node?.description ? `  // ${node.description}` : '';
    lines.push(`  ${k}: ${human},${desc}`);
  }
  lines.push('}', '```');
  return lines.join('\n');
}

function humanType(z: string): string {
  switch (z) {
    case 'ZodString':
    case 'string':
      return 'string';
    case 'ZodNumber':
    case 'number':
      return 'number';
    case 'ZodBoolean':
    case 'boolean':
      return 'boolean';
    case 'ZodArray':
    case 'array':
      return 'array';
    case 'ZodObject':
    case 'object':
      return 'object';
    case 'ZodRecord':
    case 'record':
      return 'record';
    case 'ZodOptional':
    case 'optional':
      return 'optional';
    case 'ZodNullable':
    case 'nullable':
      return 'optional';
    default:
      return 'unknown';
  }
}

function describeExamples(tool: ToolDefinition): string {
  const samples: Record<string, string[]> = {
    'collection.list': ['```bash', 'coach-os collection.list', '```'],
    'collection.read': ['```bash', 'coach-os collection.read tasks', '```'],
    'collection.search': ['```bash', 'coach-os collection.search --query "Onboarding"', '```'],
    'collection.create': ['```bash', 'coach-os collection.create --json \'{"collectionId":"tasks","fields":{"label":"Nouvelle tâche","status":"open"}}\'', '```'],
    'collection.update': ['```bash', 'coach-os collection.update --json \'{"collectionId":"tasks","id":"task-1","patch":{"status":"done"}}\'', '```'],
    'collection.delete': ['```bash', 'coach-os collection.delete --json \'{"collectionId":"tasks","id":"task-1"}\'', '```'],
    'app.list': ['```bash', 'coach-os app.list', '```'],
    'app.open': ['```bash', 'coach-os app.open clients', '```'],
    'section.goto': ['```bash', 'coach-os section.goto --json \'{"appId":"clients","sectionId":"Pipeline"}\'', '```'],
    'scenario.list': ['```bash', 'coach-os scenario.list', '```'],
    'scenario.read': ['```bash', 'coach-os scenario.read p_abc123', '```'],
    'scenario.approve': ['```bash', 'coach-os scenario.approve p_abc123', '```'],
    'scenario.reject': ['```bash', 'coach-os scenario.reject p_abc123 --reason "doublon"', '```'],
  };
  return (samples[tool.name] ?? ['```bash', `coach-os ${tool.name} --help # pas d\'exemple canonique fourni`, '```']).join('\n');
}

function describeErrors(tool: ToolDefinition): string {
  const lines: string[] = [];
  lines.push('Cette section liste les réponses `ok:false` que l\'outil peut rendre.');
  if (tool.category === 'ecriture') {
    lines.push('');
    lines.push('Pour un outil `ecriture`, les seuls effets de bord visibles sont :');
    lines.push('- création d\'un fichier dans `_briefs/.../proposals/` ;');
    lines.push('- affichage d\'une entrée dans la file d\'approbation côté client ;');
    lines.push('- aucun fichier de seed ni de source modifié.');
  }
  lines.push('');
  lines.push('Erreurs fréquemment observées :');
  lines.push('- `Collection inconnue` / `App inconnue` / `Item introuvable` : appeler');
  lines.push('  d\'abord `collection.list` ou `app.list` pour vérifier l\'id exact.');
  lines.push('- `Section "${sectionId}" introuvable` : lister les sections');
  lines.push('  valides via `app.list` (le champ `sections` par app).');
  lines.push('- `Invalid arguments` : le format des args ne valide pas le schema.');
  lines.push('  Reprendre `coach-os ${tool.name} --help` ou la skill liste ci-dessus.');
  return lines.join('\n');
}
