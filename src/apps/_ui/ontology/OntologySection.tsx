/** OntologySection — une section de barre laterale qui lit le registre
 *  d'ontologie et rend ses entites, avec navigation vers le detail.
 *
 *  Elle sert deux apps a partir de la MEME source :
 *   - `it-rd` › Ontology       : les 12 entites, sous l'angle technique ;
 *   - `operations` › Context Layer : le sous-ensemble operationnel.
 *
 *  Le seul point d'entree autorise est l'API publique `lib/ontology`. Aucune
 *  entite n'est recopiee ici : renommer un attribut dans le registre se voit
 *  dans les trois apps sans toucher a leur code. C'est le critere
 *  d'acceptation de l'epic, et le test `architecture.test.ts` interdit tout
 *  import direct des tables internes.
 */
import { useState } from 'react';
import { listEntities, relationsOf, type EntityDef, type EntityId } from '../../../lib/ontology';
import { useOntologyScope } from '../../../lib/ontology/scope-store';
import { EntityCard } from './EntityCard';
import { EntityDetail } from './EntityDetail';

export interface OntologySectionProps {
  /** Couleur d'accent de l'app hote. */
  accent: string;
  /** Restreint l'affichage a ces entites. Absent = les 12. */
  only?: readonly EntityId[];
  /** Titre et sous-titre affiches au-dessus de la grille. */
  title: string;
  subtitle: string;
  /** Affiche le decompte des relations du sous-ensemble. */
  showRelationCount?: boolean;
}

export function OntologySection({
  accent,
  only,
  title,
  subtitle,
  showRelationCount = false,
}: OntologySectionProps) {
  const scope = useOntologyScope();
  const [openId, setOpenId] = useState<EntityId | null>(null);

  const all: readonly EntityDef[] = listEntities({ scope });
  const entities = only ? all.filter((e) => only.includes(e.id)) : all;

  // Union dedoublonnee des relations touchant le sous-ensemble.
  const relationCount = showRelationCount
    ? new Set(entities.flatMap((e) => relationsOf(e.id).map((r) => r.id))).size
    : 0;

  const open = openId ? entities.find((e) => e.id === openId) : undefined;

  // Une entite ouverte puis filtree hors du sous-ensemble n'existe plus :
  // on retombe sur la grille plutot que d'afficher une page vide.
  if (openId && !open) {
    return (
      <div className="p-6 text-[13px] text-[var(--theme-muted)]">
        Cette entite n&apos;est plus dans le perimetre affiche.{' '}
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="underline text-[var(--theme-text)]"
        >
          Retour aux entites
        </button>
      </div>
    );
  }

  if (open) {
    return <EntityDetail entity={open} scope={scope} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="text-[15px] font-semibold text-[var(--theme-text)]">{title}</div>
        <div className="text-[12.5px] text-[var(--theme-muted)] mt-0.5">{subtitle}</div>
      </div>

      {entities.length === 0 ? (
        <div className="text-[13px] text-[var(--theme-muted)]">Registre vide.</div>
      ) : (
        <>
          {showRelationCount && (
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--theme-text-dim)]">
              {entities.length} entites · {relationCount === 0 ? 'aucune relation' : `${relationCount} relations`}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {entities.map((e) => (
              <EntityCard key={e.id} entity={e} scope={scope} accent={accent} onOpen={setOpenId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
