import { useEffect, useState } from 'react';
import { Store, Sparkles, Package, Check, X } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { MarketplaceDetailPage, type MarketplaceDetailItem } from './MarketplaceDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { MarketplaceItemDetail } from './MarketplaceItemDetail';

registerItemDetail('marketplace', MarketplaceItemDetail);

const ACCENT = '#db2777';

export function MarketplaceApp() {
  const items = useCmsStore(s => s.items['marketplace_listings']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const [detail, setDetail] = useState<MarketplaceDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);
  const addToast = useShellStore(s => s.addToast);
  const drill = useCollectionDrill('marketplace_listings', ['Browse', 'Installed', 'Featured']);

  const install = (id: string) => {
    const current = items.find(l => l.id === id);
    if (current && current.installed !== 'Yes') {
      addToast({ source: 'Marketplace', type: 'success', message: `Installed ${current.name}.` });
    }
    updateItem('marketplace_listings', id, { installed: 'Yes' });
  };

  /* Uninstall — symmetric to install. The audit notes the install path
   * is canonical; we close the round-trip here so a coach can reverse
   * a mistaken install without leaving the marketplace. The same
   * `updateItem` write path is used, with a guard against the no-op
   * `already uninstalled` toast that `install` already guards against. */
  const uninstall = (id: string) => {
    const current = items.find(l => l.id === id);
    if (current && current.installed === 'Yes') {
      addToast({ source: 'Marketplace', type: 'success', message: `Uninstalled ${current.name}.` });
    }
    updateItem('marketplace_listings', id, { installed: 'No' });
  };

  const openListing = (id: string): void => {
    const item = items.find(c => c.id === id);
    if (!item) { drill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.name ?? 'Untitled'),
      subtitle: String(item.blurb ?? ''),
      status: String(item.installed === 'Yes' ? 'installed' : 'available'),
      install: {
        installed: item.installed === 'Yes',
        version: String(item.version ?? '1.0.0'),
        size: String(item.size ?? '—'),
      },
      stats: [
        { label: 'Tag', value: String(item.tag ?? '—') },
        { label: 'Version', value: String(item.version ?? '1.0.0') },
        { label: 'Featured', value: item.featured ? 'Yes' : 'No' },
      ],
      fields: [],
    });
    drill.open(id);
  };

  const grid = (filter: (l: typeof items[number]) => boolean, title: string) => {
    const list = items.filter(filter);
    return (
      <div className="p-7">
        <SectionHead title={title} subtitle="Extend your Citadelle — every integration is sandboxed" />
        <div className="grid grid-cols-2 gap-3">
          {list.map(l => (
            <div key={String(l.id)} className="rounded-xl border shadow-sm p-4 flex flex-col" style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--theme-text) 5%, transparent)', color: 'var(--theme-text)' }}><Package className="w-4.5 h-4.5" /></span>
                {l.featured ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}><Sparkles className="w-3 h-3" /> Featured</span> : null}
              </div>
              <button style={{color: 'var(--theme-text)'}} onClick={() => openListing(String(l.id))} className="text-sm font-semibold  text-left hover:text-[var(--theme-accent)] transition-colors">{String(l.name)}</button>
              <div style={{color: 'var(--theme-text-muted)'}} className="text-xs  mt-0.5 flex-1">{String(l.blurb)}</div>
              <div className="flex items-center justify-between mt-3">
                <span style={{color: 'var(--theme-text-dim)'}} className="text-[11px] font-semibold  uppercase tracking-wide">{String(l.tag)}</span>
                {l.installed === 'Yes' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#15803d' }}><Check className="w-3.5 h-3.5" /> Installed</span>
                    <button
                      onClick={() => uninstall(String(l.id))}
                      data-uninstall={String(l.id)}
                      className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-md transition-colors"
                      style={{ color: 'var(--theme-text-muted)' }}
                      title="Désinstaller cette intégration"
                    >
                      <X className="w-3 h-3" /> Uninstall
                    </button>
                  </div>
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

  const Browse = () => grid(() => true, 'Marketplace');
  const Installed = () => grid(l => l.installed === 'Yes', 'Installed');
  const Featured = () => grid(l => !!l.featured, 'Featured');

  const sections: AppSection[] = [
    { id: 'browse', label: 'Browse', icon: Store, render: Browse },
    { id: 'installed', label: 'Installed', icon: Package, render: Installed },
    { id: 'featured', label: 'Featured', icon: Sparkles, render: Featured },
  ];

  return (
    <>
      <AppFrame title="Marketplace" subtitle="Integrations" icon={Store} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="marketplace"
          accent="#db2777"
          onBack={() => setDetail(null)}
          motion={{ kind: 'fade-blur', durationMs: 240 }}
        >
          <MarketplaceDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
