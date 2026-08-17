// src/lib/tooling/catalog/scenario.ts
// Outils sur la file d'approbation. Trois opérations : proposer
// (déjà couvert par les outils 'ecriture' des autres catalogues),
// approuver, rejeter.
//
// Pour la V1 le serveur ne peut pas approuver à la place de l'humain :
// ces outils listent l'état de la file, et rendent la commande exacte
// à exécuter. La sécurité ici n'est pas technique — elle est que
// « approve » et « reject » sont des gestes séparés, versionnés, et
// qu'ils ne modifient rien d'eux-mêmes.

import { z } from 'zod';
import { defineTool } from '../defineTool';
import { getProposal, listProposals } from '../serverStore';
import { htmlApprobations } from '../ui/approbations';
import type { ToolContext } from '../types';

const zProposalId = z.string().min(1).describe('Identifiant de la proposition (préfixe p_).');

// scenario.list — LECTURE
export const scenarioList = defineTool({
  name: 'scenario.list',
  description: 'Liste les propositions en attente, triées par date (récent d\'abord). Lecture seule.',
  category: 'lecture',
  schema: z.object({
    limit: z.number().int().positive().max(200).optional().describe('Plafond (défaut 50).'),
  }),
  displayName: () => 'Lister les propositions',
  // MCP Apps : cet outil rend une INTERFACE, pas un bloc de texte. L'hote
  // precharge la page et l'affiche dans la conversation ; les boutons
  // rappellent scenario.approve / scenario.reject par le canal sécurisé.
  // Aucune origine externe autorisee — voir ui/approbations.ts.
  ui: {
    id: 'approbations',
    title: "File d'approbation",
    html: htmlApprobations,
    csp: { connectSrc: [], resourceSrc: [] },
  },
  execute: async (args, ctx: ToolContext) => {
    const props = (await listProposals(ctx.tenantId)).slice(0, args.limit ?? 50);
    return {
      ok: true,
      data: {
        count: props.length,
        proposals: props.map((p) => ({
          id: p.id,
          scenarioId: p.scenarioId,
          tenantId: p.tenantId,
          toolName: p.toolName,
          displayName: p.displayName,
          actorId: p.actorId,
          createdAt: p.createdAt,
          rationale: p.rationale,
        })),
      },
    };
  },
});

// scenario.read — LECTURE
export const scenarioRead = defineTool({
  name: 'scenario.read',
  description: 'Lit une proposition : args exacts, displayName, rationale. Pour qu\'un humain puisse trancher en lisant.',
  category: 'lecture',
  schema: z.object({
    proposalId: zProposalId,
  }),
  displayName: (args) => `Lire proposition ${args.proposalId}`,
  execute: async (args, ctx: ToolContext) => {
    const prop = await getProposal(ctx.tenantId, args.proposalId);
    if (!prop) return { ok: false, error: `Proposition introuvable : "${args.proposalId}".` };
    return { ok: true, data: prop };
  },
});

// scenario.approve — ces deux outils retournent une instruction, pas
// une action. Un humain doit ensuite l'exécuter via le client.
// Implémenter l'approbation automatique trahirait le rang 1 de
// ARCHITECTURE_V1.

export const scenarioApprove = defineTool({
  name: 'scenario.approve',
  description: 'INSTRUCTION D\'APPROBATION. Ne touche pas aux données : rend la commande exacte que l\'humain doit exécuter (Approve & Merge dans la file d\'approbation côté client). Le serveur refuse d\'appliquer à la place de l\'humain.',
  category: 'navigation',
  schema: z.object({
    proposalId: zProposalId,
    rationale: z.string().optional().describe('Justification humaine (optionnelle).'),
  }),
  displayName: (args) => `Approuver ${args.proposalId}`,
  execute: async (args, ctx: ToolContext) => {
    const prop = await getProposal(ctx.tenantId, args.proposalId);
    if (!prop) return { ok: false, error: `Proposition introuvable : "${args.proposalId}".` };
    return {
      ok: true,
      data: {
        proposalId: prop.id,
        toolName: prop.toolName,
        instruction: 'approve_and_merge',
        clientCommand: { type: 'approveProposal', proposalId: prop.id },
        warning: 'Aucun système ne doit auto-appliquer ces propositions. Le client attend un geste humain.',
      },
    };
  },
});

export const scenarioReject = defineTool({
  name: 'scenario.reject',
  description: 'INSTRUCTION DE REJET. Renvoie la commande exacte à passer au client. Pas d\'effet de bord.',
  category: 'navigation',
  schema: z.object({
    proposalId: zProposalId,
    reason: z.string().optional().describe('Raison du rejet (optionnelle).'),
  }),
  displayName: (args) => `Rejeter ${args.proposalId}`,
  execute: async (args, ctx: ToolContext) => {
    const prop = await getProposal(ctx.tenantId, args.proposalId);
    if (!prop) return { ok: false, error: `Proposition introuvable : "${args.proposalId}".` };
    return {
      ok: true,
      data: {
        proposalId: prop.id,
        toolName: prop.toolName,
        instruction: 'reject',
        clientCommand: { type: 'rejectProposal', proposalId: prop.id, reason: args.reason },
        warning: 'Aucun système ne doit auto-rejeter ces propositions. Le client attend un geste humain.',
      },
    };
  },
});

export const scenarioTools = [scenarioList, scenarioRead, scenarioApprove, scenarioReject];
