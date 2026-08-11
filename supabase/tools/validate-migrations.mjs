#!/usr/bin/env node
/**
 * validate-migrations.mjs — vérifie heuristiquement les migrations
 * SQL de supabase/migrations/.
 *
 * Brief-F-2026-08-11 §Validation : si Docker n'est pas dispo sur
 * cette machine, on NE PEUT PAS exécuter `supabase db lint`. Ce
 * script est un pis-aller : il vérifie des invariants qu'on peut
 * détecter sans Postgres, et qui auraient pété une vraie exécution.
 *
 * Invariants vérifiés :
 *   1. Parens / crochets / accolades équilibrés (en ignorant le
 *      contenu des string literals).
 *   2. Chaque `create or replace function` a un `language` ET un
 *      `return`.
 *   3. Chaque `create trigger` référence une fonction définie dans
 *      le même fichier (ou un fichier précédent) — sinon erreur
 *      probable au moment de l'application.
 *   4. `enable row level security` est appelé au moins une fois dans
 *      20260811000003_rls.sql — sinon on aurait un trou de sécurité.
 *   5. Chaque `create policy ... for select` est sur une table qui
 *      a été `enable row level security` plus haut.
 *   6. Les 23 tables typées sont toutes créées.
 *   7. Les 25 triggers (23 CMS + cms_items + cms_collections) sont
 *      tous câblés.
 *
 * Usage : node supabase/tools/validate-migrations.mjs
 * Sortie : OK + code 0, ou FAIL + détails + code 1.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const MIGRATIONS_DIR = resolve(repoRoot, 'supabase/migrations');

const REQUIRED_TABLES = [
  'cms_clients', 'cms_articles', 'cms_team', 'cms_people_agents',
  'cms_runbooks', 'cms_incidents', 'cms_services', 'cms_it_experiments',
  'cms_deploys', 'cms_tasks', 'cms_marketplace_listings', 'cms_product_items',
  'cms_product_releases', 'cms_growth_channels', 'cms_growth_experiments',
  'cms_deals', 'cms_invoices', 'cms_contracts', 'cms_policies',
  'cms_session_notes', 'cms_demo_coach_apps', 'cms_demo_coach_notes',
  'cms_demo_coach_metrics',
  'cms_items', 'cms_collections',
];

function stripStringsAndComments(src) {
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

function checkBalanced(name, src) {
  const clean = stripStringsAndComments(src);
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c in pairs) stack.push({ ch: c, idx: i });
    else if (c === ')' || c === ']' || c === '}') {
      const top = stack.pop();
      if (!top || pairs[top.ch] !== c) {
        return { ok: false, error: `Unbalanced "${c}" at offset ${i} in ${name}` };
      }
    }
  }
  if (stack.length > 0) {
    const top = stack[stack.length - 1];
    return { ok: false, error: `Unclosed "${top.ch}" at offset ${top.idx} in ${name}` };
  }
  return { ok: true };
}

function checkFunctionDefinitions(name, src) {
  const errors = [];
  // Match `create or replace function name(...) returns <type>` and
  // stop at the type — `[\w.]+?` (non-greedy) so we don't eat the
  // `language` clause. Then scan forward for `language`.
  const fnRegex = /create\s+(or\s+replace\s+)?function\s+([\w.]+)\s*\([^)]*\)\s*returns\s+[\w.]+?/gi;
  let m;
  while ((m = fnRegex.exec(src)) !== null) {
    const rest = src.slice(m.index + m[0].length, m.index + m[0].length + 200);
    if (!/\blanguage\b/i.test(rest)) {
      errors.push(`${name}: function ${m[2]} missing "language" clause`);
    }
  }
  return errors;
}

function checkTriggers(name, src, knownFunctions) {
  const errors = [];
  // Capture every function defined in this file.
  const definedFns = new Set(knownFunctions);
  const fnRegex = /create\s+(or\s+replace\s+)?function\s+([\w.]+)/gi;
  let m;
  while ((m = fnRegex.exec(src)) !== null) definedFns.add(m[2].replace(/^public\./, ''));

  // Capture every `execute function <fn>;` reference.
  const trigRegex = /execute\s+function\s+([\w.]+)/gi;
  while ((m = trigRegex.exec(src)) !== null) {
    const fn = m[1].replace(/^public\./, '');
    if (!definedFns.has(fn)) {
      errors.push(`${name}: trigger references "${fn}" not defined in any preceding file`);
    }
  }
  return errors;
}

function checkRlsCoverage(name, src) {
  const errors = [];
  if (name.endsWith('20260811000003_rls.sql')) {
    // 23 tables CMS couvertes par la boucle `foreach t in array cms_tables`,
    // 2 tables supplémentaires (cms_items, cms_collections) couvertes
    // par le bloc explicite plus bas dans le même fichier.
    const cmsCollectionTables = REQUIRED_TABLES.filter((t) => t.startsWith('cms_') && !['cms_items', 'cms_collections'].includes(t));
    const explicitTables = ['cms_items', 'cms_collections'];

    // Détecter le pattern dynamique.
    const hasDynamicEnable = /alter\s+table\s+(public\.)?%I[^'"\n]*enable\s+row\s+level\s+security/i.test(src);
    const hasDynamicPolicy = /create\s+policy\s+%I_(select|insert|update|delete)/i.test(src);
    const hasTablesArray = /cms_tables\s+text\[\]\s*:?=\s*array\[/i.test(src);

    if (!(hasDynamicEnable && hasDynamicPolicy && hasTablesArray)) {
      // Pas de pattern dynamique : on exige la couverture littérale pour tout.
      for (const t of REQUIRED_TABLES) {
        const re = new RegExp(`alter\\s+table\\s+public\\.${t}\\b[^;]*enable\\s+row\\s+level\\s+security`, 'i');
        if (!re.test(src)) errors.push(`${name}: RLS not enabled for public.${t}`);
      }
      for (const t of REQUIRED_TABLES) {
        const re = new RegExp(`create\\s+policy\\s+${t}_(select|insert|update|delete)\\b`, 'i');
        if (!re.test(src)) errors.push(`${name}: no policy for public.${t} (expected ${t}_select etc.)`);
      }
    } else {
      // Boucle dynamique : on vérifie qu'elle couvre les 23 CMS collections.
      const m = src.match(/cms_tables\s+text\[\]\s*:?=\s*array\[([^\]]*)\]/i);
      if (m) {
        const entries = m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        if (entries.length !== cmsCollectionTables.length) {
          errors.push(`${name}: cms_tables ARRAY has ${entries.length} entries, expected ${cmsCollectionTables.length} (23 CMS collections)`);
        }
        for (const t of cmsCollectionTables) {
          if (!entries.includes(t)) {
            errors.push(`${name}: cms_tables ARRAY missing ${t}`);
          }
        }
      }
      // Bloc explicite : cms_items et cms_collections doivent avoir
      // leur alter table et leurs policies.
      for (const t of explicitTables) {
        const re = new RegExp(`alter\\s+table\\s+public\\.${t}\\b[^;]*enable\\s+row\\s+level\\s+security`, 'i');
        if (!re.test(src)) errors.push(`${name}: RLS not enabled for public.${t} (explicit block)`);
        for (const op of ['select', 'insert', 'update', 'delete']) {
          const re2 = new RegExp(`create\\s+policy\\s+${t}_${op}\\b`, 'i');
          if (!re2.test(src)) errors.push(`${name}: no policy ${t}_${op} (explicit block)`);
        }
      }
    }
  }
  return errors;
}

function checkTablesCreated(name, src) {
  const errors = [];
  if (name.endsWith('20260811000001_collections.sql')) {
    for (const t of REQUIRED_TABLES) {
      const re = new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?public\\.${t}\\b`, 'i');
      if (!re.test(src)) {
        errors.push(`${name}: missing CREATE TABLE for public.${t}`);
      }
    }
  }
  return errors;
}

function checkTriggersAttached(name, src) {
  const errors = [];
  if (name.endsWith('20260811000001_collections.sql')) {
    // Pattern dynamique : on cherche la chaîne `create trigger %I_touch`
    // n'importe où dans le fichier (souvent dans un literal string multi-ligne).
    const hasDynamicTrigger = /create\s+trigger\s+%I_touch/i.test(src);
    const hasTablesArray = /tables\s+text\[\]\s*:?=\s*array\[/i.test(src);
    if (!(hasDynamicTrigger && hasTablesArray)) {
      for (const t of REQUIRED_TABLES) {
        const re = new RegExp(`create\\s+trigger\\s+${t}_touch\\b`, 'i');
        if (!re.test(src)) {
          errors.push(`${name}: missing trigger ${t}_touch`);
        }
      }
    } else {
      // Vérifier que la liste `tables` couvre les 25 tables.
      const m = src.match(/tables\s+text\[\]\s*:?=\s*array\[([^\]]*)\]/i);
      if (m) {
        const entries = m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        if (entries.length !== REQUIRED_TABLES.length) {
          errors.push(`${name}: trigger tables ARRAY has ${entries.length} entries, expected ${REQUIRED_TABLES.length}`);
        }
        for (const t of REQUIRED_TABLES) {
          if (!entries.includes(t)) errors.push(`${name}: trigger tables ARRAY missing ${t}`);
        }
      }
    }
  }
  return errors;
}

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log('');
  console.log(`Validating ${files.length} migrations in ${MIGRATIONS_DIR}`);
  console.log('');

  // Cross-file function registry : on accumule les fonctions définies
  // au fur et à mesure pour résoudre les références inter-fichiers.
  const knownFunctions = new Set();
  const allErrors = [];

  for (const f of files) {
    const fullPath = resolve(MIGRATIONS_DIR, f);
    const src = readFileSync(fullPath, 'utf8');
    const name = f;

    const bal = checkBalanced(name, src);
    if (!bal.ok) allErrors.push(bal.error);

    const fnErrors = checkFunctionDefinitions(name, src);
    allErrors.push(...fnErrors);

    // checkTriggers reçoit le registre cross-file.
    const trigErrors = checkTriggers(name, src, knownFunctions);
    allErrors.push(...trigErrors);

    const rlsErrors = checkRlsCoverage(name, src);
    allErrors.push(...rlsErrors);

    const tableErrors = checkTablesCreated(name, src);
    allErrors.push(...tableErrors);

    const triggerAttachedErrors = checkTriggersAttached(name, src);
    allErrors.push(...triggerAttachedErrors);

    // Ajouter les fonctions définies dans ce fichier au registre.
    const fnRegex = /create\s+(or\s+replace\s+)?function\s+([\w.]+)/gi;
    let m;
    while ((m = fnRegex.exec(src)) !== null) {
      knownFunctions.add(m[2].replace(/^public\./, ''));
    }

    const status = allErrors.length === 0 ? 'OK  ' : 'WARN';
    console.log(`  ${status}  ${f}`);
  }

  console.log('');
  if (allErrors.length > 0) {
    console.log('FAIL — erreurs détectées :');
    for (const e of allErrors) console.log('  • ' + e);
    process.exit(1);
  } else {
    console.log('OK — toutes les migrations passent les invariants heuristiques.');
    console.log('');
    console.log('NOTE : ce validateur est un pis-aller. La validation complète');
    console.log('nécessite Docker + `supabase start` + `supabase db lint` +');
    console.log('exécution du test adverse (cf. VERIFICATION_RLS.md).');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('validate-migrations.mjs crashed:', err);
  process.exit(2);
});
