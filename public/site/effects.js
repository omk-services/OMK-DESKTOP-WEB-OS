/* ────────────────────────────────────────────────────────────────────────────
   Coach OS — site /site/ · effets interactifs
   Campagne 2026-08-11 — agent K

   1. Lien actif dans l'en-tête selon le chemin courant.
   2. Lien actif dans la sous-nav (IntersectionObserver).

   PURGE DU 2026-08-13 — ce fichier faisait 536 lignes. Les 419 lignes
   supprimees montaient sept effets Canvas 2D ecrits a la main dans les
   conteneurs [data-fx] : decrypt, liquid, particle, glass-overlay, shatter,
   grid, glyph-rain. Ils portaient les noms de composants Canvas UI que
   personne n'avait installes.

   Le balisage [data-fx] avait ete retire des cinq pages le 2026-08-11 : la
   machinerie ne montait donc plus rien depuis deux jours, mais elle partait
   toujours chez chaque visiteur. Un mort qui voyage n'est pas un mort.

   Il reste des regles `.fx-*` dans styles.css (21 lignes, dix blocs) : elles
   ne selectionnent plus rien et tombent a la passe suivante sur ce fichier.

   Pas de framework, pas de dépendance.
   ──────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Lien actif dans l'en-tête ────────────────────────────────────────

  function markActiveTopLink() {
    const path = window.location.pathname.replace(/\/$/, '');
    const links = document.querySelectorAll('.site-top__nav a');
    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      const normalized = href.replace(/\/$/, '');
      const isHome = (path === '/site' || path === '/site/' || path.endsWith('/site/index.html'));
      const linkIsHome = (normalized === '/site' || normalized === '/site/' || normalized.endsWith('/site/index.html') || normalized === '');
      if (isHome && linkIsHome) {
        a.setAttribute('aria-current', 'page');
      } else if (normalized && path.endsWith(normalized.replace(/^\/site/, ''))) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  // ── 2. Lien actif dans la sous-nav (IntersectionObserver) ───────────────

  function wireSubnav() {
    const subnavLinks = Array.from(document.querySelectorAll('.site-subnav a'));
    if (!subnavLinks.length) return;

    const targets = subnavLinks
      .map((a) => {
        const id = (a.getAttribute('href') || '').replace(/^#/, '');
        return { link: a, el: id ? document.getElementById(id) : null };
      })
      .filter((t) => t.el);

    if (!targets.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      const first = targets[0];
      if (first) first.link.setAttribute('aria-current', 'true');
      return;
    }

    function recompute() {
      const viewportH = window.innerHeight;
      const scores = targets.map(({ el }) => {
        const r = el.getBoundingClientRect();
        const visibleBottom = Math.min(viewportH, r.bottom);
        const visible = Math.max(0, visibleBottom - Math.max(0, r.top));
        const inView = r.top < viewportH && r.bottom > 0;
        return { id: el.id, visible, inView, top: r.top };
      });
      const visible = scores.filter((s) => s.inView && s.visible > 0);
      if (visible.length === 0) return;
      visible.sort((a, b) => Math.abs(a.top + 50) - Math.abs(b.top + 50));
      const winnerId = visible[0].id;
      targets.forEach(({ link, el }) => {
        if (el.id === winnerId) {
          if (link.getAttribute('aria-current') !== 'true') {
            link.setAttribute('aria-current', 'true');
          }
        } else if (link.getAttribute('aria-current') === 'true') {
          link.removeAttribute('aria-current');
        }
      });
    }

    let scheduled = false;
    function onScroll() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        recompute();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    setTimeout(recompute, 0);
  }

  // ── 4. Initialisation ───────────────────────────────────────────────────

  function init() {
    markActiveTopLink();
    wireSubnav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();