// Renders scripts/og.html to public/og.png (1200×630), the image shown in link previews.
// Run: npx playwright install chromium && node scripts/make-og.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const at = (p) => fileURLToPath(new URL(p, import.meta.url));
const data = (p, type) => `data:${type};base64,${readFileSync(at(p)).toString("base64")}`;

const html = readFileSync(at("./og.html"), "utf8")
  .replace("__FONT__", data("../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2", "font/woff2"))
  .replace("__RAVEN__", data("../public/assets/raven.png", "image/png"))
  .replace("__PORTRAIT__", data("../public/assets/portrait-particles.png", "image/png"));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.waitForSelector("body[data-ready='1']");
await page.screenshot({ path: at("../public/og.png") });
await browser.close();
console.log("Wrote public/og.png");
