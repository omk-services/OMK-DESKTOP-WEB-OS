import { Users, UserCog, Bot, Heart } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#0891b2';

function Culture() {
  const values = ['Client outcomes first', 'Bias to shipped, not perfect', 'Sober by default', 'Own the mistake, keep the receipt'];
  return (
    <div className="p-7">
      <SectionHead title="Culture" subtitle="The operating values every agent inherits" />
      <div className="grid grid-cols-2 gap-3">
        {values.map((v, i) => (
          <div key={i} className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm p-5 flex items-start gap-3">
            <Heart className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-stone-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeopleApp() {
  // Hooks live here, at the top of the real component — section closures below
  // only read the already-computed drill state, they never call hooks themselves.
  const teamDrill = useCollectionDrill('team', 'Team');
  const agentsDrill = useCollectionDrill('people_agents', 'Agents');
  const teamCount = useCmsStore(s => s.items['team']?.length ?? 0);

  const Team = () => {
    if (teamDrill.openId) {
      return <DynamicPageView collectionId="team" itemId={teamDrill.openId} onBack={teamDrill.close} onNavigate={teamDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Team" subtitle="Your People squad (X-Men doctrine)" action={<Badge tone="accent">{teamCount} members</Badge>} />
        <CollectionRepeater collectionId="team" onOpen={teamDrill.open} />
      </div>
    );
  };

  const Agents = () => {
    if (agentsDrill.openId) {
      return <DynamicPageView collectionId="people_agents" itemId={agentsDrill.openId} onBack={agentsDrill.close} onNavigate={agentsDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Agents" subtitle="Autonomous workers on the People domain" />
        <CollectionRepeater collectionId="people_agents" onOpen={agentsDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'team', label: 'Team', icon: Users, render: Team },
    { id: 'agents', label: 'Agents', icon: Bot, render: Agents },
    { id: 'culture', label: 'Culture', icon: Heart, render: Culture },
  ];

  return <AppFrame title="People / Agents" subtitle="Green Lantern domain" icon={UserCog} accent={ACCENT} sections={sections} />;
}
