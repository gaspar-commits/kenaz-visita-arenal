import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = 'file:///' + resolve(__dirname, 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();

  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const dPage = await desktop.newPage();
  await dPage.goto(FILE, { waitUntil: 'networkidle' });
  await dPage.waitForTimeout(800);
  await dPage.screenshot({ path: resolve(__dirname, 'desktop-hero.png'), fullPage: false });
  await dPage.screenshot({ path: resolve(__dirname, 'desktop-fullpage.png'), fullPage: true });
  await desktop.close();

  // Mobile (iPhone 14 Pro)
  const mobile = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const mPage = await mobile.newPage();
  await mPage.goto(FILE, { waitUntil: 'networkidle' });
  await mPage.waitForTimeout(800);
  await mPage.screenshot({ path: resolve(__dirname, 'mobile-hero.png'), fullPage: false });
  await mPage.screenshot({ path: resolve(__dirname, 'mobile-fullpage.png'), fullPage: true });
  await mobile.close();

  await browser.close();
  console.log('Screenshots done.');
})();
