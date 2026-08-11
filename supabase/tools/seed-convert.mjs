#!/usr/bin/env node
/**
 * seed-convert.mjs — vérifie que supabase/migrations/20260811000005_seed.sql
 * est cohérent avec src/lib/cms/seed.ts.
 *
 * Brief-F-2026-08-11 §Livrable 3 : « S'il faut un script de conversion,
 * mets-le dans `supabase/tools/` et fais-le tourner. »
 *
 * Pour chaque collection déclarée dans seed.ts, on compte le nombre
 * d'items (par comptage des objets `{` au niveau 0 du tableau
 * `const XItems: CmsItem[] = [ ... ]`). Pour chaque INSERT INTO dans
 * seed.sql, on compte le nombre de lignes VALUES (par comptage des `,`
 * au niveau 0 entre parenthèses, plus 1). On compare.
 *
 * Usage : node supabase/tools/seed-convert.mjs
 * Sortie : tableau + code retour 0/1.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const SEED_TS = resolve(repoRoot, 'src/lib/cms/seed.ts');
const SEED_SQL = resolve(repoRoot, 'supabase/migrations/20260811000005_seed.sql');

/** Mapping collection id (TS) → nom de variable du tableau d'items (TS).
 *  Le seed.ts ne nomme pas ses variables de façon régulière — parfois
 *  `clients` → `clientsItems`, parfois `people_agents` → `agentsItems`,
 *  parfois `product_items` → `productItemsItems`. Cette table explicite
 *  le mapping et le déclare comme une source de vérité. */
const COLLECTION_ITEMS_VAR = {
  clients: 'clientsItems',
  articles: 'articlesItems',
  team: 'teamItems',
  people_agents: 'agentsItems',
  runbooks: 'runbooksItems',
  incidents: 'incidentsItems',
  services: 'servicesItems',
  it_experiments: 'itExperimentsItems',
  deploys: 'deploysItems',
  tasks: 'tasksItems',
  marketplace_listings: 'marketplaceItems',
  product_items: 'productItemsItems',
  product_releases: 'releasesItems',
  growth_channels: 'growthChannelsItems',
  growth_experiments: 'growthExperimentsItems',
  deals: 'dealsItems',
  invoices: 'invoicesItems',
  contracts: 'contractsItems',
  policies: 'policiesItems',
  session_notes: 'sessionNotesItems',
  demo_coach_apps: 'demoCoachAppsItems',
  demo_coach_notes: 'demoCoachNotesItems',
  demo_coach_metrics: 'demoCoachMetricsItems',
};

/** Mapping collection id (TS) → nom de table (SQL).
 *  Doit rester aligné avec 20260811000001_collections.sql. */
const COLLECTION_TABLE = {
  clients: 'cms_clients',
  articles: 'cms_articles',
  team: 'cms_team',
  people_agents: 'cms_people_agents',
  runbooks: 'cms_runbooks',
  incidents: 'cms_incidents',
  services: 'cms_services',
  it_experiments: 'cms_it_experiments',
  deploys: 'cms_deploys',
  tasks: 'cms_tasks',
  marketplace_listings: 'cms_marketplace_listings',
  product_items: 'cms_product_items',
  product_releases: 'cms_product_releases',
  growth_channels: 'cms_growth_channels',
  growth_experiments: 'cms_growth_experiments',
  deals: 'cms_deals',
  invoices: 'cms_invoices',
  contracts: 'cms_contracts',
  policies: 'cms_policies',
  session_notes: 'cms_session_notes',
  demo_coach_apps: 'cms_demo_coach_apps',
  demo_coach_notes: 'cms_demo_coach_notes',
  demo_coach_metrics: 'cms_demo_coach_metrics',
};

/** Strip TS comments and string literals from source — gives a string
 *  where braces/parens are unambiguously syntactic. */
function stripTsNoise(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    // line comment
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    // block comment
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // string literal
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i += 2;
        else if (quote === '`' && src[i] === '$' && src[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
            i++;
          }
        } else i++;
      }
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Strip SQL comments and string literals. */
function stripSqlNoise(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '-' && n === '-') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === "'") {
      i++;
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\') i += 2;
        else i++;
      }
      i++;
      continue;
    }
    if (c === '"') {
      i++;
      while (i < src.length && src[i] !== '"') i++;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Count top-level objects in the array assigned to `const <varName>`. */
function countItemsInSeedTs(seedTsSource, collectionId) {
  const varName = COLLECTION_ITEMS_VAR[collectionId];
  if (!varName) return null;
  const clean = stripTsNoise(seedTsSource);
  const re = new RegExp(
    `const\\s+${varName}\\s*[:=][^=]*=\\s*\\[`,
    'm'
  );
  const m = clean.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 0;
  let count = 0;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '{') {
      if (depth === 0) count++;
      depth++;
    } else if (ch === '}') {
      depth--;
    } else if (ch === ']' && depth === 0) {
      break;
    }
  }
  return count;
}

/** Count tuples (rows) in the VALUES clause of an INSERT.
 *  Algorithm: walk the string char by char, track paren depth.
 *  A row starts at a `(` at depth 1 (i.e., the first paren after VALUES).
 *  A row ends at the matching `)`.
 *  The number of rows is the number of times we transition
 *  depth 0 → depth 1.
 */
function countRowsInSeedSql(seedSql, tableName) {
  const clean = stripSqlNoise(seedSql);
  const re = new RegExp(
    `insert\\s+into\\s+public\\.${tableName}\\b[^;]*?values\\s*`,
    'gi'
  );
  let total = 0;
  let m;
  while ((m = re.exec(clean)) !== null) {
    let i = m.index + m[0].length;
    let depth = 0;
    let rows = 0;
    // Walk until we hit `;` at the outer level, or end of input.
    while (i < clean.length) {
      const ch = clean[i];
      if (ch === '(') {
        depth++;
        if (depth === 1) rows++;
      } else if (ch === ')') {
        depth--;
      } else if (ch === ';' && depth === 0) {
        break;
      }
      i++;
    }
    total += rows;
  }
  return total;
}

async function main() {
  const seedTs = await readFile(SEED_TS, 'utf8');
  const seedSql = await readFile(SEED_SQL, 'utf8');

  const rows = [];
  let mismatch = 0;
  for (const [collectionId, table] of Object.entries(COLLECTION_TABLE)) {
    const tsCount = countItemsInSeedTs(seedTs, collectionId);
    const sqlCount = countRowsInSeedSql(seedSql, table);
    const ok = tsCount !== null && sqlCount !== null && tsCount === sqlCount;
    if (!ok) mismatch++;
    rows.push({
      collection: collectionId,
      table,
      seedTsItems: tsCount,
      seedSqlRows: sqlCount,
      ok,
    });
  }

  console.log('');
  console.log('Collection              | Table                    | seed.ts | seed.sql | match');
  console.log('------------------------|--------------------------|---------|----------|------');
  for (const r of rows) {
    const match = r.ok ? 'OK  ' : 'FAIL';
    const ts = r.seedTsItems === null ? '—' : String(r.seedTsItems);
    const sq = r.seedSqlRows === null ? '—' : String(r.seedSqlRows);
    console.log(
      `${r.collection.padEnd(23)} | ${r.table.padEnd(24)} | ${ts.padStart(7)} | ${sq.padStart(8)} | ${match}`
    );
  }
  console.log('');
  console.log(`Collections checked : ${rows.length}`);
  console.log(`Mismatch            : ${mismatch}`);
  console.log('');

  if (mismatch > 0) {
    console.error('FAIL — au moins une collection a un compte seed.ts ≠ seed.sql.');
    console.error('Voir le tableau ci-dessus. Régénérer le seed SQL ou corriger le script.');
    process.exit(1);
  } else {
    console.log('OK — seed TS et seed SQL sont cohérents à 23/23.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('seed-convert.mjs crashed:', err);
  process.exit(2);
});
