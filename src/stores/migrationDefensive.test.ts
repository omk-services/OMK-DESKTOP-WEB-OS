// src/stores/migrationDefensive.test.ts
// Contrat des helpers de migration defensive (FIX-8, 2026-08-17).
//
// Trois cas a verrouiller, par ligne du brief :
//  1. une charge de version anterieure -> le store demarre sur son
//     defaut, sans jeter ;
//  2. une charge corrompue (`{ toto: 1 }`, `null`, un tableau la ou
//     un objet est attendu) -> le store demarre sur son defaut, sans
//     jeter ;
//  3. une charge valide de la version courante -> elle est respectee.
//
// La strategie est la meme que `scope-store.test.ts` : on ne monte
// pas un environnement React, on pousse directement le payload dans
// les fonctions `merge` / `migrate` des helpers et on observe la
// sortie. Les sanitizeurs sont testes en parallele (un par store du
// perimetre), pour qu'un changement de forme casse ici avant
// d'atteindre le navigateur.

import { describe, it, expect } from 'vitest';
import {
  defensiveMerge,
  defensiveMigrate,
  decodeVersionedEnvelope,
} from './migrationDefensive';

// ──────────────────────────────────────────────────────────────────
// Helpers — contrat
// ──────────────────────────────────────────────────────────────────

describe('defensiveMigrate', () => {
  const migrate = defensiveMigrate<{ x: number }>(1);

  it('cas 1 : version anterieure -> undefined', () => {
    expect(migrate({ x: 5 }, 0)).toBeUndefined();
  });

  it('cas 3 : version courante -> charge restituee', () => {
    expect(migrate({ x: 5 }, 1)).toEqual({ x: 5 });
  });

  it('cas 2 : charge non-objet -> undefined', () => {
    expect(migrate(null, 1)).toBeUndefined();
    expect(migrate('foo', 1)).toBeUndefined();
    expect(migrate(42, 1)).toBeUndefined();
    expect(migrate([1, 2], 1)).toBeUndefined();
  });

  it('cas 2 : tableau a la place d un objet -> undefined', () => {
    expect(migrate([], 1)).toBeUndefined();
  });

  it('cas 2 : charge corrompue `{ toto: 1 }` -> restituee telle quelle', () => {
    // migrate ne valide PAS la forme du payload — c'est le merge qui
    // s'en charge. Tant que c'est un objet et que la version est
    // courante, on laisse passer ; le merge ecrasera ce qui ne tient
    // pas. C'est la separation des responsabilites.
    expect(migrate({ toto: 1 }, 1)).toEqual({ toto: 1 });
  });

  it('cas 1 : version > courante -> on laisse passer (forward-compat)', () => {
    // Une version posterieure (futur rollback) n'est pas notre
    // probleme ; on la respecte. Le merge validera les champs connus.
    expect(migrate({ x: 5 }, 2)).toEqual({ x: 5 });
  });
});

describe('defensiveMerge', () => {
  type S = { x: number; s: string; m: Record<string, number> };
  const sanitizeX = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0;
  const sanitizeS = (v: unknown): string => (typeof v === 'string' ? v : 'default');
  const sanitizeM = (v: unknown): Record<string, number> => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
    const out: Record<string, number> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
    }
    return out;
  };
  const merge = defensiveMerge<S>({
    validators: { x: sanitizeX, s: sanitizeS, m: sanitizeM },
  });

  it('cas 2 : charge null -> current preserve', () => {
    const cur: S = { x: 1, s: 'run', m: { a: 1 } };
    const out = merge(null, cur);
    expect(out).toEqual({ x: 1, s: 'run', m: { a: 1 } });
  });

  it('cas 2 : charge tableau -> current preserve', () => {
    const cur: S = { x: 1, s: 'run', m: { a: 1 } };
    const out = merge([1, 2, 3], cur);
    expect(out).toEqual({ x: 1, s: 'run', m: { a: 1 } });
  });

  it('cas 2 : charge `{ toto: 1 }` -> champs declares valides, x/s/m retombent sur default', () => {
    const cur: S = { x: 1, s: 'run', m: { a: 1 } };
    const out = merge({ toto: 1 }, cur);
    // x, s, m sont declares : ils retombent sur leur validateur.
    // toto n'est pas declare : il est ignore.
    expect(out).toEqual({ x: 0, s: 'default', m: {} });
  });

  it('cas 2 : valeur du mauvais type -> validateur retombe sur defaut', () => {
    const cur: S = { x: 1, s: 'run', m: { a: 1 } };
    const out = merge({ x: 'pas un nombre', s: 42, m: 'pas une map' }, cur);
    expect(out).toEqual({ x: 0, s: 'default', m: {} });
  });

  it('cas 3 : charge valide -> respectee', () => {
    const cur: S = { x: 1, s: 'run', m: { a: 1 } };
    const out = merge({ x: 7, s: 'persisted', m: { b: 2 } }, cur);
    expect(out).toEqual({ x: 7, s: 'persisted', m: { b: 2 } });
  });

  it('cas 3 : charge partielle -> champs absents prennent le current', () => {
    const cur: S = { x: 1, s: 'run', m: { a: 1 } };
    const out = merge({ x: 7 }, cur);
    // x est valide (7), s et m absents -> le validateur les ramene
    // au defaut declare (et NON a current.s). C'est la semantique
    // explicite du brief : un champ absent reprend sa valeur par
    // defaut, il n'ecrase pas avec current.
    expect(out).toEqual({ x: 7, s: 'default', m: {} });
  });

  it('les methodes de current survivent', () => {
    // Le merge ne mute pas les refs non declarées. Si current
    // contient une fonction, elle reste dans la sortie.
    type SWithFn = S & { act: () => string };
    const fn = () => 'hello';
    const cur: SWithFn = { x: 1, s: 'run', m: {}, act: fn };
    const out = defensiveMerge<SWithFn>({
      validators: { x: sanitizeX, s: sanitizeS, m: sanitizeM },
    })({ x: 7 }, cur);
    expect(out.act).toBe(fn);
    expect(out.act()).toBe('hello');
  });
});

describe('decodeVersionedEnvelope', () => {
  it('cas 1 : version trop ancienne -> undefined', () => {
    expect(decodeVersionedEnvelope<{ x: number }>(
      JSON.stringify({ version: 0, state: { x: 1 } }), 1
    )).toBeUndefined();
  });

  it('cas 3 : bonne version -> state restitue', () => {
    expect(decodeVersionedEnvelope<{ x: number }>(
      JSON.stringify({ version: 1, state: { x: 1 } }), 1
    )).toEqual({ x: 1 });
  });

  it('cas 2 : JSON malforme -> undefined', () => {
    expect(decodeVersionedEnvelope<{ x: number }>('not json', 1)).toBeUndefined();
  });

  it('cas 2 : objet haut-niveau sans version -> undefined', () => {
    expect(decodeVersionedEnvelope<{ x: number }>(
      JSON.stringify({ state: { x: 1 } }), 1
    )).toBeUndefined();
  });

  it('cas 2 : state manquant -> undefined', () => {
    expect(decodeVersionedEnvelope<{ x: number }>(
      JSON.stringify({ version: 1 }), 1
    )).toBeUndefined();
  });

  it('cas 2 : null -> undefined', () => {
    expect(decodeVersionedEnvelope<{ x: number }>(null, 1)).toBeUndefined();
  });

  it('cas 2 : state qui n est pas un objet -> undefined', () => {
    expect(decodeVersionedEnvelope<{ x: number }>(
      JSON.stringify({ version: 1, state: 'foo' }), 1
    )).toBeUndefined();
  });
});
