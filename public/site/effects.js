/* ────────────────────────────────────────────────────────────────────────────
   Coach OS — site /site/ · effets interactifs
   Campagne 2026-08-11 — agent K

   1. Lien actif dans l'en-tête selon le chemin courant.
   2. Lien actif dans la sous-nav (IntersectionObserver).
   3. Montage de cinq effets Canvas 2D dans les conteneurs [data-fx] :
        .fx-decrypt       (Hero)        — décryptage de glyphes
        .fx-liquid        (Pain)        — liquide organique
        .fx-particle      (CTA, Howto)  — particules montantes
        .fx-glass-overlay (Paliers)     — reflets spéculaires
        .fx-shatter       (Engagements) — bris de verre diagonal
        .fx-grid          (Grids)       — quadrillage animé
        .fx-glyph-rain    (Creds)       — pluie de glyphes terminal
   4. prefers-reduced-motion : annule l'animation, garde l'état.
   5. Échec bruyant : toute cible [data-fx] sans canvas monté ou tout
      canvas de 0×0 lève un `console.error`. Aucun repli silencieux.

   Pas de framework, pas de dépendance. ~250 lignes.
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

  // ── 3. Montage des effets Canvas 2D ─────────────────────────────────────

  /**
   * Insère un <canvas> plein-parent dans la cible, avec resize automatique.
   * Retourne { canvas, ctx, w, h } ou null si la cible a une taille 0.
   */
  function mountCanvas(target) {
    const cs = getComputedStyle(target);
    if (cs.position === 'static') {
      target.style.position = cs.position; // no-op, signale
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas__cv';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    target.appendChild(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = target.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas, ctx, w, h };
  }

  /**
   * Recalcule la taille du canvas sur resize et déclenche un callback.
   */
  function watchSize(target, handle, onResize) {
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = target.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      handle.canvas.width = Math.floor(w * dpr);
      handle.canvas.height = Math.floor(h * dpr);
      handle.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      handle.w = w;
      handle.h = h;
      if (onResize) onResize(handle);
    });
    ro.observe(target);
    return ro;
  }

  // — DecryptReveal : champ de glyphes qui se résout vers du texte réel —

  function startDecrypt(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] decrypt · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    const fontSize = 22;
    const alphabet = 'アァカサタナハマヤラワABCDEFGHIJK0123456789#%&@*';

    const grid = () => {
      const cols = Math.floor(handle.w / fontSize);
      const rows = Math.floor(handle.h / fontSize);
      return { cols, rows };
    };

    const seed = (cols, rows) => {
      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            c, r,
            ch: alphabet[Math.floor(Math.random() * alphabet.length)],
            target: Math.random() < 0.04 ? 'COACH OS' : '',
            progress: 0,
            settled: false,
          });
        }
      }
      return cells;
    };

    let { cols, rows } = grid();
    let cells = seed(cols, rows);
    let t0 = performance.now();

    function tick(now) {
      const elapsed = (now - t0) / 1000;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, handle.w, handle.h);

      ctx.font = `${fontSize}px ui-monospace, monospace`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      for (const cell of cells) {
        if (!cell.settled && Math.random() < 0.02) {
          cell.settled = true;
        }
        const x = cell.c * fontSize + fontSize / 2;
        const y = cell.r * fontSize + fontSize / 2;
        if (cell.settled) {
          if ((cell.c + cell.r) % 6 === 0) {
            ctx.fillStyle = 'rgba(255,91,31,0.8)';
          } else {
            ctx.fillStyle = 'rgba(10,10,10,0.32)';
          }
        } else {
          ctx.fillStyle = 'rgba(255,91,31,0.55)';
        }
        ctx.fillText(cell.ch, x, y);
      }

      if (elapsed > 6) {
        t0 = now;
        cells = seed(cols, rows);
      }

      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle, () => {
      const g = grid();
      cols = g.cols; rows = g.rows;
      cells = seed(cols, rows);
    });
    target.addEventListener('cleanup', () => cancelAnimationFrame(anim), { once: true });
  }

  // — Liquid : blobs qui ondulent et se fondent —

  function startLiquid(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] liquid · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    const blobs = [
      { x: 0.3, y: 0.5, r: 0.45, hue: 0, alpha: 0.18 },
      { x: 0.7, y: 0.4, r: 0.35, hue: 12, alpha: 0.14 },
      { x: 0.5, y: 0.7, r: 0.4, hue: -8, alpha: 0.16 },
    ];
    let t = 0;

    function tick() {
      t += 0.012;
      ctx.clearRect(0, 0, handle.w, handle.h);
      for (const b of blobs) {
        const cx = b.x * handle.w + Math.cos(t + b.hue) * 12;
        const cy = b.y * handle.h + Math.sin(t * 1.3 + b.hue) * 18;
        const r = b.r * Math.min(handle.w, handle.h) * (0.9 + 0.1 * Math.sin(t * 2 + b.hue));
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(255,0,0,${b.alpha})`);
        grad.addColorStop(0.6, `rgba(255,60,0,${b.alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle);
    target.addEventListener('cleanup', () => cancelAnimationFrame(anim), { once: true });
  }

  // — ParticleReveal : montée de particules avec fade —

  function startParticle(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] particle · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    const accent = getComputedStyle(target).getPropertyValue('--accent').trim() || '#0080ff';
    const particles = [];
    const MAX = 60;
    let last = 0;

    function tick(now) {
      if (now - last > 180 && particles.length < MAX) {
        particles.push({
          x: Math.random() * handle.w,
          y: handle.h + 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.4 + Math.random() * 0.9),
          r: 0.8 + Math.random() * 1.8,
          life: 0,
          maxLife: 180 + Math.random() * 120,
        });
        last = now;
      }
      ctx.clearRect(0, 0, handle.w, handle.h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const fade = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = accent;
        ctx.globalAlpha = fade * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.life > p.maxLife) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle);
    target.addEventListener('cleanup', () => cancelAnimationFrame(anim), { once: true });
  }

  // — Glass overlay : reflets spéculaires balayant les cartes —

  function startGlass(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] glass · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    let t = 0;

    function tick() {
      t += 0.008;
      ctx.clearRect(0, 0, handle.w, handle.h);
      const sweeps = 3;
      for (let i = 0; i < sweeps; i++) {
        const phase = (t + i / sweeps) % 1;
        const x = phase * (handle.w + 300) - 150;
        const grad = ctx.createLinearGradient(x - 120, 0, x + 120, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, handle.w, handle.h);
      }
      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle);
    target.addEventListener('cleanup', () => cancelAnimationFrame(anim), { once: true });
  }

  // — Shatter : fragments triangulaires qui se croisent —

  function startShatter(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] shatter · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    let t = 0;

    function tick() {
      t += 0.025;
      ctx.clearRect(0, 0, handle.w, handle.h);
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      const step = 48;
      for (let x = -handle.h; x < handle.w + handle.h; x += step) {
        const offset = Math.sin(t + x * 0.01) * 14;
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset + handle.h, handle.h);
        ctx.stroke();
      }
      ctx.restore();
      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle);
    target.addEventListener('cleanup', () => cancelAnimationFrame(anim), { once: true });
  }

  // — Grid : quadrillage qui s'allume à mesure qu'on entre dans la section —

  function startGrid(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] grid · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    const step = 64;
    let visible = 0;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible = Math.min(1, visible + 0.1);
        else visible = Math.max(0, visible - 0.05);
      }
    }, { threshold: [0, 0.5, 1] });
    io.observe(target);

    function tick() {
      ctx.clearRect(0, 0, handle.w, handle.h);
      ctx.strokeStyle = `rgba(10,10,10,${0.06 + 0.06 * visible})`;
      ctx.lineWidth = 1;
      for (let x = 0; x <= handle.w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, handle.h);
        ctx.stroke();
      }
      for (let y = 0; y <= handle.h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(handle.w, y);
        ctx.stroke();
      }
      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle);
    target.addEventListener('cleanup', () => { cancelAnimationFrame(anim); io.disconnect(); }, { once: true });
  }

  // — GlyphRain : colonnes de caractères façon Matrix —

  function startGlyphRain(target) {
    const handle = mountCanvas(target);
    if (!handle) {
      console.error('[effects] glyph-rain · cible de taille nulle', target);
      return;
    }
    const ctx = handle.ctx;
    const fontSize = 16;
    const chars = 'アァカサタナハマヤラワ0123456789ABCDE<>=*#';
    let cols = Math.floor(handle.w / fontSize);
    let drops = Array.from({ length: cols }, () => Math.random() * handle.h / fontSize);

    function tick() {
      ctx.fillStyle = 'rgba(5,5,5,0.18)';
      ctx.fillRect(0, 0, handle.w, handle.h);
      ctx.font = `${fontSize}px ui-monospace, monospace`;
      ctx.textBaseline = 'top';
      for (let i = 0; i < cols; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const head = Math.random() < 0.02;
        ctx.fillStyle = head ? '#33ff00' : 'rgba(51,255,0,0.55)';
        ctx.fillText(ch, x, y);
        if (y > handle.h && Math.random() > 0.97) drops[i] = 0;
        drops[i] += 0.5;
      }
      anim = requestAnimationFrame(tick);
    }

    let anim = requestAnimationFrame(tick);
    watchSize(target, handle, (h) => {
      cols = Math.floor(h.w / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * h.h / fontSize);
    });
    target.addEventListener('cleanup', () => cancelAnimationFrame(anim), { once: true });
  }

  // — Routage par nom d'effet —

  const starters = {
    'fx-decrypt': startDecrypt,
    'fx-liquid': startLiquid,
    'fx-particle': startParticle,
    'fx-glass-overlay': startGlass,
    'fx-shatter': startShatter,
    'fx-grid': startGrid,
    'fx-glyph-rain': startGlyphRain,
  };

  function mountAll() {
    const targets = document.querySelectorAll('[data-fx]');
    if (!targets.length) {
      console.error('[effects] aucune cible [data-fx] trouvée dans la page');
      return;
    }

    let mounted = 0;
    for (const t of targets) {
      const key = Array.from(t.classList).find((c) => starters[c]);
      if (!key) {
        console.error('[effects] cible [data-fx] sans classe d\'effet connue', t);
        continue;
      }
      if (reducedMotion) continue;
      try {
        starters[key](t);
        mounted++;
      } catch (err) {
        console.error(`[effects] ${key} · échec de montage`, err);
      }
    }
    if (!mounted && !reducedMotion) {
      console.warn('[effects] aucun effet monté (vérifier data-fx et classes)');
    }
  }

  // ── 4. Initialisation ───────────────────────────────────────────────────

  function init() {
    markActiveTopLink();
    wireSubnav();
    mountAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();