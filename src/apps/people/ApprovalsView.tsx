/**
 * ApprovalsView.tsx — la file d'approbation des scénarios.
 *
 * Pourquoi une section dédiée et pas une sous-section d'Agents : la page
 * People > Agents montre la configuration des 12 squads (rôles, charge,
 * latence). La file d'approbation est le geste « oui ou non sur la file »
 * que Mark décrit : « You approve in 10 min · Yes or no on the queue. Ship
 * or kill. Move on. » Le geste est distinct, il mérite sa propre section.
 * Le résumé « X scénarios en attente » reste visible en haut de la file
 * pour ceux qui ne visitent que People > Overview.
 *
 * Cette file reflète la démo Palantir : un scénario ouvert, des propositions
 * visibles, l'approbateur qui édite avant de fusionner, et le bouton
 * « Approve & Merge » qui déclenche la fusion atomique.
 *
 * Si une étape de la fusion échoue, RIEN n'est appliqué — l'UI le rend
 * explicite, sans escamoter l'échec (cf. capture preuve 6 du brief).
 */
import { useState } from 'react';
import {
  ListChecks, CheckCircle2, X, AlertTriangle, Trash2, RotateCcw,
  Sparkles, ShieldCheck, Eye, ChevronRight, GitMerge, Bot, Plus,
} from 'lucide-react';
import { SectionHead } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { useScenariosStore, type Scenario, type Proposal } from '../../stores/scenarios.store';
import { applicateurs } from '../../agent/tools';
import { useThemeStore } from '../../lib/themes/store';
import { THEME_META } from '../../lib/themes/tokens';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { useCmsCollectionStatus } from './useCmsCollectionStatus';
import { UnknownCollectionBanner } from './UnknownCollectionBanner';
import { FLEET_AGENTS } from './fleet';
import {
  linkScenarioToAgent,
  unlinkScenario,
  getAgentCodeForScenario,
} from './scenarioAgents';

function shortDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Combined agent options for the "Nouveau scénario" form.
 *  Fleet (B3 operational agents) + People agents (RH/méta) — both can
 *  deposit proposals into a scenario. Order is stable for the dropdown. */
function useAgentOptions(): { code: string; name: string; source: 'fleet' | 'people' }[] {
  // Brief FIX-7 — silence bruyant. Si la collection people_agents n'est
  // pas dans le registre, le dropdown tombe à [fleet] sans rien dire.
  // On lit le discriminant via le hook ; le bandeau global est rendu
  // au-dessus de la file d'approbation, pas dans la liste.
  const peopleAgentsRead = useCmsCollectionStatus('people_agents');
  const peopleAgents = peopleAgentsRead.items;
  const fleet = FLEET_AGENTS.map((a) => ({ code: a.code, name: a.name, source: 'fleet' as const }));
  const people = peopleAgents.map((it) => ({
    code: String(it.codename ?? it.id),
    name: String(it.name ?? it.id),
    source: 'people' as const,
  }));
  return [...fleet, ...people];
}

const STATUS_TONE: Record<Scenario['status'], 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  draft:     'neutral',
  pending:   'accent',
  approved:  'ok',
  rejected:  'danger',
  merged:    'ok',
};

const STATUS_LABEL: Record<Scenario['status'], string> = {
  draft:     'Brouillon',
  pending:   'En attente',
  approved:  'Approuvé',
  rejected:  'Rejeté',
  merged:    'Fusionné',
};

function ProposalsList({
  scenario,
  onEdit,
  onRemove,
  readonly,
}: {
  scenario: Scenario;
  onEdit?: (proposalId: string) => void;
  onRemove?: (proposalId: string) => void;
  readonly: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {scenario.proposals.length === 0 && (
        <li className="text-[12px] text-[var(--theme-text-muted)] italic">Aucune proposition.</li>
      )}
      {scenario.proposals.map((p) => (
        <ProposalRow key={p.id} proposal={p} scenario={scenario} onEdit={onEdit} onRemove={onRemove} readonly={readonly} />
      ))}
    </ul>
  );
}

function ProposalRow({
  proposal,
  scenario,
  onEdit,
  onRemove,
  readonly,
}: {
  proposal: Proposal;
  scenario: Scenario;
  onEdit?: (proposalId: string) => void;
  onRemove?: (proposalId: string) => void;
  readonly: boolean;
}) {
  const tone =
    proposal.status === 'applied' ? 'ok'
    : proposal.status === 'failed' ? 'danger'
    : proposal.status === 'reverted' ? 'warn'
    : 'neutral';
  const label =
    proposal.status === 'applied' ? 'Appliqué'
    : proposal.status === 'failed' ? 'Échec'
    : proposal.status === 'reverted' ? 'Reverté'
    : 'En attente';

  // Si le scénario a une comparaison avec recommandation, on regarde si la
  // proposition est dans la voie recommandée.
  const inRecommendedPath = (() => {
    if (!scenario.comparison?.recommendation) return true;
    const opt = scenario.comparison.options.find((o) => o.id === scenario.comparison!.recommendation);
    return opt ? opt.proposalIds.includes(proposal.id) : true;
  })();

  return (
    <li
      data-proposal-row
      data-proposal-id={proposal.id}
      data-proposal-status={proposal.status}
      className="flex items-start gap-3 rounded-lg border bg-[var(--panel-solid)] px-3 py-2"
      style={{ borderColor: inRecommendedPath ? 'var(--panel-border)' : 'var(--panel-border-subtle)', opacity: inRecommendedPath ? 1 : 0.6 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-[var(--theme-text)] truncate">{proposal.displayName}</span>
          <Badge tone={tone}>{label}</Badge>
          {!inRecommendedPath && (
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: 'var(--theme-text-muted)', background: 'var(--panel-border-subtle)' }}
              title="Hors voie recommandée — ne sera pas fusionné."
            >
              hors voie
            </span>
          )}
        </div>
        <div className="text-[10.5px] font-mono text-[var(--theme-text-dim)] mt-0.5 truncate">
          {proposal.toolName}({JSON.stringify(proposal.args)})
        </div>
        {proposal.error && (
          <div className="text-[10.5px] text-[#dc2626] mt-0.5">{proposal.error}</div>
        )}
      </div>
      {!readonly && proposal.status === 'pending' && (
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(proposal.id)}
              className="text-[10.5px] font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] px-2 py-1 rounded"
              data-edit-proposal
              title="Éditer la proposition avant fusion"
            >
              Éditer
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(proposal.id)}
              className="px-2 py-1 rounded transition-colors"
              style={{ color: '#dc2626' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.10)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              title="Retirer la proposition"
              data-remove-proposal
              aria-label="Retirer la proposition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function ComparisonCards({ scenario }: { scenario: Scenario }) {
  if (!scenario.comparison || scenario.comparison.options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
        — COMPARAISON · {scenario.comparison.options.length} options
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenario.comparison.options.map((opt) => {
          const recommended = scenario.comparison!.recommendation === opt.id;
          return (
            <div
              key={opt.id}
              data-comparison-option
              data-option-id={opt.id}
              data-recommended={recommended ? 'true' : 'false'}
              className="rounded-xl border bg-[var(--panel-solid)] p-3 flex flex-col gap-2"
              style={{
                borderColor: recommended ? '#059669' : 'var(--panel-border)',
                boxShadow: recommended ? '0 0 0 2px rgba(16,185,129,0.15)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[var(--theme-text)]">{opt.label}</span>
                {recommended && (
                  <Badge tone="ok">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Recommandé
                  </Badge>
                )}
              </div>
              <p className="text-[11.5px] text-[var(--theme-text-muted)] leading-snug">{opt.rationale}</p>
              <ul className="flex flex-col gap-1">
                {opt.metrics.map((m, i) => (
                  <li key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--theme-text-muted)]">{m.label}</span>
                    <span className="font-mono font-semibold text-[var(--theme-text)]">{m.value}</span>
                  </li>
                ))}
              </ul>
              <div className="text-[10px] font-mono text-[var(--theme-text-dim)] pt-1.5 border-t border-[var(--panel-border-subtle)]">
                {opt.proposalIds.length} proposition{opt.proposalIds.length === 1 ? '' : 's'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MergeResultBanner({ scenario }: { scenario: Scenario }) {
  if (!scenario.merge) return null;
  if (scenario.merge.success) {
    return (
      <div
        data-merge-result="success"
        className="rounded-xl border p-3 flex items-start gap-2"
        style={{ borderColor: '#86efac', background: 'rgba(22,163,74,0.10)' }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#15803d' }} />
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: '#166534' }}>Fusion atomique réussie</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#15803d' }}>
            Toutes les propositions ont été appliquées. {shortDate(scenario.merge.at)}.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      data-merge-result="failure"
      className="rounded-xl border p-3 flex items-start gap-2"
      style={{ borderColor: '#fca5a5', background: 'rgba(220,38,38,0.10)' }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b91c1c' }} />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold" style={{ color: '#991b1b' }}>Fusion atomique annulée</div>
        <div className="text-[11px] mt-0.5" style={{ color: '#b91c1c' }}>
          Étape <span className="font-mono">{scenario.merge.failedProposalId}</span> : {scenario.merge.failureReason}.
          Aucune modification n'a été appliquée — toutes les propositions précédentes ont été revertées.
        </div>
      </div>
    </div>
  );
}

function ScenarioDetail({
  scenario,
  onClose,
}: {
  scenario: Scenario;
  onClose: () => void;
}) {
  const editProposal = useScenariosStore((s) => s.editProposal);
  const removeProposal = useScenariosStore((s) => s.removeProposal);
  const submitForApproval = useScenariosStore((s) => s.submitForApproval);
  const rejectScenario = useScenariosStore((s) => s.rejectScenario);
  const approveAndMerge = useScenariosStore((s) => s.approveAndMerge);
  const renameScenario = useScenariosStore((s) => s.renameScenario);

  const [editing, setEditing] = useState<string | null>(null);
  const [editThemeId, setEditThemeId] = useState<string>('');
  const [editAppId, setEditAppId] = useState<string>('');
  const [nameEdit, setNameEdit] = useState<string | null>(null);

  const canEdit = scenario.status === 'draft' || scenario.status === 'pending';
  const canMerge = scenario.status === 'pending' && scenario.proposals.length > 0;
  const agentCode = getAgentCodeForScenario(scenario.id);
  const agentOptions = useAgentOptions();
  const linkedAgent = agentOptions.find((a) => a.code === agentCode);

  const handleEditProposal = (proposalId: string) => {
    const p = scenario.proposals.find((x) => x.id === proposalId);
    if (!p) return;
    setEditing(proposalId);
    setEditThemeId(String(p.args.themeId ?? ''));
    setEditAppId(typeof p.args.appId === 'string' ? p.args.appId : '');
  };

  const handleSaveEdit = (proposalId: string) => {
    const p = scenario.proposals.find((x) => x.id === proposalId);
    if (!p) return;
    const newArgs: Record<string, unknown> = { ...p.args, themeId: editThemeId };
    if (editAppId.trim()) newArgs.appId = editAppId.trim();
    else delete newArgs.appId;
    const displayName = newArgs.appId
      ? `Thème « ${editThemeId} » sur l'app ${newArgs.appId}`
      : `Thème global « ${editThemeId} »`;
    editProposal(scenario.id, proposalId, newArgs, displayName);
    setEditing(null);
  };

  const handleSubmit = () => {
    submitForApproval(scenario.id);
  };

  const handleReject = () => {
    rejectScenario(scenario.id);
    // Mirror the approve path: a rejection is also a decision that must
    // be auditable. Persist it through the CMS, with the same toast on
    // success or failure. Keeping the two paths symmetric means a
    // regression on one will not silently affect the other.
    const addItem = useCmsStore.getState().addItem;
    const addToast = useShellStore.getState().addToast;
    const result = addItem('approval_decisions', {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      verdict: 'rejected',
      decidedBy: 'B1 Gatekeeper',
      proposalCount: scenario.proposals.length,
      rationale: scenario.rationale ?? '—',
      decidedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    if (result.ok) {
      addToast({ source: 'Approvals', type: 'success', message: `Rejet enregistré : ${scenario.name}` });
    } else {
      addToast({ source: 'Approvals', type: 'warning', message: result.error ?? 'Rejet non enregistré.' });
    }
  };

  const handleApproveAndMerge = () => {
    approveAndMerge(scenario.id, applicateurs);
    // Log the decision in the CMS — the audit trail lives next to the
    // scenario, not in the volatile scenarios store. `addItem` is the
    // canonical write path; it returns `{ ok, error }` so a failure to
    // register is surfaced as a toast instead of being silently dropped.
    const addItem = useCmsStore.getState().addItem;
    const addToast = useShellStore.getState().addToast;
    const result = addItem('approval_decisions', {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      verdict: 'approved',
      decidedBy: 'B1 Gatekeeper',
      proposalCount: scenario.proposals.length,
      rationale: scenario.rationale ?? '—',
      decidedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    if (result.ok) {
      addToast({ source: 'Approvals', type: 'success', message: `Décision enregistrée : ${scenario.name}` });
    } else {
      addToast({ source: 'Approvals', type: 'warning', message: result.error ?? 'Décision non enregistrée.' });
    }
  };

  return (
    <div data-scenario-detail data-scenario-id={scenario.id} data-scenario-status={scenario.status} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onClose}
          className="self-start flex items-center gap-1.5 text-[11px] font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
          data-close-detail
        >
          ← File d'approbation
        </button>
        <div className="flex-1 min-w-0" />
        <Badge tone={STATUS_TONE[scenario.status]}>{STATUS_LABEL[scenario.status]}</Badge>
      </div>

      <div className="flex flex-col gap-1">
        {nameEdit !== null ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              className="flex-1 text-[20px] font-bold bg-transparent border-b border-[var(--theme-border)] outline-none"
              style={{ color: 'var(--theme-text)' }}
              data-edit-name
              autoFocus
            />
            <button
              type="button"
              onClick={() => { renameScenario(scenario.id, nameEdit || scenario.name); setNameEdit(null); }}
              className="text-[11px] font-semibold text-[#059669] hover:underline"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setNameEdit(null)}
              className="text-[11px] text-[var(--theme-text-muted)] hover:underline"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1
              className="text-[22px] font-bold text-[var(--theme-text)]"
              style={{ fontFamily: 'var(--theme-font-display)' }}
            >
              {scenario.name}
            </h1>
            {canEdit && (
              <button
                type="button"
                onClick={() => setNameEdit(scenario.name)}
                className="text-[10.5px] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
                title="Renommer"
              >
                ✎
              </button>
            )}
          </div>
        )}
        {scenario.rationale && (
          <p className="text-[12.5px] text-[var(--theme-text-muted)] max-w-2xl">{scenario.rationale}</p>
        )}
        <div className="flex items-center gap-2 text-[10.5px] font-mono text-[var(--theme-text-dim)]">
          {linkedAgent && (
            <>
              <span
                data-scenario-detail-agent
                className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(13,148,136,0.12)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.3)' }}
                title={`Scénario rattaché à l'agent ${linkedAgent.code} · ${linkedAgent.name}`}
              >
                <Bot className="w-2.5 h-2.5" />
                {linkedAgent.code} · {linkedAgent.name}
              </span>
              <span>·</span>
            </>
          )}
          <span>créé par {scenario.createdBy}</span>
          <span>·</span>
          <span>{shortDate(scenario.createdAt)}</span>
          {scenario.proposals.length > 0 && (
            <>
              <span>·</span>
              <span>{scenario.proposals.length} proposition{scenario.proposals.length === 1 ? '' : 's'}</span>
            </>
          )}
        </div>
      </div>

      <MergeResultBanner scenario={scenario} />

      <ComparisonCards scenario={scenario} />

      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
          — PROPOSITIONS · {scenario.proposals.length}
        </div>
        <ProposalsList
          scenario={scenario}
          readonly={!canEdit}
          onEdit={handleEditProposal}
          onRemove={(id) => removeProposal(scenario.id, id)}
        />
      </div>

      {/* Inline edit panel */}
      {editing && (() => {
        const p = scenario.proposals.find((x) => x.id === editing);
        if (!p) return null;
        return (
          <div data-edit-panel className="rounded-xl border-2 border-[var(--theme-accent)] bg-[var(--theme-surface-hover)] p-3 flex flex-col gap-2">
            <div className="text-[11px] font-bold text-[var(--theme-text)]">Éditer la proposition</div>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-[var(--theme-text-dim)]">Thème</span>
              <select
                value={editThemeId}
                onChange={(e) => setEditThemeId(e.target.value)}
                className="text-[12px] rounded-lg border border-[var(--panel-border)] bg-[var(--panel-solid)] px-2 py-1.5"
                data-edit-theme
              >
                {THEME_META.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-[var(--theme-text-dim)]">App (vide = global)</span>
              <input
                type="text"
                value={editAppId}
                onChange={(e) => setEditAppId(e.target.value)}
                placeholder="global"
                className="text-[12px] rounded-lg border border-[var(--panel-border)] bg-[var(--panel-solid)] px-2 py-1.5"
                data-edit-app
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveEdit(editing)}
                className="text-[11px] font-bold text-[color:#fff] px-3 py-1.5 rounded-lg"
                style={{ background: '#059669' }}
                data-save-edit
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-[11px] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
              >
                Annuler
              </button>
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-2 pt-3 border-t border-[var(--panel-border-subtle)]">
          {scenario.status === 'draft' && (
            <button
              type="button"
              onClick={handleSubmit}
              className="text-[12px] font-bold text-[color:#fff] px-3.5 py-2 rounded-xl"
              style={{ background: '#0891b2' }}
              data-submit-for-approval
              disabled={scenario.proposals.length === 0}
              title="Soumettre le scénario à l'approbation"
            >
              <ShieldCheck className="w-3.5 h-3.5 inline-block mr-1.5" />
              Submit for Approval
            </button>
          )}
          {scenario.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleApproveAndMerge}
                className="text-[12px] font-bold text-[color:#fff] px-3.5 py-2 rounded-xl"
                style={{ background: '#059669', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                data-approve-merge
                disabled={!canMerge}
                title="Fusionner atomiquement toutes les propositions retenues"
              >
                <GitMerge className="w-3.5 h-3.5 inline-block mr-1.5" />
                Approve &amp; Merge
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="text-[12px] font-bold px-3.5 py-2 rounded-xl transition-colors"
                style={{ color: '#dc2626' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.10)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                data-reject-scenario
                title="Rejeter ce scénario — aucune modification ne sera appliquée"
              >
                <X className="w-3.5 h-3.5 inline-block mr-1.5" />
                Rejeter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ScenarioRow({
  scenario,
  onOpen,
}: {
  scenario: Scenario;
  onOpen: () => void;
}) {
  const deleteScenario = useScenariosStore((s) => s.deleteScenario);
  const currentScenarioId = useScenariosStore((s) => s.currentScenarioId);
  const proposals = scenario.proposals.length;
  const recommendations = scenario.comparison?.options.length ?? 0;
  const lastUpdate = shortDate(scenario.updatedAt);
  const agentCode = getAgentCodeForScenario(scenario.id);

  const handleDelete = () => {
    deleteScenario(scenario.id);
    unlinkScenario(scenario.id);
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      data-scenario-row
      data-scenario-id={scenario.id}
      data-scenario-status={scenario.status}
      className="w-full text-left rounded-xl border bg-[var(--panel-solid)] hover:shadow-md transition-all px-4 py-3 flex items-start gap-3"
      style={{ borderColor: 'var(--panel-border)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[var(--theme-text)] truncate">{scenario.name}</span>
          <Badge tone={STATUS_TONE[scenario.status]}>{STATUS_LABEL[scenario.status]}</Badge>
          {currentScenarioId === scenario.id && (
            <Badge tone="accent">courant</Badge>
          )}
          {agentCode && (
            <span
              data-scenario-agent
              className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'rgba(13,148,136,0.12)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.3)' }}
              title={`Scénario rattaché à l'agent ${agentCode}`}
            >
              <Bot className="w-2.5 h-2.5" />
              {agentCode}
            </span>
          )}
        </div>
        {scenario.rationale && (
          <p className="text-[11.5px] text-[var(--theme-text-muted)] mt-1 line-clamp-1">{scenario.rationale}</p>
        )}
        <div className="flex items-center gap-3 text-[10.5px] font-mono text-[var(--theme-text-dim)] mt-1.5">
          <span>{proposals} proposition{proposals === 1 ? '' : 's'}</span>
          {recommendations > 0 && (
            <>
              <span>·</span>
              <span>{recommendations} options</span>
            </>
          )}
          <span>·</span>
          <span>mis à jour {lastUpdate}</span>
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className="shrink-0 text-[10.5px] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] cursor-pointer"
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleDelete(); } }}
        data-delete-scenario
        title="Supprimer ce scénario"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--theme-text-dim)] shrink-0 self-center" />
    </button>
  );
}

/** Petits boutons pour les actions au niveau file (définir courant, etc.) */
function ScenarioQueue({ onOpen }: { onOpen: (id: string) => void }) {
  const order = useScenariosStore((s) => s.scenarioOrder);
  const scenarios = useScenariosStore((s) => s.scenarios);
  const createScenario = useScenariosStore((s) => s.createScenario);
  const currentScenarioId = useScenariosStore((s) => s.currentScenarioId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAgent, setNewAgent] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const agentOptions = useAgentOptions();

  // Tri : pending d'abord, puis draft, puis le reste (récent d'abord à l'intérieur).
  const tier = (s: Scenario): number => {
    if (s.status === 'pending') return 0;
    if (s.status === 'draft') return 1;
    return 2;
  };
  const sorted = [...order].sort((a, b) => {
    const sa = scenarios[a]; const sb = scenarios[b];
    if (!sa || !sb) return 0;
    const t = tier(sa) - tier(sb);
    if (t !== 0) return t;
    return sb.updatedAt - sa.updatedAt;
  });

  const resetForm = () => {
    setCreating(false);
    setNewName('');
    setNewAgent('');
    setNameError(null);
  };

  const handleCreate = () => {
    setCreating(true);
    setNameError(null);
    setNewAgent(agentOptions[0]?.code ?? '');
  };

  const handleSubmit = () => {
    const title = newName.trim();
    if (!title) {
      setNameError("L'intitulé est obligatoire.");
      return;
    }
    if (!newAgent) {
      setNameError("L'agent concerné est obligatoire.");
      return;
    }
    // Avoid duplicates by case-insensitive title.
    const exists = order.some((id) => {
      const sc = scenarios[id];
      return sc && sc.name.trim().toLowerCase() === title.toLowerCase();
    });
    if (exists) {
      setNameError(`Un scénario "${title}" existe déjà.`);
      return;
    }
    const sc = createScenario({ name: title, createdBy: 'human' });
    linkScenarioToAgent(sc.id, newAgent);
    resetForm();
    onOpen(sc.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
          — SCENARIO REQUESTS · {order.length} au total
        </div>
        <div className="flex items-center gap-2">
          {currentScenarioId && (
            <button
              type="button"
              onClick={() => useScenariosStore.getState().setCurrentScenario(null)}
              className="text-[10.5px] font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
              data-clear-current
              title="Désactiver le scénario courant — les futures propositions en créeront un nouveau"
            >
              <RotateCcw className="w-3 h-3 inline-block mr-1" />
              Désactiver le scénario courant
            </button>
          )}
          {!creating && (
            <button
              type="button"
              onClick={handleCreate}
              className="text-[11px] font-bold text-[color:#fff] px-3 py-1.5 rounded-lg"
              style={{ background: '#059669' }}
              data-create-scenario
            >
              <Plus className="w-3 h-3 inline-block mr-1" />
              Nouveau scénario
            </button>
          )}
        </div>
      </div>

      {creating && (
        <div
          data-new-scenario-form
          className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-solid)] p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-bold text-[var(--theme-text)]">Nouveau scénario</div>
            <button
              type="button"
              onClick={resetForm}
              className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
              aria-label="Annuler"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-muted)]">
              Intitulé *
            </span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Rollback voice-clone v3 → v2"
              className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
              style={{
                background: 'var(--theme-bg)',
                color: 'var(--theme-text)',
                border: '1px solid var(--panel-border)',
              }}
              data-new-scenario-name
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-muted)]">
              Agent concerné *
            </span>
            <select
              value={newAgent}
              onChange={(e) => setNewAgent(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
              style={{
                background: 'var(--theme-bg)',
                color: 'var(--theme-text)',
                border: '1px solid var(--panel-border)',
              }}
              data-new-scenario-agent
            >
              {agentOptions.map((a) => (
                <option key={`${a.source}:${a.code}`} value={a.code}>
                  {a.code} · {a.name}{a.source === 'people' ? ' · People' : ''}
                </option>
              ))}
            </select>
          </label>

          {nameError && (
            <div
              role="alert"
              className="text-[11px] rounded-lg px-3 py-2"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            >
              {nameError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] px-3 h-7 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="text-[11px] font-bold text-[color:#fff] h-7 px-3 rounded-lg"
              style={{ background: '#059669' }}
              data-new-scenario-submit
            >
              Créer le scénario
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <div
            data-empty-queue
            className="rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-solid)] p-6 text-center"
          >
            <ListChecks className="w-6 h-6 text-[var(--theme-text-dim)] mx-auto mb-2" />
            <div className="text-[12.5px] font-bold text-[var(--theme-text)]">File vide</div>
            <div className="text-[11px] text-[var(--theme-text-muted)] mt-1">
              Demande à l'agent de changer un thème ou un réglage : il déposera une proposition ici.
            </div>
          </div>
        )}
        {sorted.map((id) => {
          const sc = scenarios[id];
          if (!sc) return null;
          return <ScenarioRow key={id} scenario={sc} onOpen={() => onOpen(id)} />;
        })}
      </div>
    </div>
  );
}

export function ApprovalsView() {
  const [openId, setOpenId] = useState<string | null>(null);
  const openScenario = useScenariosStore((s) => (openId ? s.scenarios[openId] : null));
  const order = useScenariosStore((s) => s.scenarioOrder);
  const scenarios = useScenariosStore((s) => s.scenarios);
  const currentTheme = useThemeStore((s) => s.globalTheme);

  const pendingCount = order.filter((id) => scenarios[id]?.status === 'pending').length;
  const draftCount = order.filter((id) => scenarios[id]?.status === 'draft').length;

  // Brief FIX-7 — silence bruyant. La file d'approbation écrit dans
  // `approval_decisions` à chaque approve/reject. Si la collection
  // n'existe pas, `addItem` répond « Collection inconnue » à chaque
  // action et la décision est perdue. On annonce le défaut avant que
  // l'utilisateur ne clique.
  const approvalDecisionsRead = useCmsCollectionStatus('approval_decisions');
  const agentsAvailableRead = useCmsCollectionStatus('people_agents');

  if (openScenario) {
    return (
      <div data-approvals-view data-mode="detail" className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <ScenarioDetail scenario={openScenario} onClose={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div data-approvals-view data-mode="queue" className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <UnknownCollectionBanner
        collectionId="approval_decisions"
        status={approvalDecisionsRead.status}
        appName="People"
      />
      <UnknownCollectionBanner
        collectionId="people_agents"
        status={agentsAvailableRead.status}
        appName="People"
      />
      <SectionHead
        title="Approvals"
        subtitle="L'agent propose, vous tranchez. Ship or kill, en 10 minutes."
        action={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge tone="accent">
                {pendingCount} en attente
              </Badge>
            )}
            {draftCount > 0 && (
              <Badge tone="neutral">{draftCount} brouillon{draftCount === 1 ? '' : 's'}</Badge>
            )}
            <Badge tone="neutral">
              <Eye className="w-3 h-3 mr-1" />
              Thème global : {currentTheme}
            </Badge>
          </div>
        }
      />

      <div
        data-doctrine-banner
        className="rounded-2xl border bg-[var(--panel-solid)] p-5 flex items-start gap-3"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[color:#fff] shrink-0"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
        >
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[14px] font-bold text-[var(--theme-text)]">B1 Gatekeeper — la file d'approbation</div>
          <p className="text-[12px] text-[var(--theme-text-muted)] mt-1 leading-relaxed max-w-2xl">
            Les outils d'écriture (changerTheme, et tous les réglages à venir) déposent des propositions
            dans le scénario courant. Les outils de lecture et la navigation restent immédiats. La
            fusion est <span className="font-bold">atomique</span> : si une étape échoue, <span className="font-bold">aucune</span> modification n'est appliquée.
          </p>
        </div>
      </div>

      <ScenarioQueue onOpen={setOpenId} />
    </div>
  );
}

// Pour brancher dans PeopleApp.tsx : on importe `ApprovalsView` directement.
// La section "Approvals" est ajoutée à la liste `sections` avec l'icône
// `ListChecks`. Voir PeopleApp.tsx.
export default ApprovalsView;
