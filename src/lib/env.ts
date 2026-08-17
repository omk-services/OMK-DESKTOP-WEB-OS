/** env.ts — lire les variables `VITE_*` sans supposer qu'on tourne dans Vite.
 *
 *  POURQUOI CE FICHIER EXISTE
 *  `/api/v1/tools` rendait 500 `FUNCTION_INVOCATION_FAILED` en production.
 *  La route importe le catalogue d'outils, qui importe transitivement
 *  `src/lib/supabase.ts`, lequel faisait :
 *
 *      const url = import.meta.env.VITE_SUPABASE_URL
 *
 *  `import.meta.env` est une invention de Vite. Le bundler la remplace par un
 *  objet littéral au build du client. Mais une fonction serverless Vercel
 *  tourne en Node, où `import.meta` existe sans `.env` : la valeur est
 *  `undefined`, et lire `.VITE_SUPABASE_URL` dessus jette un `TypeError`
 *  avant la première ligne utile de la route.
 *
 *  Le build Vercel le disait, d'ailleurs, et personne ne le lisait :
 *  `src/lib/supabase.ts(7,25): error TS2339: Property 'env' does not exist on
 *  type 'ImportMeta'`. Le déploiement réussissait quand même — c'est
 *  l'INVOCATION qui échouait.
 *
 *  CE QUE ÇA NE FAIT PAS
 *  Ce helper ne rend pas les variables disponibles côté serveur : il rend leur
 *  ABSENCE inoffensive. Une fonction Vercel qui a besoin d'un secret doit lire
 *  `process.env`, pas `VITE_*` — ces dernières sont publiques par conception,
 *  embarquées dans le bundle client. */

/** L'objet d'environnement de Vite, ou un objet vide hors de Vite.
 *
 *  Vite remplace `import.meta.env` statiquement au build : l'expression
 *  ci-dessous devient un littéral côté client, et reste `undefined` côté Node.
 *  Le `??` absorbe le second cas. */
function envBrut(): Record<string, unknown> {
  const meta = import.meta as unknown as { env?: Record<string, unknown> };
  return meta.env ?? {};
}

/** Lit une variable d'environnement de build. Rend `undefined` si absente,
 *  jamais une exception — y compris dans un contexte Node. */
export function viteEnv(cle: string): string | undefined {
  const v = envBrut()[cle];
  return typeof v === 'string' ? v : undefined;
}

/** Vrai si la variable est présente et non vide. Utile pour les drapeaux du
 *  type « ce fournisseur est-il configuré ? » sans exposer la valeur. */
export function viteEnvDefinie(cle: string): boolean {
  const v = viteEnv(cle);
  return typeof v === 'string' && v.length > 0;
}

/** Le mode de build (`'development'` | `'production'` | …). `'production'`
 *  par défaut : hors de Vite, on suppose le contexte le plus strict. */
export function viteMode(): string {
  return viteEnv('MODE') ?? 'production';
}

/** Vrai en développement uniquement. Hors de Vite, c'est faux — un garde qui
 *  s'ouvre « en dev » ne doit jamais s'ouvrir par accident sur un serveur. */
export function estDev(): boolean {
  return envBrut().DEV === true;
}

/** Vrai dans un navigateur, faux dans une fonction serverless.
 *
 *  Pourquoi passer par `globalThis` plutôt qu'écrire `typeof window` :
 *  `api/tsconfig.json` ne charge PAS la lib DOM — c'est voulu, ces fonctions
 *  tournent dans Node. Le nom `window` y est donc inconnu du vérificateur, et
 *  même `typeof window` déclenche un `TS2304: Cannot find name 'window'`.
 *  `globalThis.window` se type sans la lib DOM et se comporte pareil à
 *  l'exécution. */
export function estNavigateur(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== 'undefined';
}
