// LAS OLAS carta — render PDF + preview screenshots
// Usage: node render.mjs

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileUrl = (p) => 'file:///' + path.resolve(__dirname, p).replace(/\\/g, '/');

const previewDir = path.resolve(__dirname, 'preview');
if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();

  // -----------------------------------------------------------
  // 1. Mobile preview of carta-digital.html (iPhone 14 viewport)
  // -----------------------------------------------------------
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(fileUrl('carta-digital.html'), { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);

  // Cover
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-01-cover.png'),
    fullPage: false,
  });

  // La casa
  await mobilePage.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-02-casa.png'),
    fullPage: false,
  });

  // Arroces section
  await mobilePage.evaluate(() => {
    const target = document.querySelector('#arroces');
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-03-arroces.png'),
    fullPage: false,
  });

  // Entrantes
  await mobilePage.evaluate(() => {
    const sections = document.querySelectorAll('section');
    const target = Array.from(sections).find((s) => s.textContent.includes('Entrantes y'));
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-04-entrantes.png'),
    fullPage: false,
  });

  // Pescados y carnes
  await mobilePage.evaluate(() => {
    const sections = document.querySelectorAll('section');
    const target = Array.from(sections).find((s) => s.textContent.includes('Pescados'));
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-05-pescados.png'),
    fullPage: false,
  });

  // Bebidas
  await mobilePage.evaluate(() => {
    const sections = document.querySelectorAll('section');
    const target = Array.from(sections).find((s) => s.textContent.includes('Bebidas'));
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-06-bebidas.png'),
    fullPage: false,
  });

  // Full mobile
  await mobilePage.screenshot({
    path: path.resolve(previewDir, 'mobile-fullpage.png'),
    fullPage: true,
  });

  await mobileCtx.close();
  console.log('mobile screenshots done');

  // -----------------------------------------------------------
  // 2. PDF imprimible — A3 horizontal gatefold
  // -----------------------------------------------------------
  const printCtx = await browser.newContext({
    viewport: { width: 1600, height: 1131 },
    deviceScaleFactor: 2,
  });
  const printPage = await printCtx.newPage();
  await printPage.goto(fileUrl('carta-imprimible.html'), { waitUntil: 'networkidle' });
  await printPage.waitForTimeout(2000);

  // Generate PDF: A3 horizontal (420mm x 297mm), no margins (handled in @page)
  await printPage.pdf({
    path: path.resolve(__dirname, 'carta-imprimible.pdf'),
    width: '420mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    preferCSSPageSize: true,
  });
  console.log('PDF generated');

  // PNG preview of each printable sheet
  await printPage.setViewportSize({ width: 1680, height: 1190 });

  const sheets = await printPage.$$('.sheet');
  for (let i = 0; i < sheets.length; i++) {
    await sheets[i].screenshot({
      path: path.resolve(previewDir, `print-sheet-${i + 1}.png`),
    });
  }
  console.log(`print previews done (${sheets.length} sheets)`);

  await printCtx.close();
  await browser.close();
  console.log('all done');
})();
