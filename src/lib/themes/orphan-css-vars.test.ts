/// <reference types="node" />

/**
 * Garde-fou contre le retour des variables orphelines — story 2 du theme epic.
 *
 * But : empecher une regression silencieuse du bug "34 % de la surface thémée
 * gelée sur warm-paper" (story 1). Story 1 a posé 9 alias dans
 * `applyThemeTokens` ; sans filet, un dev peut les retirer sans que rien ne
 * bronche. Ce test scanne `src/`, collecte tous les `var(--xxx)` consommes,
 * les confronte aux noms ecrits par `applyThemeTokens` (src/lib/themes/store.ts
 * lignes 62-104) + declares dans les blocs `:root` / `[data-theme]` de
 * src/index.css, retire 8 exclusions justifiees, et fait echouer la suite en
 * nommant toute orpheline residuelle.
 *
 * Le test lit les fichiers sur disque (analyse statique cote Node). Il ne
 * touche ni au store, ni au DOM, ni au bundle. Vitest est execute en env
 * `jsdom` (vite.config.ts) mais les built-ins Node (`fs`, `path`) restent
 * accessibles.
 *
 * Story 1 a gele `applyThemeTokens` et `tokens.ts`. Ce test ne modifie ni
 * l'un ni l'autre.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Racine du projet — `process.cwd()` est la racine du package.json quand
 *  vitest demarre depuis ce package (cf. `npm test` ligne 11 de package.json). */
const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const STORE_FILE = path.join(SRC_DIR, 'lib', 'themes', 'store.ts');
const INDEX_CSS = path.join(SRC_DIR, 'index.css');
/** Ce fichier lui-meme : on l'exclut du scan consommateur (les regex
 *  stringifyees sinon matcheraient leur propre definition). */
const THIS_FILE = path.join(SRC_DIR, 'lib', 'themes', 'orphan-css-vars.test.ts');

/** Extensions scellees : on ne regarde que les fichiers ou CSS-in-TS est
 *  plausible. .md / .png / .json / .svg ne portent pas de `var(--xxx)`. */
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html']);

/** Applique un predicat a chaque fichier d'un repertoire (recursif). Suit
 *  la symlinke pour rester simple ; pas de jonction NTFS attendue ici. */
function walk(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** Recupere chaque `var(--xxx)` consomme dans un buffer. Spec : regex
 *  `var\(\s*--([a-zA-Z0-9-]+)`.
 *  Filtre les artefacts de capture terminant par `-` (le char class inclut
 *  le trait d'union, donc `var(--theme-*)` capture `theme-` avant que le
 *  `*` ne casse — `theme-` n'est pas un nom CSS valide). */
const CONSUMER_RE = /var\(\s*--([a-zA-Z0-9-]+)/g;

/** Recupere chaque nom SET par `applyThemeTokens`. Spec : regex
 *  `setProperty\(`\$\{p\}--([a-zA-Z0-9-]+)\`` sur les lignes 62-104 du store. */
const STORE_WRITER_RE = /setProperty\(`\$\{p\}--([a-zA-Z0-9-]+)`/g;

/** Bloc `:root` ou `[data-theme*]` simple (non imbrique). Capture le corps
 *  entre accolades pour y extraire les declarations `--xxx: ...`. */
const ROOT_BLOCK_RE = /:root\s*{([^}]*)}/g;
const DATA_THEME_BLOCK_RE = /\[\s*data-theme[^\]]*\]\s*{([^}]*)}/g;

/** Declaration `--xxx: valeur;` a l'interieur d'un bloc statique. */
const DECL_RE = /--([a-zA-Z0-9-]+)\s*:/g;

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function listSrcFiles(): string[] {
  return walk(SRC_DIR).filter((f) => {
    if (f === THIS_FILE) return false;
    return SCAN_EXTENSIONS.has(path.extname(f));
  });
}

/** Collecte tous les `var(--xxx)` consommes dans `src/`, hors ce test.
 *  Renvoie les noms SANS le prefixe `--` (forme canonique CSS-Var, plus
 *  pratique a comparer). Filtre les artefacts terminant par `-`. */
function collectConsumers(): string[] {
  const names: string[] = [];
  for (const file of listSrcFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(CONSUMER_RE)) {
      const name = m[1];
      if (name.endsWith('-')) continue; // artefact du regex sur les JSDoc
      names.push(name);
    }
  }
  return uniq(names);
}

/** Extrait les noms SET par `applyThemeTokens` sur src/lib/themes/store.ts
 *  lignes 62-104. Renvoie les noms SANS prefixe `--`. */
function collectStoreWriters(): string[] {
  const src = fs.readFileSync(STORE_FILE, 'utf8');
  const lines = src.split('\n');
  let startIdx: number;
  let endIdx: number;
  if (lines.length >= 104) {
    startIdx = 61; // ligne 62 (0-indexed)
    endIdx = 104;  // ligne 104 incluse
  } else {
    // Fallback : balayer tout le fichier. La story 1 gele store.ts.
    startIdx = 0;
    endIdx = lines.length;
  }
  const block = lines.slice(startIdx, endIdx).join('\n');
  const names: string[] = [];
  for (const m of block.matchAll(STORE_WRITER_RE)) {
    names.push(m[1]);
  }
  return uniq(names);
}

/** Extrait les noms DECLARES dans `:root` / `[data-theme]` de src/index.css.
 *  Renvoie les noms SANS prefixe `--`. */
function collectCssWriters(): string[] {
  const src = fs.readFileSync(INDEX_CSS, 'utf8');
  const blocks: string[] = [];
  for (const m of src.matchAll(ROOT_BLOCK_RE)) blocks.push(m[1]);
  for (const m of src.matchAll(DATA_THEME_BLOCK_RE)) blocks.push(m[1]);
  const names: string[] = [];
  for (const body of blocks) {
    for (const d of body.matchAll(DECL_RE)) {
      names.push(d[1]);
    }
  }
  return uniq(names);
}

/** Exclusions justifiees — chacune pointe vers le fichier qui consomme la
 *  variable. Les noms sont stockes SANS le prefixe `--` pour matcher le
 *  format de capture des regex ; le commentaire en regard garde la forme
 *  `--xxx` pour la lecture humaine.
 *  Ajouter une exclusion sans justification consomme le credit story-1 ;
 *  preferer ecrire la valeur cote store ou cote `:root`. */
const EXCLUSIONS: ReadonlyArray<{ name: string; consumer: string; reason: string }> = [
  {
    name: 'ok',
    // consomme : src/apps/clients/ClientsDetailPage.tsx:68 — `good: 'var(--ok)'`
    consumer: 'src/apps/clients/ClientsDetailPage.tsx',
    reason: 'couleur semantique (succes), absente de ThemeTokens — choix design, pas un cablage de theme',
  },
  {
    name: 'warn',
    // consomme : src/apps/clients/ClientsDetailPage.tsx:69 — `warn: 'var(--warn)'`
    consumer: 'src/apps/clients/ClientsDetailPage.tsx',
    reason: 'couleur semantique (avertissement), absente de ThemeTokens',
  },
  {
    name: 'danger',
    // consomme : src/apps/clients/ClientsDetailPage.tsx:70 — `bad: 'var(--danger)'`
    consumer: 'src/apps/clients/ClientsDetailPage.tsx',
    reason: 'couleur semantique (erreur), absente de ThemeTokens',
  },
  {
    name: 'nm-shade',
    // consomme : src/apps/people/PeopleDetailPage.tsx (8 occurrences) — posee a l'execution
    consumer: 'src/apps/people/PeopleDetailPage.tsx',
    reason: 'locale au theme neumorphism, posee a l\'execution par PeopleDetailPage (style.setProperty inline)',
  },
  {
    name: 'nm-glow',
    // consomme : src/apps/people/PeopleDetailPage.tsx — posee a l'execution
    consumer: 'src/apps/people/PeopleDetailPage.tsx',
    reason: 'locale au theme neumorphism, posee a l\'execution par PeopleDetailPage',
  },
  {
    name: 'nm-accent',
    // consomme : src/apps/people/PeopleDetailPage.tsx — posee a l'execution
    consumer: 'src/apps/people/PeopleDetailPage.tsx',
    reason: 'locale au theme neumorphism, posee a l\'execution par PeopleDetailPage',
  },
  {
    name: 'topbar-height',
    // consomme : src/index.css:88 — `.top-bar { height: var(--topbar-height); }` (declare :root ligne 65)
    consumer: 'src/index.css',
    reason: 'constante de mise en page declaree dans :root du meme fichier (ligne 65) et consommee localement (ligne 88)',
  },
  {
    name: 'canvasui-cursor',
    // consomme : src/components/canvasui/v30/Bend/BendVanilla.ts:750 + HexFloat/HexFloatVanilla.ts:1422 — pose a l'execution
    consumer: 'src/components/canvasui/v30/Bend/BendVanilla.ts + src/components/canvasui/v30/HexFloat/HexFloatVanilla.ts',
    reason: 'posee a l\'execution par canvas-ui (Bend + HexFloat), jamais par applyThemeTokens ni :root',
  },
];

describe('orphan-css-vars', () => {
  // Garde de prerequis : si vitest demarre dans un environnement etrange,
  // mieux vaut echouer tout de suite qu'avec un faux positif.
  it('prerequis — vitest peut lire src/, store.ts et index.css', () => {
    expect(fs.existsSync(SRC_DIR)).toBe(true);
    expect(fs.existsSync(STORE_FILE)).toBe(true);
    expect(fs.existsSync(INDEX_CSS)).toBe(true);
  });

  it('ne declare pas d\'orphelines : tout var(--xxx) consomme est ecrit ou exclu', () => {
    const consumers = collectConsumers();
    const storeWriters = new Set(collectStoreWriters());
    const cssWriters = new Set(collectCssWriters());
    const exclusionNames = new Set(EXCLUSIONS.map((e) => e.name));

    const writers = new Set<string>([...storeWriters, ...cssWriters]);
    const orphans = consumers.filter((c) => !writers.has(c) && !exclusionNames.has(c));

    if (orphans.length > 0) {
      // Liste explicite — vitest affiche le message en clair dans la sortie.
      const lines = orphans.map((o) => `  - --${o}`).join('\n');
      throw new Error(
        `Variables CSS orphelines detectees (${orphans.length}) :\n${lines}\n\n` +
          'Resolution : ajouter la valeur dans applyThemeTokens (store.ts:62-104) ' +
          'OU la declarer dans :root / [data-theme] de src/index.css, ' +
          'OU l\'ajouter a EXCLUSIONS avec une justification pointant le fichier consommateur.'
      );
    }

    expect(orphans).toEqual([]);
  });

  it('garde-fou REGRESSION_9_ALIAS_REMOVED : les 9 alias de story 1 sont toujours dans le store', () => {
    // Sanity : la liste extraite du store DOIT contenir les 9 alias que
    // story 1 a poses (lignes 95-103). Si cette liste se vide, le garde-fou
    // precedent ne protegerait plus rien.
    const storeWriters = new Set(collectStoreWriters());
    const STORY1_ALIASES = [
      'theme-muted',
      'canvas',
      'panel',
      'panel-solid',
      'panel-border',
      'panel-border-subtle',
      'hairline',
      'shadow-panel',
      'shadow-window',
    ];
    const missing = STORY1_ALIASES.filter((a) => !storeWriters.has(a));
    expect(missing, `Alias story 1 manquants dans applyThemeTokens : ${missing.map((m) => '--' + m).join(', ')}`).toEqual([]);
  });

  it('EXCLUSION_RENAMED : la liste d\'exclusions reste exactement aux 8 noms attendus', () => {
    // Si quelqu'un elargit la liste pour faire passer le test au vert, on
    // veut le voir. Verrou : la liste doit faire 8 et contenir ces noms.
    const EXPECTED = [
      'ok', 'warn', 'danger',
      'nm-shade', 'nm-glow', 'nm-accent',
      'topbar-height', 'canvasui-cursor',
    ];
    expect(EXCLUSIONS.length).toBe(8);
    const actual = EXCLUSIONS.map((e) => e.name).sort();
    expect(actual).toEqual([...EXPECTED].sort());
  });
});