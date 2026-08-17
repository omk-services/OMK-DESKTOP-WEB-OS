// api/v1/tools.ts
// GET /api/v1/tools — manifest des outils. Le client REST s'en sert
// pour hydrater sa liste (équivalent de `coach-os tools list`).
//
// Pourquoi le catalogue n'est PAS importé au top level :
//   `catalog/index.ts` appelle `registerAll()` à l'évaluation du module,
//   qui charge `saasBuilderTools` → `useThreeAppStore` (zustand + persist
//   avec `localStorage`). En serverless Node, `localStorage` n'est pas
//   défini : l'import jette, l'invocation Vercel rend
//   `FUNCTION_INVOCATION_FAILED` (500). C'est exactement ce qu'on a vu
//   en prod (cf. RAPPORT_FIX_3 §3).
//
//   Le garde `verifierAcces` ne peut rien faire si le module n'a jamais
//   pu charger — il est posé dans le gestionnaire, donc après le top
//   level. Le 500 accidentel masquait le 503 et faisait paraître la
//   route « ouverte » (en réalité, cassée). La correction consiste à
//   NE PAS déclencher la chaîne au chargement du module : on importe
//   le catalogue à la demande, dans le gestionnaire, après le garde,
//   et on capture l'erreur pour rendre 503 au lieu de planter.

import { verifierAcces } from '../_agent/garde.js';

/** Tente de charger le catalogue et de produire le manifest.
 *
 *  Le retour `null` signale un échec — par exemple, `localStorage`
 *  indisponible côté Node quand la chaîne Zustand est déclenchée par
 *  `registerAll()`. On ne sait pas aujourd'hui faire mieux sans toucher
 *  à `src/` (les deux stores fautifs sont dans `src/stores/` et
 *  `src/lib/saas-builder/`). Le fix durable est documenté dans
 *  RAPPORT_FIX_5 §3. */
async function chargerCatalogue(): Promise<
  { count: number; tools: unknown[] } | null
> {
  try {
    const [{ registerAll }, { manifestTools }, { list }] = await Promise.all([
      import('../../src/lib/tooling/catalog/index.js'),
      import('../../src/lib/tooling/adapters/rest.js'),
      import('../../src/lib/tooling/registry.js'),
    ]);
    registerAll();
    const outils = list();
    return { count: outils.length, tools: manifestTools() };
  } catch {
    return null;
  }
}

/** Gestionnaire de la route — exporté pour les tests du garde.
 *
 *  Le catalogue (noms, descriptions, schémas) renseigne un attaquant
 *  sur la surface d'outils disponibles — `collection.create`,
 *  `scenario.approve`. Il est gardé comme le reste de `/api/v1/*`. */
export async function gestionnaire(request: Request): Promise<Response> {
  const refus = verifierAcces(request);
  if (refus) {
    return new Response(
      JSON.stringify({ ok: false, error: refus.message }),
      { status: refus.status, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const catalogue = await chargerCatalogue();
  if (catalogue === null) {
    // Catalogue indisponible côté serveur — on reste fermé. Pas de 200
    // vide, pas de 500 : 503 explicite.
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Catalogue d'outils indisponible côté serveur. Le déploiement attend un correctif dans `src/` (cf. RAPPORT_FIX_5).",
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return new Response(
    JSON.stringify(
      { count: catalogue.count, tools: catalogue.tools },
      null,
      2,
    ),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

export default async function handler(req: unknown, res?: unknown): Promise<unknown> {
  // Pas de versNode — Vercel gère les routes en /api/v1/*.ts directement
  // via son runtime qui passe des Request. Pour le dev (vite plugin),
  // on accepte aussi (req,res).
  if (res === undefined) {
    return gestionnaire(req as Request);
  }
  // Branche Node/Vercel — délègue à versNode de _agent/adapt.ts.
  const { versNode } = await import('../_agent/adapt.js');
  return versNode(gestionnaire)(req as never, res as never);
}
