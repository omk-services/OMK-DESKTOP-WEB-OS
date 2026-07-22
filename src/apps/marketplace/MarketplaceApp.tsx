import { Store, Sparkles, Package, Check } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';

const ACCENT = '#db2777';

export function MarketplaceApp() {
  const items = useCmsStore(s => s.items['marketplace_listings']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const addToast = useShellStore(s => s.addToast);
  const drill = useCollectionDrill('marketplace_listings', ['Browse', 'Installed', 'Featured']);

  const install = (id: string) => {
    const current = items.find(l => l.id === id);
    if (current && current.installed !== 'Yes') {
      addToast({ source: 'Marketplace', type: 'success', message: `Installed ${current.name}.` });
    }
    updateItem('marketplace_listings', id, { installed: 'Yes' });
  };

  const grid = (filter: (l: typeof items[number]) => boolean, title: string) => {
    const list = items.filter(filter);
    return (
      <div className="p-7">
        <SectionHead title={title} subtitle="Extend your Citadelle — every integration is sandboxed" />
        <div className="grid grid-cols-2 gap-3">
          {list.map(l => (
            <div key={String(l.id)} className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center"><Package className="w-4.5 h-4.5 text-pink-600" /></span>
                {l.featured ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-pink-600"><Sparkles className="w-3 h-3" /> Featured</span> : null}
              </div>
              <button onClick={() => drill.open(String(l.id))} className="text-sm font-semibold text-stone-800 text-left hover:text-[var(--theme-accent)] transition-colors">{String(l.name)}</button>
              <div className="text-xs text-stone-500 mt-0.5 flex-1">{String(l.blurb)}</div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">{String(l.tag)}</span>
                {l.installed === 'Yes' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><Check className="w-3.5 h-3.5" /> Installed</span>
                ) : (
                  <button onClick={() => install(String(l.id))} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform" style={{ background: ACCENT }}>Install</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Browse = () => drill.openId
    ? <DynamicPageView collectionId="marketplace_listings" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />
    : grid(() => true, 'Marketplace');
  const Installed = () => drill.openId
    ? <DynamicPageView collectionId="marketplace_listings" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />
    : grid(l => l.installed === 'Yes', 'Installed');
  const Featured = () => drill.openId
    ? <DynamicPageView collectionId="marketplace_listings" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />
    : grid(l => !!l.featured, 'Featured');

  const sections: AppSection[] = [
    { id: 'browse', label: 'Browse', icon: Store, render: Browse },
    { id: 'installed', label: 'Installed', icon: Package, render: Installed },
    { id: 'featured', label: 'Featured', icon: Sparkles, render: Featured },
  ];

  return <AppFrame title="Marketplace" subtitle="Integrations" icon={Store} accent={ACCENT} sections={sections} />;
}
