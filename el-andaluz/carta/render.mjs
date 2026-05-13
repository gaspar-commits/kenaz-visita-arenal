// El Andaluz — carta render: PDF imprimible + screenshots mobile/print
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

  // La historia
  await mobilePage.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-02-historia.png'),
    fullPage: false,
  });

  // Arroces (la sección protagonista — la tercera "section" del flow)
  await mobilePage.evaluate(() => {
    const sections = document.querySelectorAll('.section');
    // section[0] = historia, section[1] = arroces (después de la primera figure)
    if (sections[1]) sections[1].scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-03-arroces.png'),
    fullPage: false,
  });

  // Tapas
  await mobilePage.evaluate(() => {
    const sections = document.querySelectorAll('.section');
    if (sections[2]) sections[2].scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.resolve(__dirname, 'preview/mobile-04-tapas.png'),
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
  // 2. Desktop preview (1440 viewport) — fullpage
  // -----------------------------------------------------------
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto(fileUrl('carta-digital.html'), { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1500);

  await desktopPage.screenshot({
    path: path.resolve(__dirname, 'preview/desktop-hero.png'),
    fullPage: false,
  });
  await desktopPage.screenshot({
    path: path.resolve(__dirname, 'preview/desktop-fullpage.png'),
    fullPage: true,
  });
  await desktopCtx.close();
  console.log('desktop screenshots done');

  // -----------------------------------------------------------
  // 3. PDF imprimible — A3 horizontal gatefold triple (2 hojas)
  // -----------------------------------------------------------
  const printCtx = await browser.newContext({
    viewport: { width: 1680, height: 1190 },
    deviceScaleFactor: 2,
  });
  const printPage = await printCtx.newPage();
  await printPage.goto(fileUrl('carta-imprimible.html'), { waitUntil: 'networkidle' });
  await printPage.waitForTimeout(2000);

  await printPage.pdf({
    path: path.resolve(__dirname, 'carta-imprimible.pdf'),
    width: '420mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    preferCSSPageSize: true,
  });
  console.log('PDF generated');

  // PNG previews of each printed sheet
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
