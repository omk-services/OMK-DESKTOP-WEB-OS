// src/lib/tooling/types.ts
// Types partagés par defineTool et les cinq adaptateurs.
//
// Le contrat : une seule définition d'outil produit un REST handler, un
// outil MCP, une commande CLI, une skill et un outil in-app. Pour que
// les cinq surfaces restent équivalentes, elles partagent cette grammaire.
//
// Trois catégories, qui ne sont jamais réécrites par outil :
//  - 'lecture'   : geste immédiat, retourne la valeur réelle, jamais de
//                  proposition. L'agent a besoin de lire l'état pour
//                  informer ses décisions.
//  - 'navigation': geste d'affichage (fenêtre, section). Immédiat aussi,
//                  pas une écriture de données. L'utilisateur voit bouger
//                  et corrige en un geste.
//  - 'ecriture'  : proposition déposée dans la file d'approbation. Ne
//                  touche jamais aux données réelles. C'est la règle
//                  absolue du projet : aucune écriture sans humain qui
//                  arbitre.

import type { z } from 'zod';

export type ToolCategory = 'lecture' | 'navigation' | 'ecriture';

export interface ToolContext {
  /** Tenant actif. Tout outil métier doit le lire et l'appliquer. */
  tenantId: string;
  /** Identifiant de l'agent qui appelle (humain, agent:cle, etc.). */
  actorId: string;
  /** Rôle de l'acteur vis-à-vis du tenant. La couche permissions
   *  (étape 3) croise cette valeur avec la catégorie de l'outil.
   *  Valeurs usuelles : 'owner' (tous droits, auto-approuve OK),
   *  'admin' (tous droits), 'member' (ne peut pas auto-approuver),
   *  'guest' (lecture seule). */
  role: 'owner' | 'admin' | 'member' | 'guest';
}

/** Forme du retour avant que l'adaptateur ne l'enveloppe. Les adaptateurs
 *  sont libres de leurs propres enveloppes (jsonRpc, http, etc.) ; ce
 *  contenu est ce qu'ils mettent à l'intérieur. */
export interface ToolSuccess<T> {
  ok: true;
  data: T;
}

export interface ToolFailure {
  ok: false;
  error: string;
}

export type ToolResult<T> = ToolSuccess<T> | ToolFailure;

/** Un outil catégories écriture dépose une proposition. Pour que tout
 *  adaptateur (REST, MCP, CLI, Skill) puisse annoncer une proposition
 *  sans connaître React ni Zustand, on rend la même forme que celle
 *  consommée par le scénario (cf. scenarios.store.ts). */
export interface ProposalRef {
  scenarioId: string;
  proposalId: string;
}

/** Paramètres de l'executeur. Tous les outils acceptent un contexte en
 *  plus des args validés par le schema — c'est ce qui permet au niveau
 *  appelant (REST, MCP, CLI) de porter le tenant et l'acteur sans que
 *  chaque outil ait à le redécouvrir. */
export type ToolExecutor<TSchema extends z.ZodTypeAny, TOut> = (
  args: z.infer<TSchema>,
  ctx: ToolContext,
) => ToolResult<TOut> | Promise<ToolResult<TOut>>;

/** Coquille publique d'un outil. Une seule définition, cinq surfaces. */
export interface ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny, TOut = unknown> {
  /** Nom canonique, kebab-case. 1-64 caractères, [a-z0-9.-]. */
  name: string;
  /** Résumé < 240 caractères. Toujours dans le contexte du modèle. Le
   *  reste va dans la skill, qui n'est chargée qu'à la demande. */
  description: string;
  category: ToolCategory;
  schema: TSchema;
  /** Quand l'outil est 'ecriture', le label humain affiché dans la file
   *  d'approbation. Calculé à partir des args, pas au moment du dépôt. */
  displayName: (args: z.infer<TSchema>) => string;
  /** Exécuteur. Pour 'ecriture', il retourne une ProposalRef plutôt que
   *  d'écrire directement. Les adaptateurs ne lisent pas cette nuance :
   *  c'est l'executeur qui sait. */
  execute: ToolExecutor<TSchema, TOut>;
  /**
   * Interface MCP Apps, optionnelle. Presente = l'hote peut rendre une page
   * HTML interactive au lieu d'un bloc de texte. Absente = l'outil se
   * comporte exactement comme avant sur les six autres surfaces.
   */
  ui?: import('./adapters/mcp-apps').ToolUi;
}
