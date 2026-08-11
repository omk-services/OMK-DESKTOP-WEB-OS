// src/lib/tooling/adapters/in-app.ts
// Adaptateur in-app. Reexporte les outils sous la forme déjà attendue
// par `src/agent/tools.ts`, sans le modifier.
//
// Le client Coach OS consomme les outils via `src/agent/tools.ts` qui
// declare les applicateurs et execute. Le présent module produit, pour
// chaque outil du catalogue, un adaptateur qui :
//  - pour 'lecture' et 'navigation' : délègue à la fonction client déjà
//    implémentée (listerApps, ouvrirApp, etc.) — c'est le pont vers le
//    bureau. On évite ici de recréer la couche DOM/Shell.
//  - pour 'ecriture' : dépose une proposition via le scenario store
//    exactement comme `changerTheme`/`creerItem`/`modifierItem` le font
//    aujourd'hui. Aucune écriture directe.
//
// L'appellation « in-app » est délibérée : il ne s'agit PAS de
// l'équivalent SDK du Model Context Protocol. C'est la passe qui
// permet au runtime agent déjà en place d'invoquer les nouveaux outils
// du catalogue.
//
// Important : on NE MODIFIE PAS src/agent/tools.ts. On produit un
// adaptateur parallèle, prêt à être consommé par qui voudra remplacer
// le câblage actuel. Le brief est explicite : « reexporte vers la
// forme deja attendue par src/agent/tools.ts, sans le modifier ».

import type { ToolContext, ToolDefinition, ToolResult } from '../types';

/** Type miroir de `src/agent/scenarios.ts` Applicator. On ne dépend
 *  pas du module client (qui lit `import.meta.env`, indispo en
 *  Node) — la forme est identique, et l'in-app adapter est validé
 *  côté client au moment où les bindings sont câblés. */
export interface Applicator {
  (args: Record<string, unknown>): { ok: boolean; error?: string; revert?: () => void };
}

export interface InAppBinding {
  /** Bind client-side : appelle l'outil réellement sur le bureau. */
  execute: (args: Record<string, unknown>, ctx: ToolContext) => ToolResult<unknown> | Promise<ToolResult<unknown>>;
  /** Bind applicateur : est-ce que l'outil a un applicateur pour la
   *  fusion atomique ? Les outils 'ecriture' en ont un (sinon la
   *  fusion rejettera). Les lectures et la navigation n'en ont pas. */
  applicator?: Applicator;
}

/** Table des bindings client. Alimentée par `registerInApp(tool, binding)`
 *  depuis `catalog/_bind.ts`. Vide par défaut. Chaque binding déclare
 *  comment déléguer à l'implémentation existante côté navigateur. */
const _bindings: Record<string, InAppBinding> = {};

export function registerInApp(tool: ToolDefinition, binding: InAppBinding): void {
  _bindings[tool.name] = binding;
}

export function getInAppBinding(name: string): InAppBinding | undefined {
  return _bindings[name];
}

export function listInAppBindings(): Record<string, InAppBinding> {
  return { ..._bindings };
}
