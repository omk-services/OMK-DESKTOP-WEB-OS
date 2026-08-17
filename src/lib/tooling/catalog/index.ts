// src/lib/tooling/catalog/index.ts
// Un point d'enregistrement par catalogue. Importé une fois, à l'init
// du runtime, après quoi les adaptateurs lisent `list()`.

import { register } from '../registry';
import { collectionTools } from './collection';
import { appTools } from './app';
import { scenarioTools } from './scenario';
import { saasBuilderTools } from './saasBuilder';

let _registered = false;

export function registerAll(): void {
  if (_registered) return;
  for (const t of [...collectionTools, ...appTools, ...scenarioTools, ...saasBuilderTools]) {
    register(t);
  }
  _registered = true;
}

registerAll();

export { collectionTools, appTools, scenarioTools, saasBuilderTools };
export * from './collection';
export * from './app';
export * from './scenario';
export * from './saasBuilder';
