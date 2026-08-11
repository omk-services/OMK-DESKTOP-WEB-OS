/** LegalApp — local seed for the AI-Act compliance checklist + the wider
 *  compliance register (frameworks, controls, policies, evidence, risks,
 *  vendors, gaps).
 *
 *  Brief-F (2026-08-11) — la conformité sans Vanta. Six nouvelles collections
 *  sont déclarées ici et branchées sur le même `useCmsStore` que les 23
 *  collections déjà enregistrées dans `src/lib/cms/seed.ts`. Elles héritent
 *  donc du CRUD générique (`CollectionRepeater` + `addItem` / `updateItem` /
 *  `removeItem` du store) : chaque section de l'app montre un bouton
 *  « + Nouveau » qui ouvre un formulaire, exige un titre, bloque les
 *  doublons, et persiste (best-effort vers Supabase, seed local sinon).
 *
 *  `seedLegalCms()` reste idempotent via le drapeau `seeded` — HMR-safe.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ AI-Act checks — existed before this brief, kept as-is. ═══ */

const aiActChecksDef = def({
  id: 'legal_ai_act_checks', name: 'AI-Act checks', singular: 'AI-Act check', accent: '#64748b',
  titleField: 'label', subtitleField: 'category', badgeField: 'done',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'done', label: 'Cleared', type: 'badge' },
    { key: 'description', label: 'Description', type: 'longtext' },
    { key: 'clearedAt', label: 'Cleared at', type: 'text' },
  ],
});

const aiActChecksItems: CmsItem[] = [
  {
    id: 'aiact-1',
    label: 'Risk classification documented',
    category: 'Documentation',
    done: 'Yes',
    description: 'Each AI surface in the OS carries a documented risk tier (minimal, limited, high) with the rationale logged in the audit trail.',
    clearedAt: '2026-07-21',
  },
  {
    id: 'aiact-2',
    label: 'Human-in-the-loop on client-facing actions',
    category: 'Safeguards',
    done: 'Yes',
    description: 'Every outbound client action (send, sign, refund) routes through a human approval gate unless an explicit standing consent is on file.',
    clearedAt: '2026-07-21',
  },
  {
    id: 'aiact-3',
    label: 'Transparency notice on AI-drafted content',
    category: 'Disclosure',
    done: 'Yes',
    description: 'Client-facing emails, summaries, and proposals carry a footer tag identifying AI involvement and the model version used.',
    clearedAt: '2026-07-22',
  },
  {
    id: 'aiact-4',
    label: 'Data-processing register up to date',
    category: 'Documentation',
    done: 'No',
    description: 'The Article 30 register of processing activities must reflect every new model deployed in the last quarter. Audit is in progress, target completion 2026-08-15.',
    clearedAt: '—',
  },
  {
    id: 'aiact-5',
    label: 'Incident logging & reporting path',
    category: 'Operations',
    done: 'No',
    description: 'A formal incident-response path for AI-specific failures (output drift, prompt-injection attempts, data leakage) with notification thresholds. Runbook pending.',
    clearedAt: '—',
  },
];

/* ═══ Compliance register — six new collections, all owned by the legal app. ═══ */

/* Cadres (frameworks) — the regulatory and standards chassis. A few
 * real ones the coach actually targets: SOC 2, ISO 27001, RGPD, NIS 2. */
const frameworksDef = def({
  id: 'legal_frameworks',
  name: 'Cadres',
  singular: 'Cadre',
  accent: '#0f172a',
  titleField: 'name',
  subtitleField: 'short',
  badgeField: 'family',
  fields: [
    { key: 'family', label: 'Famille', type: 'badge' },
    { key: 'short', label: 'Résumé', type: 'text' },
    { key: 'scope', label: 'Périmètre', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'appliesFrom', label: 'Applicable depuis', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});
const frameworksItems: CmsItem[] = [
  {
    id: 'fw-soc2',
    name: 'SOC 2 Type II',
    short: 'Trust services criteria',
    family: 'Audit',
    scope: 'Citadelle (socle SaaS + tooling)',
    owner: 'Amadou',
    appliesFrom: '2026-Q3',
    status: 'In progress',
  },
  {
    id: 'fw-iso27001',
    name: 'ISO 27001',
    short: 'Information security management',
    family: 'Standard',
    scope: 'Citadelle + data pipeline',
    owner: 'Amadou',
    appliesFrom: '2026-Q4',
    status: 'Planned',
  },
  {
    id: 'fw-rgpd',
    name: 'RGPD',
    short: 'EU data protection',
    family: 'Law',
    scope: 'Tous clients EU + prospect EU',
    owner: 'Amadou',
    appliesFrom: '2018-05-25',
    status: 'Active',
  },
  {
    id: 'fw-nis2',
    name: 'NIS 2',
    short: 'EU cyber resilience',
    family: 'Law',
    scope: 'Clients ≥50 pers. ou secteur essentiel',
    owner: 'Amadou',
    appliesFrom: '2024-10-17',
    status: 'Scoped',
  },
];

/* Contrôles — the requirements each framework imposes. They have a code
 * (e.g. CC6.1), a title, a severity (high/medium/low), and a status. */
const controlsDef = def({
  id: 'legal_controls',
  name: 'Contrôles',
  singular: 'Contrôle',
  accent: '#0369a1',
  titleField: 'code',
  subtitleField: 'title',
  badgeField: 'severity',
  fields: [
    { key: 'title', label: 'Intitulé', type: 'text' },
    { key: 'framework', label: 'Cadre', type: 'text' },
    { key: 'severity', label: 'Sévérité', type: 'badge' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'evidenceCount', label: 'Preuves', type: 'number' },
    { key: 'lastTested', label: 'Dernier test', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});
const controlsItems: CmsItem[] = [
  {
    id: 'cc-cc6-1',
    code: 'CC6.1',
    title: 'Logical access — software, infrastructure, architectures',
    framework: 'SOC 2',
    severity: 'High',
    owner: 'Amadou',
    evidenceCount: 2,
    lastTested: '2026-07-12',
    status: 'Done',
  },
  {
    id: 'cc-a-8-1',
    code: 'A.8.1.1',
    title: 'Inventory of assets',
    framework: 'ISO 27001',
    severity: 'Medium',
    owner: 'Amadou',
    evidenceCount: 0,
    lastTested: '—',
    status: 'Pending',
  },
  {
    id: 'cc-art-30',
    code: 'Art. 30',
    title: 'Record of processing activities',
    framework: 'RGPD',
    severity: 'High',
    owner: 'Amadou',
    evidenceCount: 1,
    lastTested: '2026-07-22',
    status: 'In progress',
  },
  {
    id: 'cc-art-32',
    code: 'Art. 32',
    title: 'Security of processing',
    framework: 'RGPD',
    severity: 'High',
    owner: 'Amadou',
    evidenceCount: 3,
    lastTested: '2026-07-30',
    status: 'Done',
  },
];

/* Politiques — published documents the coach maintains. Versioned,
 * owned, with a review date. */
const compliancePoliciesDef = def({
  id: 'legal_compliance_policies',
  name: 'Politiques',
  singular: 'Politique',
  accent: '#7c3aed',
  titleField: 'name',
  subtitleField: 'owner',
  badgeField: 'version',
  fields: [
    { key: 'version', label: 'Version', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'updated', label: 'Mise à jour', type: 'text' },
    { key: 'reviewBy', label: 'À rerelire avant', type: 'text' },
    { key: 'body', label: 'Résumé', type: 'longtext' },
  ],
});
const compliancePoliciesItems: CmsItem[] = [
  {
    id: 'cp-privacy',
    name: 'Politique de confidentialité',
    version: 'v3.1',
    owner: 'Amadou',
    updated: '2026-05-04',
    reviewBy: '2026-11-04',
    body: 'How client data is collected, used, retained, and never shared outside the Citadelle.',
  },
  {
    id: 'cp-dpa',
    name: 'DPA — sous-traitance',
    version: 'v2.0',
    owner: 'Amadou',
    updated: '2026-06-12',
    reviewBy: '2026-12-12',
    body: 'Le contrat qui lie la pratique à chaque sous-traitant. À signer avant tout partage de données.',
  },
  {
    id: 'cp-iso',
    name: 'Politique de sécurité de l\'information',
    version: 'v1.2',
    owner: 'Amadou',
    updated: '2026-04-18',
    reviewBy: '2026-10-18',
    body: 'La politique chapeau ISO 27001 — gouvernance, classification, contrôles d\'accès, journalisation.',
  },
  {
    id: 'cp-ai',
    name: 'Politique d\'usage de l\'IA',
    version: 'v0.9',
    owner: 'Amadou',
    updated: '2026-07-22',
    reviewBy: '2026-10-22',
    body: 'What AI agents may and may not do on the coach\'s behalf, and the human-in-the-loop boundaries.',
  },
];

/* Preuves — the artefacts that back up a control. The link between
 * a control and the document/log/attestation that proves it holds. */
const evidenceDef = def({
  id: 'legal_evidence',
  name: 'Preuves',
  singular: 'Preuve',
  accent: '#15803d',
  titleField: 'title',
  subtitleField: 'control',
  badgeField: 'kind',
  fields: [
    { key: 'control', label: 'Contrôle', type: 'text' },
    { key: 'kind', label: 'Type', type: 'badge' },
    { key: 'location', label: 'Emplacement', type: 'text' },
    { key: 'collectedAt', label: 'Collectée le', type: 'text' },
    { key: 'expiresAt', label: 'Expire le', type: 'text' },
  ],
});
const evidenceItems: CmsItem[] = [
  {
    id: 'ev-cc6-1-screenshot',
    title: 'Capture — matrice d\'accès Supabase',
    control: 'CC6.1',
    kind: 'Screenshot',
    location: 'supabase://iam/roles',
    collectedAt: '2026-07-12',
    expiresAt: '2026-10-12',
  },
  {
    id: 'ev-art-32-tls',
    title: 'Rapport TLS — Qualys SSL Labs',
    control: 'Art. 32',
    kind: 'Report',
    location: 'https://www.ssllabs.com/ssltest/...',
    collectedAt: '2026-07-30',
    expiresAt: '2026-08-30',
  },
  {
    id: 'ev-art-30-register',
    title: 'Registre des traitements — export',
    control: 'Art. 30',
    kind: 'Document',
    location: 'docs/compliance/registre-traitements-v3.xlsx',
    collectedAt: '2026-07-22',
    expiresAt: '2026-10-22',
  },
];

/* Risques — what could go wrong. Probability × impact, mitigation,
 * owner. The risk register is what feeds the audit narrative. */
const risksDef = def({
  id: 'legal_risks',
  name: 'Risques',
  singular: 'Risque',
  accent: '#b91c1c',
  titleField: 'title',
  subtitleField: 'area',
  badgeField: 'rating',
  fields: [
    { key: 'area', label: 'Zone', type: 'text' },
    { key: 'likelihood', label: 'Probabilité', type: 'badge' },
    { key: 'impact', label: 'Impact', type: 'badge' },
    { key: 'rating', label: 'Cotation', type: 'badge' },
    { key: 'mitigation', label: 'Atténuation', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});
const risksItems: CmsItem[] = [
  {
    id: 'rk-vendor-breach',
    title: 'Fuite de données chez un sous-traitant',
    area: 'Sous-traitance',
    likelihood: 'Low',
    impact: 'High',
    rating: 'High',
    mitigation: 'DPA signé, revue annuelle, clause de notification sous 72 h',
    owner: 'Amadou',
    status: 'Mitigated',
  },
  {
    id: 'rk-rgpd-consent',
    title: 'Consentement RGPD mal capturé',
    area: 'Marketing',
    likelihood: 'Medium',
    impact: 'Medium',
    rating: 'Medium',
    mitigation: 'Double opt-in + journal de consentement',
    owner: 'Amadou',
    status: 'Open',
  },
];

/* Fournisseurs (vendors) — the sub-processor register, which is also
 * a RGPD requirement. Each vendor carries its data-access scope and
 * whether the DPA is signed. */
const vendorsDef = def({
  id: 'legal_vendors',
  name: 'Fournisseurs',
  singular: 'Fournisseur',
  accent: '#0891b2',
  titleField: 'name',
  subtitleField: 'category',
  badgeField: 'risk',
  fields: [
    { key: 'category', label: 'Catégorie', type: 'text' },
    { key: 'dataAccess', label: 'Accès aux données', type: 'badge' },
    { key: 'dpaSigned', label: 'DPA signé', type: 'badge' },
    { key: 'dpaDate', label: 'Date DPA', type: 'text' },
    { key: 'lastReview', label: 'Dernière revue', type: 'text' },
    { key: 'risk', label: 'Risque', type: 'badge' },
  ],
});
const vendorsItems: CmsItem[] = [
  {
    id: 'vd-anthropic',
    name: 'Anthropic',
    category: 'Model provider',
    dataAccess: 'Prompts + outputs',
    dpaSigned: 'Yes',
    dpaDate: '2026-04-02',
    lastReview: '2026-07-02',
    risk: 'Medium',
  },
  {
    id: 'vd-supabase',
    name: 'Supabase',
    category: 'Database / Auth',
    dataAccess: 'All tenant data',
    dpaSigned: 'Yes',
    dpaDate: '2026-03-15',
    lastReview: '2026-07-15',
    risk: 'High',
  },
];

/* Ecarts (gaps) — what is not yet compliant. The single source of
 * truth for the audit narrative. Created by hand, or auto-created
 * by the Prowler import. */
const gapsDef = def({
  id: 'legal_gaps',
  name: 'Écarts',
  singular: 'Écart',
  accent: '#dc2626',
  titleField: 'title',
  subtitleField: 'control',
  badgeField: 'severity',
  fields: [
    { key: 'control', label: 'Contrôle', type: 'text' },
    { key: 'framework', label: 'Cadre', type: 'text' },
    { key: 'severity', label: 'Sévérité', type: 'badge' },
    { key: 'openedOn', label: 'Ouvert le', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});
const gapsItems: CmsItem[] = [
  {
    id: 'gp-cc-a-8-1-1',
    title: 'Inventaire des actifs non documenté',
    control: 'A.8.1.1',
    framework: 'ISO 27001',
    severity: 'Medium',
    openedOn: '2026-06-30',
    owner: 'Amadou',
    status: 'Open',
  },
];

let seeded = false;

export function seedLegalCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(aiActChecksDef, aiActChecksItems);
  store.registerCollection(frameworksDef, frameworksItems);
  store.registerCollection(controlsDef, controlsItems);
  store.registerCollection(compliancePoliciesDef, compliancePoliciesItems);
  store.registerCollection(evidenceDef, evidenceItems);
  store.registerCollection(risksDef, risksItems);
  store.registerCollection(vendorsDef, vendorsItems);
  store.registerCollection(gapsDef, gapsItems);
}
