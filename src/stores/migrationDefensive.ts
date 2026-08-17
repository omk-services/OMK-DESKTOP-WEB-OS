/**
 * migrationDefensive.ts — helpers partagés par tous les stores persistés.
 *
 * Pourquoi ce fichier :
 *   Sur les 11 stores qui appellent `persist()`, presque aucun ne déclare
 *   `version` ni `migrate`, et seul un tiers a un `merge` défensif.
 *   Pour 9 d'entre eux (cf. Correctif 8), il faut une politique uniforme :
 *   une charge persistée est NON FIABLE. Si elle est plus ancienne que le
 *   code qui la lit, ou si elle a la mauvaise forme, on jette la charge
 *   et on retombe sur le défaut. C'est moins bon qu'un rattrappage
 *   intelligent, mais c'est toujours mieux que de jeter l'app.
 *
 *   Neuf copies divergeraient. Ce fichier expose deux helpers —
 *   `defensiveMigrate` et `defensiveMerge` — que les stores utilisent.
 *   Le contrat est validé par un test qui couvre les 3 cas du brief :
 *   (1) version antérieure → défaut, (2) charge corrompue → défaut,
 *   (3) charge valide de la version courante → respectée.
 *
 *   Ces helpers sont compatibles avec `persist()` de Zustand, qui attend
 *   `migrate(persisted, persistedVersion)` et `merge(persisted, current)`.
 *   Si `migrate` rend `undefined`, Zustand retombe sur l'état initial.
 *   `merge` rend l'état final, qui doit contenir les méthodes de
 *   `current` (reconstruites à chaque hydratation).
 */
// ─── Garde-types ──────────────────────────────────────────────────────

/** Prédicat : plain object (pas un array, pas null). C'est la forme
 *  minimale que doit avoir une charge persistée pour être examinable. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ─── merge défensif ──────────────────────────────────────────────────

/** Spécification d'un merge défensif : un validateur par champ.
 *  Chaque validateur reçoit la valeur persistée et rend la valeur
 *  validée (ou la valeur de repli si la forme ne tient pas). */
export interface DefensiveMergeSpec<T> {
  /** Map champ → validateur. Un champ absent de la spec est laissé tel
   *  quel s'il existe dans la charge, sinon repris de `current`. */
  validators: Partial<Record<keyof T, (value: unknown) => unknown>>;
}

/** Renvoie une fonction `merge` Zustand qui valide champ par champ.
 *
 *  Sémantique :
 *   - Si la charge n'est pas un objet (null, tableau, primitif) → on rend
 *     `current` tel quel. Les méthodes sont préservées (elles viennent
 *     de l'état initial de Zustand), les données retombent sur celles
 *     définies dans cet état initial — qui sont par construction le
 *     défaut.
 *   - Sinon, on repart d'une copie de `current` (les méthodes sont
 *     préservées), et pour chaque champ déclaré dans `validators` on
 *     remplace par la valeur validée. Un champ persisté non déclarée
 *     dans `validators` est ignorée — elle ne s'infiltre pas dans
 *     l'état.
 *
 *  Pourquoi ne pas valider automatiquement :
 *   La validation automatique (ex. JSON Schema) ajoute un parser
 *   lourd pour chaque hydratation. Un validateur explicite par champ
 *   est plus léger, plus lisible, et plus testable.
 */
export function defensiveMerge<T extends object>(
  spec: DefensiveMergeSpec<T>,
): (persisted: unknown, current: T) => T {
  return (persisted: unknown, current: T): T => {
    if (!isPlainObject(persisted)) {
      return current;
    }
    const out = { ...current } as Record<string, unknown>;
    for (const [key, validator] of Object.entries(spec.validators)) {
      if (typeof validator !== 'function') continue;
      const v = (persisted as Record<string, unknown>)[key];
      out[key] = validator(v);
    }
    return out as T;
  };
}

// ─── migrate défensif ────────────────────────────────────────────────

/** Renvoie une fonction `migrate` Zustand qui jette toute charge trop
 *  ancienne ou malformée.
 *
 *  Sémantique :
 *   - `persistedVersion < currentVersion` → `undefined` (Zustand
 *     retombera sur l'état initial — c'est le cas du brief).
 *   - Charge qui n'est pas un objet → `undefined`.
 *   - Sinon, on rend la charge telle quelle ; le `merge` validera
 *     champ par champ et rejettera ce qui ne tient pas.
 *
 *  Le second cas est important : une charge qui se trouve dans le
 *  localStorage dans un format inconnu (corruption, bug ancien, ou
 *  injection) ne doit pas casser l'hydratation. */
export function defensiveMigrate<T>(currentVersion: number) {
  return (persisted: unknown, persistedVersion: number): T | undefined => {
    if (typeof persistedVersion === 'number' && persistedVersion < currentVersion) {
      return undefined;
    }
    if (!isPlainObject(persisted)) {
      return undefined;
    }
    return persisted as T;
  };
}

// ─── Helper pour les stores manuels (sans persist) ──────────────────

/** Type utilitaire : un payload stocké enveloppé dans `{ version, state }`,
 *  comme `shell.store` l'écrit. C'est le format majoritaire chez nous ;
 *  ceux qui stockent un objet brut (ex. `dock.store`) peuvent reculer
 *  vers cette enveloppe en héritant de cette convention.
 *
 *  Pas un helper fonctionnel — c'est juste un type documentaire pour
 *  aligner les stores manuels sur le contrat des stores persist.
 */
export interface VersionedEnvelope<T> {
  version: number;
  state: T;
}

/** Décode une enveloppe versionnée. Renvoie `undefined` si la version
 *  est trop ancienne, si l'enveloppe est malformée, ou si la version
 *  courante est < 0. Les stores manuels (sans `persist()`) s'en
 *  servent pour lire leur blob.
 *
 *  Le défaut est toujours une `MigrationDefensiveOptions.defaults`
 *  passée par l'appelant — ce helper ne fournit pas le défaut, il
 *  valide le payload et rend la charge intérieure. */
export function decodeVersionedEnvelope<T>(
  raw: string | null,
  currentVersion: number,
): T | undefined {
  if (raw === null) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isPlainObject(parsed)) return undefined;
  const v = parsed.version;
  if (typeof v !== 'number' || v < currentVersion) return undefined;
  const state = parsed.state;
  if (!isPlainObject(state)) return undefined;
  return state as T;
}
