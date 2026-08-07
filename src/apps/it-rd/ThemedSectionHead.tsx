/** ThemedSectionHead — copy locale de `SectionHead` depuis `components/AppFrame.tsx`.
 *
 *  Raison : le `SectionHead` canonique utilise `text-stone-900` / `text-stone-500`
 *  (Tailwind fige, warm-paper-only). Sous le theme cyberpunk (canonique pour
 *  it-rd) ces couleurs sont quasi invisibles : `stone-900 = #1c1917` sur le
 *  fond cyberpunk `bg = #0a0a14` donne un contraste de 1.18:1 (WCAG AAA
 *  exige 7:1, AA exige 4.5:1). Le `components/AppFrame.tsx` est hors
 *  perimetre de cette vague (autre agent y travaille), donc on duplique
 *  la primitive avec des variables de theme ici.
 *
 *  Les couleurs :
 *    - titre   -> `var(--theme-text)`       = couleur la plus contrastee du theme
 *    - sous-titre -> `var(--theme-text-muted)` = secondaire lisible
 *  Aucune couleur en dur, aucun impact sur les autres apps.
 *
 *  Cf. FIX-2 brief : aligner ce qui est illisible sur ce qui l'est deja
 *  (les badges et compteurs utilisent deja `var(--theme-text)` /
 *  `var(--theme-muted)` et sont parfaitement lisibles).
 */
import type { ReactNode } from 'react';

export interface ThemedSectionHeadProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ThemedSectionHead({ title, subtitle, action }: ThemedSectionHeadProps): JSX.Element {
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
