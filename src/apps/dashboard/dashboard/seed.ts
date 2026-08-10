/**
 * Dashboard Enterprise seed — demo data for the 9 sections of the new dashboard.
 *
 * Scope (per brief): kept locally inside src/apps/dashboard so the global CMS
 * seed (src/lib/cms/seed.ts) stays untouched. All numbers are plausible for a
 * coaching firm running 5 active agents on a mixed-model stack.
 *
 * Adaptation: Mark Kashef's Enterprise OS blueprint targets AWS Bedrock +
 * DynamoDB + IAM. Coach OS has no AWS footprint, so the provider list here is
 * the actual stack — Claude (Opus / Sonnet / Haiku) via Anthropic, the
 * MiniMax-M3 fleet, plus open models routed through OpenRouter. Auth stays on
 * Supabase (Postgres) and the cost ceiling is enforced at the gateway (not IAM).
 */

export type AgentState = 'healthy' | 'degraded' | 'tripped';
export type ConnectionKind = 'telegram' | 'slack' | 'email' | 'whatsapp' | 'webhook' | 'in-app';

export interface DashboardAgent {
  id: string;
  name: string;
  role: string;
  purpose: string;
  model: string;
  systemPrompt: string;
  state: AgentState;
  health: number;
  sessionsLast24h: number;
  costLast24h: number;
  connections: ConnectionKind[];
  memories: number;
  guardrails: string[];
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  at: string;
  content: string;
}

export interface PlaygroundModel {
  id: string;
  vendor: string;
  label: string;
  costPer1kIn: number;
  costPer1kOut: number;
  response: string;
  latencyMs: number;
  tone: 'ok' | 'warn' | 'danger';
}

export interface DashboardSession {
  id: string;
  agentId: string;
  startedAt: string;
  durationMin: number;
  tokens: number;
  cost: number;
  channel: ConnectionKind | 'in-app';
  outcome: 'completed' | 'escalated' | 'failed' | 'flagged';
}

export interface CostBucket {
  label: string;
  value: number;
  color: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  note?: string;
}

export interface JarvisRoutine {
  id: string;
  label: string;
  cadence: string;
  lastRun: string;
  output: string;
}

export interface JarvisSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  rationale: string;
  readOnly: true;
}

/* ─────────────────────────── Agents ─────────────────────────── */

export const AGENTS: DashboardAgent[] = [
  {
    id: 'agent-onboarding',
    name: 'Onboarding Agent',
    role: 'Welcome & intake',
    purpose: 'Runs the 7-step welcome for new clients and books the first session.',
    model: 'claude-sonnet-4-5',
    systemPrompt: 'Tu es l\'agent d\'accueil Coach OS. Tu poses 7 questions ciblées pour comprendre la pratique, le tempo et les blocages du nouveau client, puis tu livres un brief de première séance au coach humain.',
    state: 'healthy',
    health: 96,
    sessionsLast24h: 14,
    costLast24h: 1.82,
    connections: ['email', 'telegram'],
    memories: 312,
    guardrails: ['escalate on contract', 'no commitment quotes', 'PII redaction'],
    lastUpdated: '2026-08-06T08:14:00Z',
  },
  {
    id: 'agent-sales',
    name: 'Sales Agent',
    role: 'Outreach & qualification',
    purpose: 'Drafts outreach in the coach\'s voice and scores inbound leads against the 6-signal diagnostic.',
    model: 'claude-opus-4-5',
    systemPrompt: 'Tu es l\'agent de croissance Coach OS. Tu rédiges les messages de prospection dans la voix du coach, tu scores chaque lead sur 6 signaux, et tu ne qualifies jamais au-dessus de 70 sans relecture humaine.',
    state: 'healthy',
    health: 91,
    sessionsLast24h: 38,
    costLast24h: 9.46,
    connections: ['email', 'slack', 'webhook'],
    memories: 1284,
    guardrails: ['max 3 drafts/day', 'voice clone approval', 'lead score ≤ 70 routes to human'],
    lastUpdated: '2026-08-06T08:42:00Z',
  },
  {
    id: 'agent-retention',
    name: 'Retention Agent',
    role: 'Churn watch',
    purpose: 'Surfaces clients at risk from engagement decay and drafts a 3-step re-engagement sequence.',
    model: 'claude-sonnet-4-5',
    systemPrompt: 'Tu es l\'agent de rétention Coach OS. Tu observes les signaux d\'engagement décroissant et tu proposes, sans jamais écrire, une séquence de réengagement en 3 étapes.',
    state: 'degraded',
    health: 64,
    sessionsLast24h: 6,
    costLast24h: 0.92,
    connections: ['email'],
    memories: 218,
    guardrails: ['human approves any send', 'no public commentary on churn'],
    lastUpdated: '2026-08-06T07:58:00Z',
  },
  {
    id: 'agent-knowledge',
    name: 'Knowledge Agent',
    role: 'Vault curator',
    purpose: 'Indexes session notes into the IP Vault, extracts the proprietary framework, surfaces reuse.',
    model: 'claude-haiku-4-5',
    systemPrompt: 'Tu es l\'agent de connaissance Coach OS. Tu indexes chaque note de séance, tu extrais les éléments réutilisables, et tu ne pousses jamais rien vers l\'extérieur sans relecture.',
    state: 'healthy',
    health: 99,
    sessionsLast24h: 142,
    costLast24h: 2.14,
    connections: ['webhook'],
    memories: 4821,
    guardrails: ['no outbound shares', 'Zero-PII seal enforced', 'provenance log mandatory'],
    lastUpdated: '2026-08-06T08:36:00Z',
  },
  {
    id: 'agent-jarvis',
    name: 'Jarvis',
    role: 'Read-only copilot',
    purpose: 'Reads the OS state, explains it, never writes anything back.',
    model: 'claude-sonnet-4-5',
    systemPrompt: 'Tu es Jarvis, copilote en lecture seule de Coach OS. Tu observes l\'état des agents, sessions, coûts et alertes. Tu expliques, tu recommandes, mais tu n\'écris jamais rien dans le système. Si on te demande de modifier quelque chose, tu réponds que l\'écriture est désactivée par conception.',
    state: 'healthy',
    health: 100,
    sessionsLast24h: 91,
    costLast24h: 4.18,
    connections: ['in-app'],
    memories: 0,
    guardrails: ['read-only by design', 'no state mutation', 'every recommendation logged'],
    lastUpdated: '2026-08-06T08:48:00Z',
  },
];

/* ─────────────────────────── Chat ─────────────────────────── */

export const CHAT_BY_AGENT: Record<string, ChatMessage[]> = {
  'agent-onboarding': [
    { id: 'm1', role: 'assistant', at: '08:14', content: 'Bonjour. Je suis l\'agent d\'accueil Coach OS. Je vais te poser 7 questions pour comprendre ta pratique avant ta première séance. Ça prend environ 4 minutes.' },
    { id: 'm2', role: 'user', at: '08:15', content: 'Ça marche.' },
    { id: 'm3', role: 'assistant', at: '08:15', content: 'Combien de clients actifs acompagnes-tu aujourd\'hui ?' },
    { id: 'm4', role: 'user', at: '08:16', content: 'Une douzaine.' },
    { id: 'm5', role: 'assistant', at: '08:16', content: 'Bien noté. Question 2 : combien d\'heures par semaine passes-tu à retranscrire tes séances ?' },
    { id: 'm6', role: 'user', at: '08:17', content: 'Trop. 6 ou 7.' },
    { id: 'm7', role: 'assistant', at: '08:17', content: 'Compris. On va regarder ce point en priorité. Je passe à la question 3 sur ton offre signature.' },
  ],
  'agent-sales': [
    { id: 'm1', role: 'assistant', at: '08:30', content: 'Voici 3 brouillons de message pour le lead "Atelier Bricolage". Tu valides avant que je les envoie.' },
    { id: 'm2', role: 'assistant', at: '08:30', content: 'Brouillon A — direct : "Bonjour Marc, j\'ai vu ton passage sur le podcast X. Tu parles d\'un point qui revient souvent chez mes clients. Tu veux qu\'on en parle 20 minutes ?" — 41 mots.' },
    { id: 'm3', role: 'assistant', at: '08:31', content: 'Brouillon B —好奇 : "Marc, ton passage sur le podcast X m\'a fait penser à 3 de mes clients. Tu es dispo cette semaine pour 20 minutes ?" — 24 mots.' },
    { id: 'm4', role: 'user', at: '08:33', content: 'Le B est plus moi. Mais raccourcis la question finale.' },
    { id: 'm5', role: 'assistant', at: '08:33', content: 'OK. Version B révisée : "Marc, ton passage sur le podcast X m\'a fait penser à 3 de mes clients. 20 minutes cette semaine ?" — 20 mots. J\'attends ta validation avant envoi.' },
  ],
  'agent-retention': [
    { id: 'm1', role: 'assistant', at: '07:58', content: 'Surveillance des 14 derniers jours. 3 clients en zone de risque.' },
    { id: 'm2', role: 'assistant', at: '07:58', content: 'Studio Nord — 21 jours sans séance. Recommandation : appel de réengagement par coach humain (pas de mail automatique).' },
    { id: 'm3', role: 'assistant', at: '07:59', content: 'Atelier Bricolage — onboarding étape 3/7 bloqué depuis 9 jours. Recommandation : relance coach sur WhatsApp.' },
    { id: 'm4', role: 'user', at: '08:02', content: 'Prépare les 3 drafts, je relis avant envoi.' },
    { id: 'm5', role: 'assistant', at: '08:02', content: 'Brouillons prêts. Aucun envoi effectué. Tu valides ?' },
  ],
  'agent-knowledge': [
    { id: 'm1', role: 'assistant', at: '08:36', content: '142 notes indexées sur les dernières 24h. 7 frameworks extraits.' },
    { id: 'm2', role: 'assistant', at: '08:36', content: 'Le "Weight Method" de Priya Nandan a été rattaché à 3 sessions antérieures. Score de cohérence : 0.94.' },
    { id: 'm3', role: 'user', at: '08:38', content: 'Prépare un draft de page framework.' },
    { id: 'm4', role: 'assistant', at: '08:38', content: 'Brouillon prêt dans le Vault. Aucun push externe. Tu valides ?' },
  ],
  'agent-jarvis': [
    { id: 'm1', role: 'assistant', at: '08:48', content: 'Bonjour. Je suis Jarvis. Je lis l\'état du système, j\'explique, je ne touche à rien.' },
    { id: 'm2', role: 'user', at: '08:49', content: 'Où en est la dépense du jour ?' },
    { id: 'm3', role: 'assistant', at: '08:49', content: 'La dépense cumulée du jour est de $18.52, en baisse de 23% par rapport à la moyenne mobile 7 jours. 5 agents actifs. 1 en état dégradé (Retention, 64% de santé). 291 messages sur 24h, 0 erreur.' },
    { id: 'm4', role: 'user', at: '08:50', content: 'Désactive la prospection outbound pour aujourd\'hui.' },
    { id: 'm5', role: 'assistant', at: '08:50', content: 'Je ne peux pas. L\'écriture est désactivée par conception. Je peux te montrer la procédure manuelle pour désactiver l\'agent Sales, ou ouvrir une note pour ton assistant humain.' },
  ],
};

/* ─────────────────────────── Playground ─────────────────────────── */

export const PLAYGROUND_PROMPT = 'Un client qui hésite entre 3 formats de coaching hésite depuis 11 jours. Rédige 3 messages courts (40 mots max chacun) qui le font choisir sans le presser.';

export const PLAYGROUND_MODELS: PlaygroundModel[] = [
  {
    id: 'claude-opus-4-5',
    vendor: 'Anthropic',
    label: 'Claude Opus 4.5',
    costPer1kIn: 0.015,
    costPer1kOut: 0.075,
    latencyMs: 1840,
    tone: 'ok',
    response: 'A — "11 jours, c\'est long. Quel est le format qui te fait le plus peur à choisir ?" B — "Si tu devais signer ce soir pour un seul, ce serait lequel ?" C — "Décide sur la question du budget. Le reste suit."',
  },
  {
    id: 'claude-sonnet-4-5',
    vendor: 'Anthropic',
    label: 'Claude Sonnet 4.5',
    costPer1kIn: 0.003,
    costPer1kOut: 0.015,
    latencyMs: 920,
    tone: 'ok',
    response: 'A — "Trois formats, onze jours. Lequel te demanderait le moins d\'énergie demain matin ?" B — "Si tu devais en choisir un seul, ce serait lequel ?" C — "Le choix se fait sur la peur, pas sur la raison. Laquelle est la plus petite ?"',
  },
  {
    id: 'claude-haiku-4-5',
    vendor: 'Anthropic',
    label: 'Claude Haiku 4.5',
    costPer1kIn: 0.0008,
    costPer1kOut: 0.004,
    latencyMs: 410,
    tone: 'ok',
    response: 'A — "Trois options depuis 11 jours. Laquelle t\'empêche le moins de dormir ?" B — "Si tu en prenais un seul, ce serait lequel ?" C — "Décide sur l\'énergie de demain matin."',
  },
  {
    id: 'm3',
    vendor: 'MiniMax',
    label: 'MiniMax-M3',
    costPer1kIn: 0.002,
    costPer1kOut: 0.006,
    latencyMs: 730,
    tone: 'warn',
    response: 'A — "11 jours, 3 formats. Lequel te donne le moins d\'excuses pour reculer ?" B — "Choisis celui où tu te vois encore dans 6 mois." C — "Le choix se fait sur la peur, pas sur la raison."',
  },
  {
    id: 'llama-3.3-70b',
    vendor: 'OpenRouter',
    label: 'Llama 3.3 70B',
    costPer1kIn: 0.00059,
    costPer1kOut: 0.00079,
    latencyMs: 610,
    tone: 'ok',
    response: 'A — "Trois options depuis 11 jours. Laquelle te fait le moins hésiter ?" B — "Si tu en choisissais un seul, ce serait lequel ?" C — "Décide sur l\'énergie de demain matin."',
  },
  {
    id: 'mistral-large',
    vendor: 'OpenRouter',
    label: 'Mistral Large 2',
    costPer1kIn: 0.002,
    costPer1kOut: 0.006,
    latencyMs: 870,
    tone: 'danger',
    response: 'A — "11 jours, 3 formats. Lequel te fait le plus peur à choisir ?" B — "Si tu signais ce soir pour un seul, ce serait lequel ?" C — "Décide sur le budget. Le reste suit."',
  },
];

/* ─────────────────────────── Sessions ─────────────────────────── */

export const SESSIONS: DashboardSession[] = [
  { id: 's-001', agentId: 'agent-knowledge', startedAt: '08:48:12', durationMin: 1, tokens: 1840, cost: 0.014, channel: 'webhook', outcome: 'completed' },
  { id: 's-002', agentId: 'agent-sales', startedAt: '08:47:51', durationMin: 4, tokens: 6240, cost: 0.094, channel: 'email', outcome: 'completed' },
  { id: 's-003', agentId: 'agent-jarvis', startedAt: '08:46:30', durationMin: 2, tokens: 980, cost: 0.003, channel: 'in-app', outcome: 'completed' },
  { id: 's-004', agentId: 'agent-onboarding', startedAt: '08:45:09', durationMin: 6, tokens: 4120, cost: 0.012, channel: 'email', outcome: 'completed' },
  { id: 's-005', agentId: 'agent-sales', startedAt: '08:42:18', durationMin: 3, tokens: 5180, cost: 0.078, channel: 'slack', outcome: 'escalated' },
  { id: 's-006', agentId: 'agent-retention', startedAt: '08:38:44', durationMin: 2, tokens: 1620, cost: 0.005, channel: 'email', outcome: 'completed' },
  { id: 's-007', agentId: 'agent-knowledge', startedAt: '08:36:21', durationMin: 1, tokens: 980, cost: 0.002, channel: 'webhook', outcome: 'completed' },
  { id: 's-008', agentId: 'agent-sales', startedAt: '08:33:05', durationMin: 5, tokens: 7820, cost: 0.117, channel: 'email', outcome: 'completed' },
  { id: 's-009', agentId: 'agent-onboarding', startedAt: '08:31:48', durationMin: 7, tokens: 5640, cost: 0.017, channel: 'telegram', outcome: 'completed' },
  { id: 's-010', agentId: 'agent-knowledge', startedAt: '08:29:14', durationMin: 1, tokens: 720, cost: 0.001, channel: 'webhook', outcome: 'completed' },
  { id: 's-011', agentId: 'agent-sales', startedAt: '08:24:55', durationMin: 4, tokens: 6810, cost: 0.102, channel: 'slack', outcome: 'flagged' },
  { id: 's-012', agentId: 'agent-jarvis', startedAt: '08:22:09', durationMin: 1, tokens: 540, cost: 0.002, channel: 'in-app', outcome: 'completed' },
  { id: 's-013', agentId: 'agent-onboarding', startedAt: '08:18:30', durationMin: 5, tokens: 3920, cost: 0.012, channel: 'email', outcome: 'completed' },
  { id: 's-014', agentId: 'agent-retention', startedAt: '08:14:11', durationMin: 3, tokens: 2140, cost: 0.006, channel: 'email', outcome: 'completed' },
  { id: 's-015', agentId: 'agent-knowledge', startedAt: '08:09:52', durationMin: 1, tokens: 1240, cost: 0.002, channel: 'webhook', outcome: 'failed' },
];

/* ─────────────────────────── Usage + Cost ─────────────────────────── */

export const USAGE_TODAY = {
  tokensIn: 1_842_310,
  tokensOut: 612_840,
  costUsd: 18.52,
  budgetUsd: 25,
  projectionUsd: 23.41,
  costPerHourUsd: [
    1.42, 1.21, 0.98, 0.82, 1.05, 1.31, 1.62, 2.18, 2.46, 2.31, 1.94, 1.42,
  ],
};

export const COST_BUCKETS: CostBucket[] = [
  { label: 'Claude Opus 4.5', value: 9.46, color: '#7c3aed' },
  { label: 'Claude Sonnet 4.5', value: 6.04, color: '#0891b2' },
  { label: 'Claude Haiku 4.5', value: 1.62, color: '#0d9488' },
  { label: 'MiniMax-M3', value: 0.94, color: '#ca8a04' },
  { label: 'Open models', value: 0.46, color: '#64748b' },
];

export const COST_TREND = [
  { day: 'Jul 30', value: 14.20 },
  { day: 'Jul 31', value: 16.80 },
  { day: 'Aug 01', value: 15.40 },
  { day: 'Aug 02', value: 17.10 },
  { day: 'Aug 03', value: 19.80 },
  { day: 'Aug 04', value: 22.40 },
  { day: 'Aug 05', value: 21.70 },
  { day: 'Aug 06', value: 18.52 },
];

export const MONTH_SUMMARY = {
  monthToDateUsd: 412.18,
  monthPreviousUsd: 386.94,
  monthProjectionUsd: 542.10,
  monthBudgetUsd: 500,
  overBudget: false,
  topVendor: 'Anthropic',
};

/* ─────────────────────────── Audit log ─────────────────────────── */

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'a-001', at: '08:48:12', actor: 'agent-knowledge', action: 'index.session_note', entity: 'sn-2', note: 'Marcus Reyes · burnout check-in' },
  { id: 'a-002', at: '08:47:51', actor: 'agent-sales',     action: 'draft.outreach',     entity: 'lead:atelier-bricolage', note: 'Brouillon B approuvé par humain' },
  { id: 'a-003', at: '08:46:30', actor: 'agent-jarvis',    action: 'read.system',        entity: 'os.state' },
  { id: 'a-004', at: '08:45:09', actor: 'agent-onboarding',action: 'intake.advance',     entity: 'client:techflow', note: 'Step 1 → 2' },
  { id: 'a-005', at: '08:42:18', actor: 'agent-sales',     action: 'lead.escalate',      entity: 'lead:dara-okafor', note: 'Score 71 → humain' },
  { id: 'a-006', at: '08:38:44', actor: 'agent-retention', action: 'observe.decay',      entity: 'client:studio-nord' },
  { id: 'a-007', at: '08:36:21', actor: 'agent-knowledge', action: 'extract.framework',  entity: 'sn-3', note: '"Weight Method" · 4 stages' },
  { id: 'a-008', at: '08:33:05', actor: 'human:coach',     action: 'draft.approve',      entity: 'lead:atelier-bricolage' },
  { id: 'a-009', at: '08:31:48', actor: 'agent-onboarding',action: 'intake.advance',     entity: 'client:atelier-bricolage' },
  { id: 'a-010', at: '08:29:14', actor: 'agent-knowledge', action: 'index.session_note', entity: 'sn-1' },
  { id: 'a-011', at: '08:24:55', actor: 'agent-sales',     action: 'draft.flag',         entity: 'lead:amara-bello', note: 'Tonalité à reviser' },
  { id: 'a-012', at: '08:22:09', actor: 'agent-jarvis',    action: 'recommend.brief',    entity: 'os.state' },
  { id: 'a-013', at: '08:18:30', actor: 'agent-onboarding',action: 'intake.advance',     entity: 'client:techflow' },
  { id: 'a-014', at: '08:14:11', actor: 'agent-retention', action: 'observe.decay',      entity: 'client:atelier-bricolage' },
  { id: 'a-015', at: '08:09:52', actor: 'agent-knowledge', action: 'index.failed',       entity: 'sn-5', note: 'Audio source indisponible' },
];

/* ─────────────────────────── Jarvis ─────────────────────────── */

export const JARVIS_ROUTINES: JarvisRoutine[] = [
  { id: 'r-morning', label: 'Morning brief', cadence: '08:00 · quotidien', lastRun: '08:00:14', output: 'Dépense hier $21.70 · 5 agents · 1 dégradé' },
  { id: 'r-cost',    label: 'Cost ceiling watch', cadence: 'toutes les 30 min', lastRun: '08:30:00', output: 'Budget mensuel 82% consommé, projection $542' },
  { id: 'r-churn',   label: 'Churn watch', cadence: '2× / jour', lastRun: '07:58:02', output: '2 clients en zone de risque, drafts prêts' },
  { id: 'r-dlp',     label: 'DLP scan', cadence: 'horaire', lastRun: '08:42:18', output: '0 tentative de fuite, 0 clé AWS, 0 PEM' },
];

export const JARVIS_SUGGESTIONS: JarvisSuggestion[] = [
  { id: 'j-1', priority: 'high',   title: 'Retention Agent en état dégradé', rationale: 'Santé 64%, queue 3. Recommandation : re-provisionner côté M3 ou basculer sur Sonnet pour la prochaine heure.', readOnly: true },
  { id: 'j-2', priority: 'medium', title: '2 leads > 70 en attente', rationale: 'Dara Okafor (71) et Marcus Reyes (74). Score au-dessus du seuil — relecture humaine requise.', readOnly: true },
  { id: 'j-3', priority: 'medium', title: 'Budget mensuel à 82%', rationale: 'Projection $542 sur $500 budget. Si la trajectoire continue, dépassement vers le 24 août.', readOnly: true },
  { id: 'j-4', priority: 'low',    title: 'Vault 4821 entrées', rationale: 'Knowledge Agent tourne à 142 sessions/jour. Aucun signe de saturation mais à surveiller.', readOnly: true },
];

/* ─────────────────────────── Helpers ─────────────────────────── */

export function findAgent(id: string): DashboardAgent | undefined {
  return AGENTS.find(a => a.id === id);
}

/**
 * Cross-module surface: the Dashboard Audit Log surfaces DLP counters that
 * are produced by the security app. The numbers come from
 * security/seed.ts DLP_PATTERNS — duplicated here as a snapshot so the
 * Audit Log does not need to import across module boundaries. If the
 * security module's hitsLast24h ever change, refresh this map.
 */
export const DLP_HITS = {
  awsAccessKey: 0,
  apiKeyHeader: 1,
  pemPrivateKey: 0,
  slackToken: 0,
  githubPat: 0,
  creditCard: 2,
  usSsn: 0,
  awsSecretShaped: 4,
  jwt: 3,
} as const;

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}
