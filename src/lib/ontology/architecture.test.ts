/// <reference types="node" />

/**
 * Garde-fou de fermeture du module ontology — story 1 de l'epic couche-ontologie.
 *
 * But : empecher la regression silencieuse de la these de l'epic. La
 * story 1 expose 4 fonctions publiques (getEntity, listEntities,
 * relationsOf, contractOf) via `src/lib/ontology/index.ts` ; les modules
 * internes (`entities`, `relations`, `contracts`) sont censes etre
 * inaccessibles aux apps. Sans filet, un dev peut taper
 * `import { ENTITIES } from '@/lib/ontology/entities'` et tout le
 * contrat tombe — le registre devient mutable depuis chaque consommateur.
 *
 * Stories 2 et 4 ajouteront trois consommateurs. Si la fermeture n'est
 * pas testee, elle casse a la premiere PR sans que rien ne bronche.
 *
 * Regle verifiee :
 *   - Aucun fichier hors 'src/lib/ontology/' ne peut importer un module
 *     interne du registre ('entities', 'relations', 'contracts'). Les
 *     consommateurs passent par l'API publique d'`index.ts`.
 *   - A l'interieur du module, les imports croises sont libres : c'est de
 *     la cohesion interne, pas une fuite. `relations.ts` et `contracts.ts`
 *     importent le type `EntityId` d'`entities.ts` — c'est ce qui garantit
 *     une source unique pour les 12 identifiants. Interdire ces imports
 *     forcerait a recopier l'union dans trois fichiers, exactement la
 *     duplication que cet epic existe pour supprimer.
 *
 * Le test lit les fichiers sur disque (analyse statique cote Node). Il
 * ne touche ni au store, ni au DOM, ni au bundle. Vitest est execute en
 * env `jsdom` (vite.config.ts) mais les built-ins Node (`fs`, `path`)
 * restent accessibles.
 *
 * Limites documentees :
 *   - Le projet n'a pas d'alias de chemin (`@/...` non configure dans
 *     vite.config.ts ni tsconfig.app.json). Le test couvre donc les
 *     imports relatifs `./...` et `../...`. Si un alias est ajoute plus
 *     tard, le test devra etre etendu pour le reconnaitre.
 *   - Les imports dynamiques (`import('...')`) ne sont pas traques ; ils
 *     contournent deja l'API publique du compilateur TypeScript et ne
 *     sont pas attendus dans ce module.
 *
 * Suit le motif de `src/lib/themes/orphan-css-vars.test.ts` (meme
 * en-tete explicatif, `/// <reference types="node" />`, `node:fs` +
 * `node:path`, `process.cwd()` comme racine, exclusion du fichier de test
 * lui-meme pour eviter l'auto-match).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const ONTOLOGY_DIR = path.join(SRC_DIR, 'lib', 'ontology');
/** Le seul fichier autorise a importer les modules internes. */
const INDEX_FILE = path.join(ONTOLOGY_DIR, 'index.ts');
/** Ce fichier lui-meme : on l'exclut du scan (les regex stringifyees
 *  sinon matcheraient leur propre definition). */
const THIS_FILE = path.join(ONTOLOGY_DIR, 'architecture.test.ts');

/** Extensions scellees : on ne regarde que les sources TS/TSX du projet. */
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx']);

/** Les trois modules internes que la fermeture isole. `index.ts` est
 *  exclu : c'est lui-meme la surface publique. */
const INTERNAL_MODULES = new Set(['entities', 'relations', 'contracts']);

/** Marche recursive de `src/`. Saute les jonctions/symlinks — la racine
 *  du profil heberge 47 jonctions NTFS (cf. CLAUDE.md utilisateur) et
 *  un walk naif y suivrait, comptant des fichiers d'autres arborescences. */
function walk(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** Importe relatif : `from '...'` ou `import type ... from '...'`. */
const IMPORT_FROM_RE = /from\s+['"]([^'"]+)['"]/g;

/** Renvoie la liste des imports relatifs qui pointent vers un des
 *  modules internes du registre (`entities`, `relations`, `contracts`).
 *  Resolution : on prend le dernier segment du chemin (apres strip de
 *  l'extension `.ts`/`.tsx`) et on verifie qu'il appartient a
 *  `INTERNAL_MODULES`. On resout ensuite le chemin absolu pour verifier
 *  qu'il atterrit bien dans `src/lib/ontology/` (sinon un `./entities`
 *  dans un autre sous-dossier serait un faux positif). */
function findInternalImports(filePath: string): string[] {
  const src = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const hits: string[] = [];
  for (const m of src.matchAll(IMPORT_FROM_RE)) {
    const target = m[1];
    if (!target.startsWith('./') && !target.startsWith('../')) continue;
    const sansExt = target.replace(/\.tsx?$/, '');
    const base = path.basename(sansExt);
    if (!INTERNAL_MODULES.has(base)) continue;
    const resolved = path.resolve(dir, sansExt);
    if (!resolved.startsWith(ONTOLOGY_DIR + path.sep)) continue;
    hits.push(target);
  }
  return hits;
}

function listScannableFiles(): string[] {
  return walk(SRC_DIR).filter((f) => {
    if (f === THIS_FILE) return false;
    return SCAN_EXTENSIONS.has(path.extname(f));
  });
}

describe('architecture du module ontology — fermeture', () => {
  // Garde de prerequis : si vitest demarre dans un environnement etrange,
  // mieux vaut echouer tout de suite qu'avec un faux negatif.
  it('prerequis — vitest peut lire src/ et le module ontology', () => {
    expect(fs.existsSync(SRC_DIR)).toBe(true);
    expect(fs.existsSync(ONTOLOGY_DIR)).toBe(true);
    expect(fs.existsSync(INDEX_FILE)).toBe(true);
  });

  it('aucun fichier hors du module n importe les modules internes du registre', () => {
    const files = listScannableFiles();

    // Map<chemin relatif a ROOT, liste d'imports fautifs>. On collecte
    // d'abord, on remonte ensuite, pour avoir un message d'erreur qui
    // liste TOUS les contrevenants d'un coup (un seul a la fois est
    // frustrant quand plusieurs devs PRent en parallele).
    const contrevenants: { file: string; targets: string[] }[] = [];

    for (const f of files) {
      // Les fichiers du module lui-meme ont le droit de s'importer entre
      // eux : `relations.ts` et `contracts.ts` tirent `EntityId` de
      // `entities.ts`, ce qui garde une source unique pour les 12
      // identifiants. Seule la frontiere du module est gardee.
      if (f.startsWith(ONTOLOGY_DIR + path.sep)) continue;
      const targets = findInternalImports(f);
      if (targets.length > 0) {
        contrevenants.push({ file: path.relative(ROOT, f), targets });
      }
    }

    if (contrevenants.length > 0) {
      const lignes = contrevenants
        .map((c) => `  - ${c.file} importe ${c.targets.map((t) => `'${t}'`).join(', ')}`)
        .join('\n');
      throw new Error(
        `Import interdit des modules internes du registre (${contrevenants.length} fichier(s)) :\n` +
          `${lignes}\n\n` +
          `Hors de src/lib/ontology/, './entities', './relations' et './contracts' sont fermes.\n` +
          `Les apps doivent passer par l'API publique : getEntity, listEntities, relationsOf, contractOf.`,
      );
    }

    expect(contrevenants).toEqual([]);
  });

  it('la fermeture tient : index.ts est le seul point d entree interne', () => {
    // Sanity check : si quelqu'un retire un des trois imports internes
    // dans index.ts (par exemple en refactorant), ce test echoue avec un
    // message qui nomme l import manquant. Plus strict qu un simple
    // `toBeGreaterThan(0)` : on verifie que les 3 modules sont bien
    // importes au moins une fois chacun, pas seulement qu au moins un.
    // Note : index.ts importe chaque module deux fois (une fois en
    // valeur, une fois en type) — la fermeture tient des qu au moins
    // un import de chaque nom est present.
    const importsDedans = findInternalImports(INDEX_FILE);
    const attendus = new Set(['./entities', './relations', './contracts']);
    const vus = new Set(importsDedans);
    for (const a of attendus) {
      expect(vus, `index.ts doit importer '${a}'`).toContain(a);
    }
    // Symetriquement : aucun import vers un chemin non attendu.
    for (const v of vus) {
      expect(attendus, `index.ts ne doit importer que les 3 modules internes`).toContain(v);
    }
  });

  it('index.ts ne re-exporte pas les tables internes', () => {
    // La fermeture ne tient que si la surface de `index.ts` reste etroite.
    // Un `export { ENTITIES } from './entities'` (ou RELATIONS, CONTRACTS)
    // permet a un consommateur de taper directement la table interne via
    // le chemin public, et de muter le registre partage en place. Le scan
    // ci-dessus regarde ce qui est *importe* depuis l'exterieur ; il
    // laisse passer un re-export par `index.ts` parce que ce fichier est
    // exempté. Ce test ferme cette derniere frontiere — sous toutes ses
    // formes possibles (nom direct, renomme `as X`, etoile `*`, etoile
    // dans namespace, default, type-only, local `export { ENTITIES }`).
    const src = fs.readFileSync(INDEX_FILE, 'utf8');
    const BANNED = new Set(['ENTITIES', 'RELATIONS', 'CONTRACTS']);

    /** Normalise un token de re-export en nom canonique. Gere `as X`
     *  (`ENTITIES as Foo` => `ENTITIES`) et les espaces. */
    const canon = (tok: string): string => {
      const t = tok.trim();
      // `default as Foo` -> on flagge `Foo` ; `Foo as default` -> on flagge `Foo`
      // `ENTITIES as X` -> `ENTITIES` ; `X as ENTITIES` -> `ENTITIES`
      const asIdx = t.indexOf(' as ');
      const left = asIdx === -1 ? t : t.slice(0, asIdx);
      const right = asIdx === -1 ? '' : t.slice(asIdx + 4);
      return BANNED.has(left.trim()) ? left.trim() : (BANNED.has(right.trim()) ? right.trim() : '');
    };

    const fuites: string[] = [];

    // Forme 1 : `export { ENTITIES } from './entities'` (ou renommee).
    const namedFromRe = /export\s*\{([^}]*)\}\s*from\s*['"]\.\/(entities|relations|contracts)['"]/g;
    for (const m of src.matchAll(namedFromRe)) {
      const noms = m[1].split(',').map((s) => canon(s)).filter(Boolean);
      for (const n of noms) {
        fuites.push(`${n} (re-export nomme depuis './${m[2]}')`);
      }
    }

    // Forme 2 : `export * from './entities'` (etoile nue).
    const starRe = /export\s*\*\s*from\s*['"]\.\/(entities|relations|contracts)['"]/g;
    for (const m of src.matchAll(starRe)) {
      fuites.push(`* (re-export etoile depuis './${m[2]}')`);
    }

    // Forme 3 : `export * as ns from './entities'` (etoile dans namespace).
    const starNsRe = /export\s*\*\s*as\s+\w+\s*from\s*['"]\.\/(entities|relations|contracts)['"]/g;
    for (const m of src.matchAll(starNsRe)) {
      fuites.push(`namespace (re-export etoile depuis './${m[2]}')`);
    }

    // Forme 4 : `export type { ENTITIES } from './entities'` (type-only).
    const typeReexportRe = /export\s+type\s*\{([^}]*)\}\s*from\s*['"]\.\/(entities|relations|contracts)['"]/g;
    for (const m of src.matchAll(typeReexportRe)) {
      const noms = m[1].split(',').map((s) => canon(s)).filter(Boolean);
      for (const n of noms) {
        fuites.push(`${n} (re-export type-only depuis './${m[2]}')`);
      }
    }

    // Forme 5 : `export { ENTITIES }` local (sans clause `from`) — exige
    // qu'un import correspondant existe plus haut dans le meme fichier.
    // On accepte `export type { ... }` local puisque c'est un re-export
    // de types, pas de tables.
    const localRe = /^export\s*\{([^}]*)\}\s*$/gm;
    for (const m of src.matchAll(localRe)) {
      const noms = m[1].split(',').map((s) => canon(s)).filter(Boolean);
      for (const n of noms) {
        fuites.push(`${n} (re-export local sans clause 'from')`);
      }
    }

    if (fuites.length > 0) {
      throw new Error(
        `index.ts re-exporte une ou plusieurs tables internes du registre :\n` +
          fuites.map((f) => `  - ${f}`).join('\n') +
          `\n\nLa fermeture du module est rompue : un consommateur peut alors importer\n` +
          `ENTITIES / RELATIONS / CONTRACTS via le chemin public et muter le registre\n` +
          `partage en place. Seule l'API publique doit rester visible :\n` +
          `  getEntity, listEntities, relationsOf, contractOf.`,
      );
    }
    expect(fuites).toEqual([]);
  });

  it('scope-store.ts n importe pas React (store vanilla)', () => {
    // Story 3 de l epic couche-ontologie : le store de portee doit
    // rester testable hors React. Un import `from 'react'` (ou
    // `from "react"`, casse la barriere et oblige a monter un
    // environnement React pour les tests. On grep le contenu
    // directement : analyse statique, pas de resolution de module.
    const SCOPE_STORE_FILE = path.join(ONTOLOGY_DIR, 'scope-store.ts');
    expect(fs.existsSync(SCOPE_STORE_FILE), 'scope-store.ts doit exister').toBe(true);

    const src = fs.readFileSync(SCOPE_STORE_FILE, 'utf8');

    // Couvre toutes les formes qui tirent React dans le module :
    //  - `from 'react'`, `from "react"`, `from 'react/...'`, `from "react/..."`
    //  - `import type { X } from 'react'` (meme motif `from`)
    //  - `require('react')`, `require("react")`, `require('react/...')`
    //  - `import('react')` dynamique (meme `from`-equivalent au runtime)
    //  - `from 'zustand/react'` et `from "zustand/react"` — l'entree
    //    Zustand qui appelle useSyncExternalStore et force un env React.
    const reactImportRe =
      /(?:from|require|import)\s*(?:\(\s*)?['"](?:[^'"]*\/)?react(?:\/[^'"]+)?['"]/g;
    const hits = src.match(reactImportRe);
    if (hits && hits.length > 0) {
      throw new Error(
        `scope-store.ts importe React ou un adapter React — le store doit rester vanilla pour la testabilite :\n` +
          hits.map((h) => `  - ${h}`).join('\n') +
          `\n\nZustand fournit un create vanilla ; c'est le consommateur qui s'abonne via le hook. Voir themes/store.ts pour le patron.`,
      );
    }
    expect(hits).toBeNull();
  });
});