/**
 * ContractDetail — fiche d'un contrat semantique d'entite : 2 listes a
 *  puces (Triggers + Allowed actions) + entete descriptive.
 *
 *  Composant partage entre `OntologyApp` (section Contracts, story 2)
 *  et la nouvelle section `Ontology` de `it-rd` (story 4). Meme rendu,
 *  meme accent, meme comportement en cas d'absence de contrat.
 *
 *  L'accent est passe en props pour que la nouvelle section d'`it-rd`
 *  puisse reutiliser ce composant avec sa propre palette d'app (le
 *  violet `#7c3aed`) sans casser l'invariant visuel d'`OntologyApp`
 *  (teal `#0f766e`). Cf. spec story 4 §Code Map.
 */
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card } from '../kit';
import { getEntity, contractOf } from '../../../lib/ontology';
import type { EntityId } from '../../../lib/ontology';

export interface ContractDetailProps {
  entityId: EntityId;
  accent?: string;
  onBack: () => void;
}

export function ContractDetail({ entityId, accent = '#0f766e', onBack }: ContractDetailProps): import('react').ReactNode {
  const entity = getEntity(entityId);
  const contract = contractOf(entityId);

  if (!entity || !contract) {
    return (
      <div className="flex flex-col gap-4" data-contract-detail={entityId}>
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux contrats
        </button>
        <div className="text-[13px] text-[var(--theme-text-dim)] italic">
          Aucun contrat pour cette entite.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" data-contract-detail={entityId}>
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux contrats
      </button>

      <Card title={entity.label}>
        <div className="px-5 pb-4 text-[13px] text-[var(--theme-text)] leading-relaxed">
          {entity.description}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Declencheurs">
          <ul className="px-5 pb-4 flex flex-col gap-1.5">
            {contract.triggers.map((t) => (
              <li
                key={t}
                className="text-[12.5px] font-mono text-[var(--theme-text)] flex items-center gap-2"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Actions permises">
          <ul className="px-5 pb-4 flex flex-col gap-1.5">
            {contract.allowedActions.map((a) => (
              <li
                key={a}
                className="text-[12.5px] font-mono text-[var(--theme-text)] flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-text-dim)] shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
