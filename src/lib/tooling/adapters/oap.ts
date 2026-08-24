// src/lib/tooling/adapters/oap.ts
// OAP — Open Agent Protocol. Interoperabilite entre frameworks d agents.
//
// LE PROBLEME QU IL FERME
//
// Chaque framework nomme les memes choses differemment. Un « tool » ici est une
// « function » la, un « plugin » ailleurs. OAP pose un vocabulaire pivot pour
// qu un agent ecrit sous un framework soit lisible par un autre.
//
// C est l interoperabilite au niveau du VOCABULAIRE — la ou le bridge la traite
// au niveau du HARNAIS. Les deux sont necessaires : router vers un harnais qui
// ne comprend pas le mot « outil » ne route rien.

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

export type Framework = 'langchain' | 'llamaindex' | 'autogen' | 'crewai' | 'semantic-kernel';

/** Le mot que chaque framework emploie pour la meme chose. */
const LEXIQUE: Record<Framework, { outil: string; agent: string; tache: string }> = {
  langchain: { outil: 'tool', agent: 'agent', tache: 'chain' },
  llamaindex: { outil: 'tool', agent: 'agent', tache: 'workflow' },
  autogen: { outil: 'function', agent: 'assistant', tache: 'conversation' },
  crewai: { outil: 'tool', agent: 'agent', tache: 'task' },
  'semantic-kernel': { outil: 'plugin', agent: 'planner', tache: 'function' },
};

export function lexique(f: Framework) {
  return LEXIQUE[f];
}

export interface DescripteurOAP {
  oap_version: 1;
  provider: 'coach-os';
  /** Vocabulaire pivot : neutre, aucun framework privilegie. */
  capabilities: Array<{
    id: string;
    kind: 'tool';
    description: string;
    input: Record<string, unknown>;
    effects: 'none' | 'durable';
  }>;
}

export function buildOAP(): DescripteurOAP {
  return {
    oap_version: 1,
    provider: 'coach-os',
    capabilities: list().map((t: ToolDefinition) => ({
      id: t.name,
      kind: 'tool' as const,
      description: t.description,
      input: zodToInputSchema(t.schema),
      effects: t.category === 'ecriture' ? ('durable' as const) : ('none' as const),
    })),
  };
}

/** Rend le descripteur habille du vocabulaire d un framework donne. */
export function pourFramework(f: Framework): Record<string, unknown> {
  const l = LEXIQUE[f];
  const d = buildOAP();
  return {
    framework: f,
    [`${l.outil}s`]: d.capabilities.map((c) => ({
      name: c.id,
      description: c.description,
      parameters: c.input,
    })),
  };
}
