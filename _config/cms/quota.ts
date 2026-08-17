// _config/cms/quota.ts
// Seuils par défaut du rate-limit par tenant (campagne 2026-08-15, W13).
//
// Ce fichier vit à la racine du dépôt (sous `_config/`), pas dans `src/` :
// c'est de la configuration, pas du code de domaine. Les valeurs sont
// volontairement **basses** : un humain ne dépose pas 12 propositions par
// minute ; un agent, si. L'objectif de W13 est de faire apparaître un
// signal avant qu'un appelant authentifié sature le store.
//
// La persistance de ces seuils est volontairement triviale : exporter une
// constante. La V2 lira Supabase par tenant ; ce fichier sera alors
// remplacé par un lookup dans une table `quota_policies`.

/** Limites du compteur par tenant. Chaque compteur est isolé par
 *  `(tenantId, action)` — un tenant qui sature ne bloque pas les
 *  autres (cf. test 3 dans `quota.test.ts`). */
export const QUOTA_DEFAULTS = {
  /** Écritures génériques sur le store (items, collections…)
   *  par tenant par fenêtre. 60/min = 1/sec — au-dessus, c'est un
   *  script ou un agent, pas un humain. */
  writes_per_minute: 60,
  /** Propositions déposées par tenant par fenêtre. 12/min = une
   *  toutes les 5 secondes ; c'est plus strict que les écritures
   *  parce qu'une proposition est l'unité côté humain. */
  proposals_per_minute: 12,
  /** Fenêtre coulissante (sliding window), en secondes. Le compteur
   *  garde les timestamps des dernières écritures dans cette fenêtre
 *  et les purge à chaque `check()`. */
  window_seconds: 60,
} as const;

/** Type of the quota actions — gardé ici pour que la config et le
 *  code partagent la même string-union. Une nouvelle action = ajouter
 *  un littéral ici et une limite dans `QUOTA_DEFAULTS`. */
export type QuotaAction = 'write' | 'proposal';

/** Limite par action — la forme que `QuotaRegistry.check` attend. */
export interface QuotaLimit {
  /** Nombre maximal d'événements dans la fenêtre. */
  readonly max: number;
  /** Taille de la fenêtre, en secondes. */
  readonly windowSeconds: number;
}

/** Construit la `QuotaLimit` pour une action donnée à partir des
 *  défauts. Le helper vit dans la config pour qu'un changement de
 *  seuil (ex. hausse après mise en prod) reste un fichier plat. */
export function quotaLimitFor(action: QuotaAction): QuotaLimit {
  switch (action) {
    case 'write':
      return { max: QUOTA_DEFAULTS.writes_per_minute, windowSeconds: QUOTA_DEFAULTS.window_seconds };
    case 'proposal':
      return { max: QUOTA_DEFAULTS.proposals_per_minute, windowSeconds: QUOTA_DEFAULTS.window_seconds };
  }
}
