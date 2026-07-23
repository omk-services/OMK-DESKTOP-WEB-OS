/** Maps a badge's raw text to a semantic tone — shared by CollectionRepeater
 *  (list view) and DynamicPageView (detail view) so a status pill reads the
 *  same color everywhere instead of a flat neutral/accent regardless of value. */
export function badgeTone(value: string): { bg: string; fg: string } {
  const v = value.toLowerCase();
  if (/(active|done|paid|resolved|installed|live|shipped|won|healthy|breakthrough)/.test(v)) return { bg: '#dcfce7', fg: '#15803d' };
  if (/(onboarding|pending|in progress|draft|upcoming|review|scheduled|watch)/.test(v)) return { bg: '#fef3c7', fg: '#b45309' };
  if (/(risk|overdue|failed|churn|blocked|lost|urgent|at risk)/.test(v)) return { bg: '#fee2e2', fg: '#b91c1c' };
  return { bg: '#f5f5f4', fg: '#57534e' };
}
