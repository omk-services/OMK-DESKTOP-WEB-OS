// src/lib/saas-builder/ledger.export.ts
// Export markdown du ledger. Format inspire de generate.py:83-102 dans
// le kit Bench Studio Ownership (append + recount du Running total).

import type { LedgerEntry } from './ledger.store';

/** Tronque un texte a 60 chars (cf. generate.py:85 dans le kit). */
function snippet(s: string): string {
  return s.length > 60 ? s.slice(0, 60) + '...' : s;
}

/** Formate une entree en ligne markdown. */
function rowMarkdown(e: LedgerEntry): string {
  const approx = e.costConfidence === 'verified' ? '' : e.costConfidence === 'estimated' ? '~est' : '~';
  const date = e.ts.slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:MM
  return `| ${date} | ${e.routeId} | ${snippet(e.promptSnippet)} | ${e.outputPath} | ${approx}$${e.costUsd.toFixed(3)} |`;
}

/** Genere le markdown complet du ledger, avec en-tete et Running
 *  total. Le total est recalcule a chaque appel (cf. generate.py:99 :
 *  pas d'agregation incrementale). */
export function ledgerMarkdown(entries: readonly LedgerEntry[]): string {
  const lines: string[] = [
    '# SaaS Builder — Generation Ledger',
    '',
    '| Timestamp | Route | Prompt | Output | Est. cost |',
    '|---|---|---|---|---|',
  ];
  for (const e of entries) {
    lines.push(rowMarkdown(e));
  }
  const total = entries.reduce((s, e) => s + e.costUsd, 0);
  lines.push('');
  lines.push(`**Running total: $${total.toFixed(3)}** (routes with 'estimated' confidence are catalogue prices, not final billed amounts)`);
  return lines.join('\n');
}
