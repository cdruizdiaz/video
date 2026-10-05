// Revisión automática de cuadros clave de una composición (sin abrir el video ni hacer el render completo).
// 1) Renderiza un borrador mudo chico (escala 0.25) de la composición o de un tramo.
// 2) ffmpeg mide el cambio entre cuadros (filtro scene) y elige los cuadros donde algo cambia de golpe
//    (cortes, entradas de globos, cambios de pose) más algunos repartidos parejo para no dejar huecos.
// 3) Arma una hoja de contactos con el número de cada cuadro (en rojo los de cambio brusco).
// Uso: node scripts/revisar.mjs <composición> [ID] [--max 24] [--parejos N] [--umbral U] [--escala 0.25]
//        [--desde 0] [--hasta N] [--columnas 6] [--props '{"…"}'] [--gl angle] [--fondo "#e9e4dc"]
// Salida: out/<ID>/revision/revisar_<composición>.png (sin ID: out/_revision/). Lista de cuadros en la consola.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const herr = JSON.parse(readFileSync(join(RAIZ, "scripts/herramientas.json"), "utf8"));

const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const posicionales = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const [comp, id] = posicionales;
if (!comp) {
  console.error("Uso: node scripts/revisar.mjs <composición> [ID] [--max 24] [--parejos N] [--umbral U] [--desde] [--hasta] [--gl angle]");
  process.exit(1);
}
const MAX = Number(opc("max", "24"));
const UMBRAL_MIN = 0.012; // score de escena de ffmpeg (0…1) por debajo del cual nunca es un cambio (ruido de compresión)
const SEPARACION = 6; // cuadros mínimos entre dos elegidos
const escala = Number(opc("escala", "0.25"));
const columnas = Number(opc("columnas", "6"));
const fondo = opc("fondo", "#e9e4dc");
const props = opc("props") ? JSON.parse(opc("props")) : undefined;
const chromiumOptions = opc("gl") ? { gl: opc("gl") } : {};

const serveUrl = await bundle({ entryPoint: join(RAIZ, "src/index.ts"), onProgress: () => undefined });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: props });
const desde = Number(opc("desde", "0"));
const hasta = Math.min(Number(opc("hasta", String(composition.durationInFrames - 1))), composition.durationInFrames - 1);

const tmp = join(RAIZ, "tmp", `revisar-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const borrador = join(tmp, "borrador.mp4");
const navegador = await openBrowser("chrome", { chromiumOptions });
const t0 = Date.now();
try {
  // 1) Borrador chico. Fondo transparente → se compone sobre gris claro para que se vea.
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: borrador,
    inputProps: props,
    scale: escala,
    muted: true,
    frameRange: [desde, hasta],
    crf: 28,
    puppeteerInstance: navegador,
    chromiumOptions,
    onProgress: () => undefined,
  });
  const tRender = (Date.now() - t0) / 1000;

  // 2) Score de cambio de cada cuadro (scene) con ffmpeg
  const log = spawnSync(herr.ffmpeg, ["-hide_banner", "-nostats", "-i", borrador, "-vf", "select='gte(scene,0)',metadata=print:key=lavfi.scene_score", "-an", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const scores = [...`${log.stdout}${log.stderr}`.matchAll(/lavfi\.scene_score=([\d.]+)/g)].map((m) => Number(m[1]));
  const n = scores.length || hasta - desde + 1;

  // Cuadros parejos (incluye primero y último; uno cada ~1,5 s, entre 8 y 16) + cambios bruscos de mayor a menor.
  // Cambio brusco = pico local del score por encima del percentil 95 de esta composición (o de --umbral):
  // así sirve igual para cortes de video (scores altos) que para un personaje que cambia de pose (scores bajos).
  const PAREJOS = Number(opc("parejos", String(Math.min(16, Math.max(8, Math.round(n / (composition.fps * 1.5)))))));
  const p95 = [...scores].sort((a, b) => a - b)[Math.floor(scores.length * 0.95)] ?? 1;
  const UMBRAL = Number(opc("umbral", String(Math.max(UMBRAL_MIN, p95))));
  const pico = (i) => scores[i] >= (scores[i - 1] ?? 0) && scores[i] >= (scores[i + 1] ?? 0);
  const elegidos = new Map(); // índice del borrador → ¿cambio brusco?
  for (let k = 0; k < PAREJOS; k++) elegidos.set(Math.round((k * (n - 1)) / Math.max(1, PAREJOS - 1)), false);
  const lejos = (i) => [...elegidos.keys()].every((j) => Math.abs(j - i) >= SEPARACION);
  const cambios = scores.map((s, i) => [s, i]).filter(([s, i]) => s >= UMBRAL && pico(i)).sort((a, b) => b[0] - a[0]);
  for (const [, i] of cambios) {
    if (elegidos.size >= MAX) break;
    // el cuadro donde ya cambió (i) es el que muestra lo nuevo
    if (lejos(i)) elegidos.set(i, true);
    else if (!elegidos.get(i)) for (const j of elegidos.keys()) if (Math.abs(j - i) < SEPARACION && !elegidos.get(j)) { elegidos.delete(j); elegidos.set(i, true); break; }
  }
  const lista = [...elegidos.entries()].sort((a, b) => a[0] - b[0]);

  // 3) Extraer esos cuadros del borrador y armar la hoja con Pillow
  const expr = lista.map(([i]) => `eq(n\\,${i})`).join("+");
  execFileSync(herr.ffmpeg, ["-v", "error", "-y", "-i", borrador, "-vf", `select='${expr}'`, "-fps_mode", "passthrough", join(tmp, "c_%04d.png")]);
  const pngs = readdirSync(tmp).filter((f) => f.startsWith("c_")).sort();
  const etiquetas = lista.slice(0, pngs.length).map(([i, brusco]) => `${desde + i}${brusco ? "*" : ""}`);
  const salida = resolve(RAIZ, id ? `out/${id}/revision/revisar_${comp}.png` : `out/_revision/revisar_${comp}.png`);
  mkdirSync(dirname(salida), { recursive: true });
  const py = `
import sys
from PIL import Image, ImageDraw
carpeta, salida, columnas, fondo = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
pares = sys.argv[5:]
nombres, etiquetas = pares[0::2], pares[1::2]
ims = [Image.open(carpeta + "/" + n).convert("RGB") for n in nombres]
w = max(i.width for i in ims); h = max(i.height for i in ims)
filas = (len(ims) + columnas - 1) // columnas
hoja = Image.new("RGB", (min(columnas, len(ims)) * (w + 4) + 4, filas * (h + 4) + 4), fondo)
d = ImageDraw.Draw(hoja)
for k, (im, e) in enumerate(zip(ims, etiquetas)):
    x = 4 + (k % columnas) * (w + 4); y = 4 + (k // columnas) * (h + 4)
    hoja.paste(im, (x, y))
    brusco = e.endswith("*")
    d.rectangle([x, y, x + 8 * len(e) + 6, y + 13], fill=(200, 30, 30) if brusco else (255, 255, 255))
    d.text((x + 3, y + 1), e.rstrip("*"), fill=(255, 255, 255) if brusco else (0, 0, 0))
hoja.save(salida)
`;
  execFileSync(herr.python, ["-c", py, tmp, salida, String(columnas), fondo, ...pngs.flatMap((p, k) => [p, etiquetas[k]])], { stdio: "inherit" });
  const bruscos = lista.filter(([, b]) => b).map(([i]) => desde + i);
  console.log(`OK ${salida}`);
  console.log(`   ${lista.length} cuadros de ${n} (borrador ${tRender.toFixed(0)} s) · umbral ${UMBRAL.toFixed(3)} · cambios bruscos: ${bruscos.join(", ") || "ninguno"}`);
} finally {
  await navegador.close({ silent: true });
  rmSync(tmp, { recursive: true, force: true });
}
