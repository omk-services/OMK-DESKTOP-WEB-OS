/** CMSCardList — renders a CMS collection as FleetItemCard grid (NOT a
 *  vertical line-separated list). Use this in every app's items section.
 *  Mirrors the pattern from People/Agents Fleet subpage. */

import React from 'react';
import { useCmsStore } from '../../lib/cms/cms.store';
import { FleetItemCard, FleetItemGrid, type FleetStatusTone } from './FleetItemCard';

export interface CMSCardListProps<T = Record<string, unknown>> {
  collectionId: string;
  /** Map a CMS item to a FleetItemCard render */
  render: (item: T) => {
    title: string;
    subtitle?: string;
    description?: string;
    statusLabel?: string;
    statusTone?: FleetStatusTone;
    accent?: string;
    icon?: React.ReactNode;
    metricLabel?: string;
    metricValue?: string | number;
    meta?: React.ReactNode;
  };
  onOpen?: (id: string) => void;
  cols?: 1 | 2 | 3;
  emptyMessage?: string;
}

export function CMSCardList<T extends { id: unknown }>({
  collectionId, render, onOpen, cols = 2, emptyMessage = 'No items yet.',
}: CMSCardListProps<T>) {
  const items = (useCmsStore(s => s.items[collectionId] ?? []) as unknown as T[]);
  if (items.length === 0) {
    return <div className="text-center text-[12px] text-stone-400 py-8">{emptyMessage}</div>;
  }
  return (
    <FleetItemGrid cols={cols}>
      {items.map(item => {
        const r = render(item);
        return (
          <FleetItemCard
            key={String(item.id)}
            title={r.title}
            subtitle={r.subtitle}
            description={r.description}
            statusLabel={r.statusLabel}
            statusTone={r.statusTone}
            accent={r.accent}
            icon={r.icon}
            metricLabel={r.metricLabel}
            metricValue={r.metricValue}
            meta={r.meta}
            onClick={onOpen ? () => onOpen(String(item.id)) : undefined}
          />
        );
      })}
    </FleetItemGrid>
  );
}
