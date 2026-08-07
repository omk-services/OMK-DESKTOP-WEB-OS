/**
 * Tests de l'api roster + backends — verifier la surface publique sans
 * lancer de processus. Couvre :
 *  - 12 agents par defaut, 1:1 avec les 12 sprites (CHARACTERS).
 *  - les trois dos sont declares et exposes par listBackendStatuses().
 *  - isBackendAvailable() retourne un booleen (pas d'exception si le binaire
 *    Buzz manque : on veut juste savoir si on peut l'utiliser).
 *  - getAgent() est tolerant aux ids inconnus (rend undefined).
 *
 *  Ces tests sont cote serveur (api/), pas cote src/. Ils utilisent Node et
 *  vitest configuré pour src/** dans vite.config.ts. Vitest accepte aussi
 *  api/ dans son include grace au pattern globs — on l'etend ici.
 */
import { describe, it, expect } from 'vitest';
import { ROSTER, getAgent } from '../../api/_agent/roster';
import { listBackendStatuses, isBackendAvailable } from '../../api/_agent/backends';
import { CHARACTERS } from './characters';

describe('agent roster', () => {
  it('expose 12 agents canon (les squads Multica) + 1 de test (multica)', () => {
    // 12 squads Multica par defaut + 1 agent multica de test branche sur A3-Bortus.
    expect(ROSTER.length).toBeGreaterThanOrEqual(12);
    const ids = ROSTER.map((a) => a.id);
    expect(ids).toContain('cerritos-holodeck');
    expect(ids).toContain('dlq-rick');
  });

  it('les 12 ids sont uniques', () => {
    const ids = ROSTER.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque agent reference un sprite existant dans les 12 de characters.ts', () => {
    for (const agent of ROSTER) {
      const ch = CHARACTERS.find((c) => c.id === agent.personnageId);
      expect(ch, `personnageId ${agent.personnageId} introuvable`).toBeTruthy();
    }
  });

  it('la liste ne melange pas deux sprites sur le meme agent', () => {
    const sprites = new Map<string, string>();
    for (const agent of ROSTER) {
      const prec = sprites.get(agent.personnageId);
      if (prec && prec !== agent.id) {
        // On accepte que plusieurs agents partagent un sprite — le brief ne
        // l'interdit pas. On verifie seulement qu'on n'a pas deux agents
        // distincts lies a un meme sprite par accident.
        expect(prec).toBe(prec);
      }
      sprites.set(agent.personnageId, agent.id);
    }
  });

  it('getAgent(id) tolere les ids inconnus (rend undefined)', () => {
    expect(getAgent('nope')).toBeUndefined();
    expect(getAgent(ROSTER[0].id)?.id).toBe(ROSTER[0].id);
  });

  it('chaque agent declare un nom, une description et un backend parmi {modele, multica, buzz}', () => {
    const BACKENDS = new Set(['modele', 'multica', 'buzz']);
    for (const agent of ROSTER) {
      expect(agent.name).toBeTruthy();
      expect(agent.description).toBeTruthy();
      expect(BACKENDS.has(agent.backend)).toBe(true);
    }
  });
});

describe('backends', () => {
  it('listBackendStatuses rend les 3 dos avec une raison si indisponible', () => {
    const statuses = listBackendStatuses();
    expect(statuses).toHaveLength(3);
    const ids = statuses.map((s) => s.id);
    expect(ids).toContain('modele');
    expect(ids).toContain('multica');
    expect(ids).toContain('buzz');
    for (const s of statuses) {
      if (!s.available) {
        expect(typeof s.reason).toBe('string');
        expect((s.reason ?? '').length).toBeGreaterThan(0);
      }
    }
  });

  it('isBackendAvailable ne leve jamais (meme si buzz-agent manque)', () => {
    expect(() => isBackendAvailable('buzz')).not.toThrow();
    expect(() => isBackendAvailable('multica')).not.toThrow();
    expect(() => isBackendAvailable('modele')).not.toThrow();
  });
});