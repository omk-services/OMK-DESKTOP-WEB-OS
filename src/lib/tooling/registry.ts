// src/lib/tooling/registry.ts
// Catalogue des outils découverts. Tous les adaptateurs lisent ici ; le
// client (in-app) aussi.
//
// Format : name -> ToolDefinition. Sur le client, les outils 'lecture'
// et 'navigation' sont exécutables immédiatement. Les outils 'ecriture'
// passent par l'in-app adapter qui dépose une proposition avant toute
// exécution.
//
// L'enregistrement se fait à l'import. Un fichier `catalog/index.ts`
// appelle `register(tool)` pour chaque outil. C'est statique, pas
// dynamique — pas de plugin tiers au runtime dans la V1.

import type { ToolDefinition } from './types';

const _tools: Map<string, ToolDefinition> = new Map();
const _listeners: Set<() => void> = new Set();

export function register(tool: ToolDefinition): void {
  if (_tools.has(tool.name)) {
    // On refuse les doublons silencieux. Un outil enregistré deux fois
    // est un bug de catalogue, pas un cas rare.
    throw new Error(`Outil déjà enregistré : "${tool.name}".`);
  }
  _tools.set(tool.name, tool);
  _notify();
}

export function get(name: string): ToolDefinition | undefined {
  return _tools.get(name);
}

export function list(): ToolDefinition[] {
  return Array.from(_tools.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function listByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return list().filter((t) => t.category === category);
}

/** Pour les tests et la régénération de la doc. Recharge tout le
 *  catalogue à partir d'un import frais. */
export function reset(): void {
  _tools.clear();
  _notify();
}

export function subscribe(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notify(): void {
  for (const fn of _listeners) {
    try {
      fn();
    } catch {
      // Une notification qui plante n'invalide pas le catalogue.
    }
  }
}
