/** ThemedSectionHead — copy locale de `SectionHead` depuis `components/AppFrame.tsx`.
 *
 *  Meme raison que `src/apps/it-rd/ThemedSectionHead.tsx` : le `SectionHead`
 *  canonique utilise `` / `` (Tailwind fige),
 *  invisibles sous les themes sombres.
 *
 *  Ontology n'a pas d'entree dans `CANONICAL_APP_THEMES`, elle herite du
 *  theme global. La QA signale le defaut sous `dark-oled` ; le meme
 *  probleme reapparait sous `aurora`, `cyberpunk`, `dark-oled` (tous
 *  sombres). Sous `warm-paper` (defaut clair) le ``
 *  reste lisible, donc le remplacement par `var(--theme-text)` ne
 *  degrade aucun theme clair.
 *
 *  Cf. FIX-2 brief : aligner ce qui est illisible sur ce qui l'est deja
 *  (les badges et compteurs utilisent deja `var(--theme-text)` /
 *  `var(--theme-muted)`).
 */
import type { ReactNode } from 'react';

export interface ThemedSectionHeadProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ThemedSectionHead({ title, subtitle, action }: ThemedSectionHeadProps): import('react').ReactNode {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2
          className="text-lg font-bold tracking-tight font-outfit"
          style={{ color: 'var(--theme-text)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
