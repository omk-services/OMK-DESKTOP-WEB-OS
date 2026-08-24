// src/lib/tooling/adapters/acp.ts
// Agent Client Protocol — la surface qui rend Coach OS pilotable.
//
// SENS DU FLUX, ET POURQUOI IL COMPTE
//
// MCP : l'agent atteint un outil.        agent -> outil
// ACP : un client pilote l'agent.        client -> agent
//
// C'est l'inverse, et c'est exactement l'etage de l'agnosticite de harnais :
// un editeur qui parle ACP pilote n'importe quel agent ACP. Sans cette
// surface, chaque integration d'editeur est un cablage proprietaire.
//
// Enveloppes JSON-RPC. Version stable 1. La poignee de main `initialize`
// echange `protocolVersion` et `capabilities` avant tout echange.
// Reference : https://github.com/agentclientprotocol/agent-client-protocol

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

export const ACP_PROTOCOL_VERSION = 1;

export interface AcpCapabilites {
  protocolVersion: number;
  agent: {
    name: string;
    version: string;
    /** Ce que Coach OS sait faire quand un client le pilote. */
    capabilities: {
      tools: boolean;
      sessions: boolean;
      streaming: boolean;
      /** Faux, et delibere : aucun agent n'engage de valeur sans mandat humain. */
      payments: boolean;
    };
  };
}

export function buildAcpInitialize(): AcpCapabilites {
  return {
    protocolVersion: ACP_PROTOCOL_VERSION,
    agent: {
      name: 'coach-os',
      version: '1',
      capabilities: { tools: true, sessions: true, streaming: false, payments: false },
    },
  };
}

/** Descripteurs d'outils au format ACP. Meme registre que MCP, enveloppe differente. */
export function buildAcpTools(): Array<Record<string, unknown>> {
  return list().map((t: ToolDefinition) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToInputSchema(t.schema),
    // ACP ne connait pas nos categories : on les passe en annotation plutot
    // que de les perdre. Un client qui les ignore reste conforme.
    annotations: { category: t.category },
  }));
}

/**
 * Reponse a une enveloppe JSON-RPC entrante.
 *
 * Une methode inconnue rend -32601, jamais un succes vide : un client doit
 * pouvoir distinguer « pas implemente » de « rien a dire ».
 */
export function handleAcp(
  methode: string,
  // Non lu pour l'instant : aucune methode geree ici ne consomme de params.
  // Conserve dans la signature publique pour que l'appelant (routeur ACP)
  // n'ait pas a distinguer les methodes qui en ont besoin de celles qui n'en
  // ont pas — a activer le jour ou 'tools/call' rejoint ce switch.
  _params: Record<string, unknown> | undefined,
  id: string | number | null,
): Record<string, unknown> {
  const enveloppe = (result: unknown) => ({ jsonrpc: '2.0', id, result });
  const erreur = (code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

  switch (methode) {
    case 'initialize':
      return enveloppe(buildAcpInitialize());
    case 'tools/list':
      return enveloppe({ tools: buildAcpTools() });
    case 'session/new':
      return enveloppe({ sessionId: `coach-os-${Date.now()}` });
    default:
      return erreur(-32601, `methode inconnue : ${methode}`);
  }
}
