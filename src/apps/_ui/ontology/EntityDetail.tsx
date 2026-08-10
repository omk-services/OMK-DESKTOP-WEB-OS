/**
 * EntityDetail — detail inline d'une entite : tableau d'attributs typés
 * + bouton retour.
 *
 *  Composant partage entre `OntologyApp` (section Entities, story 2)
 *  et la nouvelle section `Ontology` de `it-rd` (story 4). Meme
 *  composant React, meme comportement, meme grammaire visuelle. Pas
 *  d'import depuis `src/lib/ontology/` : l'appel a `listAttributesOf`
 *  passe par le caller via le props `entity` deja resolu.
 *
 *  Spec §Design notes : choix justifie « masquer » plutot que « voiler »
 *  — les attributs personnels disparaissent en mode 'org', reapparaissent
 *  avec un badge en mode 'all'.
 */
import { ArrowLeft, User } from 'lucide-react';
import { Card, Badge } from '../kit';
import { listAttributesOf } from '../../../lib/ontology';
import type { EntityDef, EntityAttribute, ScopeFilter as UIScopeFilter } from '../../../lib/ontology';

export interface EntityDetailProps {
  entity: EntityDef;
  scope: UIScopeFilter;
  onBack: () => void;
}

export function EntityDetail({ entity, scope, onBack }: EntityDetailProps): import('react').ReactNode {
  const attrs: readonly EntityAttribute[] = listAttributesOf(entity.id, { scope });

  // En mode 'org', on peut tomber sur une entite qui n'a que des
  // attributs personnels (cas degenere mais verrouille par les
  // invariants : on garde l'entite visible pour servir de plan).
  const empty = attrs.length === 0;

  return (
    <div className="flex flex-col gap-5" data-entity-detail={entity.id}>
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux entites
      </button>

      <Card title={entity.label}>
        <div className="px-5 pb-4 text-[13px] text-[var(--theme-text)] leading-relaxed">
          {entity.description}
        </div>
      </Card>

      <Card title="Attributs">
        {empty ? (
          <div className="px-5 pb-4 text-[12.5px] text-[var(--theme-text-dim)] italic">
            Aucun attribut organisationnel pour cette entite. Basculez sur
            « Tout » pour voir les notes personnelles.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-[var(--theme-text-dim)]">
                  <th className="px-5 py-2 font-semibold">Nom</th>
                  <th className="px-5 py-2 font-semibold">Type</th>
                  <th className="px-5 py-2 font-semibold">Requis</th>
                  <th className="px-5 py-2 font-semibold">Cible</th>
                  <th className="px-5 py-2 font-semibold">Portee</th>
                </tr>
              </thead>
              <tbody>
                {attrs.map((a) => (
                  <tr
                    key={a.name}
                    className="border-t border-[var(--panel-border-subtle)]"
                  >
                    <td className="px-5 py-2 font-mono text-[var(--theme-text)]">{a.name}</td>
                    <td className="px-5 py-2">
                      <Badge tone={a.type === 'ref' ? 'accent' : 'neutral'}>{a.type}</Badge>
                    </td>
                    <td className="px-5 py-2">
                      {a.required ? (
                        <Badge tone="ok">requis</Badge>
                      ) : (
                        <Badge tone="neutral">optionnel</Badge>
                      )}
                    </td>
                    <td className="px-5 py-2 font-mono text-[var(--theme-text-dim)]">
                      {a.ref ?? '—'}
                    </td>
                    <td className="px-5 py-2">
                      {a.scope === 'personal' ? (
                        <Badge tone="warn">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            personnel
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-[var(--theme-text-dim)]">org</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
