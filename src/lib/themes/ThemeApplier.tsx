/** ThemeApplier — applies the current global theme's CSS variables to :root.
 *  Mounted once at the App level. Re-applies whenever globalTheme changes.
 *  The per-app theme is applied by the AppFrame (so each window gets its own
 *  scoped :root CSS variables on its inner content). */

import { useEffect } from 'react';
import { useThemeStore, applyThemeTokens } from './store';
import { THEMES } from './tokens';

export function ThemeApplier() {
  const globalTheme = useThemeStore((s) => s.globalTheme);

  useEffect(() => {
    const root = document.documentElement;
    const tokens = THEMES[globalTheme] ?? THEMES['warm-paper'];
    applyThemeTokens(root, tokens);
    // Mark the data-theme attribute for CSS hooks (e.g. light vs dark selectors)
    root.setAttribute('data-theme', globalTheme);
    root.setAttribute('data-theme-dark', tokens.isDark ? 'true' : 'false');
  }, [globalTheme]);

  return null;
}
