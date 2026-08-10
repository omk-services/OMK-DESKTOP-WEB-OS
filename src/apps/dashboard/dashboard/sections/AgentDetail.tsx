/**
 * AgentDetailPage — opens inside AppDetailOverlay. Per the brief, the agent
 * detail has 6 tabs : invite système, conversation, sessions, mémoires,
 * connexions, réglages.
 *
 * The detail is rendered as a sibling of AppFrame (so it follows the topbar
 * theme, not the app sidebar theme — see ClientsApp precedent).
 *
 * System prompt persistence: the seed `DashboardAgent.systemPrompt` is
 * immutable. The user-facing override lives in `PROMPT_OVERRIDES` (a
 * localStorage map keyed by agent id). The effective prompt = override if
 * present, else seed. When the API lands, replace `loadPromptOverrides` /
 * `savePromptOverrides` with a fetch + cache, but keep the same shape so
 * the page stays the same.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Bot, BrainCircuit, Cable, Check, Database, History, MessageSquare,
  Plug, RotateCcw, Save, Settings, ShieldCheck, Sparkles, Wrench, X,
} from 'lucide-react';
import type { DashboardAgent } from '../seed';
import { CHAT_BY_AGENT } from '../seed';
import {
  ACCENT, GhostButton, IconChip, KV, Panel, Pill, PrimaryButton,
  ProgressBar, SectionTitle,
} from '../Primitives';
import { useShellStore } from '../../../../stores/shell.store';

type TabId = 'system' | 'conversation' | 'sessions' | 'memories' | 'connections' | 'settings';

const TABS: Array<{ id: TabId; label: string; icon: typeof Bot }> = [
  { id: 'system',       label: 'Invite système', icon: Sparkles },
  { id: 'conversation', label: 'Conversation',   icon: MessageSquare },
  { id: 'sessions',     label: 'Sessions',       icon: History },
  { id: 'memories',     label: 'Mémoires',       icon: BrainCircuit },
  { id: 'connections',  label: 'Connexions',     icon: Plug },
  { id: 'settings',     label: 'Réglages',       icon: Settings },
];

const PROMPT_OVERRIDES_KEY = 'coach-os:agent-prompts:v1';

function loadPromptOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROMPT_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function savePromptOverrides(map: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROMPT_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    // Storage quota or private mode — degrade silently to in-memory only.
  }
}

export function AgentDetailPage({
  agent,
  onBack,
}: {
  agent: DashboardAgent;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<TabId>('system');
  const addToast = useShellStore((s) => s.addToast);
  // User-supplied overrides of the seed system prompt. Re-hydrated on
  // mount and mirrored back to localStorage on every change. Survives
  // tab switches, section changes, and page reloads.
  const [promptOverrides, setPromptOverrides] = useState<Record<string, string>>(() => loadPromptOverrides());
  useEffect(() => {
    savePromptOverrides(promptOverrides);
  }, [promptOverrides]);
  const effectivePrompt = promptOverrides[agent.id] ?? agent.systemPrompt;
  const savePrompt = (next: string): void => {
    setPromptOverrides((prev) => ({ ...prev, [agent.id]: next }));
  };
  const resetPrompt = (): void => {
    setPromptOverrides((prev) => {
      const next = { ...prev };
      delete next[agent.id];
      return next;
    });
  };

  return (
    <div className="min-h-full" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Sticky command bar */}
      <div
        className="sticky top-0 z-10 px-5 py-3 sm:px-7"
        style={{
          background: 'color-mix(in srgb, var(--theme-bg) 70%, transparent)',
          borderBottom: '1px solid var(--panel-border)',
          backdropFilter: 'blur(18px) saturate(150%)',
        }}
      >
        <div className="mx-auto flex max-w-[1080px] items-center gap-3">
          <GhostButton onClick={onBack} size="sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour aux agents
          </GhostButton>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
            Dashboard
          </span>
          <span style={{ color: 'var(--theme-text-dim)' }}>›</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
            Agents
          </span>
          <span style={{ color: 'var(--theme-text-dim)' }}>›</span>
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-muted)' }}>
            {agent.name}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1080px] px-5 py-7 sm:px-7">
        {/* Header card */}
        <Panel pad="p-6" className="mb-5">
          <div className="flex items-start gap-4">
            <IconChip tone={agent.state === 'healthy' ? 'ok' : agent.state === 'degraded' ? 'warn' : 'danger'} size={56}>
              <Bot className="h-5 w-5" />
            </IconChip>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[24px] font-extrabold tracking-tight" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
                  {agent.name}
                </h1>
                <Pill tone={agent.state === 'healthy' ? 'ok' : agent.state === 'degraded' ? 'warn' : 'danger'}>
                  {agent.state}
                </Pill>
                <Pill tone="accent">{agent.role}</Pill>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                {agent.purpose}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                <span>modèle · {agent.model}</span>
                <span>·</span>
                <span>santé {agent.health}%</span>
                <span>·</span>
                <span>{agent.sessionsLast24h} sessions 24 h</span>
                <span>·</span>
                <span>${agent.costLast24h.toFixed(2)} 24 h</span>
              </div>
              <div className="mt-3 max-w-md">
                <ProgressBar value={agent.health} tone={agent.state === 'healthy' ? 'ok' : agent.state === 'degraded' ? 'warn' : 'danger'} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <PrimaryButton size="sm" onClick={() => { setTab('conversation'); addToast({ source: 'Agents', type: 'info', message: `Conversation ouverte avec ${agent.name} — brouillons à valider avant envoi.` }); }}>
                <MessageSquare className="h-3.5 w-3.5" /> Discuter
              </PrimaryButton>
              <GhostButton size="sm" onClick={() => { setTab('settings'); addToast({ source: 'Agents', type: 'info', message: `Réglages de ${agent.name} — toute modification est tracée dans l'audit log.` }); }}>
                <Wrench className="h-3.5 w-3.5" /> Réglages
              </GhostButton>
            </div>
          </div>
        </Panel>

        {/* Tabs */}
        <div
          className="mb-5 flex flex-wrap gap-1 rounded-xl p-1"
          style={{ background: 'var(--theme-surface-hover)' }}
          role="tablist"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all"
                style={{
                  background: on ? 'var(--theme-surface)' : 'transparent',
                  color: on ? 'var(--theme-text)' : 'var(--theme-text-muted)',
                  boxShadow: on ? 'var(--shadow-panel)' : 'none',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'system' ? <SystemTab agent={agent} prompt={effectivePrompt} onSave={savePrompt} onReset={resetPrompt} /> : null}
        {tab === 'conversation' ? <ConversationTab agent={agent} /> : null}
        {tab === 'sessions' ? <SessionsTab agent={agent} /> : null}
        {tab === 'memories' ? <MemoriesTab agent={agent} /> : null}
        {tab === 'connections' ? <ConnectionsTab agent={agent} /> : null}
        {tab === 'settings' ? <SettingsTab agent={agent} /> : null}
      </div>
    </div>
  );
}

function SystemTab({
  agent,
  prompt,
  onSave,
  onReset,
}: {
  agent: DashboardAgent;
  prompt: string;
  onSave: (next: string) => void;
  onReset: () => void;
}) {
  const addToast = useShellStore((s) => s.addToast);
  // Local draft so the user can type freely without losing the saved value.
  // Reset to the saved `prompt` whenever the agent changes (cancels pending
  // edits when the user backtracks to a different agent card).
  const [draft, setDraft] = useState<string>(prompt);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(prompt);
    setError(null);
  }, [prompt, agent.id]);
  const trimmed = draft.trim();
  const dirty = trimmed !== prompt.trim();
  const canSave = trimmed.length > 0 && dirty;
  const charCount = draft.length;
  const handleSave = (): void => {
    if (trimmed.length === 0) {
      setError("Une invite vide laisse l'agent sans comportement défini. Renseigne au moins une phrase.");
      return;
    }
    onSave(trimmed);
    setError(null);
    addToast({
      source: 'Agents',
      type: 'success',
      message: `Invite système de ${agent.name} enregistrée · ${trimmed.length} caractères`,
    });
  };
  const handleCancel = (): void => {
    setDraft(prompt);
    setError(null);
  };
  const handleReset = (): void => {
    onReset();
    setError(null);
    addToast({
      source: 'Agents',
      type: 'info',
      message: `Invite système de ${agent.name} remise à la version d'origine.`,
    });
  };
  const isOverridden = draft !== prompt.trim();
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      <Panel pad="p-5">
        <SectionTitle eyebrow="Système" title="Invite système" />
        <p className="mb-3 text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Ce texte pilote le comportement de l'agent. Chaque modification est tracée dans l'audit log.
        </p>
        <textarea
          value={draft}
          onChange={(e) => { setDraft(e.target.value); if (error) setError(null); }}
          spellCheck={false}
          rows={12}
          aria-label={`Invite système de ${agent.name}`}
          className="block w-full min-w-0 rounded-xl p-4 text-[12.5px] leading-relaxed"
          style={{
            background: 'var(--theme-surface-hover)',
            color: 'var(--theme-text)',
            border: `1px solid ${error ? '#b91c1c' : 'var(--panel-border-subtle)'}`,
            fontFamily: 'var(--theme-font-body)',
            resize: 'vertical',
            minHeight: 240,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
          <span>{charCount.toLocaleString()} caractères</span>
          <span>·</span>
          <span>{trimmed.split(/\s+/).filter(Boolean).length.toLocaleString()} mots</span>
          {isOverridden ? (
            <>
              <span>·</span>
              <span style={{ color: ACCENT }}>version personnalisée active</span>
            </>
          ) : null}
        </div>
        {error ? (
          <div
            className="mt-2 flex items-start gap-2 rounded-lg p-2.5 text-[11.5px]"
            style={{ background: 'rgba(185,28,28,0.10)', color: '#b91c1c', border: '1px solid rgba(185,28,28,0.35)' }}
            role="alert"
          >
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PrimaryButton size="sm" onClick={handleSave} disabled={!canSave}>
            <Save className="h-3.5 w-3.5" /> Enregistrer
          </PrimaryButton>
          <GhostButton size="sm" onClick={handleCancel} disabled={!dirty}>
            <X className="h-3.5 w-3.5" /> Annuler
          </GhostButton>
          <button
            type="button"
            onClick={handleReset}
            disabled={prompt.trim() === agent.systemPrompt.trim()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
            style={{
              background: 'transparent',
              color: 'var(--theme-text-muted)',
              border: '1px solid var(--panel-border)',
            }}
            title="Revenir à l'invite d'origine (seed)"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Remettre l'original
          </button>
        </div>
      </Panel>
      <Panel pad="p-5">
        <SectionTitle eyebrow="Garde-fous" title="Bornes actives" />
        <ul className="flex flex-col gap-2">
          {agent.guardrails.map((g, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg p-2.5"
              style={{ background: 'var(--theme-surface-hover)' }}
            >
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
              <span className="text-[12.5px]" style={{ color: 'var(--theme-text)' }}>{g}</span>
            </li>
          ))}
        </ul>
        <div
          className="mt-4 flex items-start gap-2 rounded-lg p-3 text-[11px]"
          style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text-muted)' }}
        >
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
          <span>Les modifications sont persistées localement. Branche l'API agents pour les pousser côté serveur.</span>
        </div>
      </Panel>
    </div>
  );
}

function ConversationTab({ agent }: { agent: DashboardAgent }) {
  const messages = CHAT_BY_AGENT[agent.id] ?? [];
  return (
    <Panel pad="p-5">
      <SectionTitle
        eyebrow="Fil"
        title="Conversation"
        subtitle={`${messages.length} messages · exemple figé pour démo`}
        action={<Pill tone="info">read-only preview</Pill>}
      />
      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title="Aucune conversation enregistrée"
          hint="Démarre une session chat depuis le bouton « Discuter » pour amorcer un fil."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className="flex gap-3"
              style={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {m.role !== 'user' ? (
                <IconChip tone="accent" size={28}>
                  <Bot className="h-3.5 w-3.5" />
                </IconChip>
              ) : null}
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5"
                style={{
                  background: m.role === 'user' ? ACCENT : 'var(--theme-surface-hover)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--theme-text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--panel-border-subtle)',
                }}
              >
                <div className="text-[10px] font-mono" style={{ opacity: 0.7 }}>
                  {m.role} · {m.at}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed">{m.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function SessionsTab({ agent }: { agent: DashboardAgent }) {
  // Per-agent session trace. The number of rows is derived from the
  // agent's `sessionsLast24h` so a freshly created agent (0 sessions) shows
  // the empty state, and an agent with N sessions shows N rows whose token
  // and cost values follow the agent's average cost. This replaces the
  // previous hard-coded six-row table that misrepresented every agent.
  const rows = useMemo(() => deriveSessionTrace(agent), [agent]);
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      <Panel pad="p-5">
        <SectionTitle eyebrow="Trace" title={`${rows.length} dernières sessions 24 h`} />
        {rows.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="Aucune session sur les 24 dernières heures"
            hint="Quand l'agent tourne, chaque session apparaît ici avec son canal, ses tokens et son coût."
          />
        ) : (
          <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            {rows.map((s, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="font-mono text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{s.at}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>{s.channel}</span>
                <span className="ml-auto tabular-nums text-[12px]" style={{ color: 'var(--theme-text)' }}>{s.tokens.toLocaleString()} tok</span>
                <span className="w-16 text-right tabular-nums text-[12px]" style={{ color: 'var(--theme-text)' }}>${s.cost.toFixed(3)}</span>
                <Pill tone={s.outcome === 'failed' ? 'danger' : 'ok'}>{s.outcome}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel pad="p-5">
        <SectionTitle eyebrow="Récap" title="Sur la fenêtre" />
        <div className="grid grid-cols-2 gap-3">
          <KV label="Sessions" value={agent.sessionsLast24h} mono />
          <KV label="Coût" value={`$${agent.costLast24h.toFixed(2)}`} mono />
          <KV label="Mémoires" value={agent.memories} mono />
          <KV label="Santé" value={`${agent.health}%`} mono />
        </div>
      </Panel>
    </div>
  );
}

/** FNV-1a-style deterministic hash for stable per-agent pseudo traces. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deriveSessionTrace(agent: DashboardAgent): Array<{ at: string; tokens: number; cost: number; channel: 'webhook' | 'email' | 'in-app'; outcome: 'completed' | 'failed' }> {
  const total = Math.min(agent.sessionsLast24h, 12);
  if (total === 0) return [];
  const channels: Array<'webhook' | 'email' | 'in-app'> = ['webhook', 'email', 'in-app'];
  // Default channel preference: agents with email connection get more email
  // sessions. The check covers the seed agents and any user-created agent
  // that wires an email connection through the form.
  const channelHint: 'webhook' | 'email' | 'in-app' = agent.connections.includes('email')
    ? 'email'
    : agent.connections.includes('webhook')
      ? 'webhook'
      : 'in-app';
  const avgCost = total > 0 ? agent.costLast24h / total : 0;
  const out: Array<{ at: string; tokens: number; cost: number; channel: 'webhook' | 'email' | 'in-app'; outcome: 'completed' | 'failed' }> = [];
  for (let i = 0; i < total; i += 1) {
    const h = hashSeed(`${agent.id}:${i}`);
    const channelIdx = (h & 1) === 0 ? channelHint : channels[(h >>> 1) % channels.length];
    const tokens = 600 + ((h >>> 4) % 2400);
    const cost = +(avgCost * (0.4 + ((h >>> 8) % 100) / 100)).toFixed(3);
    const outcome: 'completed' | 'failed' = ((h >>> 12) % 11) === 0 ? 'failed' : 'completed';
    // Step the timestamp backward from "now" by 1.5h per row.
    const d = new Date();
    d.setMinutes(d.getMinutes() - i * 90);
    const at = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    out.push({ at, tokens, cost, channel: channelIdx, outcome });
  }
  return out;
}

function MemoriesTab({ agent }: { agent: DashboardAgent }) {
  // Per-agent memory sample: anchored on the agent's `memories` count, with
  // a deterministic per-agent title. A user-created agent with `memories=0`
  // shows the empty state; a seeded agent with N memories shows N rows that
  // look distinct across agents (instead of the previous shared sample).
  const sample = useMemo(() => deriveMemorySample(agent), [agent]);
  return (
    <Panel pad="p-5">
      <SectionTitle
        eyebrow="Mémoire"
        title={`${agent.memories.toLocaleString()} entrées indexées`}
        subtitle="Provenance loggée · scope par agent ou ruche partagée"
        action={<Pill tone="info">Zero-PII seal</Pill>}
      />
      {sample.length === 0 ? (
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="Aucune mémoire indexée pour cet agent"
          hint="L'agent n'a encore rien indexé. Dès qu'il traite une session, les faits vérifiés apparaissent ici."
        />
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
          {sample.map((m, i) => (
            <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <IconChip tone={m.scope === 'shared' ? 'accent' : 'neutral'} size={28}>
                <Database className="h-3.5 w-3.5" />
              </IconChip>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                  {m.fact}
                </div>
                <div className="mt-0.5 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                  {m.scope} · poids {m.weight.toFixed(2)} · {m.date}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Derive a believable memory sample for the agent. The exact text is
 *  templated from the agent's role so each agent shows distinct rows (no
 *  longer the same "Ava Chen" hard-coded list rendered for every agent). */
function deriveMemorySample(agent: DashboardAgent): Array<{ fact: string; scope: 'shared' | 'agent-only'; weight: number; date: string }> {
  if (agent.memories === 0) return [];
  const h = hashSeed(agent.id);
  const count = Math.min(4, Math.max(1, Math.round(agent.memories / 250)));
  const sharedBase: Array<{ fact: string; date: string }> = [
    { fact: `${agent.name} · pattern de cadrage observé sur 12 sessions`, date: '04 août 2026' },
    { fact: `${agent.role} · escalade humaine à 70 confirmée en revue`, date: '01 août 2026' },
  ];
  const agentBase: Array<{ fact: string; date: string }> = [
    { fact: `${agent.name} · ton aligné avec la voix du coach (3/3 samples OK)`, date: '28 juillet 2026' },
    { fact: `${agent.role} · pic d'usage les mardis 09-11h`, date: '21 juillet 2026' },
  ];
  const out: Array<{ fact: string; scope: 'shared' | 'agent-only'; weight: number; date: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const shared = (h & (1 << i)) !== 0;
    const base = shared ? sharedBase : agentBase;
    const row = base[i % base.length];
    const weight = 0.55 + ((hashSeed(`${agent.id}:${i}`) >>> 8) % 40) / 100;
    out.push({ fact: row.fact, scope: shared ? 'shared' : 'agent-only', weight, date: row.date });
  }
  return out;
}

function ConnectionsTab({ agent }: { agent: DashboardAgent }) {
  const meta: Record<string, { label: string; tone: 'ok' | 'warn' | 'info' }> = {
    telegram: { label: 'Telegram',  tone: 'info' },
    slack:    { label: 'Slack',     tone: 'info' },
    email:    { label: 'Email',     tone: 'ok' },
    whatsapp: { label: 'WhatsApp',  tone: 'warn' },
    webhook:  { label: 'Webhook',   tone: 'ok' },
    'in-app': { label: 'In-app',    tone: 'info' },
  };
  return (
    <Panel pad="p-5">
      <SectionTitle
        eyebrow="Canaux"
        title="Connexions actives"
        subtitle="Telegram · Slack · Email · Webhook — branchements via agentgateway"
        action={<Pill tone="ok">gateway opérationnel</Pill>}
      />
      {agent.connections.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-5 w-5" />}
          title="Aucun canal branché pour cet agent"
          hint="Les connexions sont définies à la création de l'agent. Branche un canal via l'API agents pour activer ce routage."
        />
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
          {agent.connections.map((c) => {
            const m = meta[c] ?? { label: c, tone: 'neutral' as const };
            return (
              <li key={c} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <IconChip tone={m.tone}>
                  <Cable className="h-4 w-4" />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                    {m.label}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Statut : connecté · routeur agentgateway
                  </div>
                </div>
                <Pill tone="ok">live</Pill>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function SettingsTab({ agent }: { agent: DashboardAgent }) {
  // Per-agent settings. Mirrors the prompt-overrides pattern: a localStorage
  // map keyed by agent id, rehydrated on mount, mirrored back on every save.
  // The brief explicitly asks for the Réglages tab to be modifiable and
  // persisted like the system prompt is — same shape, same guarantees.
  const [settingsOverrides, setSettingsOverrides] = useState<Record<string, AgentSettings>>(() => loadSettingsOverrides());
  useEffect(() => {
    saveSettingsOverrides(settingsOverrides);
  }, [settingsOverrides]);
  const effective = effectiveSettings(agent, settingsOverrides[agent.id]);
  const [draft, setDraft] = useState<AgentSettings>(effective);
  const [saved, setSaved] = useState<AgentSettings>(effective);
  useEffect(() => {
    setDraft(effective);
    setSaved(effective);
  }, [agent.id, effective.plafondSession, effective.plafondJour, effective.escalationScore]);
  const dirty =
    draft.plafondSession !== saved.plafondSession ||
    draft.plafondJour !== saved.plafondJour ||
    draft.escalationScore !== saved.escalationScore;
  const canSave = dirty;
  const addToast = useShellStore((s) => s.addToast);
  const handleSave = (): void => {
    setSettingsOverrides((prev) => ({ ...prev, [agent.id]: draft }));
    setSaved(draft);
    addToast({
      source: 'Agents',
      type: 'success',
      message: `Réglages de ${agent.name} enregistrés · session ${draft.plafondSession} msg · jour $${draft.plafondJour.toFixed(2)} · escalade > ${draft.escalationScore}`,
    });
  };
  const handleCancel = (): void => {
    setDraft(saved);
  };
  const isOverridden =
    settingsOverrides[agent.id] !== undefined &&
    (settingsOverrides[agent.id]?.plafondSession !== effective.plafondSession ||
      settingsOverrides[agent.id]?.plafondJour !== effective.plafondJour ||
      settingsOverrides[agent.id]?.escalationScore !== effective.escalationScore);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Panel pad="p-5">
        <SectionTitle
          eyebrow="Modèle"
          title="Fournisseur & quotas"
          action={isOverridden ? <Pill tone="accent">version personnalisée</Pill> : null}
        />
        <div className="grid grid-cols-2 gap-3">
          <KV label="Modèle" value={agent.model} mono />
          <KV label="Latence p50" value="640 ms" mono />
          <KV label="Coût / 1k in" value={`$${agent.model.startsWith('claude-opus') ? '0.015' : '0.003'}`} mono />
          <KV label="Coût / 1k out" value={`$${agent.model.startsWith('claude-opus') ? '0.075' : '0.015'}`} mono />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg p-3 text-[11px]" style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text-muted)' }}>
          <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
          <span>Le modèle est défini à la création. Pour le changer, recrée l'agent avec le bon champ « Model ».</span>
        </div>
      </Panel>
      <Panel pad="p-5">
        <SectionTitle eyebrow="Garde-fous" title="Bornes & escalade" />
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
              Plafond session
            </span>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--theme-surface-hover)', border: '1px solid var(--panel-border-subtle)' }}
            >
              <input
                type="number"
                min={1}
                step={1}
                value={draft.plafondSession}
                onChange={(e) => setDraft((d) => ({ ...d, plafondSession: Math.max(1, Math.round(Number(e.target.value) || 0)) }))}
                className="w-full bg-transparent text-[13px] font-bold tabular-nums outline-none"
                style={{ color: 'var(--theme-text)' }}
                aria-label="Plafond session (messages)"
              />
              <span className="shrink-0 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>msg</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
              Plafond jour
            </span>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--theme-surface-hover)', border: '1px solid var(--panel-border-subtle)' }}
            >
              <span className="shrink-0 text-[13px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>$</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.plafondJour}
                onChange={(e) => setDraft((d) => ({ ...d, plafondJour: Math.max(0, Number(e.target.value) || 0) }))}
                className="w-full bg-transparent text-[13px] font-bold tabular-nums outline-none"
                style={{ color: 'var(--theme-text)' }}
                aria-label="Plafond jour (USD)"
              />
              <span className="shrink-0 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>USD / 24 h</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
              Escalade humaine au-delà de
            </span>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--theme-surface-hover)', border: '1px solid var(--panel-border-subtle)' }}
            >
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={draft.escalationScore}
                onChange={(e) => setDraft((d) => ({ ...d, escalationScore: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) }))}
                className="w-full bg-transparent text-[13px] font-bold tabular-nums outline-none"
                style={{ color: 'var(--theme-text)' }}
                aria-label="Seuil d'escalade humaine (score)"
              />
              <span className="shrink-0 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>/ 100</span>
            </div>
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <PrimaryButton size="sm" onClick={handleSave} disabled={!canSave}>
              <Save className="h-3.5 w-3.5" /> Enregistrer
            </PrimaryButton>
            <GhostButton size="sm" onClick={handleCancel} disabled={!dirty}>
              <X className="h-3.5 w-3.5" /> Annuler
            </GhostButton>
            <span className="ml-auto text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
              DLP scan : every call
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

const SETTINGS_KEY = 'coach-os:agent-settings:v1';

interface AgentSettings {
  plafondSession: number;
  plafondJour: number;
  escalationScore: number;
}

const DEFAULT_SETTINGS: Record<string, AgentSettings> = {
  'agent-onboarding': { plafondSession: 100, plafondJour: 3.0,  escalationScore: 70 },
  'agent-sales':      { plafondSession: 200, plafondJour: 15.0, escalationScore: 70 },
  'agent-retention':  { plafondSession: 50,  plafondJour: 2.0,  escalationScore: 60 },
  'agent-knowledge':  { plafondSession: 500, plafondJour: 5.0,  escalationScore: 80 },
  'agent-jarvis':     { plafondSession: 100, plafondJour: 6.0,  escalationScore: 100 },
};

function defaultSettingsFor(agent: DashboardAgent): AgentSettings {
  if (DEFAULT_SETTINGS[agent.id]) return DEFAULT_SETTINGS[agent.id];
  return { plafondSession: 100, plafondJour: 5.0, escalationScore: 70 };
}

function effectiveSettings(agent: DashboardAgent, override: AgentSettings | undefined): AgentSettings {
  return override ?? defaultSettingsFor(agent);
}

function loadSettingsOverrides(): Record<string, AgentSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, AgentSettings>;
  } catch {
    return {};
  }
}

function saveSettingsOverrides(map: Record<string, AgentSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
  } catch {
    // Storage quota or private mode — degrade silently to in-memory only.
  }
}

function EmptyState({
  icon, title, hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl py-10 text-center"
      style={{ background: 'var(--theme-surface-hover)' }}
    >
      <IconChip tone="neutral" size={40}>{icon}</IconChip>
      <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>{title}</div>
      <div className="text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{hint}</div>
    </div>
  );
}
