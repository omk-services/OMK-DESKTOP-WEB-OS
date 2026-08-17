// src/lib/tooling/adapters/harness.ts
// Adaptateur Harness — la huitième surface.
//
// Les sept premières exposent le registre à un APPELANT (une app, un shell,
// un hôte MCP, un client REST, un modèle qui lit un SKILL.md). Celle-ci
// l'expose à un HARNESS : un agent de code autonome qui tourne dans un dépôt,
// avec ses propres outils, sa propre boucle, et sa propre idée de ce qu'il a
// le droit de faire.
//
// Substrat : `pi` (earendil-works/pi), pilote par Super Simple Software
// Factory (disler/super-simple-software-factory), dont le `sssf.config.yaml`
// declare `coding_agent: pi` et donne a chaque agent sa liste d'extensions
// sous `harness_engineering:`. C'est ce point d'accroche que l'on vise.
//
// CE QUE CE MODULE EMET — ET NE FAIT PAS
//
// Il genere deux fichiers, comme `skill.ts` genere des SKILL.md :
//   1. une extension pi (`pi.registerTool` + `pi.on('tool_call')`),
//   2. le fragment de roster YAML qui la charge et borne le perimetre.
// Il n'execute rien, ne resout aucune identite, n'ouvre aucun socket. La
// generation est statique ; l'execution appartient a la surface MCP.
//
// POURQUOI IL NE REIMPLEMENTE PAS LES OUTILS
//
// L'extension emise est un CLIENT du serveur MCP coach-os, pas une copie de
// sa logique. Un harness qui embarquerait `execute()` embarquerait aussi le
// magasin, donc les donnees de tous les locataires, sur la machine d'un agent
// delegue. La cloison par tenant de `serverStore` ne survivrait pas au voyage.
//
// LA LIMITE, ECRITE PLUTOT QUE MASQUEE
//
// L'extension transporte `__tenantId / __actorId / __role` depuis son
// environnement. Le serveur les re-resout (`resolveIdentity`) et applique la
// matrice role x categorie (`assertPermission`) : c'est la garde qui tient.
// Mais **rien n'authentifie encore ces valeurs** — un appelant qui pose son
// propre `COACH_OS_ROLE=owner` sera cru. C'est W03, ouverte au rapport
// `RAPPORT_SECURITY_ARCHITECTURE_V1.md`. Tant qu'elle l'est, cet adaptateur
// se deploie sur une machine de confiance, pas devant un tiers.
//
// Le precedent qui l'exige : Melbourne, aout 2026. Un agent annule la
// reservation d'un tiers parce que l'API ne verifiait pas *qui* annule. Le
// systeme tenait parce qu'aucun humain n'irait manipuler l'API a la main.
// Les agents, eux, ne regardent jamais l'interface.

import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';
import type { ToolDefinition } from '../types';

export interface HarnessFile {
  /** Chemin relatif a la racine du depot cible. */
  path: string;
  content: string;
}

/** Emplacements imposes par le stamp SSSF. Ecrits ici pour qu'un changement
 *  de convention se corrige a un seul endroit. */
const CHEMIN_EXTENSION = 'adws/adw_data/harness_engineering/coach-os.ts';
const CHEMIN_ROSTER = 'adws/adw_sssf_config/coach-os.roster.yaml';

/**
 * Le nom d'outil vu par le harness.
 *
 * Le registre nomme en points (`collection.list`). Un point dans un nom
 * d'outil casse les hotes qui construisent des identifiants a plat — la
 * surface MCP publie deja `collection_list`. On garde la meme translation
 * pour qu'un agent qui passe de MCP a pi ne reapprenne pas les noms.
 */
export function nomHarness(tool: ToolDefinition): string {
  return tool.name.replace(/\./g, '_');
}

/** Les outils qu'un harness a le droit de voir. Tous — le tri se fait par
 *  role a l'execution, pas par omission a la generation. Cacher un outil
 *  n'est pas une garde : c'est une garde qu'on croit avoir. */
export function toolsHarness(): ToolDefinition[] {
  return list();
}

/**
 * L'extension pi.
 *
 * Construite par tableau de lignes plutot qu'en litteral gabarit : le corps
 * contient des accolades, des commentaires et des exemples, et un accent
 * grave egare dans un litteral imbrique ferme la chaine sans erreur lisible.
 */
export function buildPiExtension(): HarnessFile {
  const outils = toolsHarness();

  const lignes: string[] = [
    '// GENERE par coach-os — src/lib/tooling/adapters/harness.ts',
    '// Ne pas editer a la main : regenerer via `npm run tooling:harness`.',
    '//',
    '// Extension pi. Elle publie les outils coach-os dans le harness et pose',
    '// un refus local avant l\'appel. Le refus local est un confort ; la garde',
    '// qui tient est cote serveur (identity.ts + permissions.ts).',
    '',
    '// Le type est declare sur place plutot qu\'importe : le nom du paquet pi',
    '// qui exporte ExtensionAPI n\'a pas ete verifie contre la source. Une',
    '// interface structurelle rend le fichier compilable tel quel ; si pi',
    '// publie le type, remplacer ces lignes par son import.',
    'interface ExtensionAPI {',
    '  registerTool(t: {',
    '    name: string;',
    '    description: string;',
    '    parameters: unknown;',
    '    run(args: Record<string, unknown>): Promise<unknown>;',
    '  }): void;',
    '  on(',
    '    evenement: "tool_call",',
    '    h: (e: { name: string }, ctx: { deny(raison: string): void }) => Promise<void>,',
    '  ): void;',
    '}',
    '',
    '// Fourni par l\'operateur : le transport vers le serveur MCP coach-os.',
    '// Volontairement non genere — le choix du transport (stdio local, socket,',
    '// HTTP) depend du deploiement, et le coder ici le figerait.',
    'declare function appelerCoachOs(',
    '  nom: string,',
    '  args: Record<string, unknown>,',
    '): Promise<unknown>;',
    '',
    '// L\'identite vient de l\'environnement du processus, jamais du modele.',
    '// Un agent qui pourrait ecrire son propre role serait un agent qui',
    '// s\'accorde ses propres droits.',
    'const IDENTITE = {',
    '  __tenantId: process.env.COACH_OS_TENANT,',
    '  __actorId: process.env.COACH_OS_ACTOR,',
    '  __role: process.env.COACH_OS_ROLE,',
    '};',
    '',
    '// Categorie par outil : sert au refus local. Copiee du registre a la',
    '// generation — si elle derive, c\'est le serveur qui tranche.',
    'const CATEGORIES: Record<string, string> = {',
    ...outils.map((t) => `  "${nomHarness(t)}": "${t.category}",`),
    '};',
    '',
    'export default function (pi: ExtensionAPI) {',
    '  // 1. Le garde-fou, pose AVANT les outils : si l\'enregistrement echoue',
    '  //    a mi-parcours, on prefere un harness sans outils a un harness',
    '  //    avec outils et sans garde.',
    '  pi.on("tool_call", async (event, ctx) => {',
    '    const categorie = CATEGORIES[event.name];',
    '    if (!categorie) return; // outil hors coach-os : pas notre affaire.',
    '    if (!IDENTITE.__tenantId || !IDENTITE.__actorId || !IDENTITE.__role) {',
    '      return ctx.deny(',
    '        "Identite coach-os absente. Poser COACH_OS_TENANT, COACH_OS_ACTOR " +',
    '        "et COACH_OS_ROLE. Aucun defaut : un defaut silencieux ici rejoue " +',
    '        "exactement le defaut qu\'on corrige.",',
    '      );',
    '    }',
    '    if (categorie === "ecriture" && IDENTITE.__role === "guest") {',
    '      return ctx.deny("Role guest : ecriture refusee.");',
    '    }',
    '  });',
    '',
    '  // 2. Les outils. Chacun proxie vers le serveur MCP coach-os ; aucune',
    '  //    logique metier ne voyage jusqu\'ici.',
  ];

  for (const tool of outils) {
    lignes.push(...ligneOutil(tool));
  }

  lignes.push('}', '');

  return { path: CHEMIN_EXTENSION, content: lignes.join('\n') };
}

/**
 * Un bloc `registerTool` par outil.
 *
 * `parameters` reprend le JSON Schema deja produit pour MCP. Une seconde
 * traduction du zod, ecrite a la main ici, aurait derive de la premiere sans
 * qu'aucun test ne le dise — et un agent aurait appele avec les arguments
 * d'hier.
 */
function ligneOutil(tool: ToolDefinition): string[] {
  const nom = nomHarness(tool);
  const schema = JSON.stringify(zodToInputSchema(tool.schema));
  return [
    '',
    `  // ${tool.category} — ${echapper(tool.description)}`,
    '  pi.registerTool({',
    `    name: "${nom}",`,
    `    description: "${echapper(tool.description)}",`,
    `    parameters: ${schema},`,
    '    async run(args) {',
    `      return appelerCoachOs("${tool.name}", { ...args, ...IDENTITE });`,
    '    },',
    '  });',
  ];
}

/** Guillemets et retours a la ligne : une description multiligne collee dans
 *  un litteral de chaine casse le fichier genere. */
function echapper(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

/**
 * Le fragment de roster.
 *
 * `writes:` est le perimetre exclusif de l'agent — la regle que les briefs
 * de delegation portaient en prose et que deux agents ont deja violee en se
 * reecrivant sans le voir. Ici elle est lue par la machine.
 *
 * `protected_files:` ajoute `harness_engineering/` a la liste par defaut de
 * SSSF, qui protege `adw_modules/`, `adw_sssf_config/` et `adw_*.py` mais
 * **pas** les extensions. Un agent capable de reecrire l'extension qui le
 * bride se debride lui-meme.
 */
export function buildRosterEntry(): HarnessFile {
  const lignes = [
    '# GENERE par coach-os — src/lib/tooling/adapters/harness.ts',
    '# Fragment a fusionner dans adws/adw_sssf_config/sssf.config.yaml',
    '',
    'defaults:',
    '  protected_files:',
    '    - adws/adw_modules/',
    '    - adws/adw_sssf_config/',
    '    - adws/adw_*.py',
    '    # Ajout coach-os : sans cette ligne, un agent reecrit la garde qui',
    '    # le bride. SSSF ne protege pas ce dossier par defaut.',
    '    - adws/adw_data/harness_engineering/',
    '',
    'agents:',
    '  - name: coach-os-operator',
    '    purpose: >-',
    '      Operer coach-os par ses outils publies. Toute ecriture depose une',
    '      proposition dans la file d\'approbation ; la fusion reste humaine.',
    '    harness_engineering:',
    `      - ${CHEMIN_EXTENSION}`,
    '    writes:',
    '      # Perimetre exclusif. Un agent qui ecrit hors de cette liste est un',
    '      # agent qui ecrase le travail d\'un autre sans que ni l\'un ni',
    '      # l\'autre ne le voie.',
    '      - specs/',
    '',
    '# Variables attendues dans l\'environnement du run — jamais dans ce',
    '# fichier, qui est versionne.',
    '#   COACH_OS_TENANT  COACH_OS_ACTOR  COACH_OS_ROLE',
    '',
  ];
  return { path: CHEMIN_ROSTER, content: lignes.join('\n') };
}

/** Les deux fichiers, dans l'ordre ou ils doivent atterrir. */
export function buildHarness(): HarnessFile[] {
  return [buildPiExtension(), buildRosterEntry()];
}
