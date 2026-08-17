// src/components/workspace/PrViewer.tsx
// Vue d'une PR — titre, reviewers, diff inline, actions.
//
// Reçoit en props tout ce qu'il affiche ; ne fait AUCUNE logique métier.
// Les actions (approve / reject / merge) délèguent aux callbacks.

import { GitMerge, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import type { Diff, Pr, PrReview } from '../../lib/workspace/types';

export interface PrViewerProps {
  pr: Pr;
  diff: Diff;
  reviews: ReadonlyArray<PrReview>;
  canApprove: boolean;
  canReject: boolean;
  canMerge: boolean;
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
  onMerge: () => void;
  onComment: (comment: string) => void;
}

export function PrViewer(props: PrViewerProps): React.ReactNode {
  const {
    pr,
    diff,
    reviews,
    canApprove,
    canReject,
    canMerge,
    onApprove,
    onReject,
    onMerge,
    onComment,
  } = props;

  const approves = reviews.filter((r) => r.verdict === 'approve');
  const rejects = reviews.filter((r) => r.verdict === 'reject');

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg"
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--panel-border)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--theme-accent-soft)',
                color: 'var(--theme-text)',
              }}
            >
              {pr.status}
            </span>
            <span className="text-xs font-mono opacity-70">
              #{pr.id.slice(-6)}
            </span>
          </div>
          <div className="text-base font-semibold">{pr.title}</div>
          {pr.description && (
            <div className="text-xs opacity-80">{pr.description}</div>
          )}
        </div>
      </div>

      {/* Reviewers */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider"
             style={{ color: 'var(--theme-text-muted)' }}>
          Reviews ({approves.length} approve · {rejects.length} reject)
        </div>
        {reviews.length === 0 ? (
          <div className="text-[11px] italic" style={{ color: 'var(--theme-text-dim)' }}>
            Aucun verdict pour l'instant.
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-2 px-2 py-1 rounded text-[11px]"
                style={{
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                }}
              >
                {r.verdict === 'approve' && <ThumbsUp className="w-3 h-3 text-emerald-500" />}
                {r.verdict === 'reject' && <ThumbsDown className="w-3 h-3 text-red-500" />}
                {r.verdict === 'comment' && <MessageSquare className="w-3 h-3 opacity-60" />}
                <span className="font-mono">{r.reviewerId.slice(0, 8)}</span>
                {r.comment && (
                  <span className="opacity-70 truncate">— {r.comment}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Diff inline */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider"
             style={{ color: 'var(--theme-text-muted)' }}>
          Diff
        </div>
        <DiffSection title="Collections ajoutées" entries={diff.collectionsAdded.map((c) => c.name)} />
        {diff.collectionsRemoved.length > 0 && (
          <DiffSection
            title="Collections supprimées"
            entries={diff.collectionsRemoved}
            tone="danger"
          />
        )}
        <DiffSection title="Items ajoutés" entries={diff.itemsAdded.map((i) => `${i.collectionId}:${i.id}`)} />
        {diff.itemsModified.length > 0 && (
          <DiffSection
            title="Items modifiés"
            entries={diff.itemsModified.map((m) => `${m.after.collectionId}:${m.after.id}`)}
            tone="warn"
          />
        )}
        {diff.itemsRemoved.length > 0 && (
          <DiffSection title="Items supprimés" entries={diff.itemsRemoved} tone="danger" />
        )}
        <DiffSection title="Membres ajoutés" entries={diff.membersAdded.map((m) => m.userId)} />
        {diff.membersRevoked.length > 0 && (
          <DiffSection title="Membres révoqués" entries={diff.membersRevoked} tone="danger" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        {canApprove && (
          <button
            type="button"
            onClick={() => onApprove()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
            style={{ background: 'var(--theme-accent)', color: '#fff' }}
          >
            <ThumbsUp className="w-3 h-3" />
            Approve
          </button>
        )}
        {canReject && (
          <button
            type="button"
            onClick={() => onReject()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
            style={{
              background: 'var(--theme-surface-hover)',
              color: 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
            }}
          >
            <ThumbsDown className="w-3 h-3" />
            Reject
          </button>
        )}
        <button
          type="button"
          onClick={() => onComment('Looking into it.')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
          style={{
            background: 'var(--theme-surface-hover)',
            color: 'var(--theme-text)',
            border: '1px solid var(--panel-border)',
          }}
        >
          <MessageSquare className="w-3 h-3" />
          Commenter
        </button>
        {canMerge && (
          <button
            type="button"
            onClick={onMerge}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
            style={{ background: '#16a34a', color: '#fff' }}
          >
            <GitMerge className="w-3 h-3" />
            Merge
          </button>
        )}
      </div>
    </div>
  );
}

function DiffSection(props: {
  title: string;
  entries: ReadonlyArray<string>;
  tone?: 'default' | 'warn' | 'danger';
}): React.ReactNode {
  const { title, entries, tone = 'default' } = props;
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-semibold opacity-80">{title}</div>
      <ul
        className="flex flex-col gap-0.5 px-2 py-1 rounded text-[10.5px] font-mono"
        style={{
          background:
            tone === 'danger' ? 'rgba(239,68,68,0.08)' :
            tone === 'warn' ? 'rgba(234,179,8,0.08)' : 'var(--theme-bg)',
          color:
            tone === 'danger' ? '#b91c1c' :
            tone === 'warn' ? '#a16207' : 'var(--theme-text)',
        }}
      >
        {entries.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}