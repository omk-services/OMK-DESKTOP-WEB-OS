import { Wallet, PiggyBank, Receipt, BarChart3, FileText, CheckCircle2 } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, StatCard } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { CMSCardList } from '../_ui/CMSCardList';

const ACCENT = '#ca8a04';

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
              <span className="text-[10px] text-stone-400">{months[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
          <span className="w-3 h-3 rounded-sm" style={{ background: ACCENT }} /> Cash on hand · burn holds runway above 24 months of safety
        </div>
      </Card>
    </div>
  );
}

export function FinanceApp() {
  const drill = useCollectionDrill('invoices', 'Invoices');

  const Invoices = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="invoices" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Invoices" subtitle="Reconciled nightly via Stripe" />
        <CMSCardList
          collectionId="invoices"
          onOpen={drill.open}
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
    { id: 'invoices', label: 'Invoices', icon: Receipt, render: Invoices },
  ];

  return <AppFrame title="Finance" subtitle="Wonder Woman domain" icon={Wallet} accent={ACCENT} sections={sections} />;
}
