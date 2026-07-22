import { useState } from 'react';
import { Settings, SlidersHorizontal, ShieldAlert, Plug } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';

const ACCENT = '#78716c';

export function SettingsApp() {
  const [flags, setFlags] = useState({
    autoBrief: true,
    autoFollowup: true,
    voicePublish: false,
    egressLock: true,
    localOnly: true,
    weeklyDigest: true,
  });
  const set = (k: keyof typeof flags) => setFlags(f => ({ ...f, [k]: !f[k] }));

  const Row = ({ label, hint, k }: { label: string; hint: string; k: keyof typeof flags }) => (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <div className="text-sm font-medium text-stone-800">{label}</div>
        <div className="text-xs text-stone-400">{hint}</div>
      </div>
      <Toggle on={flags[k]} onClick={() => set(k)} />
    </div>
  );

  const General = () => (
    <div className="p-7">
      <SectionHead title="General" subtitle="How the Citadelle works for you" />
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <Row label="Auto-brief before sessions" hint="Draft a prep note from prior notes" k="autoBrief" />
          <Row label="Auto follow-up" hint="Send drafted replies after approval" k="autoFollowup" />
          <Row label="Weekly digest" hint="Monday brief of what needs you" k="weeklyDigest" />
        </div>
      </Card>
    </div>
  );

  const Privacy = () => (
    <div className="p-7">
      <SectionHead title="Privacy" subtitle="The seal every app trusts" action={<Badge tone="ok">Zero-PII</Badge>} />
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <Row label="Egress lock ready" hint="One-tap panic lock for all outbound calls" k="egressLock" />
          <Row label="Local-only session content" hint="Never trains an outside model" k="localOnly" />
          <Row label="Require approval to publish" hint="Nothing goes out in your name unseen" k="voicePublish" />
        </div>
      </Card>
    </div>
  );

  const Integrations = () => (
    <div className="p-7">
      <SectionHead title="Integrations" subtitle="Connected via the Marketplace" />
      <div className="flex flex-col gap-3">
        {[['Stripe', 'connected'], ['Calendly', 'connected'], ['LinkedIn', 'not connected']].map(([n, s]) => (
          <Card key={n} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center"><Plug className="w-4.5 h-4.5 text-stone-500" /></span>
              <span className="text-sm font-semibold text-stone-800">{n}</span>
            </div>
            <Badge tone={s === 'connected' ? 'ok' : 'neutral'}>{s}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );

  const sections: AppSection[] = [
    { id: 'general', label: 'General', icon: SlidersHorizontal, render: General },
    { id: 'privacy', label: 'Privacy', icon: ShieldAlert, render: Privacy },
    { id: 'integrations', label: 'Integrations', icon: Plug, render: Integrations },
  ];

  return <AppFrame title="Settings" subtitle="System" icon={Settings} accent={ACCENT} sections={sections} />;
}
