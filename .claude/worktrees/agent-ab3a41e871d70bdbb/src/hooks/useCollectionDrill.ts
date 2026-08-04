/** useCollectionDrill — list<->detail state for one CMS collection inside one
 *  AppFrame section. Wires the 3rd breadcrumb segment automatically, and resets
 *  back to the list whenever the owning section is no longer the visible one
 *  (switching sidebar tabs always returns to a clean list view — no stale detail). */
import { useEffect, useState, useCallback } from 'react';
import { useWindowPage } from '../contexts/WindowContext';
import { useCmsStore } from '../lib/cms/cms.store';
import { useVoiceIntentStore } from '../lib/voiceIntent';

export function useCollectionDrill(collectionId: string, sectionLabels: string | string[]) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { windowId, activePage, setDetail } = useWindowPage();
  const def = useCmsStore(s => s.collections[collectionId]);
  const items = useCmsStore(s => s.items[collectionId]) ?? [];

  const close = useCallback(() => setOpenId(null), []);
  const labels = Array.isArray(sectionLabels) ? sectionLabels : [sectionLabels];
  const isSectionActive = labels.includes(activePage);

  const itemIntent = useVoiceIntentStore(s => s.byWindow[windowId]?.itemId);
  const consumeItemIntent = useVoiceIntentStore(s => s.consumeItem);
  useEffect(() => {
    if (isSectionActive && itemIntent) {
      setOpenId(itemIntent);
      consumeItemIntent(windowId);
    }
  }, [isSectionActive, itemIntent, windowId, consumeItemIntent]);

  useEffect(() => {
    if (!isSectionActive) {
      if (openId) setOpenId(null);
      return;
    }
    if (!openId) {
      setDetail(null);
      return;
    }
    const item = items.find(i => i.id === openId);
    if (item && def) {
      setDetail({ label: String(item[def.titleField]), onBack: close });
    }
    return () => setDetail(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSectionActive, openId, items, def]);

  return { openId, open: setOpenId, close };
}
