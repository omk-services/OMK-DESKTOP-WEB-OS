// src/lib/tooling/adapters/webmcp.ts
// Dixieme adaptateur : WebMCP.
//
// CE QUE MCP NE COUVRE PAS
//
// `mcp.ts` expose le registre cote SERVEUR : l'agent atteint un outil qui vit
// hors de la page. WebMCP fait l'inverse — c'est la PAGE qui declare ses
// propres outils a l'agent, dans le navigateur. Sans lui, un agent qui doit
// agir dans l'interface Coach OS retombe sur le pilotage par pixels : il
// clique des coordonnees au lieu d'appeler une fonction.
//
// Les deux ne se remplacent pas. MCP porte les outils de fond ; WebMCP porte
// les gestes de l'interface. Un adaptateur pour chacun, meme registre derriere.
//
// Reference : https://github.com/GoogleChromeLabs/webmcp-tools
// L'outillage amont fournit une extension d'inspection, un CLI d'evaluation et
// un polyfill JS. Ce fichier ne depend d'aucun d'eux : il produit la
// declaration, le polyfill la consomme si l'API native manque.

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

/** Un outil tel que WebMCP l'attend cote page. */
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Categorie d'origine, conservee pour que la page decide quoi exposer. */
  category: string;
}

/**
 * Seules les categories sans effet durable sortent par defaut.
 *
 * Une page web est une surface hostile : n'importe quel script tiers charge
 * dans l'onglet voit les outils declares. Exposer `ecriture` par defaut
 * reviendrait a offrir un effet de bord durable a qui passe. L'appelant peut
 * l'elargir explicitement, jamais par inadvertance.
 */
const CATEGORIES_SURES = new Set(['lecture', 'navigation']);

export function toolsWebMcp(inclureEcriture = false): ToolDefinition[] {
  return list().filter((t) =>
    inclureEcriture ? true : CATEGORIES_SURES.has(t.category),
  );
}

/** Projette le registre au format WebMCP. */
export function buildWebMcpTools(inclureEcriture = false): WebMcpTool[] {
  return toolsWebMcp(inclureEcriture).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToInputSchema(t.schema),
    category: t.category,
  }));
}

/**
 * Declaration imperative : le script a injecter dans la page.
 *
 * WebMCP accepte deux voies, imperative et declarative. L'imperative est
 * retenue ici parce que le registre est dynamique — `subscribe()` peut ajouter
 * un outil apres le chargement, et une balise statique ne le verrait pas.
 *
 * Le script ne suppose pas l'API native presente : s'il ne la trouve pas, il
 * pose la declaration sur `window.__webmcp` ou le polyfill amont la lira.
 */
export function buildWebMcpScript(inclureEcriture = false): string {
  const outils = buildWebMcpTools(inclureEcriture);
  return [
    '// Genere par coach-os/adapters/webmcp.ts — ne pas editer a la main.',
    `// ${outils.length} outil(s) declare(s)${inclureEcriture ? ' (ecriture incluse)' : ', categories sures uniquement'}.`,
    '(function () {',
    `  var outils = ${JSON.stringify(outils, null, 2)};`,
    '  function appeler(nom, args) {',
    '    return fetch("/api/tools/" + encodeURIComponent(nom), {',
    '      method: "POST",',
    '      headers: { "content-type": "application/json" },',
    '      body: JSON.stringify(args || {}),',
    '    }).then(function (r) { return r.json(); });',
    '  }',
    '  var cible = (typeof navigator !== "undefined" && navigator.modelContext)',
    '    ? navigator.modelContext',
    '    : (window.__webmcp = window.__webmcp || { tools: [] });',
    '  outils.forEach(function (o) {',
    '    var d = {',
    '      name: o.name,',
    '      description: o.description,',
    '      inputSchema: o.inputSchema,',
    '      execute: function (args) { return appeler(o.name, args); },',
    '    };',
    '    if (typeof cible.registerTool === "function") cible.registerTool(d);',
    '    else cible.tools.push(d);',
    '  });',
    '})();',
  ].join('\n');
}

/**
 * Manifeste declaratif, pour les pages qui preferent une balise statique.
 * Meme contenu, sans fermeture ni appel reseau : la page cable l'execution.
 */
export function buildWebMcpManifest(inclureEcriture = false): Record<string, unknown> {
  return {
    version: 1,
    source: 'coach-os',
    generated_by: 'adapters/webmcp.ts',
    tools: buildWebMcpTools(inclureEcriture),
  };
}
