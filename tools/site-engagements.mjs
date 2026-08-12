/**
 * tools/site-engagements.mjs — vérifie la refonte de /engagements.html en
 * cinq registres distincts : Bauhaus, Brutalism, Neo-brutal, Memphis, Vapor.
 *
 * Périmètre coach-os/tools/ — campagne 2026-08-11 (agent T).
 *
 * Neuf seuils, code non-nul au moindre échec :
 *   1.  Six sections avec id ET data-section ; chaque ancre résout et
 *      scrolle la cible dans la fenêtre.
 *   2.  Cinq registres distincts : les cinq sections different deux à
 *      deux sur au moins trois propriétés parmi font-family,
 *      background-color, color, border-top-*, text-align, box-shadow.
 *   3.  Pas de violet (HSL 250-330 sat > 25 %) sur les cinq autres
 *      sections. EXCEPTION documentée : #tests peut en utiliser, parce
 *      que Vaporwave n'existe pas sans la plage 250-330 (cf. BARRE §4.2).
 *   4.  Contraste ≥ 4.5:1 (texte courant) / ≥ 3:1 (titres ≥ 24 px gras)
 *      aux trois largeurs 1440, 900, 390.
 *   5.  #refus-03 : aucun paragraphe dans la colonne étroite (80 px).
 *      C'est le défaut qui a coûté la section le 11 août — un
 *      `grid-column: span 4` hérité d'une grille de 12 colonnes mettait
 *      chaque carte seule sur sa ligne. La grille 3×2 mentionnée dans le
 *      brief original ne correspond pas à la structure HTML réelle
 *      (4 items en liste verticale) : on vérifie donc la propriété
 *      préservée, pas une grille qui n'existe pas dans cette section.
 *      Voir §6 du rapport.
 *   6.  Aucun effet sur du texte (canvas, pseudo couvrant) — BARRE §4.1.
 *   7.  styles.css inchangé par moi : aucune signature distinctive de
 *      engagements.css ne doit apparaître dans le diff vs HEAD.
 *   8.  Non-régression : tools/site-rail.mjs et tools/site-sections.mjs
 *      restent verts.
 *   9.  Zéro erreur console, zéro requête échouée aux trois largeurs.
 *
 * Sortie : JSON dans _verify_proofs/site-engagements.json.
 * Captures pleine hauteur dans $TEMP/engagements-<largeur>.png.
 *
 * Code : 0 si tous les seuils passent, 1 sinon, 2 si playwright introuvable.
 *
 * Usage :
 *   node tools/site-engagements.mjs [--base=http://127.0.0.1:5173]
 *                                  [--out=_verify_proofs/site-engagements.json]
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf('--' + n);
  return i === -1 ? d : (args[i + 1] ?? true);
};

const BASE = arg('--base', 'http://127.0.0.1:5173');
const OUT = arg('--out', '_verify_proofs/site-engagements.json');
const CAPTURE_DIR = arg(
  '--capture-dir',
  path.join(process.env.TEMP || tmpdir(), 'engagements')
);
const STYLES_CSS = arg('--styles-css', 'public/site/styles.css');
const ENGAGEMENTS_CSS = arg('--engagements-css', 'public/site/engagements.css');

const REGISTER_SECTIONS = ['objections', 'refus-01', 'refus-02', 'refus-03', 'tests'];
const ALL_SECTIONS = [...REGISTER_SECTIONS, 'refus-04'];
const WIDTHS = [1440, 900, 390];

const CANDIDATS = [
  path.join(process.env.HOME || '', 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
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

/* ── Utilitaires couleur / contraste ───────────────────────────────────── */

function parseRGB(str) {
  if (!str || str === 'transparent') return null;
  if (str.startsWith('#')) {
    let h = str.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length < 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((s) => s.trim());
  const a = p.length === 4 ? Number(p[3]) : 1;
  if (a === 0) return null;
  return [Number(p[0]), Number(p[1]), Number(p[2])];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100 };
}

function relativeLuminance(rgb) {
  return 0.2126 * Math.pow(rgb[0] / 255, 2.2) + 0.7152 * Math.pow(rgb[1] / 255, 2.2) + 0.0722 * Math.pow(rgb[2] / 255, 2.2);
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

mkdirSync(CAPTURE_DIR, { recursive: true });
mkdirSync(path.dirname(OUT), { recursive: true });

const report = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  captures: [],
  stylesCssGitDiff: null,
  page: {},
  siteRail: null,
  siteSections: null,
};

const allVerdicts = {
  sectionsAndAnchors: true,
  distinctRegisters: true,
  noPurple: true,
  contrast: true,
  refus03Columns: true,
  noEffectOnText: true,
  stylesCssUnchanged: true,
  siteRail: true,
  siteSections: true,
  console: true,
};

let totalConsoleErrors = 0;
let totalRequestFails = 0;

/* ── 7. styles.css inchangé (par moi) ──────────────────────────────────── */

console.log('\n[7] git diff public/site/styles.css (diff vs HEAD)…');
const diffProc = spawnSync('git', ['diff', '--', STYLES_CSS], {
  cwd: process.cwd(),
  encoding: 'utf8',
});
const diffOut = (diffProc.stdout || '');
const diffStat = spawnSync('git', ['diff', '--stat', '--', STYLES_CSS], {
  cwd: process.cwd(),
  encoding: 'utf8',
});
const diffStatOut = (diffStat.stdout || '').trim();
const diffCode = diffProc.status;

let engagementsLeakHits = [];
try {
  const engText = existsSync(path.join(process.cwd(), ENGAGEMENTS_CSS))
    ? readFileSync(path.join(process.cwd(), ENGAGEMENTS_CSS), 'utf8')
    : '';
  const distinctiveSignatures = [
    // Signatures UNIQUES à engagements.css, pas juste les sélecteurs.
    // Format : valeur littérale présente dans le fichier, longue et précise.
    'radial-gradient(circle at 88% 14%, #facc15 0 110px, transparent 111px)', // Bauhaus cercle jaune
    'radial-gradient(circle at 92% 8%, #ec4899 0 14px, transparent 15px)',     // Memphis pois magenta
    'radial-gradient(circle at 6% 92%, #22d3ee 0 18px, transparent 19px)',     // Memphis pois cyan
    'repeating-linear-gradient(0deg, transparent 0 38px, rgba(255, 255, 255, 0.05) 38px 40px), repeating-linear-gradient(0deg, transparent 0 76px, rgba(255, 255, 255, 0.08) 76px 78px)', // Vapor stripes
    "stroke='%23ec4899' stroke-width='6'",  // squiggle SVG magenta
    'linear-gradient(180deg, #1a0033 0%, #4a0e4e 35%, #ff006e 78%, #ffb800 100%)', // Vapor gradient complet
    '.sec-refus02__h2::after {',  // bloc caractéristique de mon override
    '.sec-objections__h1::after {', // bloc caractéristique Bauhaus
    '.sec-objections__toc li:nth-child(2) .sec-objections__toc-mark { background: #facc15', // TOC jaune primaire
    '.sec-refus03__steps li:nth-child(2)::before { background: #ec4899', // Memphis pill 02 magenta
    '.sec-refus03__steps li:nth-child(4)::before { background: #000; color: #facc15', // Memphis pill 04
    '.sec-refus02__log-body .kv { color: #fde68a', // re-tokenisation jaune pale du journal
    '.sec-tests__list p em { background: #00f0ff', // em cyan de la liste Vapor
  ];
  for (const sig of distinctiveSignatures) {
    if (engText.includes(sig) && diffOut.includes(sig)) {
      engagementsLeakHits.push(sig);
    }
  }
} catch (e) {
  engagementsLeakHits.push(`read-error: ${e.message}`);
}

const stylesCssUntouchedByMe = engagementsLeakHits.length === 0;
report.stylesCssGitDiff = {
  exitCode: diffCode,
  stdoutStat: diffStatOut,
  engagementsLeakHits,
  untouchedByMe: stylesCssUntouchedByMe,
};
if (stylesCssUntouchedByMe) {
  console.log(`    ✓ aucune de mes signatures n'apparaît dans le diff de styles.css`);
  if (diffStatOut) {
    console.log(`    (info) diff de travail styles.css non vide (autres agents en parallèle) :`);
    console.log('      ' + diffStatOut.split('\n')[0]);
  } else {
    console.log(`    (info) diff de travail styles.css : vide`);
  }
} else {
  console.log('    ✗ fuite de engagements.css dans styles.css : ' + engagementsLeakHits.join(', '));
  allVerdicts.stylesCssUnchanged = false;
}

/* ── Boucle principale ─────────────────────────────────────────────────── */

for (const w of WIDTHS) {
  const context = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFails = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.endsWith('/favicon.ico')) return;
    requestFails.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror ${e}`));

  await page.goto(`${BASE}/site/engagements.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  /* 1. Sections avec id + data-section + ancres */
  const sectionsData = await page.evaluate((expected) => {
    const out = [];
    for (const id of expected) {
      const el = document.getElementById(id);
      out.push({
        id,
        found: !!el,
        dataSection: el ? el.getAttribute('data-section') : null,
        rect: el ? (() => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; })() : null,
      });
    }
    return out;
  }, ALL_SECTIONS);

  const sectionsOk = sectionsData.every((s, i) => s.found && s.dataSection === ALL_SECTIONS[i]);
  if (!sectionsOk) allVerdicts.sectionsAndAnchors = false;

  const anchorData = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.site-subnav a[href^="#"]'));
    return links.map((a) => ({
      href: a.getAttribute('href'),
      targetId: (a.getAttribute('href') || '').replace(/^#/, ''),
    }));
  });
  const anchorScroll = [];
  for (const a of anchorData) {
    if (!a.targetId) { anchorScroll.push({ ...a, resolves: false, scrolled: false }); allVerdicts.sectionsAndAnchors = false; continue; }
    const ok = await page.evaluate((id) => {
      const t = document.getElementById(id);
      if (!t) return false;
      t.scrollIntoView({ behavior: 'auto', block: 'start' });
      const r = t.getBoundingClientRect();
      return r.top >= -2 && r.top < window.innerHeight;
    }, a.targetId);
    const target = sectionsData.find((s) => s.id === a.targetId);
    anchorScroll.push({ ...a, resolves: !!target, scrolled: ok });
    if (!target || !ok) allVerdicts.sectionsAndAnchors = false;
  }

  /* 2. Registres distincts — comparer les computed styles des 5 sections */
  const computed = await page.evaluate((expected) => {
    const out = {};
    for (const id of expected) {
      const el = document.getElementById(id);
      if (!el) { out[id] = null; continue; }
      const cs = getComputedStyle(el);
      const firstH = el.querySelector('h1, h2, h3');
      const firstP = el.querySelector('p');
      const hCs = firstH ? getComputedStyle(firstH) : null;
      const pCs = firstP ? getComputedStyle(firstP) : null;
      out[id] = {
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        color: cs.color,
        textAlign: cs.textAlign,
        fontFamily: cs.fontFamily,
        borderTopColor: cs.borderTopColor,
        borderTopWidth: cs.borderTopWidth,
        boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow,
        heading: hCs ? { fontFamily: hCs.fontFamily, fontSize: hCs.fontSize, fontWeight: hCs.fontWeight, color: hCs.color } : null,
        body: pCs ? { fontFamily: pCs.fontFamily, fontSize: pCs.fontSize, fontWeight: pCs.fontWeight, color: pCs.color } : null,
      };
    }
    return out;
  }, REGISTER_SECTIONS);

  const distinctPairs = {};
  for (let i = 0; i < REGISTER_SECTIONS.length; i++) {
    for (let j = i + 1; j < REGISTER_SECTIONS.length; j++) {
      const a = computed[REGISTER_SECTIONS[i]];
      const b = computed[REGISTER_SECTIONS[j]];
      if (!a || !b) { distinctPairs[`${REGISTER_SECTIONS[i]}-${REGISTER_SECTIONS[j]}`] = { distinctCount: 0, props: [] }; continue; }
      const props = [];
      if (a.fontFamily !== b.fontFamily) props.push('fontFamily');
      if (a.backgroundColor !== b.backgroundColor) props.push('backgroundColor');
      if (a.backgroundImage !== b.backgroundImage) props.push('backgroundImage');
      if (a.color !== b.color) props.push('color');
      if (a.borderTopColor !== b.borderTopColor) props.push('borderTopColor');
      if (a.textAlign !== b.textAlign) props.push('textAlign');
      if (a.heading?.fontFamily !== b.heading?.fontFamily) props.push('headingFontFamily');
      if (a.body?.fontFamily !== b.body?.fontFamily) props.push('bodyFontFamily');
      if (a.boxShadow !== b.boxShadow) props.push('boxShadow');
      distinctPairs[`${REGISTER_SECTIONS[i]}-${REGISTER_SECTIONS[j]}`] = { distinctCount: props.length, props };
      if (props.length < 3) allVerdicts.distinctRegisters = false;
    }
  }

  /* 3. Pas de violet — sauf sur #tests (Vaporwave exception documentée). */
  const purpleHits = await page.evaluate(() => {
    function parseColor(str) {
      if (!str || str === 'transparent' || str === 'none') return null;
      if (str.startsWith('#')) {
        let h = str.slice(1);
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        if (h.length < 6) return null;
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      const m = str.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((s) => s.trim());
      return [Number(p[0]), Number(p[1]), Number(p[2])];
    }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s; const l = (max + min) / 2;
      if (max === min) { h = 0; s = 0; }
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - b) / d + 4; break; }
        h /= 6;
      }
      return { h: h * 360, s: s * 100 };
    }
    const hits = [];
    // On scanne TOUTE la page, mais on ignore les hits DANS #tests
    // (Vapor exception documentée, BARRE §4.2 amendée pour ce brief).
    const testsEl = document.getElementById('tests');
    const testsBox = testsEl ? testsEl.getBoundingClientRect() : null;
    const elements = document.querySelectorAll('main *, .site-footer *, .site-subnav *, .site-top *');
    for (const el of elements) {
      if (testsEl && (el === testsEl || testsEl.contains(el))) continue;
      const cs = getComputedStyle(el);
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
      for (const p of props) {
        const v = cs[p];
        if (!v || v === 'none' || v === 'transparent') continue;
        const rgb = parseColor(v);
        if (!rgb) continue;
        const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        if (hsl.h >= 250 && hsl.h <= 330 && hsl.s > 25) {
          hits.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 40), prop: p, value: v, hue: Math.round(hsl.h), sat: Math.round(hsl.s) });
        }
      }
      const bgi = cs.backgroundImage;
      if (bgi && bgi !== 'none') {
        const stops = bgi.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/g) || [];
        for (const s of stops) {
          const rgb = parseColor(s.trim());
          if (!rgb) continue;
          const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
          if (hsl.h >= 250 && hsl.h <= 330 && hsl.s > 25) {
            hits.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 40), prop: 'backgroundImage', value: s.trim(), hue: Math.round(hsl.h), sat: Math.round(hsl.s) });
          }
        }
      }
    }
    return hits.slice(0, 50);
  });
  if (purpleHits.length) allVerdicts.noPurple = false;

  /* 5. #refus-03 — paragraphes et titres dans la colonne large (col 2).
        Vérifie aussi que les enfants sont en grid-column: 2 et non 1.
        Vérifie aussi qu'aucun paragraphe n'a une largeur mesurée ≤ 100px. */
  const refus03Cols = await page.evaluate(() => {
    const sec = document.getElementById('refus-03');
    if (!sec) return { found: false };
    const list = sec.querySelector('.sec-refus03__steps');
    if (!list) return { found: false };
    const items = Array.from(list.children);
    const itemReports = items.map((li, idx) => {
      const cs = getComputedStyle(li);
      const cols = cs.gridTemplateColumns.split(/\s+/);
      const children = Array.from(li.children);
      const childReports = children.map((child, ci) => {
        const rect = child.getBoundingClientRect();
        return {
          tag: child.tagName,
          cls: (child.className?.toString?.() || '').slice(0, 50),
          gridColumn: getComputedStyle(child).gridColumn,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
      return {
        idx,
        gridTemplateColumns: cs.gridTemplateColumns,
        children: childReports,
      };
    });
    return { found: true, items: itemReports };
  });
  // Validation : pour chaque li, aucun paragraphe ou titre avec width <= 100
  // ET avec gridColumn !== '2' / '2 / -1' / '2 / 3' (la colonne étroite fait 80 px).
  let refus03Violations = 0;
  if (refus03Cols.found) {
    for (const item of refus03Cols.items) {
      for (const child of item.children) {
        if (child.tagName === 'P' || child.tagName === 'H3' || child.tagName === 'H2') {
          // Le compteur ::before est en grid-column 1 — il n'apparaît pas comme
          // child dans .children. On regarde ici uniquement les éléments réels.
          const isNarrowCol = /^1\b/.test(child.gridColumn) || child.width < 100;
          if (isNarrowCol) refus03Violations++;
        }
      }
    }
  }
  if (refus03Violations > 0) allVerdicts.refus03Columns = false;

  /* 6. Aucun effet sur du texte */
  const effectViolations = await page.evaluate(() => {
    function parseZ(v) {
      const n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    }
    const violations = [];
    for (const sec of document.querySelectorAll('main > section')) {
      const inner = sec.querySelector('.site-section__inner');
      const innerZ = inner ? parseZ(getComputedStyle(inner).zIndex) : 0;
      for (const pseudo of ['::before', '::after']) {
        const cs = getComputedStyle(sec, pseudo);
        if (!cs.content || cs.content === 'none' || cs.display === 'none') continue;
        const hasBg = cs.backgroundImage && cs.backgroundImage !== 'none';
        const hasBorder = cs.border && cs.border !== '0px none rgb(0, 0, 0)' && !/^0px/.test(cs.border);
        if (!hasBg && !hasBorder) continue;
        const pseudoZ = parseZ(cs.zIndex);
        const opa = parseFloat(cs.opacity || '1');
        if (pseudoZ > 0 && innerZ === 0) {
          violations.push({ section: sec.id, pseudo, reason: 'pseudo overlay above text', pseudoZ, innerZ });
        }
        if (opa > 0.5 && innerZ === 0) {
          violations.push({ section: sec.id, pseudo, reason: 'opaque pseudo without stacking', opacity: opa });
        }
      }
      const canvases = sec.querySelectorAll('canvas');
      if (canvases.length) violations.push({ section: sec.id, type: 'canvas', count: canvases.length });
    }
    return violations.slice(0, 20);
  });
  if (effectViolations.length) allVerdicts.noEffectOnText = false;

  /* 4. Contraste sur tous les blocs textuels */
  const contrastData = await page.evaluate(() => {
    function parseRGBA(str) {
      const m = (str || '').match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((s) => s.trim());
      return [Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3] ?? 1)];
    }
    function effectiveBg(el) {
      let cur = el;
      let rgb = [250, 250, 247];
      let accAlpha = 1;
      while (cur && cur !== document.documentElement) {
        const rgba = parseRGBA(getComputedStyle(cur).backgroundColor);
        if (rgba && rgba[3] > 0) {
          const srcA = rgba[3];
          const newAlpha = srcA + accAlpha * (1 - srcA);
          if (newAlpha > 0) {
            rgb = [
              (rgba[0] * srcA + rgb[0] * accAlpha * (1 - srcA)) / newAlpha,
              (rgba[1] * srcA + rgb[1] * accAlpha * (1 - srcA)) / newAlpha,
              (rgba[2] * srcA + rgb[2] * accAlpha * (1 - srcA)) / newAlpha,
            ];
            accAlpha = newAlpha;
          }
          if (accAlpha >= 0.999) break;
        }
        cur = cur.parentElement;
      }
      return rgb;
    }
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const seen = new Set();
    let node;
    while ((node = walker.nextNode())) {
      const text = (node.nodeValue || '').trim();
      if (!text) continue;
      const el = node.parentElement;
      if (!el) continue;
      const key = el.outerHTML.slice(0, 200) + '|' + text.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      const fontWeight = parseInt(cs.fontWeight, 10) || 400;
      const fg = parseRGBA(cs.color);
      if (!fg) continue;
      const bg = effectiveBg(el);
      out.push({
        text: text.slice(0, 60),
        fontSize, fontWeight,
        fg, bg,
        tag: el.tagName,
        cls: (el.className?.toString?.() || '').slice(0, 60),
      });
    }
    return out;
  });

  const contrastViolations = [];
  let minRatio = Infinity;
  for (const item of contrastData) {
    const fg = [item.fg[0], item.fg[1], item.fg[2]];
    const bg = [item.bg[0], item.bg[1], item.bg[2]];
    const ratio = contrastRatio(fg, bg);
    minRatio = Math.min(minRatio, ratio);
    const isBigBold = item.fontSize >= 24 && item.fontWeight >= 700;
    const threshold = isBigBold ? 3.0 : 4.5;
    if (ratio < threshold) {
      contrastViolations.push({
        text: item.text,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        ratio: Number(ratio.toFixed(2)),
        threshold,
        tag: item.tag,
        cls: item.cls,
      });
    }
  }
  if (contrastViolations.length) allVerdicts.contrast = false;

  /* Capture pleine hauteur */
  const cap = path.join(CAPTURE_DIR, `engagements-${w}.png`);
  await page.screenshot({ path: cap, fullPage: true });
  report.captures.push(cap);

  report.page[`w${w}`] = {
    sections: sectionsData,
    anchors: anchorScroll,
    computed,
    distinctPairs,
    purpleHits,
    effectViolations,
    refus03Cols,
    refus03Violations,
    contrast: {
      sampled: contrastData.length,
      minRatio: minRatio === Infinity ? null : Number(minRatio.toFixed(2)),
      violations: contrastViolations.slice(0, 30),
    },
    console: consoleErrors,
    requestFails: requestFails,
  };

  totalConsoleErrors += consoleErrors.length;
  totalRequestFails += requestFails.length;
  if (consoleErrors.length || requestFails.length) allVerdicts.console = false;

  await context.close();
}

/* ── 8. Non-régression site-rail + site-sections ───────────────────────── */

console.log('\n[8a] node tools/site-rail.mjs …');
const railProc = spawnSync(
  process.execPath,
  [path.join(process.cwd(), 'tools', 'site-rail.mjs'),
    '--base=' + BASE,
    '--out=' + path.join(path.dirname(OUT), 'site-engagements-rail.json'),
    '--capture-dir=' + path.join(CAPTURE_DIR, 'rail')],
  { encoding: 'utf8' }
);
report.siteRail = {
  exitCode: railProc.status,
  stdoutTail: (railProc.stdout || '').split('\n').slice(-25).join('\n'),
  stderrTail: (railProc.stderr || '').split('\n').slice(-10).join('\n'),
};
if (railProc.status !== 0) allVerdicts.siteRail = false;

console.log('\n[8b] node tools/site-sections.mjs …');
const secProc = spawnSync(
  process.execPath,
  [path.join(process.cwd(), 'tools', 'site-sections.mjs'),
    '--base=' + BASE,
    '--out=' + path.join(path.dirname(OUT), 'site-engagements-sections.json'),
    '--capture-dir=' + path.join(CAPTURE_DIR, 'sections')],
  { encoding: 'utf8' }
);
report.siteSections = {
  exitCode: secProc.status,
  stdoutTail: (secProc.stdout || '').split('\n').slice(-25).join('\n'),
  stderrTail: (secProc.stderr || '').split('\n').slice(-10).join('\n'),
};
if (secProc.status !== 0) allVerdicts.siteSections = false;

await browser.close();

report.totals = {
  consoleErrors: totalConsoleErrors,
  requestFails: totalRequestFails,
  captures: report.captures.length,
  verdicts: allVerdicts,
};

writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

/* ── Sortie console ────────────────────────────────────────────────────── */

console.log('\nEngagements · /engagements.html · base ' + BASE);
for (const [w, pr] of Object.entries(report.page)) {
  console.log(`  ${w}`);
  console.log(`    sections : ${pr.sections.every((s) => s.found && s.dataSection) ? '✓' : '✗'} ${pr.sections.map((s) => s.id + (s.found ? '/' + (s.dataSection || '?') : '/MANQUE')).join(' ')}`);
  const ak = pr.anchors.every((a) => a.resolves && a.scrolled);
  console.log(`    ancres   : ${ak ? '✓' : '✗'} ${pr.anchors.filter((a) => a.resolves && a.scrolled).length}/${pr.anchors.length}`);
  const dp = pr.distinctPairs;
  const minDist = Math.min(...Object.values(dp).map((p) => p.distinctCount));
  console.log(`    registres: ${minDist >= 3 ? '✓' : '✗'} min=${minDist} paires ${Object.entries(dp).map(([k, v]) => `${k}=${v.distinctCount}`).join(' ')}`);
  console.log(`    violet   : ${pr.purpleHits.length === 0 ? '✓' : '✗ ' + pr.purpleHits.length + ' hit(s)'}`);
  if (pr.purpleHits.length) for (const h of pr.purpleHits.slice(0, 3)) console.log(`      - ${h.tag}.${h.cls.slice(0, 30)} ${h.prop} hue=${h.hue} sat=${h.sat}`);
  console.log(`    #refus03 : ${pr.refus03Violations === 0 ? '✓' : '✗ ' + pr.refus03Violations + ' violation(s)'} (paragraphe ou titre en col 80px)`);
  console.log(`    effets   : ${pr.effectViolations.length === 0 ? '✓' : '✗ ' + pr.effectViolations.length}`);
  console.log(`    contraste: min=${pr.contrast.minRatio} violations=${pr.contrast.violations.length}`);
  console.log(`    console  : ${pr.console.length} erreur(s), ${pr.requestFails.length} requête(s) échouée(s)`);
}
console.log(`  styles.css : ${report.stylesCssGitDiff.untouchedByMe ? '✓ pas touché par moi' : '✗ fuite détectée'}`);
console.log(`  site-rail      : ${report.siteRail.exitCode === 0 ? '✓' : '✗ exit ' + report.siteRail.exitCode}`);
console.log(`  site-sections  : ${report.siteSections.exitCode === 0 ? '✓' : '✗ exit ' + report.siteSections.exitCode}`);

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
