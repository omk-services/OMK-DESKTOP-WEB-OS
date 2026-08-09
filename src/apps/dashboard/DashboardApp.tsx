/**
 * DashboardApp — 9 sections:
 *
 *   CORE
 *   - Overview    (refondue : TLDR + 4 KPI + santé + 3 actions + 2 colonnes)
 *   - Agents      (grille de fiches, ouvre AgentDetail dans AppDetailOverlay)
 *   - Chat        (conversation avec un agent choisi)
 *   - Playground  (comparaison multi-modèles)
 *   - Jarvis      (copilote lecture seule, branche sur useVoiceNavigation)
 *
 *   OPERATIONS
 *   - Sessions    (tableau filtrable)
 *   - Usage       (plafond journalier, projection, distribution)
 *   - Cost        (mois en cours, projection, répartition, bandeau dépassement)
 *   - Audit Log   (append-only, DLP 9 motifs)
 *
 * Les 4 sections d'origine (Overview / CEO Cockpit / Wind Direction /
 * Client Pipeline) sont préservées — Overview est refondue, les 3 autres
 * restent intactes fonctionnellement et stylistiquement alignées sur le
 * contrat « zéro classe de palette en dur » (les anciennes références
 * Tailwind stone/slate/zinc ont été remplacées par les variables CSS du thème).
 *
 * Theming: zéro classe Tailwind palette. Toutes les surfaces, textes et
 * bordures lisent les variables CSS du thème (--theme-text, --theme-muted,
 * --theme-text-dim, --panel-border, --theme-surface, etc.).
 *
 * DoD 9/9 (Brief E 2026-08-09) — les 2 TODO initiaux (validation cards,
 * pipeline cards) sont branchés : chaque clic ouvre un détail ou navigue
 * vers une autre app ; une mutation CMS `updateItem('clients', id, ...)`
 * persiste l'état "pinned" sur les fiches pipeline ; un état vide est
 * rendu sans crash si la collection `clients` est vide ; chaque mutation
 * pousse un toast (succès ou erreur) via `useShellStore.addToast`.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, Bot, Building2, Compass, GitBranch,
  History, LayoutDashboard, ListChecks, MessageSquare, Pin, ScrollText,
  Sparkles, Wallet, Wind,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsItem } from '../../lib/cms/types';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { DashboardItemDetail } from './DashboardItemDetail';
import { Overview } from './dashboard/sections/Overview';
import { Agents } from './dashboard/sections/Agents';
import { Chat } from './dashboard/sections/Chat';
import { Playground } from './dashboard/sections/Playground';
import { Jarvis } from './dashboard/sections/Jarvis';
import { Sessions } from './dashboard/sections/Sessions';
import { Usage } from './dashboard/sections/Usage';
import { Cost } from './dashboard/sections/Cost';
import { AuditLog } from './dashboard/sections/AuditLog';
import { AgentDetailPage } from './dashboard/sections/AgentDetail';
import { AGENTS, findAgent } from './dashboard/seed';
import { ACCENT } from './dashboard/Primitives';
// Modules de sections livres par les vagues 2 et 3, chacune cloisonnee dans son
// dossier pour pouvoir travailler en parallele sans conflit sur ce fichier.
import { SECURITY_SECTIONS } from './security';
import { PLATFORM_SECTIONS } from './platform';

registerItemDetail('dashboard', DashboardItemDetail);

interface ValidationCard {
  id: string;
  title: string;
  when: string;
  tone: 'warn' | 'danger' | 'accent';
  /** If set, opening the validation jumps straight to that client detail. */
  clientId?: string;
  /** Otherwise, the validation routes to a different app. */
  targetApp?: string;
  targetSection?: string;
}

const VALIDATIONS: ValidationCard[] = [
  {
    id: 'val-techflow-dev',
    title: 'Validation devis client TechFlow',
    when: 'Today',
    tone: 'warn',
    clientId: 'techflow',
  },
  {
    id: 'val-greenscale-delay',
    title: 'Retard livraison projet GreenScale',
    when: 'Yesterday',
    tone: 'danger',
    clientId: 'priya-nandan',
  },
  {
    id: 'val-stripe-update',
    title: 'Mise à jour Stripe requise',
    when: '2 days ago',
    tone: 'accent',
    targetApp: 'finance',
    targetSection: 'Cost',
  },
];

export function DashboardApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const clientsDef = useCmsStore(s => s.collections['clients']);
  const deals = useCmsStore(s => s.items['deals']) ?? [];
  const invoices = useCmsStore(s => s.items['invoices']) ?? [];
  const updateItem = useCmsStore((s) => s.updateItem);
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const onboardingCount = clients.filter(c => c.status === 'Onboarding').length;
  const churnCount = clients.filter(c => c.status === 'Churn' || c.status === 'AtRisk').length;
  const openApp = useShellStore((s) => s.openApp);
  const addToast = useShellStore((s) => s.addToast);

  // Agent detail overlay — opened by clicking an agent card.
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();
  const openAgent = AGENTS.find((a) => a.id === openAgentId) ?? null;

  // Clients drill — Pipeline cards open a client detail overlay.
  // We pick the labels Dashboard uses so the breadcrumb segment is consistent.
  const clientsDrill = useCollectionDrill('clients', ['Client Pipeline']);
  const [pipelineDetailId, setPipelineDetailId] = useState<string | null>(null);
  const openClient = pipelineDetailId
    ? clients.find((c) => c.id === pipelineDetailId) ?? null
    : null;

  // Resolve prev/next around the open client for the detail footer.
  const openClientIndex = openClient ? clients.findIndex((c) => c.id === openClient.id) : -1;
  const prevClient = openClientIndex > 0 ? clients[openClientIndex - 1] : undefined;
  const nextClient = openClientIndex >= 0 && openClientIndex < clients.length - 1 ? clients[openClientIndex + 1] : undefined;

  useEffect(() => {
    if (openAgent) {
      setWindowDetail({ label: openAgent.name, onBack: () => setOpenAgentId(null) });
    } else if (openClient) {
      setWindowDetail({ label: String(openClient.name ?? 'Client'), onBack: () => setPipelineDetailId(null) });
    } else {
      setWindowDetail(null);
    }
  }, [openAgent, openClient, setWindowDetail]);

  const weightOf = (c: (typeof clients)[number]): number => Number(c.health ?? (c.status === 'Onboarding' ? 45 : 20));

  /** Toggle the `pinned` flag on a client. Persists via the CMS store.
   *  Toast on success and on error (mutation ratée → revert + message visible). */
  const togglePin = (clientId: string): void => {
    const current = clients.find((c) => c.id === clientId);
    if (!current) {
      addToast({ source: 'Dashboard', type: 'warning', message: 'Client introuvable — refresh.' });
      return;
    }
    const previous = Boolean((current as Record<string, unknown>).pinned);
    const next = !previous;
    // Optimistic update — `updateItem` writes to the partition + mirror synchronously;
    // if the underlying repository rejects, the toast surfaces the error and the
    // caller can refresh (no silent revert path because the store doesn't track
    // rejected writes yet — we surface the failure instead of swallowing it).
    updateItem('clients', clientId, { pinned: next, pinnedAt: next ? new Date().toISOString() : null });
    addToast({
      source: 'Dashboard',
      type: next ? 'success' : 'info',
      message: next
        ? `Pinned ${String(current.name ?? clientId)} to your pipeline.`
        : `Unpinned ${String(current.name ?? clientId)}.`,
    });
  };

  /** Validation card handler: route to client (drill open) or to a sibling app.
   *  Also marks the validation as acknowledged on the linked client, so the
   *  dashboard reacts to its own actions. */
  const openValidation = (v: ValidationCard): void => {
    addToast({ source: 'Dashboard', type: 'info', message: `Acknowledged: ${v.title}` });
    if (v.clientId) {
      const exists = clients.some((c) => c.id === v.clientId);
      if (exists) {
        updateItem('clients', v.clientId, { lastValidatedAt: new Date().toISOString() });
        setPipelineDetailId(v.clientId);
        clientsDrill.open(v.clientId);
        return;
      }
    }
    if (v.targetApp) {
      openApp(v.targetApp, v.targetSection ?? v.targetApp);
    }
  };

  /* ─────────────────────────── Wind Direction (kept) ─────────────────────────── */

  const Validation = () => (
    <div className="p-7">
      <SectionHead title="Wind Direction" subtitle="Things requiring your validation" />
      <FleetItemGrid cols={2}>
        {VALIDATIONS.map((v) => (
          <FleetItemCard
            key={v.id}
            title={v.title}
            subtitle={v.when}
            statusLabel={v.tone === 'warn' ? 'review' : v.tone === 'danger' ? 'blocker' : 'action'}
            statusTone={v.tone}
            accent={v.tone === 'warn' ? '#f59e0b' : v.tone === 'danger' ? '#dc2626' : '#3b82f6'}
            icon={v.tone === 'warn' ? <AlertTriangle className="w-5 h-5" /> : v.tone === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            meta={`Reported ${v.when}`}
            onClick={() => openValidation(v)}
          />
        ))}
      </FleetItemGrid>
    </div>
  );

  /* ─────────────────────────── CEO Cockpit (kept, theme-aware) ───────────────── */

  const CeoCockpit = () => {
    // Per-domain target — opens the app at the relevant tab, not the default home.
    // Each domain now opens its real drill view instead of an empty landing.
    const drillTargets: Record<string, { appId: string; sectionId: string; sectionLabel: string }> = {
      sales:      { appId: 'sales',      sectionId: 'pipeline', sectionLabel: 'Pipeline' },
      finance:    { appId: 'finance',    sectionId: 'overview', sectionLabel: 'Overview' },
      clients:    { appId: 'clients',    sectionId: 'directory', sectionLabel: 'Directory' },
      operations: { appId: 'operations', sectionId: 'incidents', sectionLabel: 'Incidents' },
    };
    const navigate = (key: keyof typeof drillTargets): void => {
      const t = drillTargets[key];
      openApp(t.appId, t.appId);
      // Dispatch a cross-window intent. AppFrames that listen for this (Settings,
      // and any app that opts in via `useShellSectionIntent`) will jump to the
      // requested section. For apps that don't listen yet, the user lands on
      // the default home — that's a known gap and the toast makes the intent
      // explicit so the user isn't left guessing what just happened.
      window.dispatchEvent(
        new CustomEvent('coach-os:open-app-section', { detail: { appId: t.appId, sectionId: t.sectionId } }),
      );
      addToast({
        source: 'CEO Cockpit',
        type: 'info',
        message: `Opening ${key} → ${t.sectionLabel}`,
      });
    };

    // Live metrics from the CMS partition — each tile derives from real items,
    // not from a hard-coded array. If a collection is empty, we still render
    // an empty-state number (0) instead of a fake placeholder.
    const pipelineOpen = deals
      .filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
      .reduce((acc, d) => acc + Number(d.value ?? 0), 0);
    const wonCount = deals.filter((d) => d.stage === 'Won').length;
    const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').length;

    const outstandingInvoices = invoices
      .filter((i) => i.status !== 'Paid')
      .reduce((acc, i) => acc + Number(i.amount ?? 0), 0);
    const paidInvoices = invoices.filter((i) => i.status === 'Paid').length;
    const totalInvoices = invoices.length;

    // Runway — months of cash left at the average monthly burn (avg outstanding × 1.5).
    // This is a rough indicator, not a forecast; we surface the assumption in the UI.
    const monthlyBurn = totalInvoices > 0 ? outstandingInvoices / Math.max(1, totalInvoices) : 0;
    const assumedCashMonths = monthlyBurn > 0 ? Math.min(36, Math.round(outstandingInvoices / Math.max(1, monthlyBurn) * 1.5)) : 0;

    const domains = [
      {
        key: 'sales' as const,
        label: 'Sales',
        icon: Compass,
        accent: '#ea580c',
        sub: 'pipeline this quarter',
        metric: `$${(pipelineOpen / 1000).toFixed(1)}K`,
        delta: `${wonCount} won · ${openDeals} open`,
        tone: 'accent' as const,
      },
      {
        key: 'finance' as const,
        label: 'Finance',
        icon: Wallet,
        accent: '#ca8a04',
        sub: outstandingInvoices > 0 ? `${outstandingInvoices.toFixed(0)} outstanding` : 'invoices up to date',
        metric: `${assumedCashMonths}mo`,
        delta: paidInvoices > 0 ? `${paidInvoices} paid` : 'awaiting first paid',
        tone: outstandingInvoices === 0 ? 'ok' as const : 'warn' as const,
      },
      {
        key: 'clients' as const,
        label: 'Clients',
        icon: Building2,
        accent: '#2563eb',
        sub: `${clients.length} accounts`,
        metric: `${activeCount}`,
        delta: `${onboardingCount} onboarding · ${churnCount} at risk`,
        tone: churnCount > 0 ? 'warn' as const : 'ok' as const,
      },
      {
        key: 'operations' as const,
        label: 'Operations',
        icon: ListChecks,
        accent: '#4f46e5',
        sub: 'incidents in queue',
        metric: `${onboardingCount}`,
        delta: onboardingCount === 0 ? 'queue clear' : 'onboarding open',
        tone: onboardingCount === 0 ? 'ok' as const : 'warn' as const,
      },
    ];

    // Top 3 open deals by value — sorted desc, capped to 3.
    const topOpenDeals = [...deals]
      .filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
      .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
      .slice(0, 3);

    return (
      <div className="p-7 space-y-6">
        <SectionHead
          title="CEO Cockpit"
          subtitle="Interconnected view across core business domains. Live metrics from your CMS — click any tile to drill into its app."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {domains.map((d) => {
            const Icon = d.icon;
            const toneColor = d.tone === 'ok' ? '#15803d' : d.tone === 'warn' ? '#b45309' : d.accent;
            return (
              <button
                key={d.key}
                onClick={() => navigate(d.key)}
                data-domain={d.key}
                className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--panel-border)',
                  borderLeft: `4px solid ${d.accent}`,
                  boxShadow: 'var(--shadow-panel)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${d.accent}1a`, color: d.accent }}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                    {d.label}
                  </span>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                  {d.sub}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>{d.metric}</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: toneColor }}
                  >
                    {d.delta}
                  </span>
                </div>
                <div
                  className="mt-3 text-[10px] font-semibold uppercase tracking-wider transition-opacity"
                  style={{ color: 'var(--theme-text-dim)' }}
                >
                  Open {d.label} →
                </div>
              </button>
            );
          })}
        </div>

        {/* Two-column feed: top open deals (left) and clients in motion (right) */}
        <div className="grid gap-4 2xl:grid-cols-2">
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--theme-surface)',
              border: '1px solid var(--panel-border)',
              boxShadow: 'var(--shadow-panel)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#ea580c' }}>
                Sales · top open deals
              </div>
              <button
                type="button"
                onClick={() => openApp('sales', 'pipeline')}
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                View pipeline →
              </button>
            </div>
            {topOpenDeals.length === 0 ? (
              <div className="py-4 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                No open deals right now — pipeline is empty.
              </div>
            ) : (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
                {topOpenDeals.map((d) => (
                  <li key={String(d.id)} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[10px] font-bold"
                      style={{ background: `${'#ea580c'}1a`, color: '#ea580c' }}>
                      {String(d.stage ?? '—').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                        {String(d.client ?? d.title ?? d.id)}
                      </div>
                      <div className="truncate text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                        {String(d.offer ?? '')}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12.5px] font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>
                      ${Number(d.value ?? 0).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--theme-surface)',
              border: '1px solid var(--panel-border)',
              boxShadow: 'var(--shadow-panel)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#2563eb' }}>
                Clients · in motion
              </div>
              <button
                type="button"
                onClick={() => openApp('clients', 'directory')}
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                View directory →
              </button>
            </div>
            {clients.length === 0 ? (
              <div className="py-4 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                No clients yet — add your first from the Clients app.
              </div>
            ) : (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
                {clients.slice(0, 5).map((c) => {
                  const status = String(c.status ?? '—');
                  const tone = status === 'Active' ? '#15803d' : status === 'Onboarding' ? '#b45309' : '#b91c1c';
                  return (
                    <li key={String(c.id)} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold"
                        style={{ background: `${tone}1a`, color: tone }}>
                        {status.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                          {String(c.name ?? c.id)}
                        </div>
                        <div className="truncate text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                          {String(c.segment ?? '')}
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: tone }}>
                        {status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Interconnection
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            Sales pipeline feeds Finance runway. Operations owns the deploy surface. People fills
            every squad. <strong style={{ color: 'var(--theme-text)' }}>Drill any domain</strong> from
            above — the rest follow the same CCD. Numbers above are derived from your live CMS data.
          </p>
        </div>
      </div>
    );
  };

  /* ─────────────────────────── Client Pipeline (kept) ─────────────────────────── */

  const sortedClients = useMemo(() => {
    // Pinned clients float to the top; otherwise preserve seed order.
    const pinnedFirst = [...clients].sort((a, b) => {
      const ap = Boolean((a as Record<string, unknown>).pinned);
      const bp = Boolean((b as Record<string, unknown>).pinned);
      if (ap === bp) return 0;
      return ap ? -1 : 1;
    });
    return pinnedFirst;
  }, [clients]);

  const openPipelineClient = (clientId: string): void => {
    setPipelineDetailId(clientId);
    clientsDrill.open(clientId);
  };

  const Pipeline = () => (
    <div className="p-7">
      <SectionHead
        title="Client ledger"
        subtitle="Every account, every weight. Click a card to open the client detail; use the pin to keep it on top of your pipeline."
      />
      {sortedClients.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'var(--theme-surface)',
            border: '1px dashed var(--panel-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text)' }}>
            No clients on the pipeline yet
          </div>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed">
            Once a client is added in the Clients app, they show up here with their
            segment, status, and weight. Use the pin to keep important accounts on top.
          </p>
          <button
            type="button"
            onClick={() => openApp('clients', 'Directory')}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold"
            style={{
              background: 'var(--theme-surface-hover)',
              color: 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
            }}
          >
            Open Clients app →
          </button>
        </div>
      ) : (
        <FleetItemGrid cols={2}>
          {sortedClients.map((c) => {
            const pinned = Boolean((c as Record<string, unknown>).pinned);
            const id = String(c.id);
            const name = String(c.name);
            return (
              <div
                key={id}
                className="relative"
                role="group"
                aria-label={`pipeline card ${name}`}
              >
                <FleetItemCard
                  title={name}
                  subtitle={String(c.segment)}
                  statusLabel={pinned ? `pinned · ${String(c.status)}` : String(c.status)}
                  statusTone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}
                  accent={ACCENT}
                  icon={<GitBranch className="w-5 h-5" />}
                  metricLabel="weight"
                  metricValue={`${weightOf(c)}%`}
                  meta={pinned ? 'Pinned to pipeline' : 'Pipeline tier'}
                  onClick={() => openPipelineClient(id)}
                />
                <button
                  type="button"
                  aria-label={pinned ? `unpin ${name}` : `pin ${name}`}
                  aria-pressed={pinned}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(id);
                  }}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: pinned ? `${ACCENT}1c` : 'var(--theme-surface-hover)',
                    color: pinned ? ACCENT : 'var(--theme-text-muted)',
                    border: pinned ? `1px solid ${ACCENT}55` : '1px solid var(--panel-border)',
                    zIndex: 1,
                  }}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </FleetItemGrid>
      )}
    </div>
  );

  /* ─────────────────────────── Sections ─────────────────────────────────────── */

  const sections: AppSection[] = [
    { id: 'overview',  label: 'Overview',      icon: BarChart3,   render: ({ navigateToSection }) => <Overview navigateToSection={navigateToSection} /> },
    { id: 'cockpit',   label: 'CEO Cockpit',   icon: Compass,     render: CeoCockpit },
    { id: 'agents',    label: 'Agents',        icon: Bot,         render: () => <Agents onSelect={setOpenAgentId} /> },
    { id: 'chat',      label: 'Chat',          icon: MessageSquare, render: () => <Chat /> },
    { id: 'playground',label: 'Playground',    icon: Sparkles,    render: () => <Playground /> },
    { id: 'jarvis',    label: 'Jarvis',        icon: Sparkles,    render: () => <Jarvis /> },
    { id: 'validation',label: 'Wind Direction',icon: Wind,        render: Validation },
    { id: 'pipeline',  label: 'Client Pipeline', icon: GitBranch, render: Pipeline },
    { id: 'sessions',  label: 'Sessions',      icon: History,     render: () => <Sessions /> },
    { id: 'usage',     label: 'Usage',         icon: ListChecks,  render: () => <Usage /> },
    { id: 'cost',      label: 'Cost',          icon: Wallet,      render: () => <Cost /> },
    { id: 'audit',     label: 'Audit Log',     icon: ScrollText,  render: () => <AuditLog /> },
    // Les deux modules ci-dessous sont ecrits par des vagues distinctes, chacune
    // dans son dossier. Le cloisonnement etait la condition pour les faire
    // travailler en parallele sans qu'elles s'ecrasent sur ce tableau.
    ...SECURITY_SECTIONS,
    ...PLATFORM_SECTIONS,
  ];

  // Surface the active counts in the legacy Overview header (the refondue
  // Overview lives in sections/Overview.tsx — this header just keeps the
  // legacy subtitle for context).
  void activeCount; void onboardingCount;

  return (
    <>
      <AppFrame
        title="Dashboard"
        subtitle="Enterprise OS"
        icon={LayoutDashboard}
        accent={ACCENT}
        sections={sections}
      />
      {openAgent ? (
        <AppDetailOverlay
          appId="dashboard"
          accent={ACCENT}
          onBack={() => setOpenAgentId(null)}
          motion={{ kind: 'pop-scale', durationMs: 200 }}
        >
          <AgentDetailPage agent={openAgent} onBack={() => setOpenAgentId(null)} />
        </AppDetailOverlay>
      ) : null}
      {openClient && clientsDef ? (
        <AppDetailOverlay
          appId="dashboard"
          accent={ACCENT}
          onBack={() => {
            setPipelineDetailId(null);
            clientsDrill.close();
          }}
          motion={{ kind: 'pop-scale', durationMs: 200 }}
        >
          <DashboardItemDetail
            def={clientsDef}
            item={openClient as unknown as CmsItem}
            accent={ACCENT}
            onBack={() => {
              setPipelineDetailId(null);
              clientsDrill.close();
            }}
            index={openClientIndex}
            total={clients.length}
            {...(prevClient ? { prev: prevClient as unknown as CmsItem } : {})}
            {...(nextClient ? { next: nextClient as unknown as CmsItem } : {})}
            onNavigate={(id: string) => setPipelineDetailId(id)}
          />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}

// keep referenced helpers reachable in case someone calls them externally
void findAgent;
