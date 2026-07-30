import { useEffect, useState } from 'react';
import { LayoutDashboard, Wind, GitBranch, BarChart3, Building2, Compass, AlertTriangle, Handshake, BrainCircuit, Wallet, UserCog, ClipboardList, Cpu } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { StatCard, Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { DashboardDetailPage, type DashboardDetailItem } from './DashboardDetailPage';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';

const ACCENT = '#059669';

const validations = [
  { t: 'Validation devis client TechFlow', when: 'Today', tone: 'warn' as const },
  { t: 'Retard livraison projet GreenScale', when: 'Yesterday', tone: 'danger' as const },
  { t: 'Mise à jour Stripe requise', when: '2 days ago', tone: 'accent' as const },
];

function Validation() {
  return (
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
}

export function DashboardApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const drill = useCollectionDrill('clients', ['Overview', 'Client Pipeline']);
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const onboardingCount = clients.filter(c => c.status === 'Onboarding').length;
  const [detail, setDetail] = useState<DashboardDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const weightOf = (c: (typeof clients)[number]) => Number(c.health ?? (c.status === 'Onboarding' ? 45 : 20));

  const Overview = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Ecosystem Vitals" subtitle="Live data from omk_saas.clients and omk_saas.agents" />
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Active clients" value={activeCount} hint={`of ${clients.length} total`} tone="ok" />
          <StatCard label="Active agents" value="2" hint="of 2 total" tone="accent" />
          <StatCard label="Onboarding" value={onboardingCount} hint="awaiting first session" />
          <StatCard label="Total clients" value={clients.length} hint="across all statuses" />
        </div>
        <SectionHead title="Client pipeline" subtitle="Top accounts ranked by status weight" action={<Badge tone="ok">{activeCount} active</Badge>} />
        <FleetItemGrid cols={2}>
          {clients.map(c => {
            const w = weightOf(c);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={String(c.segment)}
                statusLabel={String(c.status)}
                statusTone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}
                accent={ACCENT}
                icon={<Building2 className="w-5 h-5" />}
                metricLabel="weight"
                metricValue={`${w}%`}
                meta={`Status: ${String(c.status)}`}
                onClick={() => drill.open(String(c.id))}
              />
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Pipeline = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Client ledger" subtitle="Every account, every weight" />
        <FleetItemGrid cols={2}>
          {clients.map(c => (
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
              onClick={() => drill.open(String(c.id))}
            />
          ))}
        </FleetItemGrid>
      </div>
    );
  };

  const CeoCockpit = () => {
    // CEO Cockpit — interconnected view across 6 Domaines canon (per sponsor canon).
    // Each domain = a metric card wired to its underlying app via openApp.
    const openApp = useShellStore((s) => s.openApp);
    const navigate = (appId: string): void => openApp(appId, '');

    const domains = [
      { id: 'sales',      label: 'Sales',          icon: Handshake,    accent: '#ea580c', metric: '$67K',  delta: '+12%', sub: 'pipeline this quarter',  tone: 'accent' },
      { id: 'cognition',  label: 'Cognition',      icon: BrainCircuit, accent: '#7c3aed', metric: '0.62',  delta: 'floor', sub: 'sovereignty score',     tone: 'accent' },
      { id: 'finance',    label: 'Finance',        icon: Wallet,       accent: '#ca8a04', metric: '18mo',  delta: 'green', sub: 'runway',                  tone: 'ok' },
      { id: 'people',     label: 'People',         icon: UserCog,      accent: '#0891b2', metric: '8/12',  delta: '67%',   sub: 'team capacity',          tone: 'warn' },
      { id: 'operations', label: 'Operations',     icon: ClipboardList,accent: '#4f46e5', metric: '32',    delta: '−4',    sub: 'open incidents',          tone: 'ok' },
      { id: 'it-rd',      label: 'IT / R&D',       icon: Cpu,          accent: '#9333ea', metric: '7',     delta: '+2',    sub: 'experiments live',       tone: 'accent' },
    ] as const;

    return (
      <div className="p-7 space-y-6">
        <SectionHead
          title="CEO Cockpit"
          subtitle="Interconnected view across 6 business domains. Click any domain to drill into its app."
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {domains.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => navigate(d.id)}
                className="group relative overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderLeft: `4px solid ${d.accent}` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${d.accent}1a`, color: d.accent }}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    {d.label}
                  </span>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  {d.sub}
                </div>
                <div className="mt-1 flex items-basLe gap-2">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>{d.metric}</span>
                  <span className={`text-[11px] font-semibold ${d.tone === 'ok' ? 'text-emerald-600' : d.tone === 'warn' ? 'text-amber-600' : 'text-violet-600'
                  }`}>{d.delta}</span>
                </div>
                <div className="mt-2 text-[10px] text-stone-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Open {d.label} →
                </div>
              </button>
            );
          })}
        </div>
        {/* Interconnection hint */}
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Interconnection
          </div>
          <p className="text-[12px] leading-relaxed text-stone-600">
            Sales pipeline feeds Finance runway. Cognition.manifest gates Sales SovereignGate.
            Operations owns the IT/R&D deploy surface. People fills all squads. <strong>Drill any
            domain</strong> from above — the rest follow the same CCD.
          </p>
        </div>
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, render: Overview },
    { id: 'cockpit', label: 'CEO Cockpit', icon: Compass, render: CeoCockpit },
    { id: 'validation', label: 'Wind Direction', icon: Wind, render: Validation },
    { id: 'pipeline', label: 'Client Pipeline', icon: GitBranch, render: Pipeline },
  ];

  return (
    <>
      <AppFrame title="Dashboard" subtitle="Ecosystem Vitals" icon={LayoutDashboard} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="dashboard"
          accent="#059669"
          onBack={() => setDetail(null)}
          motion={{ kind: 'fade-up', durationMs: 220 }}
        >
          <DashboardDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
