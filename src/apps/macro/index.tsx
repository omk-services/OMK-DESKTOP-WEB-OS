/** Macro app — squelette.
 *
 *  Placeholder pour le Sandbox Gateway des 8 domaines G1-G8. Le contenu
 *  réel (sidebar des domaines, terminal par agent, branchement aux
 *  Observers) n'est pas code ici : c'est un mini-shell dans le shell,
 *  et il y a 5 decisions de design a prendre avant (voir BRIEF_MACRO).
 *
 *  Ce que ce fichier fait aujourd'hui :
 *   - declare un manifest que `import.meta.glob` de `src/apps/registry.ts`
 *     va decouvrir automatiquement (le dock affichera l'icone mauve) ;
 *   - expose un composant qui rend un panneau "TODO" avec les 5
 *     questions explicites, pour qu'on n'oublie pas le contrat en
 *     attendant la vraie implementation ;
 *   - passe le typecheck et la baseline 209/211, sans ajouter de
 *     logique metier.
 *
 *  Type : `multi` (plusieurs fenetres, comme Observateurs) — un coach
 *  peut avoir plusieurs sessions d'agents ouvertes en parallele.
 */

export function MacroApp(): import('react').ReactNode {
  return (
    <div className="flex flex-col h-full text-sm p-6 gap-4 overflow-auto">
      <header>
        <h2 className="font-semibold text-base">Macro — Sandbox Gateway</h2>
        <p className="text-xs text-[var(--theme-text-dim)]">
          Placeholder. 5 decisions de design a prendre avant l'implementation.
        </p>
      </header>

      <ol className="flex flex-col gap-3 text-xs text-[var(--theme-text)]">
        <li>
          <strong className="text-[var(--theme-text)]">Q1.</strong> Quel mode d'isolation ?
          <div className="text-[var(--theme-text-dim)]">
            Sandbox OS (Docker) — Web Worker — iframe sandboxee — aucun.
            La reponse determine le risque d'un agent qui casse le bureau.
          </div>
        </li>
        <li>
          <strong className="text-[var(--theme-text)]">Q2.</strong> Quel modele de permissions ?
          <div className="text-[var(--theme-text-dim)]">
            Comment un agent Macro accede aux donnees coach-os (lecture /
            ecriture / propose-only). Voir BRIEF_MEMBERSHIPS — l'acces
            Macro depend du role membership dans le tenant.
          </div>
        </li>
        <li>
          <strong className="text-[var(--theme-text)]">Q3.</strong> Persistance des sessions terminal ?
          <div className="text-[var(--theme-text-dim)]">
            Replay apres fermeture ? Export en log ? Retention 30j ?
            Les Observers (agentpulse, AIOS, agents-observe) produisent
            deja des evenements ; on les agrege ou on les garde separe ?
          </div>
        </li>
        <li>
          <strong className="text-[var(--theme-text)]">Q4.</strong> Branchement Observers — 11 entrees ?
          <div className="text-[var(--theme-text-dim)]">
            opik, agentpulse, AIOS, agents-observe, agent-super-spy,
            langsmith, phoenix, pocketbase-vec, super-simple-software-factory.
            PostHog n'est PAS dans REGISTRY.json (verifie le 2026-08-15).
          </div>
        </li>
        <li>
          <strong className="text-[var(--theme-text)]">Q5.</strong> Comment on tue un agent qui boucle ?
          <div className="text-[var(--theme-text-dim)]">
            Sans garde, un agent en boucle sature le CPU. Voir BRIEF_W13
            (quotas) — la garde existe, mais Macro doit l'integrer
            visuellement (badge rouge + kill switch).
          </div>
        </li>
      </ol>

      <footer className="text-[10px] text-[var(--theme-text-muted)] mt-auto pt-4 border-t border-white/5">
        Squelette pose 2026-08-15 — voir <code>BRIEF_MACRO.md</code> (a ecrire)
        pour les decisions.
      </footer>
    </div>
  );
}

export const manifest = {
  id: 'macro',
  name: 'Macro',
  kind: 'multi' as const,
  description:
    'Sandbox Gateway des 8 domaines G1-G8 : sidebar des domaines, terminal par agent, branchement Observers.',
  icon: '◆',
};
