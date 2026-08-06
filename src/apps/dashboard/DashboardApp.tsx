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
 */
import { useEffect, useState, type JSX } from 'react';
import {
  AlertTriangle, BarChart3, Bot, Building2, Compass, GitBranch,
  History, LayoutDashboard, ListChecks, MessageSquare, ScrollText,
  Sparkles, Wallet, Wind,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
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

export function DashboardApp(): JSX.Element {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const onboardingCount = clients.filter(c => c.status === 'Onboarding').length;
  const openApp = useShellStore((s) => s.openApp);

  // Agent detail overlay — opened by clicking an agent card.
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();
  const openAgent = AGENTS.find((a) => a.id === openAgentId) ?? null;

  useEffect(() => {
    if (openAgent) {
      setWindowDetail({ label: openAgent.name, onBack: () => setOpenAgentId(null) });
    } else {
      setWindowDetail(null);
    }
  }, [openAgent, setWindowDetail]);

  const weightOf = (c: (typeof clients)[number]): number => Number(c.health ?? (c.status === 'Onboarding' ? 45 : 20));

  /* ─────────────────────────── Wind Direction (kept) ─────────────────────────── */

  const validations = [
    { t: 'Validation devis client TechFlow', when: 'Today', tone: 'warn' as const },
    { t: 'Retard livraison projet GreenScale', when: 'Yesterday', tone: 'danger' as const },
    { t: 'Mise à jour Stripe requise', when: '2 days ago', tone: 'accent' as const },
  ];

  const Validation = (): JSX.Element => (
    <div className="p-7">
      <SectionHead title="Wind Direction" subtitle="Things requiring your validation" />
      <FleetItemGrid cols={2}>
        {validations.map((v, i) => (
          <FleetItemCard
            key={i}
            title={v.t}
            subtitle={v.when}
            statusLabel={v.tone === 'warn' ? 'review' : v.tone === 'danger' ? 'blocker' : 'action'}
            statusTone={v.tone}
            accent={v.tone === 'warn' ? '#f59e0b' : v.tone === 'danger' ? '#dc2626' : '#3b82f6'}
            icon={v.tone === 'warn' ? <AlertTriangle className="w-5 h-5" /> : v.tone === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            meta={`Reported ${v.when}`}
            onClick={() => { /* TODO: open validation detail */ }}
          />
        ))}
      </FleetItemGrid>
    </div>
  );

  /* ─────────────────────────── CEO Cockpit (kept, theme-aware) ───────────────── */

  const CeoCockpit = (): JSX.Element => {
    const navigate = (appId: string): void => openApp(appId, '');
    const domains = [
      { id: 'sales',      label: 'Sales',          icon: Compass,         accent: '#ea580c', metric: '$67K',  delta: '+12%', sub: 'pipeline this quarter',  tone: 'accent' as const },
      { id: 'finance',    label: 'Finance',        icon: Wallet,          accent: '#ca8a04', metric: '18mo',  delta: 'green', sub: 'runway',                  tone: 'ok' as const },
      { id: 'clients',    label: 'Clients',        icon: Building2,       accent: '#2563eb', metric: '6',     delta: '4 act', sub: 'accounts',                tone: 'accent' as const },
      { id: 'operations', label: 'Operations',     icon: ListChecks,      accent: '#4f46e5', metric: '32',    delta: '−4',    sub: 'open incidents',          tone: 'ok' as const },
    ] as const;

    return (
      <div className="p-7 space-y-6">
        <SectionHead
          title="CEO Cockpit"
          subtitle="Interconnected view across core business domains. Click any domain to drill into its app."
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {domains.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => navigate(d.id)}
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
                    style={{ color: d.tone === 'ok' ? '#15803d' : d.accent }}
                  >
                    {d.delta}
                  </span>
                </div>
                <div
                  className="mt-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: 'var(--theme-text-dim)' }}
                >
                  Open {d.label} →
                </div>
              </button>
            );
          })}
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
            above — the rest follow the same CCD.
          </p>
        </div>
      </div>
    );
  };

  /* ─────────────────────────── Client Pipeline (kept) ─────────────────────────── */

  const Pipeline = (): JSX.Element => (
    <div className="p-7">
      <SectionHead title="Client ledger" subtitle="Every account, every weight" />
      <FleetItemGrid cols={2}>
        {clients.map((c) => (
          <FleetItemCard
            key={String(c.id)}
            title={String(c.name)}
            subtitle={String(c.segment)}
            statusLabel={String(c.status)}
            statusTone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}
            accent={ACCENT}
            icon={<GitBranch className="w-5 h-5" />}
            metricLabel="weight"
            metricValue={`${weightOf(c)}%`}
            meta="Pipeline tier"
            onClick={() => { /* TODO: open ledger drill */ }}
          />
        ))}
      </FleetItemGrid>
    </div>
  );

  /* ─────────────────────────── Sections ─────────────────────────────────────── */

  const sections: AppSection[] = [
    { id: 'overview',  label: 'Overview',      icon: BarChart3,   render: () => <Overview /> },
    { id: 'agents',    label: 'Agents',        icon: Bot,         render: () => <Agents onSelect={setOpenAgentId} /> },
    { id: 'chat',      label: 'Chat',          icon: MessageSquare, render: () => <Chat /> },
    { id: 'playground',label: 'Playground',    icon: Sparkles,    render: () => <Playground /> },
    { id: 'jarvis',    label: 'Jarvis',        icon: Sparkles,    render: () => <Jarvis /> },
    { id: 'cockpit',   label: 'CEO Cockpit',   icon: Compass,     render: CeoCockpit },
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
    </>
  );
}

// keep referenced helpers reachable in case someone calls them externally
void findAgent;
