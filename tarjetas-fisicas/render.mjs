// =============================================================
// Kenaz · Tarjetas fisicas · render
// Genera 1 PDF por negocio (85x55mm, frente + dorso) listo para
// imprimir en cualquier copisteria de Calpe.
//
// Uso: node render.mjs
// Deps: playwright + qrcode (en monorepo root)
// =============================================================

import { chromium } from "playwright";
import QRCode from "qrcode";
import { promises as fs } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(__dirname, "tarjeta-template.html");

// -------------------------------------------------------------
// Catalogo de negocios — slug + nombre + URL del mockup web-v2
// Slugs y rutas estan tomadas del dashboard-visita-martes.html
// -------------------------------------------------------------
const BASE_URL = "https://gaspar-commits.github.io/kenaz-visita-arenal";

const NEGOCIOS = [
  // file-slug    nombre mostrado en tarjeta              segmento URL
  { slug: "razo",        nombre: "RAZO",                  path: "razo/web-v2/" },
  { slug: "costa",       nombre: "Restaurante Costa",     path: "costa/web-v2/" },
  { slug: "el-andaluz",  nombre: "El Andaluz",            path: "el-andaluz/web/" },
  { slug: "cacao",       nombre: "Cacao Bar",             path: "cacao/web/" },
  { slug: "tu-capricho", nombre: "Tu Capricho",           path: "tu-capricho/web/" },
  { slug: "mosselhuis",  nombre: "Mosselhuis",            path: "mosselhuis/web/" },
  { slug: "morena",      nombre: "Morena Restobar",       path: "morena/web/" },
  { slug: "semsa-beach", nombre: "Semsa Beach",           path: "semsa-beach/web/" },
  { slug: "las-olas",    nombre: "Las Olas",              path: "las-olas/web/" },
  { slug: "pasteleria",  nombre: "Pasteleria Av Europa",  path: "pasteleria-av-europa/web/" },
  { slug: "peca2",       nombre: "Heladeria Peca2",       path: "peca2/web/" },
  { slug: "amara",       nombre: "Amara",                 path: "amara/web/" },
  { slug: "hydra",       nombre: "Hydra",                 path: "hydra/web/" },
];

// -------------------------------------------------------------
// 1. Leer template HTML
// -------------------------------------------------------------
const template = await fs.readFile(TEMPLATE, "utf8");

// -------------------------------------------------------------
// 2. Helper: generar QR como data URL (negro sobre blanco)
//    Tamano 800px para que escanee perfecto a 22mm impreso.
// -------------------------------------------------------------
async function qrDataUrl(url) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 800,
    color: {
      dark: "#050505",
      light: "#f2f2f2",
    },
  });
}

// -------------------------------------------------------------
// 3. Render PDFs
// -------------------------------------------------------------
const browser = await chromium.launch();

let okCount = 0;
let firstSamplePng = null;

for (const n of NEGOCIOS) {
  const mockupUrl = `${BASE_URL}/${n.path}`;
  const qr = await qrDataUrl(mockupUrl);

  const html = template
    .replaceAll("{{NOMBRE_NEGOCIO}}", n.nombre)
    .replaceAll("{{URL_MOCKUP}}", mockupUrl)
    .replaceAll("{{QR_DATA_URL}}", qr);

  // Tambien escribimos el HTML resuelto por si Gaspar quiere
  // ajustar manualmente algo antes de imprimir.
  const htmlOut = resolve(__dirname, `${n.slug}-tarjeta.html`);
  await fs.writeFile(htmlOut, html, "utf8");

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  // pequena pausa por si las webfonts tardan un toque
  await page.waitForTimeout(400);

  const pdfOut = resolve(__dirname, `${n.slug}-tarjeta.pdf`);
  await page.pdf({
    path: pdfOut,
    width: "85mm",
    height: "55mm",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });

  // Sample PNG del primer negocio para verificacion visual rapida
  if (!firstSamplePng) {
    await page.setViewportSize({ width: 850, height: 1100 });
    const samplePath = resolve(__dirname, "_sample-preview.png");
    await page.screenshot({ path: samplePath, fullPage: true });
    firstSamplePng = samplePath;
  }

  await ctx.close();

  okCount++;
  console.log(`OK  ${n.slug.padEnd(13)} -> ${n.slug}-tarjeta.pdf  (${mockupUrl})`);
}

await browser.close();

// -------------------------------------------------------------
// 4. Tarjeta "template" generica (con placeholders sin reemplazar)
//    Util para imprimir tarjetas en blanco si surge un negocio
//    nuevo durante la visita.
// -------------------------------------------------------------
{
  const browser2 = await chromium.launch();
  const ctx = await browser2.newContext();
  const page = await ctx.newPage();
  const blankQr = await qrDataUrl("https://kenaz.studio");
  const blankHtml = template
    .replaceAll("{{NOMBRE_NEGOCIO}}", "Tu Negocio")
    .replaceAll("{{URL_MOCKUP}}", "https://kenaz.studio")
    .replaceAll("{{QR_DATA_URL}}", blankQr);
  await page.setContent(blankHtml, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.pdf({
    path: resolve(__dirname, "tarjeta-template.pdf"),
    width: "85mm",
    height: "55mm",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });
  await ctx.close();
  await browser2.close();
  console.log(`OK  template      -> tarjeta-template.pdf  (blank)`);
}

console.log(`\nListo: ${okCount} tarjetas + 1 template generadas en ${__dirname}`);
console.log(`Sample preview: ${firstSamplePng}`);
