import { useEffect, useState } from 'react';
import { Scale, FileSignature, ShieldCheck, BookMarked, AlertTriangle } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';
import { useShellStore } from '../../stores/shell.store';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { LegalDetailPage, type LegalDetailItem } from './LegalDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { LegalItemDetail } from './LegalItemDetail';
import { seedLegalCms } from './seed';

registerItemDetail('legal', LegalItemDetail);
seedLegalCms();

const ACCENT = '#64748b';

export function LegalApp() {
  const addToast = useShellStore(s => s.addToast);
  const contractsDrill = useCollectionDrill('contracts', 'Contracts');
  const policiesDrill = useCollectionDrill('policies', 'Policies');
  const contracts = useCmsStore(s => s.items['contracts']) ?? [];
  const policies = useCmsStore(s => s.items['policies']) ?? [];
  const checks = useCmsStore(s => s.items['legal_ai_act_checks']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const [detail, setDetail] = useState<LegalDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  /** Toggle an AI-Act check. The store carries the boolean as `done: 'Yes' |
   *  'No'` (matches the badgeField) so a single mutation both flips the
   *  status and the visibility pill on the Compliance summary. The clearedAt
   *  timestamp is stamped on the transition to 'Yes' so the audit trail
   *  shows when each item was actually signed off. */
  const toggle = (id: string) => {
    const current = checks.find(c => c.id === id);
    if (!current) return;
    const isDone = String(current.done) === 'Yes';
    const nextDone = isDone ? 'No' : 'Yes';
    const label = String(current.label);
    updateItem('legal_ai_act_checks', id, {
      done: nextDone,
      clearedAt: isDone ? '—' : new Date().toISOString().slice(0, 10),
    });
    if (!isDone) {
      addToast({ source: 'Legal', type: 'success', message: `AI-Act item cleared: ${label}` });
    } else {
      addToast({ source: 'Legal', type: 'warning', message: `AI-Act item re-opened: ${label}` });
    }
  };

  const openContract = (id: string): void => {
    const item = contracts.find(c => c.id === id);
    if (!item) { contractsDrill.open(id); return; }
    const body = String(item.body ?? '');
    const clauses = body
      ? body.split('\n\n').filter(Boolean).slice(0, 6).map((b, i) => ({
          title: `Clause ${i + 1}`,
          body: b,
        }))
      : [];
    const party = String(item.client ?? item.subtitle ?? '');
    const fields: { label: string; value: string }[] = [
      { label: 'Document', value: String(item.document ?? '') },
      { label: 'Counter-party', value: party },
      { label: 'Signed', value: String(item.signed ?? '') },
      { label: 'Status', value: String(item.status ?? 'active') },
    ];
    setDetail({
      id: String(item.id),
      title: String(item.document ?? item.title ?? 'Untitled'),
      subtitle: party,
      party,
      status: String(item.status ?? 'active'),
      signed: String(item.signed ?? ''),
      collection: 'contracts',
      clauses,
      fields,
    });
    contractsDrill.open(id);
  };

  const openPolicy = (id: string): void => {
    const item = policies.find(c => c.id === id);
    if (!item) { policiesDrill.open(id); return; }
    const body = String(item.body ?? item.summary ?? '');
    const clauses = body
      ? [{ title: String(item.title ?? 'Policy'), body }]
      : [];
    const updated = String(item.updated ?? '');
    const fields: { label: string; value: string }[] = [
      { label: 'Policy', value: String(item.name ?? item.title ?? '') },
      { label: 'Last updated', value: updated },
      { label: 'Summary', value: body },
    ];
    setDetail({
      id: String(item.id),
      title: String(item.name ?? item.title ?? 'Untitled'),
      subtitle: updated,
      body,
      updated,
      status: String(item.status ?? 'published'),
      collection: 'policies',
      clauses,
      fields,
    });
    policiesDrill.open(id);
  };

  const cleared = checks.filter(c => String(c.done) === 'Yes').length;

  // Une échéance AI-Act figée à 2026-08-02 est passée depuis plusieurs jours
  // et l'ancien rendu (« Deadline 2026-08-02 » en gris neutre) ne le disait
  // pas. On calcule le retard à chaque rendu (sans useState — la date du jour
  // change entre deux ouvertures du shell, pas pendant) et on l'affiche en
  // couleur d'alerte avec une icône. (cf. FIX-4.4.)
  const DEADLINE = new Date('2026-08-02T00:00:00');
  const today = new Date();
  const daysLate = Math.max(
    0,
    Math.floor((today.getTime() - DEADLINE.getTime()) / 86_400_000),
  );
  const overdue = daysLate > 0;
  const overdueLabel = overdue
    ? `Deadline 2026-08-02 · en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}`
    : `Deadline 2026-08-02 · dans ${-daysLate} jour${-daysLate > 1 ? 's' : ''}`;

  const Compliance = () => (
    <div className="p-7">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-stone-900 font-outfit">AI-Act compliance</h2>
          <p
            className={`text-sm mt-0.5 inline-flex items-center gap-1.5 ${
              overdue ? 'text-red-600 font-semibold' : 'text-stone-500'
            }`}
          >
            {overdue && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{overdueLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdue && <Badge tone="danger">Overdue</Badge>}
          <Badge tone={cleared === checks.length ? 'ok' : 'warn'}>{cleared} / {checks.length}</Badge>
        </div>
      </div>
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          {checks.map(c => {
            const isDone = String(c.done) === 'Yes';
            const clearedAt = String(c.clearedAt ?? '—');
            return (
              <div key={String(c.id)} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <span
                    className="text-sm block"
                    style={{ color: isDone ? 'var(--theme-text)' : 'var(--theme-muted)' }}
                  >
                    {String(c.label)}
                  </span>
                  <span
                    className="text-[10.5px] font-mono mt-0.5 block"
                    style={{ color: 'var(--theme-text-dim)' }}
                  >
                    {String(c.category ?? '')} · {isDone ? `cleared ${clearedAt}` : 'not cleared'}
                  </span>
                </div>
                <Toggle on={isDone} onClick={() => toggle(String(c.id))} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const Contracts = () => {
    return (
      <div className="p-7">
        <SectionHead title="Contracts" subtitle="Engagement letters & DPAs" />
        <CollectionRepeater collectionId="contracts" onOpen={openContract} />
      </div>
    );
  };

  const Policies = () => {
    return (
      <div className="p-7">
        <SectionHead title="Policies" subtitle="Published to clients" />
        <CollectionRepeater collectionId="policies" onOpen={openPolicy} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'contracts', label: 'Contracts', icon: FileSignature, render: Contracts },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck, render: Compliance },
    { id: 'policies', label: 'Policies', icon: BookMarked, render: Policies },
  ];

  return (
    <>
      <AppFrame title="Legal" subtitle="Aquaman domain" icon={Scale} accent={ACCENT} sections={sections} canvasNuance={1} />
      {detail ? (
        <AppDetailOverlay
          appId="legal"
          accent="#64748b"
          onBack={() => setDetail(null)}
          motion={{ kind: 'unfold', durationMs: 240 }}
        >
          <LegalDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
