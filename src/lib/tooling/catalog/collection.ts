// src/lib/tooling/catalog/collection.ts
// Outils sur les collections du CMS. Trois lectures, trois écritures.
//
// Lecture : list, read, search. Aucun effet de bord. L'agent lit pour
// informer ses décisions.
//
// Écriture : create, update, delete. L'executeur retourne une
// ProposalRef — il ne touche PAS le dataset. La fusion est l'acte qui
// engage, pas l'appel d'outil.

import { z } from 'zod';
import { defineTool } from '../defineTool';
import { deposeProposal, getCollection, listCollections, listItems, searchItems } from '../serverStore';
import type { ToolContext } from '../types';
import type { ProposalRef } from '../types';

const zCollectionId = z.string().min(1).describe('Identifiant canonique de la collection (kebab-case).');

// collection.list — LECTURE
export const collectionList = defineTool({
  name: 'collection.list',
  description: 'Liste les collections du CMS actives pour le tenant (id, nom, nombre d\'items). Lecture seule.',
  category: 'lecture',
  schema: z.object({}),
  displayName: () => 'Lister les collections',
  execute: async () => {
    const cols = listCollections().map((c) => ({
      id: c.id,
      name: c.name,
      singular: c.singular,
      titleField: c.titleField,
      itemCount: listItems(c.id).length,
    }));
    return { ok: true, data: { count: cols.length, collections: cols } };
  },
});

// collection.read — LECTURE
export const collectionRead = defineTool({
  name: 'collection.read',
  description: 'Lit les items d\'une collection. Renvoie id, titre, et les champs bruts.',
  category: 'lecture',
  schema: z.object({
    collectionId: zCollectionId,
    limit: z.number().int().positive().max(500).optional().describe('Plafond du nombre d\'items rendus (défaut 100).'),
  }),
  displayName: (args) => `Lire ${args.collectionId}`,
  execute: async (args) => {
    const def = getCollection(args.collectionId);
    if (!def) return { ok: false, error: `Collection inconnue : "${args.collectionId}".` };
    const items = listItems(args.collectionId).slice(0, args.limit ?? 100);
    return {
      ok: true,
      data: {
        collectionId: def.id,
        titleField: def.titleField,
        count: items.length,
        items: items.map((it) => ({
          id: String(it.id),
          title: String(it[def.titleField] ?? it.id),
          raw: it,
        })),
      },
    };
  },
});

// collection.search — LECTURE
export const collectionSearch = defineTool({
  name: 'collection.search',
  description: 'Recherche textuelle dans toutes les collections. Renvoie les items les plus pertinents avec un extrait.',
  category: 'lecture',
  schema: z.object({
    query: z.string().min(1).describe('Texte cherché (case-insensitive).'),
    limit: z.number().int().positive().max(50).optional().describe('Plafond du nombre de hits (défaut 20).'),
  }),
  displayName: (args) => `Chercher "${args.query}"`,
  execute: async (args) => {
    const hits = searchItems(args.query, args.limit ?? 20);
    return { ok: true, data: { query: args.query, count: hits.length, hits } };
  },
});

// collection.create — ÉCRITURE
export const collectionCreate = defineTool({
  name: 'collection.create',
  description: 'PROPOSE la création d\'un item dans une collection. Ne touche PAS les données réelles : la proposition atterrit dans la file d\'approbation. Le champ titre (titleField) est obligatoire.',
  category: 'ecriture',
  schema: z.object({
    collectionId: zCollectionId,
    fields: z.record(z.string(), z.unknown()).describe('Champs de l\'item. Doit inclure le titleField.'),
    rationale: z.string().optional().describe('Pourquoi cette création (affichée dans la file).'),
    actorId: z.string().optional().describe('Identifiant de l\'agent qui propose (par défaut "agent:cli").'),
  }),
  displayName: (args) => {
    const def = getCollection(args.collectionId);
    const title = String(args.fields[def?.titleField ?? 'title'] ?? '');
    return def ? `Créer ${def.singular} : ${title}` : `Créer dans ${args.collectionId}`;
  },
  execute: async (args, ctx: ToolContext): Promise<{ ok: true; data: ProposalRef } | { ok: false; error: string }> => {
    const def = getCollection(args.collectionId);
    if (!def) return { ok: false, error: `Collection inconnue : "${args.collectionId}".` };
    const titleField = args.fields[def.titleField];
    if (titleField === undefined || titleField === null || titleField === '') {
      return { ok: false, error: `fields.${def.titleField} est obligatoire.` };
    }
    const scenarioId = `scn_${ctx.tenantId}_${Date.now().toString(36)}`;
    const displayName = def
      ? `Créer ${def.singular} : ${String(titleField)}`
      : `Créer dans ${args.collectionId}`;
    const record = await deposeProposal({
      scenarioId,
      toolName: 'collection.create',
      args: { collectionId: args.collectionId, fields: args.fields },
      displayName,
      rationale: args.rationale,
      actorId: args.actorId ?? ctx.actorId,
    });
    return { ok: true, data: { scenarioId: record.scenarioId, proposalId: record.id } };
  },
});

// collection.update — ÉCRITURE
export const collectionUpdate = defineTool({
  name: 'collection.update',
  description: 'PROPOSE la modification d\'un item existant. Patch partiel, clés inconnues ignorées. La proposition n\'écrit rien directement.',
  category: 'ecriture',
  schema: z.object({
    collectionId: zCollectionId,
    id: z.string().min(1).describe('Identifiant de l\'item à modifier.'),
    patch: z.record(z.string(), z.unknown()).describe('Patch à appliquer.'),
    rationale: z.string().optional(),
    actorId: z.string().optional(),
  }),
  displayName: (args) => `Modifier ${args.collectionId}#${args.id}`,
  execute: async (args, ctx: ToolContext) => {
    const def = getCollection(args.collectionId);
    if (!def) return { ok: false, error: `Collection inconnue : "${args.collectionId}".` };
    const items = listItems(args.collectionId);
    const target = items.find((it) => String(it.id) === args.id);
    if (!target) return { ok: false, error: `Item introuvable : "${args.id}" dans "${args.collectionId}".` };
    const titleField = target[def.titleField];
    const scenarioId = `scn_${ctx.tenantId}_${Date.now().toString(36)}`;
    const record = await deposeProposal({
      scenarioId,
      toolName: 'collection.update',
      args: { collectionId: args.collectionId, id: args.id, patch: args.patch },
      displayName: `Modifier ${def.singular} : ${String(titleField ?? args.id)}`,
      rationale: args.rationale,
      actorId: args.actorId ?? ctx.actorId,
    });
    return { ok: true, data: { scenarioId: record.scenarioId, proposalId: record.id } };
  },
});

// collection.delete — ÉCRITURE
export const collectionDelete = defineTool({
  name: 'collection.delete',
  description: 'PROPOSE la suppression d\'un item. Aucune ligne n\'est retirée tant qu\'un humain n\'a pas approuvé.',
  category: 'ecriture',
  schema: z.object({
    collectionId: zCollectionId,
    id: z.string().min(1).describe('Identifiant de l\'item à supprimer.'),
    rationale: z.string().optional(),
    actorId: z.string().optional(),
  }),
  displayName: (args) => `Supprimer ${args.collectionId}#${args.id}`,
  execute: async (args, ctx: ToolContext) => {
    const def = getCollection(args.collectionId);
    if (!def) return { ok: false, error: `Collection inconnue : "${args.collectionId}".` };
    const items = listItems(args.collectionId);
    const target = items.find((it) => String(it.id) === args.id);
    if (!target) return { ok: false, error: `Item introuvable : "${args.id}" dans "${args.collectionId}".` };
    const titleField = target[def.titleField];
    const scenarioId = `scn_${ctx.tenantId}_${Date.now().toString(36)}`;
    const record = await deposeProposal({
      scenarioId,
      toolName: 'collection.delete',
      args: { collectionId: args.collectionId, id: args.id },
      displayName: `Supprimer ${def.singular} : ${String(titleField ?? args.id)}`,
      rationale: args.rationale,
      actorId: args.actorId ?? ctx.actorId,
    });
    return { ok: true, data: { scenarioId: record.scenarioId, proposalId: record.id } };
  },
});

export const collectionTools = [
  collectionList,
  collectionRead,
  collectionSearch,
  collectionCreate,
  collectionUpdate,
  collectionDelete,
];
