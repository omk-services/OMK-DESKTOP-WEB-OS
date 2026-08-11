/** Service catalogue for the embedded frames in IT/R&D.
 *
 *  Each entry knows:
 *    - its label + description,
 *    - the URL of the admin UI / dashboard,
 *    - whether it is local or hosted,
 *    - a probe path that returns 200 on a healthy service.
 *
 *  The probe is a HEAD request with a short timeout. If the probe succeeds,
 *  the frame is rendered. If it fails (timeout, refused, non-2xx, X-Frame-
 *  Options deny), the frame is replaced by a clear error message that
 *  names the URL and the failure mode — per the brief, a frame must NOT
 *  silently render an empty iframe.
 */

export type ServiceHealth = 'unknown' | 'ok' | 'down' | 'unembeddable';

export interface EmbeddedService {
  id: string;
  label: string;
  description: string;
  /** URL of the admin UI / dashboard. Configurable — in production these
   *  will be elsewhere (Render.com, etc.), in dev they are localhost. */
  url: string;
  /** Probe path — a small request that confirms the service is alive.
   *  Defaults to the root of `url`. */
  probe?: string;
  /** When true, the service is hosted (smith.langchain.com etc.) and
   *  should be opened in a new tab, not embedded. */
  external?: boolean;
  /** Free-form note shown in the panel (e.g. "Not running as of 2026-08-11"). */
  note?: string;
  /** Known state — set to 'down' for services we *know* are dead and want
   *  to surface without firing a probe (which would pollute the console
   *  with ERR_CONNECTION_REFUSED every refresh). The user sees an
   *  explicit "hors service" badge, the operator knows what to fix. */
  knownStatus?: ServiceHealth;
}

export const SERVICES: EmbeddedService[] = [
  {
    id: 'agentgateway',
    label: 'agentgateway',
    description: 'Passerelle MCP unifiee — 16 serveurs derriere un seul endpoint',
    url: 'http://127.0.0.1:15000/ui',
    probe: 'http://127.0.0.1:15000/ui',
    note: 'Admin UI sur :15000/ui, endpoint MCP sur :3300. Lance par run.cmd.',
  },
  {
    id: 'foundry',
    label: 'Foundry Ontology',
    description: 'Playground ontologique — l exploration du graphe en direct',
    url: 'http://127.0.0.1:5180/',
    probe: 'http://127.0.0.1:5180/',
    note: 'Vite dev server. Pas en production — sert de bac a sable.',
  },
  {
    id: 'observatoire',
    label: 'Observatoire',
    description: 'Vue locale des delegations d agents — WSL, invisibles du gestionnaire de taches',
    url: 'http://127.0.0.1:8787/',
    // Mesure 2026-08-11 : :8787 n'ecoute pas. Marquer hors service plutot
    // que re-sonder, pour ne pas polluer la console avec
    // ERR_CONNECTION_REFUSED a chaque ouverture du panneau.
    knownStatus: 'down',
    note: 'Annonce par REGISTRY mais :8787 n ecoute pas (mesure 2026-08-11). Service a demarrer avant de retirer ce statut.',
  },
  {
    id: 'langsmith',
    label: 'LangSmith (heberge)',
    description: 'Observabilite LangChain hebergee — traces de chains, evaluateurs',
    url: 'https://smith.langchain.com/',
    external: true,
    note: 'Service externe, non embarquable. Ouverture dans un nouvel onglet.',
  },
];

export function findService(id: string): EmbeddedService | undefined {
  return SERVICES.find((s) => s.id === id);
}
