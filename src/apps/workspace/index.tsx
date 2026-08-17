// src/apps/workspace/index.tsx
// App « WorkSpaces » — point d'entrée pour gérer branches, PRs et merges.
//
// Squelette : cette app est le futur point d'entrée du panneau de
// branches / PRs. Pour l'instant elle affiche l'arborescence des
// branches pour le tenant actif. Les actions concrètes (créer, merger,
// reviewer) délèguent aux modules lib/workspace/*.
//
// Le wiring final attend la fin des briefs AUTH_FIX + MEMBERSHIPS +
// AUDIT_LOG pour brancher la session réelle et l'envoi d'emails.

import { useEffect, useMemo, useState } from 'react';
import { GitBranch, GitPullRequest, Plus } from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { BranchTree } from '../../components/workspace/BranchTree';
import { PrViewer } from '../../components/workspace/PrViewer';
import { useBranchesStore } from '../../stores/branches.store';
import { useTenantStore } from '../../stores/tenant.store';
import { createBranch, getMainBranch, listBranches, snapshotBranch } from '../../lib/workspace/branches';
import { peutCreerBranche } from '../../lib/workspace/permissions';
import type { MembershipRole, Pr, WorkspaceData } from '../../lib/workspace/types';

function sampleWorkspace(): WorkspaceData {
  return {
    collections: [
      { id: 'a', name: 'Alpha', singular: 'alpha', accent: '#2563eb', titleField: 'name', subtitleField: '', badgeField: '', fields: [] },
    ],
    items: [],
    memberships: [],
  };
}

export default function WorkspaceApp(): import('react').ReactNode {
  const tenantId = useTenantStore((s) => s.activeTenantId);
  const branches = useBranchesStore((s) => s.branches);
  const prs = useBranchesStore((s) => s.prs);
  const setBranches = useBranchesStore((s) => s.setBranches);
  const addBranch = useBranchesStore((s) => s.addBranch);
  const upsertPr = useBranchesStore((s) => s.upsertPr);

  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [openPrId, setOpenPrId] = useState<string | null>(null);
  // Rôle effectif de l'utilisateur courant — défaut 'owner' en attendant
  // le câblage MEMBERSHIPS.
  const actorRole: MembershipRole = 'owner';
  const actorId = 'local-user';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await getMainBranch(tenantId);
        const all = await listBranches(tenantId);
        if (!cancelled) {
          setBranches(all);
          if (!activeBranchId && all.length > 0) {
            const main = all.find((b) => b.isDefault) ?? all[0];
            setActiveBranchId(main.id);
          }
        }
      } catch {
        // best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, setBranches, activeBranchId]);

  const openPr: Pr | undefined = useMemo(
    () => prs.find((p) => p.id === openPrId),
    [prs, openPrId],
  );

  const handleCreateBranch = async (): Promise<void> => {
    if (!peutCreerBranche(actorRole)) return;
    const name = window.prompt('Nom de la nouvelle branche (kebab-case) :');
    if (!name) return;
    const r = await createBranch({
      tenantId,
      name,
      actorId,
      actorRole,
    });
    if (r.ok) {
      addBranch(r.data);
      // Snapshot initial vide pour pouvoir éditer la branche.
      const snap = await snapshotBranch({
        tenantId,
        branchId: r.data.id,
        message: 'Initial',
        data: sampleWorkspace(),
        authorId: actorId,
      });
      if (snap.ok) {
        addBranch({ ...r.data, headSnapshotId: snap.data.id });
      }
    } else {
      window.alert(`Création refusée : ${r.error}`);
    }
  };

  const sections: AppSection[] = [
    {
      id: 'overview',
      label: 'Aperçu',
      icon: GitBranch,
      render: () => (
        <div className="flex flex-col gap-4 p-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="text-base font-semibold">WorkSpaces versionnés</div>
              <div className="text-[11px] opacity-70">
                Tenant actif : <span className="font-mono">{tenantId}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateBranch}
              disabled={!peutCreerBranche(actorRole)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold disabled:opacity-50"
              style={{ background: 'var(--theme-accent)', color: '#fff' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle branche
            </button>
          </header>
          <BranchTree
            branches={branches}
            prs={prs}
            activeBranchId={activeBranchId}
            onSelectBranch={(id) => {
              setActiveBranchId(id);
              setOpenPrId(null);
            }}
            onSelectPr={setOpenPrId}
          />
        </div>
      ),
    },
    {
      id: 'prs',
      label: 'Pull Requests',
      icon: GitPullRequest,
      render: () => (
        <div className="flex flex-col gap-4 p-4">
          {openPr ? (
            <PrViewer
              pr={openPr}
              diff={{
                collectionsAdded: [],
                collectionsRemoved: [],
                itemsAdded: [],
                itemsModified: [],
                itemsRemoved: [],
                membersAdded: [],
                membersRevoked: [],
              }}
              reviews={[]}
              canApprove
              canReject
              canMerge={openPr.status === 'approved'}
              onApprove={() => upsertPr({ ...openPr })}
              onReject={() => upsertPr({ ...openPr })}
              onMerge={() => upsertPr({ ...openPr })}
              onComment={() => undefined}
            />
          ) : (
            <div className="text-[11px] italic opacity-70">
              Sélectionnez une PR dans l'arborescence.
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppFrame
      title="WorkSpaces"
      icon={GitBranch}
      accent="var(--theme-accent)"
      sections={sections}
    />
  );
}