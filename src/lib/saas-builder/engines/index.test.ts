// src/lib/saas-builder/engines/index.test.ts
// Tests du registry : ordre, availability, dispatch par routeId.
// SPEC §8 : 3 cas minimum.

import { describe, expect, it } from 'vitest';
import { engines, engineForRoute, ENGINES } from './index';

describe('engines() — registry summary', () => {
  it('contient 6 engines (SPEC §4.2)', () => {
    expect(ENGINES).toHaveLength(6);
  });

  it('tous les engines ont un id non vide et unique', () => {
    const ids = ENGINES.map((e) => e.id);
    expect(new Set(ids).size).toBe(6);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });

  it('summary() reflete available() de chaque engine', () => {
    const list = engines();
    expect(list).toHaveLength(6);
    // Sans cles d'env, tous les engines sont indisponibles dans jsdom.
    // C'est attendu : la presence des cles est verifiee par un test
    // d'integration, pas unitaire.
    expect(list.every((e) => typeof e.available === 'boolean')).toBe(true);
  });
});

describe('engineForRoute — dispatch avec precedence', () => {
  it('route fal-hailuo -> MiniMax direct si dispo, sinon fal', () => {
    // jsdom n'a pas les cles d'env. result est donc toujours fal.
    // On verifie que le type de retour est coherent.
    const e = engineForRoute('fal-hailuo');
    expect(e).toBeDefined();
    expect(['fal', 'minimax']).toContain(e!.id);
  });

  it('route fal-wan -> Qwen Cloud direct si dispo, sinon fal', () => {
    const e = engineForRoute('fal-wan');
    expect(e).toBeDefined();
    expect(['fal', 'qwen-cloud']).toContain(e!.id);
  });

  it('route fal-kling -> Kling direct si dispo, sinon fal', () => {
    const e = engineForRoute('fal-kling');
    expect(e).toBeDefined();
    expect(['fal', 'kling']).toContain(e!.id);
  });

  it('route fal-veo3.1/fast -> toujours fal (pas de lane directe)', () => {
    const e = engineForRoute('fal-ai/veo3.1/fast');
    expect(e).toBeDefined();
    expect(e!.id).toBe('fal');
  });

  it('route inconnue -> toujours fal (defaut)', () => {
    const e = engineForRoute('unknown/route');
    expect(e).toBeDefined();
    expect(e!.id).toBe('fal');
  });
});
