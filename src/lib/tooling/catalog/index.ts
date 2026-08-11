// src/lib/tooling/catalog/index.ts
// Un point d'enregistrement par catalogue. Importé une fois, à l'init
// du runtime, après quoi les adaptateurs lisent `list()`.

import { register } from '../registry';
import { collectionTools } from './collection';
import { appTools } from './app';
import { scenarioTools } from './scenario';

let _registered = false;

export function registerAll(): void {
  if (_registered) return;
  for (const t of [...collectionTools, ...appTools, ...scenarioTools]) {
    register(t);
  }
  _registered = true;
}

registerAll();

export { collectionTools, appTools, scenarioTools };
export * from './collection';
export * from './app';
export * from './scenario';
