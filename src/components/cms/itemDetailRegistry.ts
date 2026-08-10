/**
 * itemDetailRegistry — per-app CMS item detail components.
 *
 * Replaces the single generic DynamicPageView template with one distinct
 * composed page per Coach OS app. Driven by the canon:
 *   docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4
 *
 * Contract:
 *   Every CMS item rendered through `useCollectionDrill` ultimately reaches
 *   `DynamicPageView` (kept as the single integration point). It looks up the
 *   owning app here, then delegates to that app's `<App>ItemDetail` component.
 *
 *   If no component is registered for a (collectionId), DynamicPageView
 *   gracefully falls back to a readable default — never a crash.
 *
 *   Collection → app ownership is established by reading which App.tsx wires
 *   the collection through `useCollectionDrill` or `CollectionRepeater`.
 *   See the `OWNERSHIP` constant below.
 *
 * Hard rules:
 *   - NO imports from inside src/apps/* (would create cycles). Each app
 *     registers itself from its own `register.ts` side-effect file.
 *   - Registered components must accept `ItemDetailProps` and return JSX.
 *   - Components must not hardcode neutrals — use the runtime theme vars
 *     (var(--theme-bg), var(--theme-text), etc.) plus the app's accent.
 */

import type { ComponentType } from 'react';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

/**
 * Props passed to every per-app item detail component.
 *  - def: the collection definition (fields, accent, titleField, ...)
 *  - item: the CMS item being rendered
 *  - index/total: position in the collection (for prev/next and X/Y readout)
 *  - accent: the resolved app accent hex — already merged with def.accent if needed
 *  - onBack / onNavigate: called by the page's own back and prev/next affordances
 */
export interface ItemDetailProps {
  def: CmsCollectionDef;
  item: CmsItem;
  index: number;
  total: number;
  accent: string;
  onBack: () => void;
  prev?: CmsItem;
  next?: CmsItem;
  onNavigate: (itemId: string) => void;
}

/**
 * Owning-app map. collectionId → appId.
 * Drawn from app call-sites (ClientsApp / OperationsApp / PeopleApp / etc).
 * Items live where they live in code, not where intuition would put them.
 */
export const COLLECTION_OWNERSHIP: Readonly<Record<string, string>> = Object.freeze({
  // Dashboard
  clients: 'dashboard',
  // People
  team: 'people',
  people_agents: 'people',
  personas: 'people',
  memory: 'people',
  codex: 'people',
  // Operations
  runbooks: 'operations',
  articles: 'operations',
  incidents: 'operations',
  // IT / R&D
  services: 'it-rd',
  it_experiments: 'it-rd',
  deploys: 'it-rd',
  it_journal: 'it-rd',
  it_loops: 'it-rd',
  it_drift: 'it-rd',
  it_evals: 'it-rd',
  // Clients
  session_notes: 'clients',
  // Tasks
  tasks: 'tasks',
  dods: 'tasks',
  comparators: 'tasks',
  exposed_actions: 'tasks',
  // Marketplace
  marketplace_listings: 'marketplace',
  // Product
  product_items: 'product',
  product_releases: 'product',
  product_rankings: 'product',
  product_launches: 'product',
  product_mvps: 'product',
  product_ideas: 'product',
  // Growth
  growth_channels: 'growth',
  growth_experiments: 'growth',
  growth_acquisition: 'growth',
  growth_strategie: 'growth',
  growth_partenariats: 'growth',
  growth_aeo: 'growth',
  // Finance
  invoices: 'finance',
  plancher_marges: 'finance',
  courbe_demande: 'finance',
  budget_tokens: 'finance',
  formes_prix: 'finance',
  // Legal
  contracts: 'legal',
  policies: 'legal',
  // Sales
  deals: 'sales',
  // Settings — none in seed; ThemeDetailPage.tsx lives in apps/settings
});

const REGISTRY_KEY = '__CITADELLE_ITEM_DETAIL_REGISTRY__';

type Registry = Map<string, ComponentType<ItemDetailProps>>;

const getRegistry = (): Registry => {
  if (typeof window !== 'undefined') {
    const registryWindow = window as Window & {
      __CITADELLE_ITEM_DETAIL_REGISTRY__?: Registry;
    };
    registryWindow[REGISTRY_KEY] ??= new Map<string, ComponentType<ItemDetailProps>>();
    return registryWindow[REGISTRY_KEY];
  }
  return new Map<string, ComponentType<ItemDetailProps>>();
};

/**
 * Each app registers its item detail component from its own register.ts.
 * (Example: apps/dashboard/register.ts calls registerItemDetail('dashboard', DashboardItemDetail).)
 */
export function registerItemDetail(appId: string, component: ComponentType<ItemDetailProps>): void {
  getRegistry().set(appId, component);
}

export function getItemDetail(appId: string): ComponentType<ItemDetailProps> | undefined {
  return getRegistry().get(appId);
}

export function resolveAppIdForCollection(collectionId: string): string | undefined {
  return COLLECTION_OWNERSHIP[collectionId];
}
