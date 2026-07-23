/** Voice command grammar — FR-first parser mapping a spoken transcript to a
 *  window-manager action. Section labels and section→collection mappings below
 *  are transcribed verbatim from each app's own AppSection/useCollectionDrill
 *  declarations (see apps/*), not invented — keep in sync if an app's sidebar
 *  sections change. */
import { getCollectionDef, getCollectionItems } from './cms/cms.store';

export type VoiceCommand =
  | { type: 'open'; appId: string; section?: string; itemId?: string }
  | { type: 'close'; appId: string }
  | { type: 'minimize'; appId: string }
  | { type: 'showDesktop' }
  | { type: 'minimizeAll' };

/** Spoken aliases per app id (FR + EN), longest match wins so e.g. "sales sanctum"
 *  outscores a stray "sales" substring inside another word. */
const APP_ALIASES: Record<string, string[]> = {
  dashboard: ['dashboard', 'tableau de bord', 'accueil', 'home'],
  people: ['people agents', 'agents', 'equipe', 'people'],
  operations: ['operations', 'operations knowledge', 'operations et connaissance'],
  'it-rd': ['it r d', 'it rd', 'r d', 'informatique', 'it'],
  clients: ['clients', 'client'],
  tasks: ['tasks', 'taches', 'tache'],
  marketplace: ['place de marche', 'marketplace'],
  product: ['product', 'produit'],
  growth: ['growth', 'croissance'],
  sales: ['sales sanctum', 'sanctum des ventes', 'ventes', 'sales'],
  finance: ['finance', 'finances'],
  legal: ['legal', 'juridique'],
  settings: ['settings', 'reglages', 'parametres'],
};

/** Sidebar section labels per app, verified against apps/*.tsx AppSection arrays. */
const APP_SECTIONS: Record<string, string[]> = {
  dashboard: ['Overview', 'Wind Direction', 'Client Pipeline'],
  people: ['Team', 'Agents', 'Culture'],
  operations: ['Runbooks', 'Knowledge Base', 'Incidents'],
  'it-rd': ['Kernel', 'Experiments', 'Deploys'],
  clients: ['Active', 'Onboarding', 'Churn Risk', 'Directory', 'IP Vault'],
  tasks: ['Today', 'Upcoming', 'Done'],
  marketplace: ['Browse', 'Installed', 'Featured'],
  product: ['Roadmap', 'Backlog', 'Releases'],
  growth: ['Funnel', 'Channels', 'Experiments'],
  sales: ['Pipeline', 'Deals', 'Forecast'],
  finance: ['Overview', 'Runway', 'Invoices'],
  legal: ['Contracts', 'Compliance', 'Policies'],
  settings: ['General', 'Privacy', 'Integrations'],
};

/** (appId, section) -> collectionId, verified against each app's useCollectionDrill
 *  call sites. Only sections that actually drill into a CMS collection appear here. */
const APP_SECTION_COLLECTION: Record<string, Record<string, string>> = {
  dashboard: { 'Client Pipeline': 'clients' },
  clients: { Active: 'clients', Onboarding: 'clients', 'Churn Risk': 'clients', Directory: 'clients', 'IP Vault': 'session_notes' },
  finance: { Invoices: 'invoices' },
  growth: { Channels: 'growth_channels', Experiments: 'growth_experiments' },
  'it-rd': { Kernel: 'services', Experiments: 'it_experiments', Deploys: 'deploys' },
  legal: { Contracts: 'contracts', Policies: 'policies' },
  marketplace: { Browse: 'marketplace_listings', Installed: 'marketplace_listings', Featured: 'marketplace_listings' },
  operations: { Runbooks: 'runbooks', 'Knowledge Base': 'articles', Incidents: 'incidents' },
  people: { Team: 'team', Agents: 'people_agents' },
  product: { Roadmap: 'product_items', Backlog: 'product_items', Releases: 'product_releases' },
  sales: { Pipeline: 'deals', Deals: 'deals' },
  tasks: { Today: 'tasks', Upcoming: 'tasks', Done: 'tasks' },
};

function normalize(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return new RegExp(`(?:^|\\s)${escapeRegex(needle)}(?:\\s|$)`).test(haystack);
}

function matchAppId(text: string): string | null {
  let bestAppId: string | null = null;
  let bestLen = 0;
  for (const [appId, aliases] of Object.entries(APP_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalize(alias);
      if (containsPhrase(text, normAlias) && normAlias.length > bestLen) {
        bestAppId = appId;
        bestLen = normAlias.length;
      }
    }
  }
  return bestAppId;
}

function matchItem(appId: string, text: string): { section: string; itemId: string } | null {
  const collectionMap = APP_SECTION_COLLECTION[appId] ?? {};
  const seen = new Set<string>();
  for (const [section, collectionId] of Object.entries(collectionMap)) {
    if (seen.has(collectionId)) continue;
    seen.add(collectionId);
    const def = getCollectionDef(collectionId);
    if (!def) continue;
    for (const item of getCollectionItems(collectionId)) {
      const title = String(item[def.titleField] ?? '');
      if (title && containsPhrase(text, normalize(title))) {
        return { section, itemId: item.id };
      }
    }
  }
  return null;
}

export function parseVoiceCommand(rawTranscript: string): VoiceCommand | null {
  const text = normalize(rawTranscript);
  if (!text) return null;

  if (containsPhrase(text, 'bureau') || containsPhrase(text, 'desktop')) {
    return { type: 'showDesktop' };
  }
  if (/\b(reduis tout|reduit tout|minimize all|cache tout)\b/.test(text)) {
    return { type: 'minimizeAll' };
  }

  let verb: 'open' | 'close' | 'minimize' = 'open';
  if (/\b(ferme|fermer|close)\b/.test(text)) verb = 'close';
  else if (/\b(reduis|reduit|minimise|minimize)\b/.test(text)) verb = 'minimize';

  const appId = matchAppId(text);
  if (!appId) return null;

  if (verb === 'close') return { type: 'close', appId };
  if (verb === 'minimize') return { type: 'minimize', appId };

  const itemMatch = matchItem(appId, text);
  if (itemMatch) {
    return { type: 'open', appId, section: itemMatch.section, itemId: itemMatch.itemId };
  }

  const sections = APP_SECTIONS[appId] ?? [];
  const matchedSection = sections.find((section) => containsPhrase(text, normalize(section)));
  return { type: 'open', appId, section: matchedSection };
}
