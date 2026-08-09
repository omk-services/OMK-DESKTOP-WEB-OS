/** SettingsApp — local seed for the Integrations section.
 *
 *  - settings_integrations · Stripe / Calendly / LinkedIn
 *
 *  Each row carries the connection status as a `badgeField`, so the
 *  repeater renders a colored chip next to the provider name. The
 *  `status` field is `'connected' | 'not connected'` — the same two
 *  states the previous hardcoded JSX rendered, so nothing visible
 *  changes for the user.
 *
 *  `seedSettingsCms()` is called once at module load from
 *  SettingsApp.tsx — idempotent thanks to `registerCollection`'s
 *  early-return (already registered on HMR).
 */

import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

const integrationsDef: CmsCollectionDef = {
  id: 'settings_integrations',
  name: 'Integrations',
  singular: 'Integration',
  accent: '#78716c',
  titleField: 'name',
  subtitleField: 'description',
  badgeField: 'status',
  fields: [
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'scope', label: 'Scope', type: 'text' },
  ],
};

const integrationsItems: CmsItem[] = [
  {
    id: 'integration-stripe',
    name: 'Stripe',
    description: 'Paiement & facturation recurrente.',
    status: 'connected',
    scope: 'billing',
  },
  {
    id: 'integration-calendly',
    name: 'Calendly',
    description: 'Prise de rendez-vous et synchronisation calendrier.',
    status: 'connected',
    scope: 'scheduling',
  },
  {
    id: 'integration-linkedin',
    name: 'LinkedIn',
    description: 'Connexion au profil professionnel — non configure.',
    status: 'not connected',
    scope: 'social',
  },
];

/** Idempotent: registerCollection short-circuits on re-entry (HMR-safe). */
export function seedSettingsCms(): void {
  useCmsStore.getState().registerCollection(integrationsDef, integrationsItems);
}
