import { useState } from 'react';
import { Scale, FileSignature, ShieldCheck, BookMarked } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';
import { useShellStore } from '../../stores/shell.store';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';

const ACCENT = '#64748b';

const aiActSeed = [
  { id: 'a1', label: 'Risk classification documented', done: true },
  { id: 'a2', label: 'Human-in-the-loop on client-facing actions', done: true },
  { id: 'a3', label: 'Transparency notice on AI-drafted content', done: true },
  { id: 'a4', label: 'Data-processing register up to date', done: false },
  { id: 'a5', label: 'Incident logging & reporting path', done: false },
];

export function LegalApp() {
  const [checks, setChecks] = useState(aiActSeed);
  const addToast = useShellStore(s => s.addToast);
  const contractsDrill = useCollectionDrill('contracts', 'Contracts');
  const policiesDrill = useCollectionDrill('policies', 'Policies');

  const toggle = (id: string) => {
    const current = checks.find(c => c.id === id);
    if (current && !current.done) {
      addToast({ source: 'Legal', type: 'success', message: `AI-Act item cleared: ${current.label}` });
    }
    setChecks(cs => cs.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const cleared = checks.filter(c => c.done).length;

  const Compliance = () => (
    <div className="p-7">
      <SectionHead title="AI-Act compliance" subtitle="Deadline 2026-08-02" action={<Badge tone={cleared === checks.length ? 'ok' : 'warn'}>{cleared} / {checks.length}</Badge>} />
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          {checks.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <span className={`text-sm ${c.done ? 'text-stone-700' : 'text-stone-500'}`}>{c.label}</span>
              <Toggle on={c.done} onClick={() => toggle(c.id)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const Contracts = () => {
    if (contractsDrill.openId) {
      return <DynamicPageView collectionId="contracts" itemId={contractsDrill.openId} onBack={contractsDrill.close} onNavigate={contractsDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Contracts" subtitle="Engagement letters & DPAs" />
        <CollectionRepeater collectionId="contracts" onOpen={contractsDrill.open} />
      </div>
    );
  };

  const Policies = () => {
    if (policiesDrill.openId) {
      return <DynamicPageView collectionId="policies" itemId={policiesDrill.openId} onBack={policiesDrill.close} onNavigate={policiesDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Policies" subtitle="Published to clients" />
        <CollectionRepeater collectionId="policies" onOpen={policiesDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'contracts', label: 'Contracts', icon: FileSignature, render: Contracts },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck, render: Compliance },
    { id: 'policies', label: 'Policies', icon: BookMarked, render: Policies },
  ];

  return <AppFrame title="Legal" subtitle="Aquaman domain" icon={Scale} accent={ACCENT} sections={sections} />;
}
