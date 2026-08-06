import { useEffect, useState } from 'react';
import { Wallet, PiggyBank, Receipt, BarChart3, FileText, CheckCircle2, Scale, LineChart, Coins, CircleDollarSign } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, StatCard } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { FinanceDetailPage, type FinanceDetailItem } from './FinanceDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { FinanceItemDetail } from './FinanceItemDetail';
import { CMSCardList } from '../_ui/CMSCardList';
import { seedFinanceCms } from './seed';

registerItemDetail('finance', FinanceItemDetail);
seedFinanceCms();

const ACCENT = '#0d9488';

// projected cash (k$) over 12 months — declining runway
const runway = [42, 40, 39, 37, 36, 34, 33, 31, 30, 28, 27, 25];

function Overview() {
  return (
    <div className="p-7">
      <SectionHead title="Finance overview" subtitle="Unit economics at a glance" />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="MRR" value="$3,600" tone="ok" hint="2 Citadelle clients" />
        <StatCard label="Monthly burn" value="$1,450" />
        <StatCard label="Runway" value="17 mo" tone="accent" hint="at current burn" />
      </div>
      <div className="mt-4">
        <StatCard label="LTV : CAC" value="9.4 : 1" tone="ok" hint="marketplace + in-voice channels" />
      </div>
    </div>
  );
}

function Runway() {
  const max = Math.max(...runway);
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return (
    <div className="p-7">
      <SectionHead title="Runway" subtitle="Projected cash, next 12 months (k$)" />
      <Card className="p-6">
        <div className="flex items-end gap-2 h-52">
          {runway.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-t-md transition-all" style={{ height: `${(v / max) * 100}%`, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}88)` }} />
              <span className="text-[10px] text-[var(--theme-text-dim)]">{months[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--theme-text-dim)]">
          <span className="w-3 h-3 rounded-sm" style={{ background: ACCENT }} /> Cash on hand · burn holds runway above 24 months of safety
        </div>
      </Card>
    </div>
  );
}

export function FinanceApp() {
  const invoices = useCmsStore(s => s.items['invoices']) ?? [];
  const plancherItems = useCmsStore(s => s.items['plancher_marges']) ?? [];
  const budgetItems = useCmsStore(s => s.items['budget_tokens']) ?? [];
  const invoicesDrill = useCollectionDrill('invoices', 'Invoices');
  const plancherDrill = useCollectionDrill('plancher_marges', 'Planchers');
  const courbeDrill = useCollectionDrill('courbe_demande', 'Courbes');
  const budgetDrill = useCollectionDrill('budget_tokens', 'Tokens');
  const formesDrill = useCollectionDrill('formes_prix', 'Formes');
  const [detail, setDetail] = useState<FinanceDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const openInvoice = (id: string): void => {
    const item = invoices.find(c => c.id === id);
    if (!item) { invoicesDrill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.client ?? item.title ?? 'Invoice'),
      subtitle: String(item.number ?? item.id),
      status: String(item.status ?? 'open'),
      kpis: [
        { label: 'Amount', value: `$${Number(item.amount ?? 0).toLocaleString()}` },
        { label: 'Status', value: String(item.status ?? 'open') },
        { label: 'Due', value: String(item.dueDate ?? '—') },
        { label: 'Issued', value: String(item.issued ?? '—') },
      ],
      rows: [
        { label: 'Description', value: String(item.description ?? item.memo ?? '') },
        { label: 'Client', value: String(item.client ?? '—') },
      ],
      fields: [],
    });
    invoicesDrill.open(id);
  };

  const PLANCHER_STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
    ok: 'ok',
    warn: 'warn',
    danger: 'danger',
  };
  const PLANCHER_STATUS_ACCENT: Record<string, string> = {
    ok: '#16a34a',
    warn: '#d97706',
    danger: '#dc2626',
  };

  const Planchers = () => {
    const belowFloor = plancherItems.filter((p) => String(p.status ?? '').toLowerCase() === 'danger').length;
    const tangential = plancherItems.filter((p) => String(p.status ?? '').toLowerCase() === 'warn').length;
    return (
      <div className="p-7">
        <SectionHead
          title="Planchers de marge"
          subtitle="Le seuil sous lequel une prestation ne se vend pas — pas une marge cible, un plancher"
        />
        {(belowFloor > 0 || tangential > 0) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {belowFloor > 0 && (
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] px-2.5 py-1 rounded-full"
                style={{ background: '#fee2e2', color: '#b91c1c' }}
              >
                {belowFloor} sous le plancher
              </span>
            )}
            {tangential > 0 && (
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] px-2.5 py-1 rounded-full"
                style={{ background: '#fef3c7', color: '#b45309' }}
              >
                {tangential} tangente
              </span>
            )}
          </div>
        )}
        <CMSCardList
          collectionId="plancher_marges"
          onOpen={plancherDrill.open}
          cols={2}
          render={(p: Record<string, unknown>) => {
            const status = String(p.status ?? 'ok').toLowerCase();
            const price = Number(p.price ?? 0);
            const floor = Number(p.floor ?? 0);
            const gap = Number(p.gap ?? price - floor);
            return {
              title: String(p.offer ?? 'Offre'),
              subtitle: `${String(p.category ?? '')} · ${String(p.unit ?? '')}`,
              description: String(p.note ?? '').slice(0, 140),
              statusLabel: status.toUpperCase(),
              statusTone: PLANCHER_STATUS_TONE[status] ?? 'neutral',
              accent: PLANCHER_STATUS_ACCENT[status] ?? ACCENT,
              icon: <Scale className="w-5 h-5" />,
              metricLabel: 'price / floor',
              metricValue: `$${price} / $${floor}`,
              meta: gap >= 0 ? `marge +$${gap.toLocaleString('en-US')}` : `${gap.toLocaleString('en-US')}€ sous`,
            };
          }}
        />
      </div>
    );
  };

  const Courbes = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Courbes de demande"
          subtitle="Scénarios de prix et volume estimé · la pente plutôt qu'un chiffre isolé"
        />
        <CMSCardList
          collectionId="courbe_demande"
          onOpen={courbeDrill.open}
          cols={2}
          render={(c: Record<string, unknown>) => {
            const elasticity = String(c.elasticity ?? 'med').toLowerCase();
            const eTone = elasticity === 'low' ? 'ok' : elasticity === 'med' ? 'warn' : 'danger';
            const eColor = elasticity === 'low' ? '#16a34a' : elasticity === 'med' ? '#d97706' : '#dc2626';
            const sweetSpot = Number(c.sweetSpot ?? 0);
            const scenariosRaw = String(c.scenarios ?? '');
            const points = scenariosRaw.split('·').filter(Boolean).length;
            return {
              title: String(c.offer ?? 'Offre'),
              subtitle: `${String(c.category ?? '')} · ${points} scénarios`,
              description: String(c.notes ?? '').slice(0, 140),
              statusLabel: elasticity,
              statusTone: eTone,
              accent: eColor,
              icon: <LineChart className="w-5 h-5" />,
              metricLabel: 'sweet spot',
              metricValue: `$${sweetSpot.toLocaleString('en-US')}`,
              meta: String(c.sensitivity ?? ''),
            };
          }}
        />
      </div>
    );
  };

  const Budgets = () => {
    const totalModel = budgetItems.reduce((s, b) => s + Number(b.modelCost ?? 0), 0);
    const totalSaving = budgetItems.reduce((s, b) => s + Number(b.monthlySaving ?? 0), 0);
    return (
      <div className="p-7">
        <SectionHead
          title="Budget de tokens"
          subtitle="Coût modèle vs ETP remplacé · la métrique qui justifie l'automatisation"
        />
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard label="Dépense modèle / mois" value={`$${totalModel.toLocaleString('en-US')}`} hint={`${budgetItems.length} usages suivis`} />
          <StatCard label="Économie nette / mois" value={`$${totalSaving.toLocaleString('en-US')}`} tone="ok" hint="vs ETP remplacés" />
        </div>
        <CMSCardList
          collectionId="budget_tokens"
          onOpen={budgetDrill.open}
          cols={2}
          render={(b: Record<string, unknown>) => {
            const status = String(b.status ?? 'ok').toLowerCase();
            return {
              title: String(b.use ?? 'Usage'),
              subtitle: `${String(b.category ?? '')} · ${String(b.fteRole ?? '')}`,
              description: String(b.notes ?? '').slice(0, 140),
              statusLabel: status.toUpperCase(),
              statusTone: status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'danger',
              accent: status === 'ok' ? '#16a34a' : status === 'warn' ? '#d97706' : '#dc2626',
              icon: <Coins className="w-5 h-5" />,
              metricLabel: 'coût modèle',
              metricValue: `$${Number(b.modelCost ?? 0).toLocaleString('en-US')} / mois`,
              meta: `économie +$${Number(b.monthlySaving ?? 0).toLocaleString('en-US')}`,
            };
          }}
        />
      </div>
    );
  };

  const Formes = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Formes de prix"
          subtitle="Comment facturer une même prestation · cashflow, engagement client, risque"
        />
        <CMSCardList
          collectionId="formes_prix"
          onOpen={formesDrill.open}
          cols={2}
          render={(f: Record<string, unknown>) => {
            const cashflow = String(f.cashflow ?? 'recurring').toLowerCase();
            const cfColor = cashflow === 'immediate' ? '#16a34a'
              : cashflow === 'upfront' ? '#1d4ed8'
              : cashflow === 'recurring' ? '#0d9488'
              : cashflow === 'event' ? '#d97706'
              : cashflow === 'deferred' ? '#7c3aed'
              : ACCENT;
            return {
              title: String(f.shape ?? 'Forme'),
              subtitle: String(f.offer ?? ''),
              description: String(f.bestFor ?? '').slice(0, 140),
              statusLabel: cashflow,
              statusTone: 'accent',
              accent: cfColor,
              icon: <CircleDollarSign className="w-5 h-5" />,
              metricLabel: 'engagement',
              metricValue: String(f.commitment ?? '—').split('—')[0]!.trim().slice(0, 28) || '—',
              meta: String(f.risk ?? '').slice(0, 60),
            };
          }}
        />
      </div>
    );
  };

  const Invoices = () => {
    return (
      <div className="p-7">
        <SectionHead title="Invoices" subtitle="Reconciled nightly via Stripe" />
        <CMSCardList
          collectionId="invoices"
          onOpen={openInvoice}
          cols={2}
          render={(inv: Record<string, unknown>) => ({
            title: String(inv.client ?? inv.title ?? 'Invoice'),
            subtitle: String(inv.number ?? inv.id),
            description: String(inv.description ?? inv.memo ?? ''),
            statusLabel: String(inv.status ?? 'open'),
            statusTone: inv.status === 'paid' ? 'ok' : inv.status === 'overdue' ? 'danger' : 'warn',
            accent: inv.status === 'paid' ? '#16a34a' : inv.status === 'overdue' ? '#dc2626' : ACCENT,
            icon: inv.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />,
            metricLabel: 'amount',
            metricValue: `$${inv.amount ?? '—'}`,
            meta: inv.dueDate ? `due ${String(inv.dueDate)}` : '',
          })}
        />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, render: Overview },
    { id: 'runway', label: 'Runway', icon: PiggyBank, render: Runway },
    { id: 'planchers', label: 'Planchers', icon: Scale, render: Planchers },
    { id: 'courbes', label: 'Courbes', icon: LineChart, render: Courbes },
    { id: 'tokens', label: 'Tokens', icon: Coins, render: Budgets },
    { id: 'formes', label: 'Formes', icon: CircleDollarSign, render: Formes },
    { id: 'invoices', label: 'Invoices', icon: Receipt, render: Invoices },
  ];

  // Picked drill (if any) — one of the 4 CMS collections exposed via
  // useCollectionDrill. The DynamicPageView is rendered in the overlay
  // (sibling of AppFrame) so it inherits the global topbar theme instead
  // of the per-app theme that AppFrame writes on its content.
  const drillViews: ReadonlyArray<{
    drill: { openId: string | null; open: (id: string) => void; close: () => void };
    collectionId: string;
  }> = [
    { drill: plancherDrill, collectionId: 'plancher_marges' },
    { drill: courbeDrill,   collectionId: 'courbe_demande' },
    { drill: budgetDrill,   collectionId: 'budget_tokens' },
    { drill: formesDrill,   collectionId: 'formes_prix' },
  ];
  const activeDrill = drillViews.find((d) => d.drill.openId) ?? null;

  return (
    <>
      <AppFrame title="Finance" subtitle="Wonder Woman domain" icon={Wallet} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="finance"
          accent={ACCENT}
          onBack={() => setDetail(null)}
          motion={{ kind: 'fade-up', durationMs: 240 }}
        >
          <FinanceDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : activeDrill && activeDrill.drill.openId ? (
        <AppDetailOverlay
          appId="finance"
          accent={ACCENT}
          onBack={() => activeDrill.drill.close()}
          motion={{ kind: 'fade-up', durationMs: 240 }}
        >
          <DynamicPageView
            collectionId={activeDrill.collectionId}
            itemId={activeDrill.drill.openId}
            onBack={() => activeDrill.drill.close()}
            onNavigate={activeDrill.drill.open}
          />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
