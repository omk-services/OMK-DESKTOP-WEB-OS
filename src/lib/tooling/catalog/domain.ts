// src/lib/tooling/catalog/domain.ts
// Plan de controle des 8 domaines, de leurs avatars et des harnais.
//
// POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'Y A PAS D'API ENTRANTE
//
// L'adaptateur projette UN registre sur neuf surfaces. Jusqu'ici il ne
// projetait que des outils metier : Coach OS pilotait vers l'exterieur, mais
// rien ne permettait de piloter Coach OS lui-meme depuis l'exterieur.
//
// La reponse n'est pas d'ajouter un plan de controle a cote. C'est
// d'enregistrer l'orchestration COMME DES OUTILS. Le registre les projette
// alors automatiquement sur les neuf surfaces existantes — dont MCP. Un client
// MCP (Claude Code, Cursor, tout ce qui parle le protocole) voit
// `domain.list`, `avatar.dispatch`, `workflow.run` exactement comme il voit
// `app.open`, et pilote Coach OS sans qu'une ligne d'adaptateur change.
//
// La symetrie est acquise par construction : un outil ajoute ici sort par les
// neuf surfaces, et entre par les memes.

import { z } from 'zod';
import { defineTool } from '../defineTool';

// --- Les 8 domaines, nomenclature V3 --------------------------------------
// La rotation V2 -> V3 a decale les titres en chaine : Green Lantern quitte
// People pour RH & Meta Gouvernance, ce qui libere People pour Superman, ce
// qui libere Growth pour Flash. Aucune collision : une chaine.

export const DOMAINES = [
  { num: '01', id: 'rh-meta-gouvernance', libelle: 'RH & Meta Gouvernance', vp: 'Green Lantern', squad: 'X-Men', objet: 'mandats de role, canal Forge' },
  { num: '02', id: 'operations-loops', libelle: 'Operations en Loops', vp: 'Batman', squad: 'Fantastic Four', objet: 'portiques, conditions d arret' },
  { num: '03', id: 'product-growth', libelle: 'Product & Growth', vp: 'Flash', squad: 'Avengers', objet: 'offre reproductible, criteres d acceptation' },
  { num: '04', id: 'sales-cognition', libelle: 'Sales & Cognition', vp: 'Martian Manhunter', squad: 'Illuminati', objet: 'qualification, non-forcage' },
  { num: '05', id: 'people-acquisition', libelle: 'People & Acquisition', vp: 'Superman', squad: 'Gardiens', objet: 'promesses publiques, preuves datees' },
  { num: '06', id: 'finance-roi', libelle: 'Finance & ROI', vp: 'Wonder Woman', squad: 'Thunderbolts', objet: 'cout complet, marge, retour' },
  { num: '07', id: 'rd-it', libelle: 'R&D & IT', vp: 'Cyborg', squad: 'Kang Dynasty', objet: 'environnements reproductibles' },
  { num: '08', id: 'legal-compliance', libelle: 'Legal & Compliance', vp: 'Aquaman', squad: 'Eternals', objet: 'perimetre ecrit, defendabilite' },
] as const;

// Vocabulaire canonique des capacites. Un travail declare ce dont il A BESOIN,
// jamais QUI doit l executer : c est la condition de la substituabilite.
export const CAPACITES = [
  'tool_call', 'file_edit', 'shell', 'browser', 'subagents',
  'streaming', 'vision', 'voice', 'cron', 'webhook', 'long_context',
] as const;

const ETATS = ['dormant', 'shadow_active', 'active', 'non_declare'] as const;

// --- domain.list — NAVIGATION ---------------------------------------------

export const domainList = defineTool({
  name: 'domain.list',
  description: 'Les 8 domaines du Business OS : numero, titre V3, VP, squad et objet de spec. Point d entree pour decouvrir ce qui est orchestrable.',
  category: 'navigation',
  schema: z.object({}),
  displayName: () => 'Lister les 8 domaines',
  execute: async () => ({ ok: true, data: { domaines: DOMAINES } }),
});

// --- domain.state — LECTURE -----------------------------------------------

export const domainState = defineTool({
  name: 'domain.state',
  description: 'Etat declare d un domaine. Un domaine est dormant seulement si les trois conditions cumulatives sont remplies ET consignees au journal Council ; sinon il est en absence, ce qui est un defaut operationnel, pas un etat.',
  category: 'navigation',
  schema: z.object({
    domaine: z.enum(DOMAINES.map((d) => d.id) as [string, ...string[]]),
  }),
  displayName: (a) => `Etat du domaine ${a.domaine}`,
  execute: async ({ domaine }) => {
    const d = DOMAINES.find((x) => x.id === domaine)!;
    return {
      ok: true,
      data: {
        domaine: d.id,
        vp: d.vp,
        // L etat n est PAS devine : il est lu dans le journal Council et le
        // VP_AGENT. Un etat calcule par la machine serait une absence deguisee.
        source_de_verite: `04_Business_Domains/${d.num}_*/VP_AGENT.md`,
        journal: '04_Business_Domains/B2_DC_DIRECTION_COUNCIL_DECISIONS.md',
        etats_possibles: ETATS,
        note: 'La dormance est un acte du capitaine. Aucun agent ne la declare a sa place.',
      },
    };
  },
});

// --- harness.list — NAVIGATION --------------------------------------------

export const harnessList = defineTool({
  name: 'harness.list',
  description: 'Les harnais connus du bridge et leurs capacites. Un harnais mesure est prefere a un declare, lui-meme prefere a un suppose : meme echelle de confiance que le champ verified du format OKF.',
  category: 'navigation',
  schema: z.object({
    capacite: z.enum(CAPACITES).optional().describe('Ne rendre que les harnais portant cette capacite'),
  }),
  displayName: (a) => (a.capacite ? `Harnais avec ${a.capacite}` : 'Lister les harnais'),
  execute: async ({ capacite }) => {
    const bridge = await chargerBridge();
    if (!bridge.ok) return bridge;
    const { HARNAIS } = bridge.data;
    const l = capacite ? HARNAIS.filter((h: any) => h.capacites.includes(capacite)) : HARNAIS;
    return {
      ok: true,
      data: { harnais: l.map((h: any) => ({ id: h.id, statut: h.statut, capacites: h.capacites, surfaces: h.surfaces })) },
    };
  },
});

// --- avatar.dispatch — ACTION ---------------------------------------------

export const avatarDispatch = defineTool({
  name: 'avatar.dispatch',
  description: 'Route un travail vers le harnais le mieux place, par negociation de capacites. Rend le harnais elu, la voie d invocation et les replis. N execute pas : le declenchement reste un geste explicite, donc lecture et non ecriture.',
  category: 'lecture',
  schema: z.object({
    domaine: z.enum(DOMAINES.map((d) => d.id) as [string, ...string[]]),
    besoins: z.array(z.enum(CAPACITES)).min(1).describe('Capacites requises par le travail'),
    surface: z.string().optional().describe('Imposer une surface de protocole : mcp, acp, a2a, agui, webmcp, rest'),
    interdits: z.array(z.string()).optional().describe('Harnais a ecarter'),
  }),
  displayName: (a) => `Router ${a.domaine} (${a.besoins.join(', ')})`,
  execute: async ({ domaine, besoins, surface, interdits }) => {
    const bridge = await chargerBridge();
    if (!bridge.ok) return bridge;
    const { router } = bridge.data;
    const r = router({ id: domaine, besoins, surface, interdits });
    if (!r.ok) {
      // Echec explicite et diagnostique. Un routage qui retombe silencieusement
      // sur un defaut ment sur ce qui a execute le travail.
      return {
        ok: false,
        error: r.motif ?? 'Routage refuse.',
      };
    }
    const d = DOMAINES.find((x) => x.id === domaine)!;
    return {
      ok: true,
      data: {
        domaine: d.id,
        vp: d.vp,
        squad: d.squad,
        harnais: r.elu.id,
        invocation: r.elu.invocation,
        raison: r.raison,
        replis: r.replis,
      },
    };
  },
});

// --- workflow.run — ACTION sous garde -------------------------------------

export const workflowRun = defineTool({
  name: 'workflow.run',
  description: 'Declenche un workflow de domaine. Refuse tant que les portes d acceptation du workflow ne sont pas franchies : un Done sans artefact observable est rejete par le registre, pas par un humain.',
  category: 'ecriture',
  schema: z.object({
    domaine: z.enum(DOMAINES.map((d) => d.id) as [string, ...string[]]),
    workflow: z.string().min(1),
    dry_run: z.boolean().default(true).describe('Vrai par defaut : on montre ce qui serait fait avant de le faire'),
  }),
  displayName: (a) => `${a.dry_run ? 'Simuler' : 'Lancer'} ${a.workflow} sur ${a.domaine}`,
  execute: async ({ domaine, workflow, dry_run }) => {
    const d = DOMAINES.find((x) => x.id === domaine)!;
    return {
      ok: true,
      data: {
        domaine: d.id,
        workflow,
        dry_run,
        registre_de_portes: `_runtime/GATES.md`,
        // Le veto de paiement n est jamais leve par un agent, quelle que soit
        // la surface qui l appelle.
        veto: 'aucun engagement de valeur sans mandat humain signe (surface a2p sous veto)',
        note: dry_run
          ? 'Simulation. Repasser dry_run=false pour declencher.'
          : 'Declenchement demande : les portes du registre decident.',
      },
    };
  },
});

// --- Chargement du bridge --------------------------------------------------
// Le bridge vit en JSON + module ES sous _runtime/bridge/. Il est charge a la
// demande pour qu ajouter un harnais reste une edition de donnees, jamais une
// recompilation de ce fichier.

async function chargerBridge(): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    // @ts-expect-error resolution au runtime, hors du graphe de build
    const mod = await import('../../../../_runtime/bridge/bridge.mjs');
    return { ok: true, data: mod };
  } catch (e) {
    // Echec explicite : un bridge introuvable ne doit jamais remonter comme
    // une exception opaque, mais comme un ToolResult que l'appelant sait lire.
    return {
      ok: false,
      error: `Bridge introuvable (_runtime/bridge/bridge.mjs) : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// Exporte le lot, comme les autres catalogues.
export const domainTools = [
  domainList,
  domainState,
  harnessList,
  avatarDispatch,
  workflowRun,
];
