/** OntologyApp — lecteur de `src/lib/ontology/index.ts`.
 *
 *  Story 2 de l'epic couche-ontologie, etendue story 3 (portee
 *  personnelle / organisation). L'app expose 4 sections dans la barre
 *  laterale (Entities / Relations / Contracts / Versions) ; chaque
 *  section lit *exclusivement* l'API publique d'ontologie. Aucun chemin
 *  vers `entities.ts` / `relations.ts` / `contracts.ts` n'est importe
 *  ici : c'est verrouille par `architecture.test.ts` (cf. spec §Boundaries).
 *
 *  Story 3 ajoute un interrupteur « Organisation seule / Tout » dans la
 *  section Entities, pilote par le store Zustand
 *  `src/lib/ontology/scope-store.ts` (cle de persistance
 *  `coach-os-ontology-scope-v1`). Les attributs marques `scope` 'personal'
 *  disparaissent du detail en mode 'org' et reapparaissent avec un badge
 *  `personnel` (tone 'warn') en mode 'all'.
 *
 *  Le composant suit le meme patron que `OperationsApp` / `ItRdApp` :
 *  `AppFrame` + 4 `AppSection`, sous-vue locale par `useState<EntityId |
 *  null>` (pas de `useCollectionDrill` : le registre est fige en memoire,
 *  pas une collection CMS).
 *
 *  Aucun accent Tailwind en dur : tout passe par `var(--theme-*)` /
 *  `var(--panel-*)`. Cf. dette corrigee sur 385 usages.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Network,
  Database,
  GitBranch,
  FileCheck,
  History,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { ThemedSectionHead } from '../../components/ThemedSectionHead';
import { EntityCard } from '../_ui/ontology/EntityCard';
import { EntityDetail } from '../_ui/ontology/EntityDetail';
import { ContractDetail } from '../_ui/ontology/ContractDetail';
import { StatCard, Card, Badge } from '../_ui/kit';
import {
  getEntity,
  listEntities,
  relationsOf,
  contractOf,
  type EntityId,
  type EntityDef,
  type Relation,
} from '../../lib/ontology';
import { useOntologyScope, useOntologyScopeStore } from '../../lib/ontology/scope-store';

/** Accent dedie au registre. Distinct des 17 accents deja deployes dans
 *  `app-discovery.ts` ; `#0f766e` est un teal plus fonce que le teal
 *  Onboarding (`#0d9488`) pour eviter toute collision visuelle. Le
 *  composant n'ecrit jamais la couleur en dur : il recupere l'accent
 *  par props / variables CSS. */
const ACCENT = '#0f766e';

/** Cardinalites declarees par le registre. Verifiees en runtime par la
 *  section Versions. Cf. `relations.ts` `Cardinality = '1-1' | '1-n' | 'n-n'`. */
const VALID_CARDINALITIES = new Set<Relation['cardinality']>(['1-1', '1-n', 'n-n']);

interface ValidationIssue {
  /** Categorie : `count` = arithmetique du registre, `integrity` = relation
   *  pendante / ref cassée, `shape` = champ mal forme. Sert a la cle. */
  kind: 'count' | 'integrity' | 'shape';
  message: string;
}

/** Vue minimale d'un contrat, telle qu'exposee par l'API publique.
 *  Voir `src/lib/ontology/index.ts` `Contract`. On declare le type
 *  localement pour que `validate()` reste testable sans importer le
 *  contrat interne. */
interface ContractLike {
  readonly triggers: readonly string[];
  readonly allowedActions: readonly string[];
}

/** Helper pur de validation. Prend en entree les surfaces *imitees*
 *  (entites / relations / contrats) et renvoie la liste d'anomalies.
 *  La forme de chaque surface est compatible avec ce que rend l'API
 *  publique d'ontologie, mais le helper reste agnostique : les tests
 *  peuvent lui passer des structures synthetiquement defectueuses sans
 *  toucher au registre (cf. patch 3 du review). */
export function validate(
  entities: readonly EntityDef[],
  relations: readonly Relation[],
  contracts: Readonly<Record<EntityId, ContractLike | undefined>>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  // Nommes plutot qu'eparpilles : le meme nombre apparaissait a quatre endroits,
  // et il a fallu quatre corrections pour en changer un seul le 2026-08-13.

  // Compte canonique : 13 entites, 13 contrats, 15-32 relations.
  //
  // Porte de 12 a 13 le 2026-08-13, avec l'arrivee de `BusinessDomain` — les
  // sept domaines du Business Pulse et leurs strateges DC, transcrits du canon
  // SDD-006 §5 de Geordi. Les 7 relations d'autorite (`owns`, `serves`) portent
  // la plage haute de 25 a 32.
  //
  // Ces trois nombres sont ecrits en dur A DESSEIN : c'est un garde-fou qui doit
  // hurler quand quelqu'un ajoute une entite sans y penser. Les changer est une
  // decision d'architecture — et elle se documente ici, pas dans un commit muet.
  if (entities.length !== ATTENDU_ENTITES) {
    issues.push({
      kind: 'count',
      message: `Compte d'entites different de ${ATTENDU_ENTITES} : observe ${entities.length}.`,
    });
  }

  // Comptes.
  const contractCount = entities.reduce((acc, e) => acc + (contracts[e.id] ? 1 : 0), 0);
  if (contractCount !== ATTENDU_ENTITES) {
    issues.push({
      kind: 'count',
      message: `Compte de contrats different de ${ATTENDU_ENTITES} : observe ${contractCount}.`,
    });
  }
  if (relations.length < RELATIONS_MIN || relations.length > RELATIONS_MAX) {
    issues.push({
      kind: 'count',
      message: `Compte de relations hors plage ${RELATIONS_MIN}-${RELATIONS_MAX} : observe ${relations.length}.`,
    });
  }

  // Indexation rapide des entites pour les verifs d'integrite.
  const entityById = new Map<EntityId, EntityDef>();
  for (const e of entities) {
    entityById.set(e.id, e);
  }

  // Integrite referentielle : attributs `ref` resolubles, relations
  // pointent vers des entites existantes, cardinalites dans l'union,
  // verbe non vide.
  for (const e of entities) {
    for (const a of e.attributes) {
      if (a.type === 'ref') {
        if (a.ref === undefined) {
          issues.push({
            kind: 'integrity',
            message: `${e.id}.${a.name} : type=ref mais ref non defini.`,
          });
        } else if (!entityById.has(a.ref)) {
          issues.push({
            kind: 'integrity',
            message: `${e.id}.${a.name} : ref=${a.ref} ne pointe vers aucune entite.`,
          });
        }
      }
    }
  }

  for (const r of relations) {
    if (!entityById.has(r.source) || !entityById.has(r.target)) {
      issues.push({
        kind: 'integrity',
        message: `Relation ${r.id} : source=${r.source} ou target=${r.target} introuvable.`,
      });
    }
    if (r.verb.trim().length === 0) {
      issues.push({
        kind: 'shape',
        message: `Relation ${r.id} : verbe vide.`,
      });
    }
    if (!VALID_CARDINALITIES.has(r.cardinality)) {
      issues.push({
        kind: 'shape',
        message: `Relation ${r.id} : cardinality=${r.cardinality} hors union.`,
      });
    }
  }

  // Doublons d'identifiant d'entite (defense en profondeur : type bloque
  // deja, mais on double-vérifie en runtime).
  const seenIds = new Set<EntityId>();
  for (const e of entities) {
    if (seenIds.has(e.id)) {
      issues.push({ kind: 'integrity', message: `Identifiant d'entite en doublon : ${e.id}.` });
    }
    seenIds.add(e.id);
  }

  return issues;
}

/** Fonction de validation runtime — wrapper qui injecte le registre
 *  reel (via l'API publique) et appelle `validate(...)`. Recouvre les
 *  invariants declares dans `ontology.test.ts` (story 1) ; l'app les
 *  *reexecute* cote UI, ne les importe pas (l'app n'a pas le droit
 *  d'ouvrir les modules internes — c'est la fermeture). */
/** Comptes canoniques du registre. Voir le commentaire dans validateRegistry(). */
export const ATTENDU_ENTITES = 13;
export const RELATIONS_MIN = 15;
export const RELATIONS_MAX = 32;

export function validateRegistry(): ValidationIssue[] {
  const entities = listEntities();

  // Dedoublonner les relations via `relationsOf(e.id)` : chaque relation
  // peut apparaitre 1 ou 2 fois (source et/ou cible). On dedoublonne par
  // `id`, comme dans `ontology.test.ts`.
  const seenRelationIds = new Set<string>();
  const relations: Relation[] = [];
  for (const e of entities) {
    for (const r of relationsOf(e.id)) {
      if (seenRelationIds.has(r.id)) continue;
      seenRelationIds.add(r.id);
      relations.push(r);
    }
  }

  // Contrats : on lit via l'API publique pour respecter la fermeture.
  const contracts = {} as Record<EntityId, ContractLike | undefined>;
  for (const e of entities) {
    contracts[e.id] = contractOf(e.id);
  }

  return validate(entities, relations, contracts);
}

/* ──────────────────────────── Entities ──────────────────────────── */

/**
 * Interrupteur 2 positions : « Organisation seule » / « Tout ».
 * Persiste via le store Zustand `scope-store`. Spec §Design notes :
 * le mode 'personnel seul' n'est pas expose cote UI — le helper
 * `listAttributesOf` le supporte pour les tests et futures stories.
 */
function ScopeToggle(): React.ReactElement {
  const scope = useOntologyScope();
  const setScope = useOntologyScopeStore((s) => s.setScope);
  const value: 'org' | 'all' = scope;

  const boutonClasses = (actif: boolean): string =>
    [
      'inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg transition-colors',
      actif
        ? 'bg-[var(--panel)] text-[var(--theme-text)] border border-[var(--panel-border)] shadow-sm'
        : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]',
    ].join(' ');

  return (
    <div
      role="group"
      aria-label="Filtrer les attributs par portee"
      className="inline-flex items-center gap-1 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-1"
    >
      <button
        type="button"
        aria-pressed={value === 'org'}
        onClick={() => setScope('org')}
        className={boutonClasses(value === 'org')}
      >
        <Filter className="w-3.5 h-3.5" />
        Organisation seule
      </button>
      <button
        type="button"
        aria-pressed={value === 'all'}
        onClick={() => setScope('all')}
        className={boutonClasses(value === 'all')}
      >
        Tout
      </button>
    </div>
  );
}

/* ──────────────────────────── Relations ──────────────────────────── */

/** Vue liste des relations avec 2 selects source / cible + bouton reset.
 *  Spec §I/O EDGE_CASE : si source = cible = Organization, 0 relations
 *  ; on affiche alors « Aucune relation. ». */
function RelationsList({ allRelations, entityIds }: {
  allRelations: readonly Relation[];
  entityIds: readonly EntityId[];
}) {
  const [source, setSource] = useState<EntityId | ''>('');
  const [target, setTarget] = useState<EntityId | ''>('');

  const filtered = allRelations.filter((r) => {
    if (source && r.source !== source) return false;
    if (target && r.target !== target) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-[var(--theme-text-muted)] font-semibold">
          Source
          <select
            value={source}
            onChange={(e) => {
              const v = e.target.value;
              setSource((v === '' || entityIds.includes(v as EntityId)) ? (v as EntityId | '') : '');
            }}
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--theme-text)] min-w-[160px]"
          >
            <option value="">— toutes —</option>
            {entityIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-[var(--theme-text-muted)] font-semibold">
          Cible
          <select
            value={target}
            onChange={(e) => {
              const v = e.target.value;
              setTarget((v === '' || entityIds.includes(v as EntityId)) ? (v as EntityId | '') : '');
            }}
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--theme-text)] min-w-[160px]"
          >
            <option value="">— toutes —</option>
            {entityIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => { setSource(''); setTarget(''); }}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reinitialiser
        </button>
        <span className="ml-auto text-[12px] text-[var(--theme-text-dim)]">
          {filtered.length} relation{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-[13px] text-[var(--theme-text-dim)] italic px-1 py-4">
          Aucune relation.
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--panel-border-subtle)]">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="px-5 py-3 flex items-center gap-3 text-[12.5px]"
              >
                <span className="font-mono text-[var(--theme-text)]">{r.source}</span>
                <span className="text-[var(--theme-text-dim)]">-[</span>
                <span className="font-mono italic text-[var(--theme-text)]">{r.verb}</span>
                <span className="text-[var(--theme-text-dim)]">]-&gt;</span>
                <span className="font-mono text-[var(--theme-text)]">{r.target}</span>
                <Badge tone={r.cardinality === '1-1' ? 'ok' : r.cardinality === '1-n' ? 'accent' : 'neutral'}>
                  {r.cardinality}
                </Badge>
                <span className="ml-auto text-[10px] font-mono text-[var(--theme-text-dim)]">{r.id}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ──────────────────────────── Contracts ──────────────────────────── */

/** Detail d'un contrat : 2 listes a puces (Triggers + Allowed actions). */
/* ──────────────────────────── Versions ──────────────────────────── */

/** Section Versions : compteurs + verification des invariants + encart
 *  « Pas d'historique ». Spec §Acceptance : sur le registre actuel, les
 *  3 StatCard affichent 12 / 20 / 12 et aucune anomalie n'est listee. */
function VersionsPanel() {
  const entities = listEntities();
  const allRelations = useMemo(() => {
    const m = new Map<string, Relation>();
    for (const e of entities) {
      for (const r of relationsOf(e.id)) m.set(r.id, r);
    }
    return Array.from(m.values());
  }, [entities]);
  const contractCount = entities.reduce((acc, e) => acc + (contractOf(e.id) ? 1 : 0), 0);
  const issues = useMemo(() => validateRegistry(), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Entites" value={entities.length} tone="accent" />
        <StatCard label="Relations" value={allRelations.length} tone="accent" />
        <StatCard label="Contrats" value={contractCount} tone="accent" />
      </div>

      <Card title="Etat du registre">
        <div className="px-5 pb-4 flex flex-col gap-3 text-[12.5px]">
          <div className="flex items-center gap-2 text-[var(--theme-text)]">
            {issues.length === 0 ? (
              <>
                <CheckCircle2
                  className="w-4 h-4 shrink-0"
                  style={{ color: '#16a34a' }}
                />
                <span>
                  Le registre respecte les invariants : cardinalites dans l'union,
                  refs resolues, verbe non vide, identifiants uniques.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle
                  className="w-4 h-4 shrink-0"
                  style={{ color: '#d97706' }}
                />
                <span>
                  {issues.length} anomalie{issues.length === 1 ? '' : 's'} detectee{issues.length === 1 ? '' : 's'}.
                </span>
              </>
            )}
          </div>

          {issues.length > 0 ? (
            <ul className="flex flex-col gap-1.5 pl-6 list-disc">
              {issues.map((issue, i) => (
                <li key={`${issue.kind}-${i}`} className="text-[var(--theme-text)]">
                  <span className="font-mono text-[var(--theme-text-dim)] mr-2">[{issue.kind}]</span>
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>

      <div
        className="rounded-xl border px-5 py-4 text-[12.5px] leading-relaxed"
        style={{
          background: `${ACCENT}10`,
          borderColor: `${ACCENT}40`,
        }}
      >
        <div className="flex items-start gap-2.5">
          <History className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
          <div className="flex flex-col gap-1">
            <div className="font-bold text-[var(--theme-text)]">
              Pas d'historique de versions
            </div>
            <div className="text-[var(--theme-text-muted)]">
              Le registre vit en memoire TypeScript, sans persistance. Aucune
              comparaison de versions n'est possible : le snapshot est
              l'etat compile. Toute mutation passe par une PR qui change
              les fichiers source du registre.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── App ───────────────────────────── */

export function OntologyApp() {
  const entities = useMemo(() => listEntities(), []);
  const allRelations = useMemo(() => {
    const m = new Map<string, Relation>();
    for (const e of entities) {
      for (const r of relationsOf(e.id)) m.set(r.id, r);
    }
    return Array.from(m.values());
  }, [entities]);
  const entityIds = useMemo(() => entities.map((e) => e.id), [entities]);

  /** Selection locale a la section Entities. Spec §Design notes : chaque
   *  section est autonome, la selection n'est pas partagee entre sections. */
  const [selectedEntity, setSelectedEntity] = useState<EntityId | null>(null);
  /** Idem pour Contracts. */
  const [selectedContract, setSelectedContract] = useState<EntityId | null>(null);

  /** Story 3 : portee (scope) de l'interrupteur dans la section Entities.
   *  Lu via le hook minimaliste `useOntologyScope` qui extrait juste la
   *  valeur courante — on n'a pas besoin du compteur `version` ici.
   *  Persiste dans `localStorage` sous la cle `coach-os-ontology-scope-v1`
   *  via le store Zustand (cf. scope-store.ts). */
  const scope = useOntologyScope();

  /** Reset defensif : si la selection pointe sur une entite inconnue du
   *  registre (cas degrade : registre modifie a chaud via HMR, fixture
   *  de dev...), on retombe sur la grille. COTE EFFET, jamais pendant
   *  le render — patch review 1 (HIGH) : un `setState` pendant le
   *  render declenche un warning React et boucle potentiellement. Le
   *  deps `[selectedEntity]` borne l'effet a un seul passage par
   *  selection modifiee, donc pas de boucle. */
  useEffect(() => {
    if (selectedEntity && !getEntity(selectedEntity)) {
      setSelectedEntity(null);
    }
  }, [selectedEntity]);
  useEffect(() => {
    if (selectedContract && !contractOf(selectedContract)) {
      setSelectedContract(null);
    }
  }, [selectedContract]);

  const Entities = () => (
    <div className="p-7">
      {selectedEntity && getEntity(selectedEntity) ? (
        <EntityDetail
          entity={getEntity(selectedEntity)!}
          scope={scope}
          onBack={() => setSelectedEntity(null)}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <ThemedSectionHead
              title="Entites metier"
              subtitle="Les 13 types du registre — cliquables pour voir leurs attributs types."
            />
            <div className="pt-1">
              <ScopeToggle />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((e) => (
              <EntityCard
                key={e.id}
                entity={e}
                scope={scope}
                accent={ACCENT}
                onOpen={setSelectedEntity}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const Relations = () => (
    <div className="p-7">
      <ThemedSectionHead
        title="Relations"
        subtitle="Verbes typés entre entites, filtrables par source ou cible."
      />
      <RelationsList allRelations={allRelations} entityIds={entityIds} />
    </div>
  );

  const Contracts = () => (
    <div className="p-7">
      {selectedContract ? (
        <ContractDetail
          entityId={selectedContract}
          accent={ACCENT}
          onBack={() => setSelectedContract(null)}
        />
      ) : (
        <>
          <ThemedSectionHead
            title="Contrats semantiques"
            subtitle="Declencheurs et actions permises par entite."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedContract(e.id)}
                className="text-left bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as string]: ACCENT } as React.CSSProperties}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                  style={{ background: ACCENT }}
                >
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[14px] text-[var(--theme-text)] truncate">
                    {e.label}
                  </div>
                  <div className="text-[11px] text-[var(--theme-text-muted)] truncate">
                    {e.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const Versions = () => (
    <div className="p-7">
      <ThemedSectionHead
        title="Etat du registre"
        subtitle="Compteurs + verification runtime des invariants de la story 1."
      />
      <VersionsPanel />
    </div>
  );

  const sections: AppSection[] = [
    { id: 'entities',  label: 'Entities',  icon: Database,   render: Entities },
    { id: 'relations', label: 'Relations', icon: GitBranch,  render: Relations },
    { id: 'contracts', label: 'Contracts', icon: FileCheck,  render: Contracts },
    { id: 'versions',  label: 'Versions',  icon: History,    render: Versions },
  ];

  return (
    <AppFrame
      title="Ontology"
      subtitle="Registre des 12 entites"
      icon={Network}
      accent={ACCENT}
      sections={sections}
    />
  );
}
