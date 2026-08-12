import { chromium } from '/Users/amado/gauntlet-eyes/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';

const root = 'http://127.0.0.1:4173/site/index.html';
const captures = [
  { width: 1440, height: 900 },
  { width: 900, height: 1000 },
  { width: 390, height: 844 },
];
const allowedRadii = new Set([0, 16, 24, 32, 9999]);
const fail = (message) => { throw new Error(message); };
const luminance = (rgb) => {
  const values = rgb.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
  const linear = values.map((value) => { const channel = value / 255; return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contrast = (foreground, background) => {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];
const failedRequests = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('requestfailed', (request) => failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? 'failed'}`));
await page.goto(root, { waitUntil: 'networkidle' });

const sectionReport = await page.evaluate(() => {
  const sections = [...document.querySelectorAll('main > section')];
  const links = [...document.querySelectorAll('.site-subnav a[data-section-link]')];
  return {
    sections: sections.map((section) => ({ id: section.id, data: section.dataset.section })),
    links: links.map((link) => ({ href: link.getAttribute('href'), target: document.querySelector(link.getAttribute('href'))?.id })),
  };
});
if (sectionReport.sections.length !== 5) fail(`Expected 5 sections, got ${sectionReport.sections.length}`);
for (const section of sectionReport.sections) if (!section.id || section.id !== section.data) fail(`Section id/data mismatch: ${JSON.stringify(section)}`);
for (const link of sectionReport.links) if (!link.target) fail(`Broken section anchor: ${link.href}`);

for (const viewport of captures) {
  await page.setViewportSize(viewport);
  await page.screenshot({ path: `C:/Users/amado/AppData/Local/Temp/rondeur-${viewport.width}.png`, fullPage: true });
  const audit = await page.evaluate(() => {
    const main = document.querySelector('main');
    const visible = (element) => {
      const style = getComputedStyle(element);
      const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some((side) => style[`border${side}Style`] !== 'none' && Number.parseFloat(style[`border${side}Width`]) > 0);
      return hasBackground || hasBorder;
    };
    const radius = (element) => Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
    const rgb = (value) => value.match(/rgba?\([^)]*\)/)?.[0] ?? '';
    const elements = [...main.querySelectorAll('*')];
    const sharp = elements.filter((element) => { const box = element.getBoundingClientRect(); return box.width > 120 && box.height > 60 && visible(element) && radius(element) < 16; }).map((element) => { const style = getComputedStyle(element); return `${element.tagName.toLowerCase()}.${element.className}[${element.textContent.trim().slice(0, 24)}] bg=${style.backgroundColor} border=${style.borderTopStyle}/${style.borderBottomStyle}`; });
    const radii = [...new Set(elements.filter(visible).map(radius))];
    const violet = elements.flatMap((element) => [getComputedStyle(element).color, getComputedStyle(element).backgroundColor, getComputedStyle(element).borderTopColor]).filter((value) => { const match = value.match(/hsl\(([-\d.]+)[^,]*,\s*([\d.]+)%/); return match && Number(match[1]) >= 250 && Number(match[1]) <= 330 && Number(match[2]) > 25; });
    const text = elements.filter((element) => element.children.length === 0 && element.textContent?.trim()).map((element) => {
      const style = getComputedStyle(element);
      let backgroundElement = element.parentElement;
      while (backgroundElement && getComputedStyle(backgroundElement).backgroundColor === 'rgba(0, 0, 0, 0)') backgroundElement = backgroundElement.parentElement;
      const heading = element.closest('h1, h2, h3, h4, h5, h6');
      return { text: element.textContent.trim().slice(0, 40), foreground: style.color, background: backgroundElement ? getComputedStyle(backgroundElement).backgroundColor : 'rgb(250, 250, 247)', fontSize: heading ? Number.parseFloat(getComputedStyle(heading).fontSize) : Number.parseFloat(style.fontSize), fontWeight: heading ? Number.parseInt(getComputedStyle(heading).fontWeight, 10) || 700 : Number.parseInt(style.fontWeight, 10) || 400 };
    });
    return { sharp, radii, violet, text };
  });
  if (audit.sharp.length) fail(`Sharp visible elements at ${viewport.width}: ${audit.sharp.join(', ')}`);
  const unexpected = audit.radii.filter((value) => !allowedRadii.has(value));
  if (unexpected.length) fail(`Unexpected radii at ${viewport.width}: ${unexpected.join(', ')}`);
  if (audit.violet.length) fail(`Violet colors at ${viewport.width}: ${audit.violet.join(', ')}`);
  const lowContrast = audit.text.filter((sample) => contrast(sample.foreground, sample.background) < (sample.fontSize >= 24 && sample.fontWeight >= 700 ? 3 : 4.5));
  if (lowContrast.length) fail(`Low contrast text at ${viewport.width}: ${lowContrast.map((sample) => `${sample.text} (${contrast(sample.foreground, sample.background).toFixed(2)}:1)`).join(', ')}`);
}

const shadows = await page.locator('#pain .pain-card').evaluateAll((cards) => cards.map((card) => getComputedStyle(card).boxShadow));
if (new Set(shadows).size !== 3) fail(`Pain card shadows are not all distinct: ${shadows.join(' | ')}`);
if (consoleErrors.length) fail(`Console errors: ${consoleErrors.join(' | ')}`);
if (failedRequests.length) fail(`Failed requests: ${failedRequests.join(' | ')}`);

execFileSync(process.execPath, ['tools/site-rail.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['tools/site-sections.mjs'], { stdio: 'inherit' });
console.log(JSON.stringify({ sections: sectionReport.sections, links: sectionReport.links, shadows, captures: captures.map(({ width }) => `C:/Users/amado/AppData/Local/Temp/rondeur-${width}.png`) }, null, 2));
await browser.close();
