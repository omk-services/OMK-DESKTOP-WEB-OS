/**
 * tools/site-rail.mjs — vérifie la transformation du site en rail latéral.
 * Périmètre coach-os/tools/ — campagne 2026-08-11 (agent O).
 *
 * Pour chaque page des 5 du site, à deux largeurs (1440 et 900) :
 *   1. À 1440 px — le rail existe avec une largeur dans [200, 260] px
 *      et <main> ainsi que tous ses <section> enfants directs démarrent
 *      à `rect.left >= rail.right` (pas de contenu sous le rail).
 *   2. À 900 px — le rail est redevenu horizontal : `rect.height < 120`
 *      et `rect.width ≈ viewport.width`. <main> n'a plus de margin-left
 *      significatif.
 *   3. Lisibilité du hero (index.html, 1440 px) — le titre #hero-title
 *      n'est pas recouvert par un .fx-canvas actif. On mesure l'intersection
 *      géométrique ; si elle est non vide, le canvas doit avoir un mask-
 *      image radial qui évide la colonne de texte. La zone de texte est
 *      considérée lisible si l'intersection tombe dans la zone transparente
 *      du masque.
 *   4. Zéro erreur console, zéro requête échouée sur les 5 pages × 2
 *      largeurs.
 *
 * Sortie : JSON dans _verify_proofs/site-rail.json.
 * Code    : 0 si tous les seuils sont atteints.
 *           1 si un seuil échoue.
 *           2 si playwright introuvable.
 *
 * Usage :
 *   node tools/site-rail.mjs [--base=http://127.0.0.1:5173]
 *                            [--out=_verify_proofs/site-rail.json]
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf('--' + n);
  return i === -1 ? d : (args[i + 1] ?? true);
};

const BASE = arg('--base', 'http://127.0.0.1:5173');
const OUT = arg('--out', '_verify_proofs/site-rail.json');
const CAPTURE_DIR = arg('--capture-dir', path.join(tmpdir(), 'rail'));

const PAGES = [
  { id: 'home',        path: '/site/index.html' },
  { id: 'methode',     path: '/site/methode.html' },
  { id: 'paliers',     path: '/site/paliers.html' },
  { id: 'engagements', path: '/site/engagements.html' },
  { id: 'demo',        path: '/site/demo.html' },
];

const RAIL_W_MIN = 200;
const RAIL_W_MAX = 260;
const RAIL_W_TARGET = 240;
const RAIL_W_TOLERANCE = 4;

const CANDIDATS = [
  path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  path.join(process.cwd(), 'node_modules', 'playwright', 'index.js'),
];
const trouve = CANDIDATS.find(existsSync);
if (!trouve) {
  console.error('playwright introuvable. Installer :');
  console.error('  mkdir -p ~/gauntlet-eyes && cd ~/gauntlet-eyes && npm i playwright');
  console.error('  npx playwright install chromium');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const browser = await chromium.launch();

function rectsIntersect(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function rectIntersection(a, b) {
  const x = Math.max(a.left, b.left);
  const y = Math.max(a.top, b.top);
  const w = Math.min(a.right, b.right) - x;
  const h = Math.min(a.bottom, b.bottom) - y;
  if (w <= 0 || h <= 0) return null;
  return { left: x, top: y, right: x + w, bottom: y + h, width: w, height: h };
}

function relativeLuminance(rgb) {
  // rgb is [r, g, b] 0..255.
  const srgb = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function parseRGB(color) {
  // Accepte hex (#abc, #aabbcc) ou rgb()/rgba().
  if (color.startsWith('#')) {
    let h = color.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(parseRGB(fg));
  const L2 = relativeLuminance(parseRGB(bg));
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

const report = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  captures: [],
  pages: {},
};

let totalErrors = 0;
const allVerdicts = { rail: true, mainOffset: true, sectionsClear: true, mobile: true, hero: true, console: true };

mkdirSync(CAPTURE_DIR, { recursive: true });
mkdirSync(path.dirname(OUT), { recursive: true });

const PALIERS_FOOTER_HACK = 'sec-paliers-ftr';

for (const p of PAGES) {
  const pageReport = {
    console: [],
    requestFails: [],
    rail1440: null,
    mainOffset1440: null,
    sectionsClear1440: null,
    rail900: null,
    mainOffset900: null,
    hero: null,
  };

  // ── 1440 px ─────────────────────────────────────────────────────────────
  {
    const viewport = { width: 1440, height: 900 };
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const requestFails = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.endsWith('/favicon.ico')) return;
      requestFails.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
    });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror ${e}`));

    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const dims = await page.evaluate(() => {
      function rect(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      }
      const rail = document.querySelector('.site-top');
      const main = document.querySelector('main');
      const sections = main ? Array.from(main.querySelectorAll(':scope > section, :scope > .site-section')) : [];
      const subs = document.querySelector('.site-subnav');
      const footer = document.querySelector('.site-footer');
      return {
        rail: rect(rail),
        main: rect(main),
        sections: sections.map((s) => rect(s)),
        subnav: rect(subs),
        footer: rect(footer),
        doc: { width: document.documentElement.clientWidth, height: document.documentElement.scrollHeight },
      };
    });

    const railW = dims.rail?.width ?? 0;
    const rail1440 = {
      width: railW,
      minOk: RAIL_W_MIN <= railW,
      maxOk: railW <= RAIL_W_MAX,
      targetHit: Math.abs(railW - RAIL_W_TARGET) <= RAIL_W_TOLERANCE,
    };
    pageReport.rail1440 = rail1440;
    if (!rail1440.minOk || !rail1440.maxOk) allVerdicts.rail = false;

    const mainOffset = dims.main ? (dims.main.left - (dims.rail?.right ?? 0)) : -Infinity;
    const mainOffset1440 = {
      mainLeft: dims.main?.left ?? null,
      railRight: dims.rail?.right ?? null,
      gap: mainOffset,
      ok: mainOffset >= -1,
    };
    pageReport.mainOffset1440 = mainOffset1440;
    if (!mainOffset1440.ok) allVerdicts.mainOffset = false;

    const sectionsClear = dims.sections.map((s) => {
      if (!s || !dims.rail) return { ok: true };
      const gap = s.left - dims.rail.right;
      return { left: s.left, railRight: dims.rail.right, gap, ok: gap >= -1 };
    });
    const sectionsClear1440 = {
      ok: sectionsClear.every((s) => s.ok),
      sections: sectionsClear,
    };
    pageReport.sectionsClear1440 = sectionsClear1440;
    if (!sectionsClear1440.ok) allVerdicts.sectionsClear = false;

    if (p.id === 'home') {
      // Lisibilité du hero — intersection géométrique + contraste.
      const hero = await page.evaluate(() => {
        function rect(el) {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        }
        const title = document.getElementById('hero-title');
        const lead = title ? title.parentElement.querySelector('.site-lead') : null;
        const fx = document.querySelector('.sec-hero .fx-canvas');
        const cs = (el) => el ? getComputedStyle(el) : null;
        const csTitle = cs(title);
        const csLead = cs(lead);
        const csFx = cs(fx);
        return {
          title: rect(title),
          lead: rect(lead),
          fx: rect(fx),
          titleColor: csTitle?.color,
          leadColor: csLead?.color,
          fxMask: csFx?.maskImage || csFx?.webkitMaskImage || csFx?.['-webkit-mask-image'],
          fxOpacity: csFx?.opacity,
        };
      });
      let titleUnderCanvas = false;
      let heroFxIntersectsTitle = false;
      let heroFxIntersectsLead = false;
      let heroIntersection = null;
      if (hero.fx && hero.title) {
        if (rectsIntersect(hero.fx, hero.title)) {
          heroFxIntersectsTitle = true;
          heroIntersection = rectIntersection(hero.fx, hero.title);
        }
        if (hero.lead && rectsIntersect(hero.fx, hero.lead)) {
          heroFxIntersectsLead = true;
        }
      }
      // Le canvas peut être masqué de deux façons :
      //  - radial-gradient — on accepte l'intersection si le centre de l'ellipse
      //    transparente est près du centre du titre ;
      //  - linear-gradient — on lit les paliers de transparence et on
      //    vérifie que le rectangle du titre est entièrement dans la
      //    bande transparente.
      const hasRadial = hero.fxMask && /radial-gradient/.test(hero.fxMask);
      const hasLinear = hero.fxMask && /linear-gradient/.test(hero.fxMask);
      const hasMask = hasRadial || hasLinear;

      const linearBands = (() => {
        if (!hasLinear) return null;
        // Stop sequence: "<color> <pct>%". Couleur peut être :
        //   transparent, #rgb, #rrggbb, rgb(...), rgba(...).
        const stops = [];
        const re = /(transparent|rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})[ ,]+(\d+(?:\.\d+)?)%/g;
        let m;
        while ((m = re.exec(hero.fxMask)) !== null) {
          const color = m[1];
          const isTransparent = color === 'transparent'
            || /rgba\([^)]*,\s*0\s*\)/.test(color);
          stops.push({ color, isTransparent, pos: Number(m[2]) });
        }
        const bands = [];
        for (let i = 0; i < stops.length - 1; i++) {
          if (stops[i].isTransparent && stops[i + 1].isTransparent) {
            bands.push({ start: stops[i].pos, end: stops[i + 1].pos });
          }
        }
        return bands;
      })();

      const titleInLinearBand = (() => {
        if (!linearBands || !hero.title || !hero.fx) return null;
        const fxTop = hero.fx.top;
        const fxH = hero.fx.height;
        const titleTopRel = ((hero.title.top - fxTop) / fxH) * 100;
        const titleBottomRel = ((hero.title.bottom - fxTop) / fxH) * 100;
        const inBand = linearBands.some((b) => b.start <= titleTopRel && b.end >= titleBottomRel);
        const inBandObj = { topRel: titleTopRel, bottomRel: titleBottomRel };
        return inBand;
      })();

      const leadInLinearBand = (() => {
        if (!linearBands || !hero.lead || !hero.fx) return null;
        const fxTop = hero.fx.top;
        const fxH = hero.fx.height;
        const leadTopRel = ((hero.lead.top - fxTop) / fxH) * 100;
        const leadBottomRel = ((hero.lead.bottom - fxTop) / fxH) * 100;
        return linearBands.some((b) => b.start <= leadTopRel && b.end >= leadBottomRel);
      })();

      const titleInRadialMask = (() => {
        if (!hasRadial || !hero.title || !hero.fx) return null;
        const m = hero.fxMask.match(/ellipse (\d+)% (\d+)%/);
        if (!m) return null;
        const rx = Number(m[1]) / 100;
        const ry = Number(m[2]) / 100;
        const fxW = hero.fx.width;
        const fxH = hero.fx.height;
        const cxf = hero.fx.left + fxW / 2;
        const cyf = hero.fx.top + fxH / 2;
        const titleCx = hero.title.left + hero.title.width / 2;
        const titleCy = hero.title.top + hero.title.height / 2;
        const dx = (titleCx - cxf) / (fxW / 2);
        const dy = (titleCy - cyf) / (fxH / 2);
        const distance = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
        return distance < 0.5;
      })();

      const contrast = (() => {
        if (!hero.titleColor || !hero.leadColor) return null;
        const bg = '#fafaf7';
        return {
          title: contrastRatio(hero.titleColor, bg),
          lead: contrastRatio(hero.leadColor, bg),
        };
      })();

      const heroOk = {
        fxIntersectsTitle: heroFxIntersectsTitle,
        fxIntersectsLead: heroFxIntersectsLead,
        hasRadialMask: hasRadial,
        hasLinearMask: hasLinear,
        linearBands,
        titleInLinearBand,
        leadInLinearBand,
        titleInRadialMask,
        titleContrast: contrast?.title ?? null,
        leadContrast: contrast?.lead ?? null,
        titleContrastOk: (contrast?.title ?? 0) >= 4.5,
        leadContrastOk: (contrast?.lead ?? 0) >= 4.5,
        intersection: heroIntersection,
      };
      const titleCovered = heroFxIntersectsTitle;
      const leadCovered = heroFxIntersectsLead;
      const titleOk = !titleCovered || (hasRadial && titleInRadialMask) || (hasLinear && titleInLinearBand);
      const leadOk = !leadCovered || (hasRadial && titleInRadialMask) || (hasLinear && leadInLinearBand);
      heroOk.ok = heroOk.titleContrastOk && heroOk.leadContrastOk && titleOk && leadOk;
      heroOk.titleMaskOk = titleOk;
      heroOk.leadMaskOk = leadOk;
      pageReport.hero = heroOk;
      if (!heroOk.ok) allVerdicts.hero = false;
    }

    const cap = path.join(CAPTURE_DIR, `rail-${p.id}-1440.png`);
    await page.screenshot({ path: cap, fullPage: true });
    report.captures.push(cap);

    pageReport.console = consoleErrors;
    pageReport.requestFails = requestFails;
    totalErrors += consoleErrors.length + requestFails.length;
    if (consoleErrors.length || requestFails.length) allVerdicts.console = false;

    await page.close();
  }

  // ── 900 px ──────────────────────────────────────────────────────────────
  {
    const viewport = { width: 900, height: 900 };
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const requestFails = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.endsWith('/favicon.ico')) return;
      requestFails.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
    });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror ${e}`));

    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const dims = await page.evaluate(() => {
      function rect(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      }
      const rail = document.querySelector('.site-top');
      const main = document.querySelector('main');
      return {
        rail: rect(rail),
        main: rect(main),
        doc: { width: document.documentElement.clientWidth },
      };
    });

    const railH = dims.rail?.height ?? 0;
    const railW = dims.rail?.width ?? 0;
    const rail900 = {
      width: railW,
      height: railH,
      widthOk: railW >= 900 * 0.95,
      heightOk: railH < 120,
      isHorizontal: railW >= 900 * 0.95 && railH < 120,
    };
    pageReport.rail900 = rail900;
    if (!rail900.isHorizontal) allVerdicts.mobile = false;

    const mainOffset900 = {
      mainLeft: dims.main?.left ?? null,
      ok: (dims.main?.left ?? 0) < 4,
    };
    pageReport.mainOffset900 = mainOffset900;
    if (!mainOffset900.ok) allVerdicts.mainOffset = false;

    const cap = path.join(CAPTURE_DIR, `rail-${p.id}-900.png`);
    await page.screenshot({ path: cap, fullPage: true });
    report.captures.push(cap);

    pageReport.console = pageReport.console.concat(consoleErrors);
    pageReport.requestFails = pageReport.requestFails.concat(requestFails);
    totalErrors += consoleErrors.length + requestFails.length;
    if (consoleErrors.length || requestFails.length) allVerdicts.console = false;

    await page.close();
  }

  // ── 390 px — capture mobile pleine hauteur (demande brief) ──────────────
  {
    const viewport = { width: 390, height: 844 };
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const requestFails = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.endsWith('/favicon.ico')) return;
      requestFails.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
    });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror ${e}`));

    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const cap = path.join(CAPTURE_DIR, `rail-${p.id}-390.png`);
    await page.screenshot({ path: cap, fullPage: true });
    report.captures.push(cap);

    pageReport.console = pageReport.console.concat(consoleErrors);
    pageReport.requestFails = pageReport.requestFails.concat(requestFails);
    totalErrors += consoleErrors.length + requestFails.length;
    if (consoleErrors.length || requestFails.length) allVerdicts.console = false;

    await page.close();
  }

  report.pages[p.id] = pageReport;
}

await browser.close();

report.totals = {
  totalErrors,
  captures: report.captures.length,
  verdicts: allVerdicts,
};

writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

console.log('\nRail-side · site /site/ · base ' + BASE);
console.log('  Largeur rail à 1440px  :');
for (const [pid, pr] of Object.entries(report.pages)) {
  const r = pr.rail1440;
  console.log(`    ${pid.padEnd(12)} ${r.width} px  ${r.targetHit ? '✓ (cible 240)' : (r.minOk && r.maxOk ? '⚠ hors tolérance ±4px' : '✗ hors fourchette [200,260]')}`);
}
console.log('  Rail horizontal à 900px :');
for (const [pid, pr] of Object.entries(report.pages)) {
  const r = pr.rail900;
  console.log(`    ${pid.padEnd(12)} ${r.width}×${r.height}  ${r.isHorizontal ? '✓' : '✗'}`);
}
console.log('  Sections hors rail (1440) :');
for (const [pid, pr] of Object.entries(report.pages)) {
  const s = pr.sectionsClear1440;
  console.log(`    ${pid.padEnd(12)} ${s.ok ? '✓' : '✗ ' + s.sections.filter((x) => !x.ok).map((x) => `gap=${x.gap.toFixed(1)}`).join(', ')}`);
}
if (report.pages.home?.hero) {
  const h = report.pages.home.hero;
  console.log('  Hero (index.html) :');
  console.log(`    fx intersect titre : ${h.fxIntersectsTitle ? 'oui' : 'non'}`);
  console.log(`    fx intersect lead  : ${h.fxIntersectsLead ? 'oui' : 'non'}`);
  console.log(`    mask radial        : ${h.hasRadialMask ? 'oui' : 'non'}`);
  console.log(`    mask linear        : ${h.hasLinearMask ? 'oui' : 'non'}`);
  console.log(`    titre dans bande   : ${h.titleInLinearBand ?? 'n/a'}`);
  console.log(`    contraste titre    : ${h.titleContrast?.toFixed(2)} ${h.titleContrastOk ? '✓' : '✗'}`);
  console.log(`    contraste lead     : ${h.leadContrast?.toFixed(2)} ${h.leadContrastOk ? '✓' : '✗'}`);
  console.log(`    verdict hero       : ${h.ok ? '✓' : '✗'}`);
}
console.log(`  Erreurs console (total) : ${totalErrors} ${totalErrors === 0 ? '✓' : '✗'}`);

console.log('\nVerdict par seuil :');
for (const [k, ok] of Object.entries(allVerdicts)) {
  console.log(`  ${ok ? '✓' : '✗'} ${k}`);
}

const failed = Object.entries(allVerdicts).filter(([, ok]) => !ok).map(([k]) => k);
if (failed.length) {
  console.log('\nSeuils ratés : ' + failed.join(', '));
  console.log(`Captures : ${CAPTURE_DIR}`);
  console.log(`Rapport  : ${OUT}`);
  process.exit(1);
}
console.log('\nTous les seuils sont atteints.');
console.log(`Captures : ${CAPTURE_DIR}`);
console.log(`Rapport  : ${OUT}`);
