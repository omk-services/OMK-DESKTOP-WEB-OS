/* ────────────────────────────────────────────────────────────────────────────
   Header — navigation multipage persistante
   ──────────────────────────────────────────────────────────────────────────── */

import { PAGES, SITE, type PageKey } from '../content';

export interface HeaderProps {
  active: PageKey;
}

export function Header({ active }: HeaderProps) {
  return (
    <header className="site-top" role="banner">
      <div className="site-top__inner">
        <a className="site-top__brand" href="/site/index.html" aria-label={`${SITE.name} — Accueil`}>
          <span className="site-top__mark" aria-hidden="true">C</span>
          <span>Coach <em>OS</em></span>
        </a>
        <nav className="site-top__nav" aria-label="Pages du site">
          {PAGES.map((p) => (
            <a
              key={p.key}
              href={p.href}
              aria-current={active === p.key ? 'page' : undefined}
            >
              {p.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
