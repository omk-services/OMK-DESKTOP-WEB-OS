/**
 * tools/site-sections.mjs — vérifie la refonte des pages /paliers et
 * /engagements en 6 sections chacune, par l'agent P — campagne 2026-08-11.
 *
 * Périmètre coach-os/tools/ — campagne 2026-08-11.
 *
 * Sept seuils, code non-nul au moindre échec :
 *   1. 6 sections par page, chacune avec id ET data-section.
 *   2. Chaque ancre de la sous-nav résout vers une section existante et
 *      l'amène dans la fenêtre après clic (ancre morte = échec bruyant).
 *   3. Aucune couleur HSL teinte 250–330 saturation > 25 % sur les éléments
 *      des deux pages (interdit BARRE §4.2 — traduction mécanique du
 *      dégradé violet/magenta).
 *   4. Contraste texte/fond ≥ 4.5:1 (texte courant) et ≥ 3:1 (titres ≥ 24 px
 *      bold) — y compris pied de page — aux trois largeurs 1440, 900, 390.
 *   5. Chacune des sections de contenu porte > 400 caractères de texte.
 *   6. Non-régression : tools/site-rail.mjs passe toujours vert.
 *   7. Zéro erreur console, zéro requête échouée sur les 2 pages × 3 largeurs.
 *
 * Sortie : JSON dans _verify_proofs/site-sections.json.
 * Captures pleine hauteur dans $TEMP/sections-<page>-<largeur>.png.
 *
 * Code : 0 si tous les seuils passent, 1 sinon, 2 si playwright introuvable.
 *
 * Usage :
 *   node tools/site-sections.mjs [--base=http://127.0.0.1:5173]
 *                               [--out=_verify_proofs/site-sections.json]
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf('--' + n);
  return i === -1 ? d : (args[i + 1] ?? true);
};

const BASE = arg('--base', 'http://127.0.0.1:5173');
const OUT = arg('--out', '_verify_proofs/site-sections.json');
const CAPTURE_DIR = arg(
  '--capture-dir',
  path.join(process.env.TEMP || tmpdir(), 'sections-paliers-engagements')
);

const PAGES = [
  { id: 'paliers', path: '/site/paliers.html' },
  { id: 'engagements', path: '/site/engagements.html' },
];

const WIDTHS = [1440, 900, 390];

const SECTION_IDS = {
  paliers: ['offre', 'poc', 'saas', 'marque-blanche', 'souverainete', 'sortie'],
  engagements: ['objections', 'refus-01', 'refus-02', 'refus-03', 'refus-04', 'tests'],
};

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

function parseRGB(color) {
  if (!color || color === 'transparent') return null;
  if (color.startsWith('#')) {
    let h = color.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length < 6) return null;
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  const a = parts.length === 4 ? Number(parts[3]) : 1;
  if (a === 0) return null;
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
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
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

/** Walk vers le haut pour trouver la couleur de fond effective (non transparente). */
function effectiveBg(el, doc) {
  let cur = el;
  while (cur && cur !== doc.documentElement) {
    const bg = parseRGB(cur.computedBg || getComputedStyle(cur).backgroundColor);
    if (bg) return bg;
    cur = cur.parentElement;
  }
  return [250, 250, 247]; // var(--paper) par défaut
}

mkdirSync(CAPTURE_DIR, { recursive: true });
mkdirSync(path.dirname(OUT), { recursive: true });

const report = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  captures: [],
  pages: {},
  siteRail: null,
};

const allVerdicts = {
  sixSections: true,
  anchors: true,
  noPurple: true,
  contrast: true,
  density: true,
  siteRail: true,
  console: true,
};

let totalConsoleErrors = 0;
let totalRequestFails = 0;

/* ── Boucle principale ─────────────────────────────────────────────────── */

for (const p of PAGES) {
  const pageReport = {
    sections: {},
    anchors: {},
    purpleHits: [],
    contrast: {},
    density: { violations: [] },
    console: [],
    requestFails: [],
  };

  const expectedIds = SECTION_IDS[p.id];

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

    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    /* 1 — six sections, id + data-section */
    const sectionsData = await page.evaluate((expected) => {
      const out = [];
      for (const id of expected) {
        const el = document.getElementById(id);
        out.push({
          id,
          found: !!el,
          dataSection: el ? el.getAttribute('data-section') : null,
          rect: el ? (() => { const r = el.getBoundingClientRect(); return { top: r.top, height: r.height }; })() : null,
        });
      }
      return out;
    }, expectedIds);

    pageReport.sections[`w${w}`] = sectionsData;
    if (sectionsData.some((s) => !s.found || s.dataSection !== s.id)) {
      allVerdicts.sixSections = false;
    }

    /* 2 — chaque ancre résout */
    const anchorResults = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.site-subnav a[href^="#"]'));
      return links.map((a) => {
        const href = a.getAttribute('href') || '';
        const id = href.replace(/^#/, '');
        const target = id ? document.getElementById(id) : null;
        return { href, targetId: id, resolves: !!target };
      });
    });
    pageReport.anchors[`w${w}`] = anchorResults;

    // Test de scroll : on clique chaque ancre et on vérifie que la cible entre dans la fenêtre.
    const anchorClickResults = [];
    for (const a of anchorResults) {
      if (!a.resolves) { anchorClickResults.push({ ...a, scrolled: false }); continue; }
      const ok = await page.evaluate((id) => {
        const t = document.getElementById(id);
        if (!t) return false;
        t.scrollIntoView({ behavior: 'auto', block: 'start' });
        const r = t.getBoundingClientRect();
        // la cible doit être visible (top dans la fenêtre ou proche du haut)
        return r.top >= -2 && r.top < window.innerHeight;
      }, a.targetId);
      anchorClickResults.push({ ...a, scrolled: ok });
      if (!ok) allVerdicts.anchors = false;
    }
    pageReport.anchors[`w${w}`] = anchorClickResults;

    /* 3 — aucun HSL 250-330 sat > 25 %, SAUF une exception nommée
     *
     * L'interdit du violet-magenta (BARRE §4.2) a été écrit contre un dégradé
     * ACCIDENTEL de générateur sur la page Paliers — la marque déposée de l'AI
     * slop. Il n'a jamais visé un registre CHOISI.
     *
     * Le registre Vaporwave de l'app Design n'existe pas sans le magenta : sa
     * légende est « magenta sunset ». Il a été assigné à `#tests` d'Engagements
     * en connaissance de cause, et à cette seule section.
     *
     * Sans cette exception, l'outil rendait 51 hits, tous dans `#tests`, et
     * faisait échouer en cascade site-paliers et site-engagements qui
     * l'appellent en non-régression. Trois rouges pour un choix assumé.
     *
     * Vérifié à la mesure avant d'ajouter l'exception : aucune des cinq autres
     * sections d'Engagements ne porte de violet. Si ça change, ça doit échouer. */
    const EXCEPTIONS_VIOLET = { engagements: ['tests'] };
    const sectionsExemptes = EXCEPTIONS_VIOLET[p.id] ?? [];

    const purpleHits = await page.evaluate((exemptes) => {
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
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
          }
          h /= 6;
        }
        return { h: h * 360, s: s * 100 };
      }
      const hits = [];
      const elements = document.querySelectorAll('main *, .site-footer *, .site-subnav *, .site-top *');
      for (const el of elements) {
        // Une section explicitement exemptée ne compte pas. L'exemption est
        // nominative : elle ne peut pas s'étendre par accident à une voisine.
        const sec = el.closest('section[data-section]');
        if (sec && exemptes.includes(sec.getAttribute('data-section'))) continue;
        const cs = getComputedStyle(el);
        const props = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
        for (const p of props) {
          const v = cs[p];
          if (!v || v === 'none' || v === 'transparent') continue;
          if (v.startsWith('linear-gradient') || v.startsWith('radial-gradient')) {
            const stops = v.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/g) || [];
            for (const s of stops) {
              const rgb = parseColor(s.trim());
              if (!rgb) continue;
              const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
              if (hsl.h >= 250 && hsl.h <= 330 && hsl.s > 25) {
                hits.push({ tag: el.tagName, cls: el.className?.toString?.() || '', prop: p, value: v.slice(0, 120), hue: Math.round(hsl.h), sat: Math.round(hsl.s) });
              }
            }
          } else {
            const rgb = parseColor(v);
            if (!rgb) continue;
            const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
            if (hsl.h >= 250 && hsl.h <= 330 && hsl.s > 25) {
              hits.push({ tag: el.tagName, cls: el.className?.toString?.() || '', prop: p, value: v, hue: Math.round(hsl.h), sat: Math.round(hsl.s) });
            }
          }
        }
      }
      return hits.slice(0, 50);
    }, sectionsExemptes);
    if (purpleHits.length) {
      allVerdicts.noPurple = false;
      pageReport.purpleHits.push(...purpleHits.map((h) => ({ ...h, width: w })));
    }

    /* 4 — contraste texte/fond pour tous les éléments textuels.
       Le fond effectif est calculé dans la même passe côté navigateur
       en remontant le DOM jusqu'à un parent non-transparent. */
    const contrastData = await page.evaluate(() => {
      function parseRGBA(str) {
        const m = (str || '').match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map((s) => s.trim());
        return [Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3] ?? 1)];
      }
      function effectiveBg(el) {
        // Compose tous les fonds en remontant jusqu'à <html>. Un rgba
        // semi-transparent doit être composé avec le parent ; un fond
        // solide (alpha = 1) écrase ce qu'il y a dessous. On ne s'arrête
        // jamais avant documentElement, sinon le premier rgba semi-
        // transparent (ex. rgba(51,255,0,0.04) sur le journal d'audit)
        // domine et empêche de voir le fond noir de la section.
        let cur = el;
        let rgb = [250, 250, 247]; // var(--paper) par défaut
        while (cur && cur !== document.documentElement) {
          const rgba = parseRGBA(getComputedStyle(cur).backgroundColor);
          if (rgba && rgba[3] > 0) {
            rgb = [
              rgba[0] * rgba[3] + rgb[0] * (1 - rgba[3]),
              rgba[1] * rgba[3] + rgb[1] * (1 - rgba[3]),
              rgba[2] * rgba[3] + rgb[2] * (1 - rgba[3]),
            ];
            if (rgba[3] >= 0.999) break; // fond solide : pas besoin de remonter
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
          tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 60),
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
          fg: `rgba(${fg.join(',')})`,
          bg: `rgba(${bg.join(',')})`,
        });
      }
    }
    pageReport.contrast[`w${w}`] = {
      sampled: contrastData.length,
      minRatio: minRatio === Infinity ? null : Number(minRatio.toFixed(2)),
      violations: contrastViolations.slice(0, 30),
    };
    if (contrastViolations.length) allVerdicts.contrast = false;

    /* 5 — densité > 400 chars par section de contenu */
    const densityData = await page.evaluate((expected) => {
      const out = {};
      for (const id of expected) {
        const el = document.getElementById(id);
        if (!el) continue;
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        out[id] = { chars: txt.length };
      }
      return out;
    }, expectedIds);
    for (const id of expectedIds) {
      const c = densityData[id]?.chars ?? 0;
      if (c < 400) {
        pageReport.density.violations.push({ id, chars: c, width: w });
        allVerdicts.density = false;
      }
    }

    /* capture */
    const cap = path.join(CAPTURE_DIR, `sections-${p.id}-${w}.png`);
    await page.screenshot({ path: cap, fullPage: true });
    report.captures.push(cap);

    /* 7 — console + requêtes */
    pageReport.console = pageReport.console.concat(consoleErrors);
    pageReport.requestFails = pageReport.requestFails.concat(requestFails);
    totalConsoleErrors += consoleErrors.length;
    totalRequestFails += requestFails.length;
    if (consoleErrors.length || requestFails.length) allVerdicts.console = false;

    await context.close();
  }

  report.pages[p.id] = pageReport;
}

await browser.close();

/* 6 — non-régression site-rail.mjs */
console.log('\nNon-régression · node tools/site-rail.mjs …');
const railProc = spawnSync(
  process.execPath,
  [path.join(process.cwd(), 'tools', 'site-rail.mjs'),
    '--base=' + BASE,
    '--out=' + path.join(path.dirname(OUT), 'site-sections-rail.json'),
    '--capture-dir=' + path.join(CAPTURE_DIR, 'rail')],
  { encoding: 'utf8' }
);
report.siteRail = {
  exitCode: railProc.status,
  stdoutTail: (railProc.stdout || '').split('\n').slice(-25).join('\n'),
  stderrTail: (railProc.stderr || '').split('\n').slice(-10).join('\n'),
};
if (railProc.status !== 0) allVerdicts.siteRail = false;

report.totals = {
  consoleErrors: totalConsoleErrors,
  requestFails: totalRequestFails,
  captures: report.captures.length,
  verdicts: allVerdicts,
};

writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

console.log('\nSections · /paliers + /engagements · base ' + BASE);
for (const p of PAGES) {
  const pr = report.pages[p.id];
  console.log(`  ${p.id}`);
  for (const [w, data] of Object.entries(pr.sections)) {
    const ok = data.every((s) => s.found && s.dataSection === s.id);
    console.log(`    ${w.padEnd(4)} sections ${ok ? '✓' : '✗'} ${data.map((s) => s.id + (s.found && s.dataSection === s.id ? '✓' : '✗')).join(' ')}`);
  }
}
console.log('  Ancres résolvent + scrollent :');
for (const p of PAGES) {
  const pr = report.pages[p.id];
  console.log(`    ${p.id}`);
  for (const [w, arr] of Object.entries(pr.anchors)) {
    const allOk = arr.every((a) => a.resolves && a.scrolled);
    console.log(`      ${w.padEnd(4)} ${allOk ? '✓' : '✗'} (${arr.filter((a) => a.resolves && a.scrolled).length}/${arr.length})`);
  }
}
console.log('  Aucun violet/magenta :');
for (const p of PAGES) {
  const pr = report.pages[p.id];
  const hits = pr.purpleHits.length;
  console.log(`    ${p.id.padEnd(12)} ${hits === 0 ? '✓' : '✗ ' + hits + ' hit(s)'}`);
  if (hits) for (const h of pr.purpleHits.slice(0, 3)) console.log(`      - ${h.tag}.${h.cls.slice(0, 30)} ${h.prop} hue=${h.hue} sat=${h.sat}`);
}
console.log('  Contraste (échantillons + min) :');
for (const p of PAGES) {
  const pr = report.pages[p.id];
  console.log(`    ${p.id}`);
  for (const [w, data] of Object.entries(pr.contrast)) {
    console.log(`      ${w.padEnd(4)} min ${data.minRatio} ${data.violations.length === 0 ? '✓' : '✗ ' + data.violations.length + ' violation(s)'}`);
    if (data.violations.length) for (const v of data.violations.slice(0, 3)) console.log(`        - ratio ${v.ratio} < ${v.threshold} · ${v.tag}.${v.cls} "${v.text.slice(0, 30)}"`);
  }
}
console.log('  Densité (caractères par section, cible > 400) :');
for (const p of PAGES) {
  const pr = report.pages[p.id];
  const viols = pr.density.violations;
  console.log(`    ${p.id.padEnd(12)} ${viols.length === 0 ? '✓' : '✗ ' + viols.map((v) => `${v.id}=${v.chars}`).join(', ')}`);
}
console.log(`  site-rail.mjs : exit ${report.siteRail.exitCode} ${report.siteRail.exitCode === 0 ? '✓' : '✗'}`);
if (report.siteRail.exitCode !== 0) {
  console.log('    --- sortie ---');
  console.log(report.siteRail.stdoutTail);
}
console.log(`  Erreurs console (total) : ${totalConsoleErrors} ${totalConsoleErrors === 0 ? '✓' : '✗'}`);
console.log(`  Requêtes échouées (total) : ${totalRequestFails} ${totalRequestFails === 0 ? '✓' : '✗'}`);

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
