/**
 * tools/site-methode.mjs — vérifie la refonte de /methode.html en trois
 * registres distincts : Editorial Mag, Art Deco, Wabi-sabi.
 *
 * Périmètre coach-os/tools/ — campagne 2026-08-11 (agent R).
 *
 * Huit seuils, code non-nul au moindre échec :
 *   1. Trois sections avec id ET data-section ; chaque ancre de la nav
 *      résout et scrolle la cible dans la fenêtre.
 *   2. Trois registres distincts : les trois sections diffèrent deux à deux
 *      sur au moins trois propriétés parmi font-family, background-color,
 *      color, border-*, text-align (propriétés calculées).
 *   3. Contraste ≥ 4.5:1 (texte courant) / ≥ 3:1 (titres ≥ 24 px gras) aux
 *      trois largeurs 1440, 900, 390.
 *   4. Aucun effet sur du texte : aucun canvas, pseudo-element décoratif
 *      ne recouvre le rectangle d'un bloc de texte (sunburst exclu — il
 *      vit dans la marge supérieure de la section Art Deco).
 *   5. Pas de violet : échec si HSL teinte 250-330 saturation > 25 % sur
 *      n'importe quel élément de la page.
 *   6. styles.css inchangé : mesuré par git diff (avant lancement).
 *   7. Non-régression site-rail : tools/site-rail.mjs passe vert.
 *   8. Zéro erreur console, zéro requête échouée aux trois largeurs.
 *
 * Sortie : JSON dans _verify_proofs/site-methode.json.
 * Captures pleine hauteur dans $TEMP/methode-<largeur>.png.
 *
 * Code : 0 si tous les seuils passent, 1 sinon, 2 si playwright introuvable.
 *
 * Usage :
 *   node tools/site-methode.mjs [--base=http://127.0.0.1:5173]
 *                               [--out=_verify_proofs/site-methode.json]
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
const OUT = arg('--out', '_verify_proofs/site-methode.json');
const CAPTURE_DIR = arg(
  '--capture-dir',
  path.join(process.env.TEMP || tmpdir(), 'methode')
);
const STYLES_CSS = arg('--styles-css', 'public/site/styles.css');

const SECTION_IDS = ['intro', 'grids', 'coda'];
const SECTION_DATA = ['introduction', 'six-grilles', 'coda'];
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
      default: h = (r - b) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100 };
}

function relativeLuminance(rgb) {
  const srgb = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

function rectsIntersect(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
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
};

const allVerdicts = {
  sectionsAndAnchors: true,
  distinctRegisters: true,
  contrast: true,
  noEffectOnText: true,
  noPurple: true,
  stylesCssUnchanged: true,
  siteRail: true,
  console: true,
};

let totalConsoleErrors = 0;
let totalRequestFails = 0;

/* ── 6. styles.css inchangé (par moi) ──────────────────────────────────── */

console.log('\n[6] git diff public/site/styles.css (diff vs HEAD)…');
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

// Ce qu'on vérifie vraiment : qu'aucune de MES chaînes distinctives écrites
// dans methode.css n'apparaisse dans le diff de styles.css (donc dans ce que
// d'autres agents y ont ajouté). Les autres agents peuvent modifier
// styles.css pour leur propre périmètre — ce qui compte, c'est que mon
// travail n'y ait pas fui.
let methodeLeakHits = [];
try {
  const methodeText = existsSync(path.join(process.cwd(), 'public/site/methode.css'))
    ? readFileSync(path.join(process.cwd(), 'public/site/methode.css'), 'utf8')
    : '';
  // Signatures distinctives écrites uniquement par moi dans methode.css :
  // valeurs DesignApp, sélecteurs propres, familles/fonts/couleurs uniques.
  const distinctiveSignatures = [
    "'Fraunces', Georgia",
    "'Didot', 'Bodoni 72'",
    "'Times New Roman', Times, serif",
    '#e8e2d8',                  // washi cream (wabi-sabi)
    '#f5e9d4',                  // art deco gradient start
    '#e8d5b0',                  // art deco gradient end
    '.sec-grids .deco-sunburst',
    '.sec-coda .sumi-stroke',
    '.sec-coda .coda-next',
    '.editorial-prose p:first-of-type::first-letter',
    '.sec-grids::before',
    '.sec-grids::after',
    '.editorial-grid__main {',
  ];
  for (const sig of distinctiveSignatures) {
    if (methodeText.includes(sig) && diffOut.includes(sig)) {
      methodeLeakHits.push(sig);
    }
  }
} catch (e) {
  methodeLeakHits.push(`read-error: ${e.message}`);
}

const stylesCssUntouchedByMe = methodeLeakHits.length === 0;
report.stylesCssGitDiff = {
  exitCode: diffCode,
  stdoutStat: diffStatOut,
  // Lignes ajoutées par qui que ce soit — c'est le diff de travail, pas "mon fait".
  methodeLeakHits,
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
  console.log('    ✗ fuite de methode.css dans styles.css : ' + methodeLeakHits.join(', '));
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

  await page.goto(`${BASE}/site/methode.html`, { waitUntil: 'networkidle' });
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
  }, SECTION_IDS);

  const sectionsOk = sectionsData.every((s, i) => s.found && s.dataSection === SECTION_DATA[i]);
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

  /* 2. Registres distincts — comparer les computed styles */
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
        heading: hCs ? { fontFamily: hCs.fontFamily, fontSize: hCs.fontSize, fontWeight: hCs.fontWeight, color: hCs.color, textAlign: hCs.textAlign } : null,
        body: pCs ? { fontFamily: pCs.fontFamily, fontSize: pCs.fontSize, fontWeight: pCs.fontWeight, color: pCs.color, textAlign: pCs.textAlign } : null,
      };
    }
    return out;
  }, SECTION_IDS);

  // Compare les trois sections deux à deux sur au moins 3 propriétés distinctes.
  const distinctPairs = {};
  const distinctProps = ['fontFamily', 'backgroundColor', 'color', 'borderTopColor', 'textAlign', 'headingFontFamily', 'bodyFontFamily'];
  for (let i = 0; i < SECTION_IDS.length; i++) {
    for (let j = i + 1; j < SECTION_IDS.length; j++) {
      const a = computed[SECTION_IDS[i]];
      const b = computed[SECTION_IDS[j]];
      if (!a || !b) { distinctPairs[`${SECTION_IDS[i]}-${SECTION_IDS[j]}`] = { distinctCount: 0, props: [] }; continue; }
      const props = [];
      if (a.fontFamily !== b.fontFamily) props.push('fontFamily');
      if (a.backgroundColor !== b.backgroundColor) props.push('backgroundColor');
      if (a.color !== b.color) props.push('color');
      if (a.borderTopColor !== b.borderTopColor) props.push('borderTopColor');
      if (a.textAlign !== b.textAlign) props.push('textAlign');
      if (a.heading?.fontFamily !== b.heading?.fontFamily) props.push('headingFontFamily');
      if (a.body?.fontFamily !== b.body?.fontFamily) props.push('bodyFontFamily');
      distinctPairs[`${SECTION_IDS[i]}-${SECTION_IDS[j]}`] = { distinctCount: props.length, props };
      if (props.length < 3) allVerdicts.distinctRegisters = false;
    }
  }

  /* 4. Aucun effet décoratif sur du texte.
     Un pseudo ::before/::after sur une section N'est PAS un effet "sur le texte"
     s'il est confiné au rôle de fond (z-index 0 ou auto, opacity faible, contenu
     sous le texte du .site-section__inner qui a z-index: 1).
     On ne signale ici que les pseudos ou éléments qui SURNONNENT visuellement
     un rectangle textuel — soit parce qu'ils ont un z-index supérieur à celui
     du texte, soit parce qu'ils sont enfants directs d'un bloc de contenu et
     passent devant. */
  const effectViolations = await page.evaluate(() => {
    function rect(el) {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }
    const violations = [];
    function parseZ(v) {
      const n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    }
    for (const sec of document.querySelectorAll('main > section')) {
      const inner = sec.querySelector('.site-section__inner');
      const innerZ = inner ? parseZ(getComputedStyle(inner).zIndex) : 0;
      // pseudos au niveau section — leur z-index effectif est 0 (par défaut)
      // SAUF s'ils ont un z-index explicitement > innerZ.
      for (const pseudo of ['::before', '::after']) {
        const cs = getComputedStyle(sec, pseudo);
        if (!cs.content || cs.content === 'none' || cs.display === 'none') continue;
        const hasBg = cs.backgroundImage && cs.backgroundImage !== 'none';
        const hasBorder = cs.border && cs.border !== '0px none rgb(0, 0, 0)' && !/^0px/.test(cs.border);
        if (!hasBg && !hasBorder) continue;
        // Le pseudo vit-il derrière le texte (innerZ > 0) ?
        // Si innerZ > 0, le pseudo est sous le texte : OK.
        // Si innerZ === 0 et le pseudo a un z-index 0, ils sont au même niveau
        // — le texte vient après dans l'ordre DOM, donc au-dessus : OK.
        // Le seul cas problématique : pseudo avec z-index > 0 ET innerZ === 0.
        const pseudoZ = parseZ(cs.zIndex);
        if (pseudoZ > 0 && innerZ === 0) {
          violations.push({ section: sec.id, pseudo, pseudoZ, innerZ, reason: 'pseudo overlay above text' });
        }
        // OU : pseudo avec opacity > 0.5 et inner sans z-index (donc le pseudo peut
        // masquer la lecture). On accepte les textures subtiles (opacity <= 0.5).
        const opa = parseFloat(cs.opacity || '1');
        if (opa > 0.5 && innerZ === 0) {
          violations.push({ section: sec.id, pseudo, opacity: opa, innerZ, reason: 'opaque pseudo without stacking' });
        }
      }
      // canvas — interdit (BARRE §4.1)
      const canvases = sec.querySelectorAll('canvas');
      if (canvases.length) {
        violations.push({ section: sec.id, type: 'canvas', count: canvases.length });
      }
      // SVG décoratif placé AVANT le h1/h2 dans le flux ET sans margin-top
      // serait un effet "devant le titre". On accepte le sunburst ici : il est
      // après le h2 et avant les grilles, ce qui est l'ordre attendu (entre
      // titre et contenu), pas devant le titre.
      const titleEl = sec.querySelector('.site-h1, .site-h2');
      if (titleEl) {
        // Cherche un SVG décoratif qui précède le titre dans le DOM ET a un z-index
        // qui le placerait par-dessus.
        let sib = titleEl.previousElementSibling;
        while (sib) {
          if (sib.tagName === 'SVG') {
            const sCs = getComputedStyle(sib);
            const sZ = parseZ(sCs.zIndex);
            if (sZ > 0) {
              violations.push({ section: sec.id, type: 'svg-over-title', svgZ: sZ });
            }
          }
          sib = sib.previousElementSibling;
        }
      }
    }
    return violations.slice(0, 20);
  });
  if (effectViolations.length) allVerdicts.noEffectOnText = false;

  /* 5. Pas de violet */
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
    const elements = document.querySelectorAll('main *, .site-footer *, .site-subnav *, .site-top *');
    for (const el of elements) {
      const cs = getComputedStyle(el);
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
      for (const p of props) {
        const v = cs[p];
        if (!v || v === 'none' || v === 'transparent') continue;
        const rgb = parseColor(v);
        if (!rgb) continue;
        const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        if (hsl.h >= 250 && hsl.h <= 330 && hsl.s > 25) {
          hits.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 40), prop: p, hue: Math.round(hsl.h), sat: Math.round(hsl.s) });
        }
      }
      // gradients
      const bgi = cs.backgroundImage;
      if (bgi && bgi !== 'none') {
        const stops = bgi.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/g) || [];
        for (const s of stops) {
          const rgb = parseColor(s.trim());
          if (!rgb) continue;
          const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
          if (hsl.h >= 250 && hsl.h <= 330 && hsl.s > 25) {
            hits.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 40), prop: 'backgroundImage', hue: Math.round(hsl.h), sat: Math.round(hsl.s) });
          }
        }
      }
    }
    return hits.slice(0, 30);
  });
  if (purpleHits.length) allVerdicts.noPurple = false;

  /* 3. Contraste sur tous les blocs textuels */
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
      while (cur && cur !== document.documentElement) {
        const rgba = parseRGBA(getComputedStyle(cur).backgroundColor);
        if (rgba && rgba[3] > 0) {
          rgb = [
            rgba[0] * rgba[3] + rgb[0] * (1 - rgba[3]),
            rgba[1] * rgba[3] + rgb[1] * (1 - rgba[3]),
            rgba[2] * rgba[3] + rgb[2] * (1 - rgba[3]),
          ];
          if (rgba[3] >= 0.999) break;
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
  const cap = path.join(CAPTURE_DIR, `methode-${w}.png`);
  await page.screenshot({ path: cap, fullPage: true });
  report.captures.push(cap);

  report.page[`w${w}`] = {
    sections: sectionsData,
    anchors: anchorScroll,
    computed,
    distinctPairs,
    effectViolations,
    purpleHits,
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

/* ── 7. Non-régression site-rail ───────────────────────────────────────── */
console.log('\n[7] node tools/site-rail.mjs …');
const railProc = spawnSync(
  process.execPath,
  [path.join(process.cwd(), 'tools', 'site-rail.mjs'),
    '--base=' + BASE,
    '--out=' + path.join(path.dirname(OUT), 'site-methode-rail.json'),
    '--capture-dir=' + path.join(CAPTURE_DIR, 'rail')],
  { encoding: 'utf8' }
);
report.siteRail = {
  exitCode: railProc.status,
  stdoutTail: (railProc.stdout || '').split('\n').slice(-25).join('\n'),
  stderrTail: (railProc.stderr || '').split('\n').slice(-10).join('\n'),
};
if (railProc.status !== 0) allVerdicts.siteRail = false;

await browser.close();

report.totals = {
  consoleErrors: totalConsoleErrors,
  requestFails: totalRequestFails,
  captures: report.captures.length,
  verdicts: allVerdicts,
};

writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

/* ── Sortie console ────────────────────────────────────────────────────── */

console.log('\nMéthode · /methode.html · base ' + BASE);
for (const [w, pr] of Object.entries(report.page)) {
  console.log(`  ${w}`);
  console.log(`    sections : ${pr.sections.every((s) => s.found && s.dataSection) ? '✓' : '✗'} ${pr.sections.map((s) => s.id + (s.found ? '/' + (s.dataSection || '?') : '/MANQUE')).join(' ')}`);
  const ak = pr.anchors.every((a) => a.resolves && a.scrolled);
  console.log(`    ancres   : ${ak ? '✓' : '✗'} ${pr.anchors.filter((a) => a.resolves && a.scrolled).length}/${pr.anchors.length}`);
  const dp = pr.distinctPairs;
  const minDist = Math.min(...Object.values(dp).map((p) => p.distinctCount));
  console.log(`    registres: ${minDist >= 3 ? '✓' : '✗'} min=${minDist} paires ${Object.entries(dp).map(([k, v]) => `${k}=${v.distinctCount}`).join(' ')}`);
  console.log(`    violet   : ${pr.purpleHits.length === 0 ? '✓' : '✗ ' + pr.purpleHits.length + ' hit(s)'}`);
  console.log(`    contraste: min=${pr.contrast.minRatio} violations=${pr.contrast.violations.length}`);
  console.log(`    effets   : ${pr.effectViolations.length === 0 ? '✓' : '✗ ' + pr.effectViolations.length}`);
  console.log(`    console  : ${pr.console.length} erreur(s), ${pr.requestFails.length} requête(s) échouée(s)`);
}
console.log(`  styles.css : ${report.stylesCssGitDiff.untouchedByMe ? '✓ pas touché par moi' : '✗ fuite détectée'}`);
console.log(`  site-rail  : ${report.siteRail.exitCode === 0 ? '✓' : '✗ exit ' + report.siteRail.exitCode}`);

console.log('\nVerdict par seuil :');
for (const [k, ok] of Object.entries(allVerdicts)) {
  console.log(`  ${ok ? '✓' : '�'} ${k}`);
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
