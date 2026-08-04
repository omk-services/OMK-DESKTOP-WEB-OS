/** ChangelogTabs — two-tab panel inside the TopBar Changelog menu.
 *
 * Tab "Dev milestones": append-only release log (CHANGELOG).
 * Tab "Roadmap": known follow-ups scoped to a target version (ROADMAP).
 *
 * State is local to the panel so opening the menu always lands on the
 * milestones tab. Each item is rendered with theme CSS vars only.
 */
import { useState } from 'react';
import type { JSX } from 'react';
import { ListChecks, History, Compass } from 'lucide-react';
import { CHANGELOG, ROADMAP, type RoadmapItem } from '../data/changelog';

type TabId = 'milestones' | 'roadmap';

const STATUS_COLOR: Record<RoadmapItem['status'], string> = {
  open: '#0891b2',
  in_progress: '#16a34a',
  blocked: '#dc2626',
  deferred: '#78716c',
};

const STATUS_LABEL: Record<RoadmapItem['status'], string> = {
  open: 'OPEN',
  in_progress: 'IN PROGRESS',
  blocked: 'BLOCKED',
  deferred: 'DEFERRED',
};

export function ChangelogTabs(): JSX.Element {
  const [tab, setTab] = useState<TabId>('milestones');

  return (
    <div>
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Changelog sections"
        className="flex items-center gap-1 px-2 pt-2"
      >
        <TabButton
          id="milestones"
          active={tab === 'milestones'}
          onClick={() => setTab('milestones')}
          icon={<History className="w-3 h-3" />}
          label="Dev milestones"
          count={CHANGELOG.length}
        />
        <TabButton
          id="roadmap"
          active={tab === 'roadmap'}
          onClick={() => setTab('roadmap')}
          icon={<Compass className="w-3 h-3" />}
          label="Roadmap"
          count={ROADMAP.length}
        />
      </div>

      <div className="max-h-[440px] overflow-y-auto pr-1 mt-1">
        {tab === 'milestones' ? <MilestonesList /> : <RoadmapList />}
      </div>
    </div>
  );
}

function TabButton({
  id,
  active,
  onClick,
  icon,
  label,
  count,
}: {
  id: TabId;
  active: boolean;
  onClick: () => void;
  icon: JSX.Element;
  label: string;
  count: number;
}): JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      id={`changelog-tab-${id}`}
      aria-selected={active}
      aria-controls={`changelog-panel-${id}`}
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-colors"
      style={{
        background: active ? 'var(--theme-accent)' : 'transparent',
        color: active ? '#ffffff' : 'var(--theme-text-muted)',
      }}
    >
      {icon}
      <span>{label}</span>
      <span
        className="text-[9.5px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
        style={{
          background: active ? 'rgba(255,255,255,0.25)' : 'var(--theme-surface-hover)',
          color: active ? '#ffffff' : 'var(--theme-text-muted)',
        }}
      >
        {count}
      </span>
    </button>
  );
}

function MilestonesList(): JSX.Element {
  return (
    <div
      role="tabpanel"
      id="changelog-panel-milestones"
      aria-labelledby="changelog-tab-milestones"
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Dev milestones · newest first
      </div>
      {CHANGELOG.map(m => (
        <div
          key={m.version}
          className="px-2 py-2 rounded-lg hover:bg-[var(--theme-surface-hover)]"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-bold" style={{ color: 'var(--theme-text)' }}>
              {m.title}
            </span>
            <span
              className="text-[10px] font-mono shrink-0"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {m.version} · {m.date}
            </span>
          </div>
          <ul className="mt-1 space-y-0.5">
            {m.highlights.map((h, i) => (
              <li
                key={i}
                className="text-[10.5px] flex gap-1.5"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <span style={{ color: 'var(--theme-accent)' }}>•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RoadmapList(): JSX.Element {
  if (ROADMAP.length === 0) {
    return (
      <div
        role="tabpanel"
        id="changelog-panel-roadmap"
        aria-labelledby="changelog-tab-roadmap"
        className="px-3 py-6 text-center text-[11px]"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        No roadmap items yet. Append-only.
      </div>
    );
  }
  return (
    <div
      role="tabpanel"
      id="changelog-panel-roadmap"
      aria-labelledby="changelog-tab-roadmap"
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Roadmap · scoped follow-ups
      </div>
      {ROADMAP.map((r, idx) => (
        <div
          key={`${r.target}-${idx}`}
          className="mx-2 my-2 rounded-xl p-3"
          style={{
            background: 'var(--theme-surface-hover)',
            border: '1px solid var(--panel-border-subtle)',
          }}
        >
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span
              className="text-[10.5px] font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--theme-accent)' }}
            >
              {r.target}
            </span>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                background: `${STATUS_COLOR[r.status]}1f`,
                color: STATUS_COLOR[r.status],
              }}
            >
              {STATUS_LABEL[r.status]} · B{r.owner === 'B1' ? '1' : r.owner === 'B2' ? '2' : '3'}
            </span>
          </div>
          <div
            className="text-[12px] font-bold mb-1"
            style={{ color: 'var(--theme-text)' }}
          >
            {r.title}
          </div>
          <p
            className="text-[10.5px] leading-relaxed mb-2"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {r.context}
          </p>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Acceptance
          </div>
          <ul className="space-y-0.5">
            {r.acceptance.map((a, i) => (
              <li
                key={i}
                className="text-[10.5px] flex gap-1.5"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <ListChecks className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--theme-accent)' }} />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
