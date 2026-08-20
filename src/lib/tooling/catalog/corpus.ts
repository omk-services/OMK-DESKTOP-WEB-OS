// src/lib/tooling/catalog/corpus.ts
// Le corpus OKF d'A'Space OS V3, exposé par l'adaptateur.
//
// POURQUOI CES OUTILS SONT ICI ET PAS DANS UN FRAMEWORK
// Quatre gestes suffisent à opérer 424 concepts : lire, inventorier,
// apposer un verdict, enregistrer une vague. Définis une fois en Zod,
// ils sortent sur les sept surfaces de l'adaptateur — REST, MCP, MCP
// Apps, CLI, skill, harness, in-app — sans une dépendance de plus.
//
// LA CONVERGENCE QUI DÉCIDE DE LA CATÉGORIE
// La règle absolue de ce dépôt — « une écriture ne touche jamais les
// données réelles, elle dépose une proposition qu'un humain arbitre » —
// et la règle absolue d'OKF — « rien ne passe de `machine` à `humain`
// sans le propriétaire du produit » — sont la MÊME règle.
//
// `corpus.apposer-verdict` est donc 'ecriture', et c'est structurel :
// aucun agent ne peut tamponner un concept, quelle que soit la surface
// par laquelle il passe. Le tampon reste un geste humain parce que
// l'adaptateur refuse d'en faire autre chose.

import { z } from 'zod';
import { defineTool } from '../defineTool';
import { deposeProposal } from '../serverStore';
import type { ToolContext } from '../types';
import { CorpusIndisponible, lireConcept, listerConcepts } from '../corpusStore';

const zChemin = z
  .string()
  .min(1)
  .describe('Chemin du concept, relatif à la racine du corpus (ex. 70_Onthologies/pulse/b1/b1-omk-t1-mandate.md).');

const zConfiance = z.enum(['non_verifie', 'machine', 'humain']);

/** Les outils du corpus échouent proprement quand la racine n'est pas
 *  configurée — sur Vercel, par exemple. Rendre une liste vide ferait
 *  croire à un corpus vide, ce qui est un mensonge plus coûteux qu'une
 *  erreur. */
function enErreur(e: unknown): { ok: false; error: string } {
  if (e instanceof CorpusIndisponible) return { ok: false, error: e.message };
  return { ok: false, error: `Corpus illisible : ${e instanceof Error ? e.message : String(e)}` };
}

// corpus.lire — LECTURE
export const corpusLire = defineTool({
  name: 'corpus.lire',
  description:
    "Lit un concept OKF : titre, type, description, sources, et son niveau de confiance déduit de `verified`. Lecture seule.",
  category: 'lecture',
  schema: z.object({
    chemin: zChemin,
    avecCorps: z.boolean().optional().describe('Inclure le texte du concept (défaut : non, seules les métadonnées).'),
  }),
  displayName: (args) => `Lire ${args.chemin}`,
  execute: async (args) => {
    try {
      const c = await lireConcept(args.chemin);
      return {
        ok: true as const,
        data: {
          chemin: c.chemin,
          titre: c.titre,
          type: c.type,
          description: c.description,
          confiance: c.confiance,
          verificateurs: c.verificateurs,
          sources: c.sources,
          ...(args.avecCorps ? { corps: c.corps } : {}),
        },
      };
    } catch (e) {
      return enErreur(e);
    }
  },
});

// corpus.inventaire — LECTURE
export const corpusInventaire = defineTool({
  name: 'corpus.inventaire',
  description:
    "Inventorie un bundle : nombre de concepts par niveau de confiance et dette de revue (ce qui attend encore un humain). Lecture seule.",
  category: 'lecture',
  schema: z.object({
    bundle: z.string().optional().describe('Sous-dossier à inventorier (défaut : tout le corpus).'),
    confiance: zConfiance.optional().describe('Ne rendre que les concepts à ce niveau.'),
    limite: z.number().int().positive().max(500).optional().describe('Plafond de concepts listés (défaut 50).'),
  }),
  displayName: (args) => `Inventaire ${args.bundle ?? 'du corpus'}`,
  execute: async (args) => {
    try {
      const tous = await listerConcepts(args.bundle ?? '');
      const parNiveau = { non_verifie: 0, machine: 0, humain: 0 };
      for (const c of tous) parNiveau[c.confiance] += 1;

      const filtres = args.confiance ? tous.filter((c) => c.confiance === args.confiance) : tous;
      const limite = args.limite ?? 50;

      return {
        ok: true as const,
        data: {
          bundle: args.bundle ?? '(racine)',
          total: tous.length,
          parNiveau,
          // Le chiffre qui appelle un geste. « 258 concepts produits »
          // félicite ; « 258 concepts, 0 relu » informe.
          detteDeRevue: tous.length - parNiveau.humain,
          affiches: Math.min(filtres.length, limite),
          concepts: filtres.slice(0, limite).map((c) => ({
            chemin: c.chemin,
            titre: c.titre,
            confiance: c.confiance,
          })),
        },
      };
    } catch (e) {
      return enErreur(e);
    }
  },
});

// corpus.apposer-verdict — ÉCRITURE (proposition, jamais d'écriture directe)
export const corpusApposerVerdict = defineTool({
  name: 'corpus.apposer-verdict',
  description:
    "Propose de faire passer un concept de `machine` à `humain`. Dépose une proposition — n'écrit JAMAIS le fichier. Seul le propriétaire tranche.",
  category: 'ecriture',
  schema: z.object({
    chemin: zChemin,
    version: z.string().min(1).describe('Version de revue (ex. V0, V0.1).'),
    note: z.string().min(1).max(600).describe('Le verdict, en une ou deux phrases : ce qui est validé et sous quelle réserve.'),
    rationale: z.string().optional().describe('Pourquoi ce verdict — affiché dans la file d\'approbation.'),
  }),
  displayName: (args) => `Apposer le verdict ${args.version} sur ${args.chemin}`,
  execute: async (args, ctx: ToolContext) => {
    try {
      // On lit AVANT de proposer : proposer un verdict sur un concept
      // qui n'existe pas, ou déjà revu, encombre la file d'approbation
      // d'un geste sans effet.
      const c = await lireConcept(args.chemin);
      if (c.confiance === 'humain') {
        return { ok: false as const, error: `Déjà revu par un humain : ${args.chemin}. Le tampon est idempotent.` };
      }

      const scenarioId = `scn_${ctx.tenantId}_${Date.now().toString(36)}`;
      const record = await deposeProposal(ctx.tenantId, {
        scenarioId,
        toolName: 'corpus.apposer-verdict',
        args: { chemin: args.chemin, version: args.version, note: args.note, confianceAvant: c.confiance },
        displayName: `Verdict ${args.version} — ${c.titre}`,
        rationale: args.rationale,
        actorId: ctx.actorId,
      });
      return { ok: true as const, data: { scenarioId: record.scenarioId, proposalId: record.id } };
    } catch (e) {
      return enErreur(e);
    }
  },
});

// corpus.enregistrer-vague — ÉCRITURE (proposition)
export const corpusEnregistrerVague = defineTool({
  name: 'corpus.enregistrer-vague',
  description:
    "Propose d'enregistrer une vague close : son genre, sa durée machine et ses constats. La compression temporelle se constate, elle ne se décrète pas.",
  category: 'ecriture',
  schema: z.object({
    genre: z.enum(['scrum', 'sprint', 'rock', 'cycle', 'annee']).describe('Le niveau d\'emboîtement de la vague.'),
    libelle: z.string().min(1),
    dossier: z.string().min(1).describe('Dossier de la vague, relatif à la racine du corpus.'),
    dureeMachineSecondes: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Temps machine réel. Sans lui, la commodité temporelle reste « non mesurée ».'),
    constats: z
      .array(
        z.object({
          nature: z.enum(['dette', 'avancee', 'apprentissage']),
          titre: z.string().min(1),
          detail: z.string().optional(),
          preuve: z.string().optional().describe('Chemin d\'une capture, d\'un diff, d\'un log ou d\'une sortie reproductible.'),
        }),
      )
      .optional(),
    rationale: z.string().optional(),
  }),
  displayName: (args) => `Enregistrer la vague ${args.genre} : ${args.libelle}`,
  execute: async (args, ctx: ToolContext) => {
    try {
      const concepts = await listerConcepts(args.dossier);
      const sansPreuve = (args.constats ?? []).filter((c) => !c.preuve).length;
      const scenarioId = `scn_${ctx.tenantId}_${Date.now().toString(36)}`;
      const record = await deposeProposal(ctx.tenantId, {
        scenarioId,
        toolName: 'corpus.enregistrer-vague',
        args: {
          genre: args.genre,
          libelle: args.libelle,
          dossier: args.dossier,
          dureeMachineSecondes: args.dureeMachineSecondes ?? null,
          conceptsTrouves: concepts.length,
          constats: args.constats ?? [],
          // Un constat sans preuve est une opinion. On ne le refuse pas,
          // on le compte — l'arbitre doit voir combien il en avale.
          constatsSansPreuve: sansPreuve,
        },
        displayName: `Vague ${args.genre} — ${args.libelle} (${concepts.length} concepts)`,
        rationale: args.rationale,
        actorId: ctx.actorId,
      });
      return {
        ok: true as const,
        data: { scenarioId: record.scenarioId, proposalId: record.id, conceptsTrouves: concepts.length, constatsSansPreuve: sansPreuve },
      };
    } catch (e) {
      return enErreur(e);
    }
  },
});

export const corpusTools = [corpusLire, corpusInventaire, corpusApposerVerdict, corpusEnregistrerVague];
