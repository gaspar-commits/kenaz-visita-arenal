// RAZO carta v2 — render PDF + preview screenshots
// Identidad: bar-restaurante mediterráneo (NO asador)
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

  // Cover top
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-01-cover.png'),
    fullPage: false,
  });

  // Scroll to la casa
  await mobilePage.evaluate(() => {
    const el = document.querySelector('#la-casa');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-02-casa.png'),
    fullPage: false,
  });

  // Scroll to mar
  await mobilePage.evaluate(() => {
    const el = document.querySelector('#mar');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-03-mar.png'),
    fullPage: false,
  });

  // Scroll to carnes (guiños rioplatenses)
  await mobilePage.evaluate(() => {
    const el = document.querySelector('#carnes');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-04-carnes.png'),
    fullPage: false,
  });

  // Full page mobile
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-fullpage.png'),
    fullPage: true,
  });

  await mobileCtx.close();
  console.log('mobile screenshots done');

  // -----------------------------------------------------------
  // 2. Desktop preview
  // -----------------------------------------------------------
  const deskCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
  });
  const deskPage = await deskCtx.newPage();
  await deskPage.goto(fileUrl('carta-digital.html'), { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(1500);

  await deskPage.screenshot({
    path: path.resolve(__dirname, 'preview/desktop-hero.png'),
    fullPage: false,
  });

  await deskPage.screenshot({
    path: path.resolve(__dirname, 'preview/desktop-fullpage.png'),
    fullPage: true,
  });

  await deskCtx.close();
  console.log('desktop screenshots done');

  // -----------------------------------------------------------
  // 3. PDF imprimible — A3 horizontal
  // -----------------------------------------------------------
  const printCtx = await browser.newContext({
    viewport: { width: 1600, height: 1131 },
    deviceScaleFactor: 2,
  });
  const printPage = await printCtx.newPage();
  await printPage.goto(fileUrl('carta-imprimible.html'), { waitUntil: 'networkidle' });
  await printPage.waitForTimeout(2000);

  // Generate PDF: A3 horizontal (420mm x 297mm)
  await printPage.pdf({
    path: path.resolve(__dirname, 'carta-imprimible.pdf'),
    width: '420mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    preferCSSPageSize: true,
  });
  console.log('PDF generated');

  // PNG previews per sheet
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
