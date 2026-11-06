// Captura la carta digital (https://menu.fu.do/coofi/qr-menu) con el Chrome que trae Remotion: texto y pantallas.
import { openBrowser } from "@remotion/renderer";
import fs from "node:fs";
const ID = "2026-10-27_docba_r1-nov";
const out = `public/trabajos/${ID}/img`;
const browser = await openBrowser("chrome", { chromiumOptions: { headless: true } });
const page = await browser.newPage({ context: { remotionRoot: process.cwd() }, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto({ url: "https://menu.fu.do/coofi/qr-menu", timeout: 60000 });
await new Promise((r) => setTimeout(r, 8000));
const texto = await page.evaluate(() => JSON.stringify({ t: document.body.innerText, imgs: [...document.images].map((i) => i.src).slice(0, 80) }));
fs.writeFileSync(`public/trabajos/${ID}/datos/menu_texto.txt`, texto);
console.log(String(texto).slice(0, 6000));
await browser.close();
