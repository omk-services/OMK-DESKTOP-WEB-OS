/* ────────────────────────────────────────────────────────────────────────────
   Footer — pied de page partagé entre les 5 pages
   ──────────────────────────────────────────────────────────────────────────── */

import { PAGES } from '../content';

export function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span>Coach OS — pour coach qui facture 500 à 2000 $/h</span>
        <nav className="site-footer__nav" aria-label="Liens du pied de page">
          {PAGES.filter((p) => p.key !== 'index').map((p) => (
            <a key={p.key} href={p.href}>{p.label}</a>
          ))}
          <a href="/">Application</a>
        </nav>
      </div>
    </footer>
  );
}
