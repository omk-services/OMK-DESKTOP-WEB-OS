/**
 * SalesApp — section Context : le dossier de documents vivants (offre,
 * acheteur, motion, objections, voix). Extrait de SalesApp.tsx.
 */
import { BookOpen, ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsItem } from '../../../lib/cms/types';
import type { DetailItem } from '../SalesDetailPage';
import {
  Eyebrow, FONT_BODY, FONT_DISPLAY, FONT_MONO, PageHeader, type ContextGroup,
} from './Primitives';

const CONTEXT: ContextGroup[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void CONTEXT;

function docDetail(group: { id: string; title: string; subtitle: string }, body: string): DetailItem {
  return {
    id: group.id, kind: 'doc', title: group.title, subtitle: group.subtitle, status: 'canonical', summary: body,
    fields: [
      { label: 'Use first', value: 'Read before any sale-related skill invocation' },
      { label: 'Refresh rule', value: 'Re-read after every routine that touches the offer or the buyer' },
    ],
  };
}

export function ContextPanel({ onSelect, navigateToSection }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void }) {
  // Read the formerly in-memory CONTEXT from the CMS store.
  const contextItems = useCmsStore(s => s.items['sales_context']) ?? [];
  // Chaque group porte 2 items (item1Title / item2Title). On derive le count
  // pour ne pas mentir sur le nombre de documents affichés plus bas.
  const livingDocs = contextItems.reduce((sum, g) => sum + (g.item1Title ? 1 : 0) + (g.item2Title ? 1 : 0), 0);
  void onSelect;
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Context"
        title="Sales OS"
        subtitle="Everything the OS knows about what we sell and to whom, kept as one folder of living documents."
        meta={{ label: 'Source', value: 'The single-source brief', sub: `${livingDocs} living document${livingDocs === 1 ? '' : 's'} · source of truth` }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Context' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Context' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      <section className="mt-8 max-w-[760px]">
        <div className="mb-4 flex items-baseline gap-3">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
            style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
          >01</span>
          <h2
            className="text-[20px] font-extrabold tracking-tight"
            style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
          >
            Context
          </h2>
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Everything the OS knows about <span className="font-bold" style={{ color: 'var(--theme-text)' }}>what we sell</span> and <span className="font-bold" style={{ color: 'var(--theme-text)' }}>to whom</span>, kept as one folder of living documents. Open any file for the full detail. Read these once and you know the offer, the buyer, the motion, the objections, the voice, and the literals a client install edits.
        </p>
      </section>

      <div className="mt-8 space-y-8">
        {contextItems.map((group) => {
          const docs = [
            { id: `${group.id}-1`, title: txt(group, 'item1Title') || '—', subtitle: txt(group, 'item1Sub') || '' },
            { id: `${group.id}-2`, title: txt(group, 'item2Title') || '—', subtitle: txt(group, 'item2Sub') || '' },
          ];
          return (
          <section key={group.id}>
            <Eyebrow>{txt(group, 'eyebrow') || '—'}</Eyebrow>
            <ul className="mt-3 space-y-3">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(docDetail({ id: doc.id, title: doc.title, subtitle: doc.subtitle }, doc.subtitle))}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-md"
                        style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span>
                        <span
                          className="block text-[15px] font-extrabold tracking-tight"
                          style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                        >
                          {doc.title}
                        </span>
                        <span className="block text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                          {doc.subtitle}
                        </span>
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: 'var(--theme-text-dim)' }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          );
        })}
      </div>
    </div>
  );
}
