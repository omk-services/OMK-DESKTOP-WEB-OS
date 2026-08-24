/** ThemedSectionHead — variante theme-aware de `SectionHead` (`components/AppFrame.tsx`).
 *
 *  Raison : le `SectionHead` canonique utilise des couleurs Tailwind figées
 *  (warm-paper-only). Sous les themes sombres (cyberpunk, dark-oled, aurora)
 *  ces couleurs sont quasi invisibles : `stone-900 = #1c1917` sur un fond
 *  sombre `#0a0a14` donne un contraste de 1.18:1 (WCAG AA exige 4.5:1).
 *
 *  Les couleurs :
 *    - titre      -> `var(--theme-text)`       = couleur la plus contrastee du theme
 *    - sous-titre -> `var(--theme-text-muted)` = secondaire lisible
 *  Aucune couleur en dur, aucun impact sur les autres apps.
 *
 *  Remonté depuis `apps/it-rd/` et `apps/_ui/ontology/` (doublons identiques) :
 *  toucher `AppFrame.tsx` directement reste hors périmètre pour l'instant. */
import type { ReactNode } from 'react';

export interface ThemedSectionHeadProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ThemedSectionHead({ title, subtitle, action }: ThemedSectionHeadProps): ReactNode {
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
