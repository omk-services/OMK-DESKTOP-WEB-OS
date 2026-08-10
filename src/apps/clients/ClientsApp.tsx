import { useEffect, useState } from 'react';
import { Contact, UserPlus, TrendingDown, Building2, Users, Vault as VaultIcon, BookText, GraduationCap, Plus } from 'lucide-react';
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
import { useShellStore } from '../../stores/shell.store';

registerItemDetail('clients', ClientsItemDetail);

const ACCENT = '#2563eb';

export function ClientsApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const drill = useCollectionDrill('clients', ['Active', 'Onboarding', 'Churn Risk', 'Directory']);
  const vaultDrill = useCollectionDrill('session_notes', 'IP Vault');
  const addItem = useCmsStore(s => s.addItem);
  const addToast = useShellStore(s => s.addToast);
  const [detail, setDetail] = useState<ClientsDetailItem | null>(null);
  const { activePage, setDetail: setWindowDetail } = useWindowPage();

  // Mirror local detail into the window breadcrumb.
  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  // Crumb dupliqué : la fiche était publiée à la fois par setWindowDetail (ici)
  // ET par useCollectionDrill('clients', ...). Quand on quittait une section
  // clients, le drill fermait son openId mais `detail` restait set, donc
  // l'overlay restait collé par-dessus. On ferme l'overlay dès qu'on quitte
  // une section clients.
  useEffect(() => {
    const isClientsSection = ['Active', 'Onboarding', 'Churn Risk', 'Directory', 'IP Vault'].includes(activePage);
    if (!isClientsSection && detail) {
      setDetail(null);
    }
    if (!isClientsSection) {
      drill.close();
      vaultDrill.close();
    }
  }, [activePage, detail, drill, vaultDrill]);

  const activeClients = clients.filter(c => c.status === 'Active');
  const onboardingClients = clients.filter(c => c.status === 'Onboarding');
  const riskClients = clients.filter(c => c.status === 'At risk');
  const sessionNotes = useCmsStore(s => s.items['session_notes']) ?? [];

  /** Compose a new client. The mini-form takes a name and a monthly ticket;
   *  everything else is defaulted to canonical Citadelle values so the new
   *  row slots into the existing lists cleanly (Active section, Directory
   *  card, etc.). The mutation flows through `addItem` so the new client
   *  appears in the right tab without any manual refresh. */
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerName, setComposerName] = useState('');
  const [composerSegment, setComposerSegment] = useState('Citadelle — high ticket');
  const [composerTicket, setComposerTicket] = useState('1800');

  const submitNewClient = (): void => {
    const name = composerName.trim();
    if (name.length === 0) {
      addToast({ source: 'Clients', type: 'warning', message: 'Client name is required.' });
      return;
    }
    // Ticket must be a positive number — refuse silently-defaulting values so
    // a coach can't create a row with an unknown monthly value.
    const ticket = Number(composerTicket);
    if (!Number.isFinite(ticket) || ticket <= 0) {
      addToast({ source: 'Clients', type: 'warning', message: 'Monthly ticket must be a positive number.' });
      return;
    }
    const result = addItem('clients', {
      name,
      segment: composerSegment.trim() || 'Citadelle — high ticket',
      ticket,
      openThreads: 0,
      nextSession: 'Not scheduled',
      health: 100,
      onboardingStep: '1 / 7',
      status: 'Onboarding',
    });
    if (result.ok) {
      addToast({ source: 'Clients', type: 'success', message: `Client added: ${name}` });
      setComposerName('');
      setComposerSegment('Citadelle — high ticket');
      setComposerTicket('1800');
      setComposerOpen(false);
    } else {
      addToast({ source: 'Clients', type: 'warning', message: result.error ?? 'Could not add client.' });
    }
  };

  const cancelComposer = (): void => {
    setComposerName('');
    setComposerSegment('Citadelle — high ticket');
    setComposerTicket('1800');
    setComposerOpen(false);
  };

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
    const initials = String(item.clientName ?? '?').split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
    setDetail({
      id: String(item.id),
      title: String(item.title ?? item.topic ?? 'Untitled'),
      subtitle: `${String(item.clientName ?? '—')} · ${String(item.date ?? '')}`,
      status: String(item.sentiment ?? 'note'),
      portrait: { initials, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
      pills: [
        { label: 'Duration', value: String(item.duration ?? '—'), tone: 'neutral' },
        { label: 'Sentiment', value: String(item.sentiment ?? 'session note'), tone: 'good' },
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
            // Defensive parse: `onboardingStep` may be "5 / 7", "complete", "" or
            // anything the coach typed. Anything that fails to parse as "<n> / <n>"
            // falls back to 0 / 7 so the card never shows "NaN%".
            const raw = String(c.onboardingStep ?? '0 / 7').split(' / ');
            const step = Number(raw[0]);
            const total = Number(raw[1]);
            const safeStep = Number.isFinite(step) ? Math.max(0, step) : 0;
            const safeTotal = Number.isFinite(total) && total > 0 ? total : 7;
            const cappedStep = Math.min(safeStep, safeTotal);
            const pct = Math.round((cappedStep / safeTotal) * 100);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={`Step ${cappedStep} / ${safeTotal}`}
                statusLabel={`${pct}%`}
                statusTone={pct >= 70 ? 'accent' : pct >= 30 ? 'warn' : 'danger'}
                accent="#f59e0b"
                icon={<GraduationCap className="w-5 h-5" />}
                metricLabel="progress"
                metricValue={`${pct}%`}
                meta={`${cappedStep} of ${safeTotal} steps complete`}
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
        <SectionHead
          title="Directory"
          subtitle="Every client — one shared page template (CMS-driven)"
          action={
            !composerOpen ? (
              <button
                onClick={() => setComposerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
                aria-label="Add a new client"
              >
                <Plus className="w-4 h-4" />
                New client
              </button>
            ) : null
          }
        />
        {composerOpen ? (
          <div
            className="mb-4 rounded-xl border p-4"
            style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="clients-composer-name"
                >
                  Name
                </label>
                <input
                  id="clients-composer-name"
                  autoFocus
                  value={composerName}
                  onChange={(e) => setComposerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNewClient();
                    if (e.key === 'Escape') cancelComposer();
                  }}
                  placeholder="Elena Marquez"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    background: 'var(--theme-bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="clients-composer-segment"
                >
                  Segment
                </label>
                <input
                  id="clients-composer-segment"
                  value={composerSegment}
                  onChange={(e) => setComposerSegment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNewClient();
                    if (e.key === 'Escape') cancelComposer();
                  }}
                  placeholder="Citadelle — high ticket"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    background: 'var(--theme-bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="clients-composer-ticket"
                >
                  Monthly ticket (USD)
                </label>
                <input
                  id="clients-composer-ticket"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={composerTicket}
                  onChange={(e) => setComposerTicket(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNewClient();
                    if (e.key === 'Escape') cancelComposer();
                  }}
                  placeholder="1800"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    background: 'var(--theme-bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={cancelComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  color: 'var(--theme-text-dim)',
                  border: '1px solid var(--panel-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitNewClient}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: ACCENT,
                  color: '#ffffff',
                }}
              >
                Add client
              </button>
            </div>
          </div>
        ) : null}
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
            title: String(n.title ?? n.topic ?? 'Untitled'),
            subtitle: `${String(n.clientName ?? '—')} · ${String(n.date ?? '')}`,
            description: String(n.body ?? '').slice(0, 160),
            statusLabel: String(n.sentiment ?? 'note'),
            statusTone: 'accent',
            accent: '#8b5cf6',
            icon: <BookText className="w-5 h-5" />,
            metricLabel: 'duration',
            metricValue: String(n.duration ?? '—'),
            meta: String(n.sentiment ?? 'session note'),
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
