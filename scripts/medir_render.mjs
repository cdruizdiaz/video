// Mide el tiempo de render por cuadro de varias composiciones (empaqueta una sola vez y cronometra solo el render).
// Uso: node scripts/medir_render.mjs <comp>[:desde-hasta][:calidad] … [--gl angle] [--salida carpeta]
//   p. ej. node scripts/medir_render.mjs claudio-prueba-motionblur-sin:13-47 claudio-prueba-motionblur-camara:13-47:borrador
// Cada medición se hace dos veces y se informa la segunda (la primera calienta el navegador y las fuentes).
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const opc = (n) => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] : undefined);
const gl = opc("gl");
const salida = opc("salida") ?? mkdtempSync(path.join(os.tmpdir(), "medir-"));
const pedidos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const p of pedidos) {
  const [id, rango, calidad] = p.split(":");
  const inputProps = calidad ? { calidad } : {};
  const composition = await selectComposition({ serveUrl, id, inputProps });
  const [desde, hasta] = rango ? rango.split("-").map(Number) : [0, composition.durationInFrames - 1];
  let ms = 0;
  for (let vez = 0; vez < 2; vez++) {
    const t0 = performance.now();
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: "h264",
      muted: true,
      frameRange: [desde, hasta],
      outputLocation: path.join(salida, `${id}.mp4`),
      chromiumOptions: gl ? { gl } : {},
      logLevel: "error",
    });
    ms = performance.now() - t0;
  }
  const n = hasta - desde + 1;
  console.log(`${p.padEnd(48)} ${(ms / n / 1000).toFixed(3)} s/cuadro · ${n} cuadros ${composition.width}×${composition.height}`);
}
