// MORENA carta — render PDF + preview screenshots
// Usage: node render.mjs

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileUrl = (p) => 'file:///' + path.resolve(__dirname, p).replace(/\\/g, '/');

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
    path: path.resolve(__dirname, 'preview/mobile-01-cover.png'),
    fullPage: false,
  });

  // Story / La casa
  await mobilePage.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-02-story.png'),
    fullPage: false,
  });

  // Cócteles section
  await mobilePage.evaluate(() => {
    const target = document.querySelector('#cocteles');
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-03-cocteles.png'),
    fullPage: false,
  });

  // Para picar
  await mobilePage.evaluate(() => {
    const target = document.querySelector('#picar');
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-04-picar.png'),
    fullPage: false,
  });

  // Platos del paseo
  await mobilePage.evaluate(() => {
    const target = document.querySelector('#platos');
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-05-platos.png'),
    fullPage: false,
  });

  // Postres
  await mobilePage.evaluate(() => {
    const target = document.querySelector('#postres');
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-06-postres.png'),
    fullPage: false,
  });

  // Full mobile
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-fullpage.png'),
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
      path: path.resolve(__dirname, `preview/print-sheet-${i + 1}.png`),
    });
  }
  console.log('print previews done');

  await printCtx.close();
  await browser.close();
  console.log('all done');
})();
