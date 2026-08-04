import { useEffect, useState } from 'react';
import { Contact, UserPlus, TrendingDown, Building2, Users, Vault as VaultIcon, BookText, GraduationCap } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { ClientsDetailPage, type ClientsDetailItem } from './ClientsDetailPage';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';
import { CMSCardList } from '../_ui/CMSCardList';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { ClientsItemDetail } from './ClientsItemDetail';

registerItemDetail('clients', ClientsItemDetail);

const ACCENT = '#2563eb';

export function ClientsApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const drill = useCollectionDrill('clients', ['Active', 'Onboarding', 'Churn Risk', 'Directory']);
  const vaultDrill = useCollectionDrill('session_notes', 'IP Vault');
  const [detail, setDetail] = useState<ClientsDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const activeClients = clients.filter(c => c.status === 'Active');
  const onboardingClients = clients.filter(c => c.status === 'Onboarding');
  const riskClients = clients.filter(c => c.status === 'At risk');
  const sessionNotes = useCmsStore(s => s.items['session_notes']) ?? [];

  const openClient = (id: string): void => {
    const item = clients.find(c => c.id === id);
    if (!item) { drill.open(id); return; }
    const health = Number(item.health ?? 0);
    const initials = String(item.name ?? '?').split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
    setDetail({
      id: String(item.id),
      title: String(item.name ?? 'Untitled'),
      subtitle: String(item.segment ?? ''),
      status: String(item.status ?? 'Active'),
      portrait: { initials, gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' },
      pills: [
        { label: 'Health', value: `${health || '—'}%`, tone: health >= 80 ? 'good' : health >= 50 ? 'warn' : health > 0 ? 'bad' : 'neutral' },
        { label: 'Ticket', value: `$${Number(item.ticket ?? 0).toLocaleString()}`, tone: 'neutral' },
        { label: 'Open threads', value: String(item.openThreads ?? 0), tone: 'neutral' },
        { label: 'Next session', value: String(item.nextSession ?? '—'), tone: 'neutral' },
        { label: 'Onboarding', value: String(item.onboardingStep ?? 'complete'), tone: item.status === 'Onboarding' ? 'warn' : 'good' },
      ],
      fields: [],
    });
    drill.open(id);
  };

  const openNote = (id: string): void => {
    const item = sessionNotes.find(c => c.id === id);
    if (!item) { vaultDrill.open(id); return; }
    const initials = String(item.client ?? '?').split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: `${String(item.client ?? '—')} · ${String(item.date ?? '')}`,
      status: String(item.tag ?? 'note'),
      portrait: { initials, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
      pills: [
        { label: 'Duration', value: String(item.duration ?? '—'), tone: 'neutral' },
        { label: 'Tag', value: String(item.tag ?? 'session note'), tone: 'good' },
        { label: 'Date', value: String(item.date ?? ''), tone: 'neutral' },
      ],
      fields: [],
    });
    vaultDrill.open(id);
  };

  const Active = () => {
    return (
      <div className="p-7">
        <SectionHead title="Active clients" subtitle="Health from engagement + outcomes" action={<Badge tone="ok">{activeClients.length}</Badge>} />
        <FleetItemGrid cols={2}>
          {activeClients.map(c => {
            const health = Number(c.health ?? 0);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={String(c.segment)}
                statusLabel={health >= 80 ? 'healthy' : 'watch'}
                statusTone={health >= 80 ? 'ok' : 'warn'}
                accent={ACCENT}
                icon={<Building2 className="w-5 h-5" />}
                metricLabel="health"
                metricValue={`${health}%`}
                meta="Active · High-touch"
                onClick={() => openClient(String(c.id))}
              />
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Onboarding = () => {
    return (
      <div className="p-7">
        <SectionHead title="Onboarding" subtitle="Agents run the 7-step welcome" />
        <FleetItemGrid cols={2}>
          {onboardingClients.map(c => {
            const [step, total] = String(c.onboardingStep ?? '0 / 7').split(' / ').map(Number);
            const pct = Math.round((step / total) * 100);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={`Step ${step} / ${total}`}
                statusLabel={`${pct}%`}
                statusTone={pct >= 70 ? 'accent' : pct >= 30 ? 'warn' : 'danger'}
                accent="#f59e0b"
                icon={<GraduationCap className="w-5 h-5" />}
                metricLabel="progress"
                metricValue={`${pct}%`}
                meta={`${step} of ${total} steps complete`}
                onClick={() => openClient(String(c.id))}
              />
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Risk = () => {
    return (
      <div className="p-7">
        <SectionHead title="Churn risk" subtitle="Flagged by the retention agent" />
        <FleetItemGrid cols={2}>
          {riskClients.map(c => (
            <FleetItemCard
              key={String(c.id)}
              title={String(c.name)}
              subtitle={String(c.nextSession)}
              statusLabel="high risk"
              statusTone="danger"
              accent="#dc2626"
              icon={<TrendingDown className="w-5 h-5" />}
              metricLabel="next"
              metricValue={String(c.nextSession)}
              meta="Retention agent flagged"
              onClick={() => openClient(String(c.id))}
            />
          ))}
        </FleetItemGrid>
      </div>
    );
  };

  const Directory = () => {
    return (
      <div className="p-7">
        <SectionHead title="Directory" subtitle="Every client — one shared page template (CMS-driven)" />
        <CMSCardList
          collectionId="clients"
          onOpen={openClient}
          cols={2}
          render={(c: Record<string, unknown>) => ({
            title: String(c.name),
            subtitle: String(c.segment),
            description: `Status: ${String(c.status)}${c.health ? ` · Health: ${c.health}%` : ''}`,
            statusLabel: String(c.status),
            statusTone: c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : c.status === 'At risk' ? 'danger' : 'neutral',
            accent: ACCENT,
            icon: <Contact className="w-5 h-5" />,
            metricLabel: 'health',
            metricValue: c.health ? `${c.health}%` : '—',
            meta: `segment: ${String(c.segment)}`,
          })}
        />
      </div>
    );
  };

  const Vault = () => {
    return (
      <div className="p-7">
        <SectionHead title="IP Vault" subtitle="Every session, captured — the coach's knowledge, sanctuarized" />
        <CMSCardList
          collectionId="session_notes"
          onOpen={openNote}
          cols={2}
          render={(n: Record<string, unknown>) => ({
            title: String(n.title),
            subtitle: `${String(n.client ?? '—')} · ${String(n.date ?? '')}`,
            description: String(n.summary ?? n.body ?? '').slice(0, 160),
            statusLabel: String(n.tag ?? 'note'),
            statusTone: 'accent',
            accent: '#8b5cf6',
            icon: <BookText className="w-5 h-5" />,
            metricLabel: 'duration',
            metricValue: String(n.duration ?? '—'),
            meta: String(n.tag ?? 'session note'),
          })}
        />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'active', label: 'Active', icon: Contact, render: Active },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, render: Onboarding },
    { id: 'risk', label: 'Churn Risk', icon: TrendingDown, render: Risk },
    { id: 'directory', label: 'Directory', icon: Users, render: Directory },
    { id: 'vault', label: 'IP Vault', icon: VaultIcon, render: Vault },
  ];

  return (
    <>
      <AppFrame title="Clients" subtitle="Accounts" icon={Contact} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="clients"
          accent="#2563eb"
          onBack={() => setDetail(null)}
          motion={{ kind: 'pop-scale', durationMs: 200 }}
        >
          <ClientsDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
