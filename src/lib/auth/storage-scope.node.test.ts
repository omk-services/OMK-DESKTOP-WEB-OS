/**
 * @vitest-environment node
 *
 * storage-scope.node.test.ts — le module doit se charger SANS navigateur.
 *
 * POURQUOI CE FICHIER EXISTE
 * `/api/v1/tools` rendait 500 `FUNCTION_INVOCATION_FAILED` en production.
 * La cause tenait en un paramètre par défaut :
 *
 *     export function createScopedStorage(backend: Storage = localStorage)
 *
 * Zustand appelle la fonction passée à `createJSONStorage()` à l'ÉVALUATION
 * DU MODULE. Sur Vercel, ce module est chargé dans Node — `localStorage`
 * n'y existe pas, le paramètre par défaut jetait un `ReferenceError`, et la
 * route mourait avant sa première ligne.
 *
 * Rien ne l'attrapait : `tsc` passe (le type existe), les tests passaient
 * (jsdom fournit `localStorage`), et le build Vercel réussit — c'est
 * l'INVOCATION qui échoue. Un défaut invisible partout sauf en production.
 *
 * D'où l'environnement `node` en tête de fichier : c'est la seule façon de
 * reproduire le contexte serverless dans la suite de tests.
 */
import { describe, it, expect } from 'vitest';

describe('storage-scope dans un contexte sans navigateur', () => {
  it('localStorage est bien absent — sinon ce fichier ne teste rien', () => {
    // Garde-fou contre un faux vert : si un jour l'environnement de test
    // fournit `localStorage`, ce fichier passerait sans rien prouver.
    expect(
      typeof localStorage,
      'localStorage est defini : l environnement node n est pas applique, ' +
      'ce test ne reproduit plus le contexte serverless',
    ).toBe('undefined');
  });

  it('le module se charge sans jeter', async () => {
    const mod = await import('./storage-scope');
    expect(mod.createScopedStorage).toBeTypeOf('function');
  });

  it('createScopedStorage() sans argument rend un magasin utilisable', async () => {
    const { createScopedStorage, setScope } = await import('./storage-scope');
    setScope('u-node', 't-node');

    const s = createScopedStorage();
    expect(s).toBeTruthy();

    s.setItem('essai', 'valeur');
    expect(s.getItem('essai')).toBe('valeur');
    s.removeItem('essai');
    expect(s.getItem('essai')).toBeNull();
  });

  it('purgeAllCoachOsKeys ne jette pas non plus', async () => {
    const { purgeAllCoachOsKeys } = await import('./storage-scope');
    expect(() => purgeAllCoachOsKeys()).not.toThrow();
  });

  it('les stores persistes se chargent sans navigateur', async () => {
    // C'est le cas reel : `api/v1/*` importe le catalogue d'outils, qui
    // importe transitivement ces stores. Si l'un d'eux jette a l'import,
    // toute la route tombe.
    await expect(import('../../stores/threeApp.store')).resolves.toBeTruthy();
    await expect(import('../saas-builder/ledger.store')).resolves.toBeTruthy();
  });
});
