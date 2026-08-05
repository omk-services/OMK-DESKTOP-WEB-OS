/**
 * EntityCard — carte cliquable d'une entite du registre d'ontologie.
 *
 *  Composant partage entre `OntologyApp` (section Entities, story 2)
 *  et la nouvelle section `Ontology` de `it-rd` (story 4). Aucun acces
 *  aux modules internes du registre : tout passe par `EntityDef` recu
 *  en props, lequel est rendu par l'API publique d'ontologie cote
 *  consommateur. La fermeture d'`architecture.test.ts` est preservee
 *  tant que ce composant n'importe rien de `src/lib/ontology/` autre
 *  que les types passes par le caller.
 *
 *  Story 3 ajoute le marqueur visuel « personnel » quand l'entite
 *  porte au moins un attribut `scope: 'personal'` ET le filtre actif
 *  n'exclut pas ces attributs. Pattern reprise verbatim d'OntologyApp
 *  (lignes 211-268 baseline 2802159).
 */
import { Database, User } from 'lucide-react';
import { Badge } from '../kit';
import type { EntityDef, EntityId, ScopeFilter as UIScopeFilter } from '../../../lib/ontology';

export interface EntityCardProps {
  entity: EntityDef;
  scope: UIScopeFilter;
  accent: string;
  onOpen: (id: EntityId) => void;
}

export function EntityCard({ entity, scope, accent, onOpen }: EntityCardProps) {
  // Marqueur visuel : badge 'personnel' si l'entite porte au moins un
  // attribut scope 'personal' ET le filtre actif n'exclut pas ces
  // attributs (mode 'all'). En mode 'org' on cache le badge : il
  // annoncerait l'existence de contenu qu'on a decide de ne pas
  // montrer. Cf. spec story 3 Design Notes §"Pourquoi masquer plutot
  // que voiler".
  const hasPersonal = entity.attributes.some((a) => a.scope === 'personal');
  const showPersonalMarker = hasPersonal && scope === 'all';
  // Compteur d'attributs visible : on suit le filtre actif pour rester
  // coherent avec le detail. Sinon l'utilisateur voit "5 attr." sur la
  // carte puis un tableau de 4 lignes en mode 'org', ce qui est
  // trompeur.
  const visibleAttrs = entity.attributes.filter((a) =>
    scope === 'all' ? true : (a.scope ?? 'org') === scope,
  );
  return (
    <button
      type="button"
      onClick={() => onOpen(entity.id)}
      className="text-left bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-2 focus:outline-none focus:ring-2"
      style={{ ['--tw-ring-color' as string]: accent } as React.CSSProperties}
      data-entity-id={entity.id}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
          style={{ background: accent }}
        >
          <Database className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
          {visibleAttrs.length} attr.
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-[var(--theme-text)] text-[14px] tracking-tight">
          {entity.label}
        </div>
        {showPersonalMarker ? (
          <Badge tone="warn">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              personnel
            </span>
          </Badge>
        ) : null}
      </div>
      <div className="text-[12px] text-[var(--theme-text-dim)] line-clamp-3">
        {entity.description}
      </div>
    </button>
  );
}
