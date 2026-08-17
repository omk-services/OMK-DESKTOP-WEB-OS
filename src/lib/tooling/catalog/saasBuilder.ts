// src/lib/tooling/catalog/saasBuilder.ts
// Tools MCP exposes par le SaaS builder. SPEC §2.5.
//
// DEUX TOOLS :
//   1. saas.appSpec.generate : produit un AppSpec JSON valide a partir
//      d'une intention vague + un hint de route. Category: 'ecriture',
//      parce qu'on depose un spec dans le ledger.
//
//   2. saas.appSpec.publish : convertit un AppSpec en ThreeApp et
//      l'installe dans App Store. Category: 'ecriture', parce qu'on
//      touche au store d'installation.
//
// POURQUOI PAS D'APPEL PROVIDER REEL ICI :
//   Les tools appellent les engines de src/lib/saas-builder/engines/.
//   Chaque engine est un stub V1 qui throw 'not wired V2' (cf. SPEC
//   §4.2). L'enrollment ici suffit : la V2 remplace les stubs sans
//   toucher ce catalogue.
//
// GARDE IDENTITY (SPEC §2.5) — variante legere :
//   On n'importe PAS `permissions.ts` ici. Ce module importe
//   transitivement `serverStore.ts` qui tire `node:fs/promises`,
//   et Vite interdit ce module cote client (cf. log Vite 12:52:15).
//   La garde reelle reste dans l'adaptateur MCP quand le tool est
//   invoque via MCP ; ici on verifie juste role !== 'guest', ce qui
//   couvre le minimum SPEC §6.4.

import { z } from 'zod';
import { defineTool } from '../defineTool';
import { AppSpecSchema, type AppSpec, appSpecToThreeApp } from '../../saas-builder/appSpec.schema';
import { useThreeAppStore } from '../../../stores/threeApp.store';
import { engineForRoute } from '../../saas-builder/engines';
import { useLedgerStore, totalUsd } from '../../saas-builder/ledger.store';
import type { ToolContext } from '../types';

/** Garde locale : refuse guest sur les outils 'ecriture'. Pas d'import
 *  vers permissions.ts pour eviter le tir de node:fs/promises. */
function refuseSiGuest(ctx: ToolContext, toolName: string): { ok: true } | { ok: false; error: string } {
  if (ctx.role === 'guest') {
    return { ok: false, error: `Role "guest" refuse pour le tool ecriture "${toolName}".` };
  }
  return { ok: true };
}
//   §4.2). L'enrollment ici suffit : la V2 remplace les stubs sans
//   toucher ce catalogue.
//
// GARDE IDENTITY (SPEC §2.5) — variante legere :
//   On n'importe PAS `permissions.ts` ici. Ce module importe
//   transitivement `serverStore.ts` qui tire `node:fs/promises`,
//   et Vite interdit ce module cote client (cf. log Vite 12:52:15).
//   La garde reelle reste dans l'adaptateur MCP quand le tool est
//   invoque via MCP ; ici on verifie juste role !== 'guest', ce qui
//   couvre le minimum SPEC §6.4.

// SPEC §4.4. V1 : genere un AppSpec "shaped" sans appeler de moteur.
// V2 : utilise le moteur selectionne pour produire un apercu media.
//
// Pourquoi V1 fait un "stub shaped" plutot qu'un throw :
//   - Le caller (UI) veut une preview immediate.
//   - On respecte la forme AppSpec (Zod), donc la suite du pipeline
//     (publish, ledger) fonctionne sans modification.

export const saasAppSpecGenerate = defineTool({
  name: 'saas.appspec.generate',
  description:
    'Genere un AppSpec JSON pour le SaaS builder. V1 : produit un spec shape-valide sans appeler de moteur. V2 : utilise le moteur selectionne pour un aperçu média.',
  category: 'ecriture',
  schema: z.object({
    intent: z.string().min(1).max(500)
      .describe('Intention vague (ex. "une app qui affiche un dashboard de sessions").'),
    routeHint: z.string().optional()
      .describe('Route fal.ai preferree (ex. fal-ai/veo3.1/fast). Si absent, fal par defaut.'),
  }),
  displayName: () => 'SaaS Builder — generer un AppSpec',
  async execute(args, ctx: ToolContext) {
    const perm = refuseSiGuest(ctx, 'saas.appspec.generate');
    if (!perm.ok) {
      return { ok: false, error: perm.error };
    }
    // Slug : kebab-case depuis l'intent, tronque a 32 chars.
    const baseSlug = args.intent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const slug = baseSlug.slice(0, 32) || 'app';
    const engine = args.routeHint ? engineForRoute(args.routeHint) : engineForRoute('fal');
    const routeId = engine?.id === 'fal' ? (args.routeHint ?? 'fal-ai/flux-2/flash') : (engine?.id ?? 'fal');
    const spec: AppSpec = {
      slug,
      name: slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
      version: '0.1.0',
      level: 'easy',
      category: 'Generated',
      inputs: { prompt: args.intent },
      outputs: {
        'text/html': `https://placeholder.invalid/${slug}.html`,
      },
      uiHint: { layout: 'window' },
      modelHints: {
        routeId,
        refinedPrompt: args.intent,
      },
    };
    // On valide par le schema Zod pour attraper toute regression.
    const parsed = AppSpecSchema.safeParse(spec);
    if (!parsed.success) {
      return { ok: false, error: `AppSpec shape invalide: ${parsed.error.message}` };
    }
    return { ok: true, data: { spec: parsed.data, generatedAt: new Date().toISOString() } };
  },
});

// ============================================================
// saas.appSpec.publish
// ============================================================
// SPEC §3 : un AppSpec est converti en ThreeApp et installe via
// useThreeAppStore. Category: 'ecriture', parce qu'on touche au
// store d'installation. Le caller (UI SaaSBuilderApp) appelle ce tool
// quand l'utilisateur clique 'Publish to App Store'.

export const saasAppSpecPublish = defineTool({
  name: 'saas.appspec.publish',
  description:
    'Convertit un AppSpec JSON en ThreeApp et l\'installe dans App Store. V1 : level=easy uniquement (iframeUrl).',
  category: 'ecriture',
  schema: z.object({
    spec: AppSpecSchema,
  }),
  displayName: (args) => `Publier ${args.spec.slug} v${args.spec.version}`,
  async execute(args, ctx: ToolContext) {
    const perm = refuseSiGuest(ctx, 'saas.appspec.publish');
    if (!perm.ok) {
      return { ok: false, error: perm.error };
    }
    let threeApp;
    try {
      threeApp = appSpecToThreeApp(args.spec);
    } catch (err) {
      return {
        ok: false,
        error: `AppSpec invalide : ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    useThreeAppStore.getState().install(threeApp);
    return { ok: true, data: { slug: threeApp.slug, installedAt: threeApp.installedAt } };
  },
});

// ============================================================
// saas.ledger.read
// ============================================================
// Lecture seule : total cumule + nombre de generations. C'est le tool
// qui alimente le LedgerTicker en haut du builder.

export const saasLedgerRead = defineTool({
  name: 'saas.ledger.read',
  description: 'Lit le total cumule du ledger SaaS builder (USD + count).',
  category: 'lecture',
  schema: z.object({}),
  displayName: () => 'SaaS Builder — lire le ledger',
  execute() {
    const summary = {
      totalGenerations: useLedgerStore.getState().entries.length,
      allTimeUsd: totalUsd(),
    };
    return { ok: true, data: summary };
  },
});

export const saasBuilderTools = [
  saasAppSpecGenerate,
  saasAppSpecPublish,
  saasLedgerRead,
];
