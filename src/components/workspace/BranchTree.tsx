// src/components/workspace/BranchTree.tsx
// Vue arborescente des branches + PRs ouvertes.
//
// Uniquement cosmétique : aucune logique métier dans ce composant.
// Toutes les actions passent par les fonctions de src/lib/workspace/*.

import { GitBranch, GitPullRequest } from 'lucide-react';
import type { Branch, Pr } from '../../lib/workspace/types';

export interface BranchTreeProps {
  branches: ReadonlyArray<Branch>;
  prs: ReadonlyArray<Pr>;
  activeBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
  onSelectPr: (prId: string) => void;
}

export function BranchTree(props: BranchTreeProps): React.ReactNode {
  const { branches, prs, activeBranchId, onSelectBranch, onSelectPr } = props;

  // Index parent -> enfants pour l'arborescence
  const childrenByParent = new Map<string | null, Branch[]>();
  for (const b of branches) {
    const key = b.parentBranchId;
    const arr = childrenByParent.get(key) ?? [];
    arr.push(b);
    childrenByParent.set(key, arr);
  }
  const roots = childrenByParent.get(null) ?? [];

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg"
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--panel-border)',
      }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
           style={{ color: 'var(--theme-text-muted)' }}>
        <GitBranch className="w-3.5 h-3.5" />
        Arborescence des branches
      </div>

      <ul className="flex flex-col gap-1">
        {roots.map((b) => (
          <BranchNode
            key={b.id}
            branch={b}
            depth={0}
            childrenByParent={childrenByParent}
            activeBranchId={activeBranchId}
            onSelect={onSelectBranch}
          />
        ))}
      </ul>

      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mt-3"
           style={{ color: 'var(--theme-text-muted)' }}>
        <GitPullRequest className="w-3.5 h-3.5" />
        PRs ouvertes ({prs.length})
      </div>
      <ul className="flex flex-col gap-1">
        {prs.length === 0 ? (
          <li className="text-[11px] italic" style={{ color: 'var(--theme-text-dim)' }}>
            Aucune PR ouverte.
          </li>
        ) : (
          prs.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelectPr(p.id)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-left"
                style={{
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--panel-border-subtle)',
                }}
              >
                <GitPullRequest className="w-3 h-3" />
                <span className="font-medium">#{p.id.slice(-6)}</span>
                <span className="truncate">{p.title}</span>
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      p.status === 'open' ? 'var(--theme-accent-soft)' : 'var(--theme-surface-hover)',
                    color: 'var(--theme-text)',
                  }}
                >
                  {p.status}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

interface BranchNodeProps {
  branch: Branch;
  depth: number;
  childrenByParent: Map<string | null, Branch[]>;
  activeBranchId: string | null;
  onSelect: (branchId: string) => void;
}

function BranchNode(props: BranchNodeProps): React.ReactNode {
  const { branch, depth, childrenByParent, activeBranchId, onSelect } = props;
  const children = childrenByParent.get(branch.id) ?? [];
  const isActive = branch.id === activeBranchId;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(branch.id)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] text-left transition-colors"
        style={{
          background: isActive ? 'var(--theme-surface-hover)' : 'transparent',
          color: 'var(--theme-text)',
          paddingLeft: `${0.625 + depth * 0.875}rem`,
          fontWeight: isActive ? 600 : 400,
        }}
      >
        <GitBranch className="w-3 h-3 shrink-0" />
        <span className="truncate">{branch.name}</span>
        {branch.isDefault && (
          <span
            className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--theme-accent-soft)',
              color: 'var(--theme-text)',
            }}
          >
            main
          </span>
        )}
        {branch.headSnapshotId && (
          <span className="text-[10px] font-mono opacity-60">
            {branch.headSnapshotId.slice(-6)}
          </span>
        )}
      </button>
      {children.length > 0 && (
        <ul className="flex flex-col gap-1 mt-1">
          {children.map((c) => (
            <BranchNode
              key={c.id}
              branch={c}
              depth={depth + 1}
              childrenByParent={childrenByParent}
              activeBranchId={activeBranchId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}