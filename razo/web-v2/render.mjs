import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(__dirname, "index.html");
const URL = pathToFileURL(HTML).href;

const SHOTS = [
  { name: "mobile-hero.png",     viewport: { width: 390,  height: 844  }, fullPage: false },
  { name: "mobile-fullpage.png", viewport: { width: 390,  height: 844  }, fullPage: true  },
  { name: "desktop-hero.png",    viewport: { width: 1440, height: 900  }, fullPage: false },
  { name: "desktop-fullpage.png",viewport: { width: 1440, height: 900  }, fullPage: true  },
];

const browser = await chromium.launch();
for (const { name, viewport, fullPage } of SHOTS) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const out = resolve(__dirname, name);
  await page.screenshot({ path: out, fullPage });
  console.log("OK", name, viewport.width + "x" + viewport.height, fullPage ? "(full)" : "");
  await ctx.close();
}
await browser.close();
