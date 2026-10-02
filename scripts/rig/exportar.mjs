// Exporta una composición de personaje (plantilla PersonajeRig u otra) para usar en CapCut, Premiere o redes:
//   --mov  ProRes 4444 con transparencia (.mov; Premiere y CapCut lo importan con alfa)   [por defecto]
//   --png  secuencia de PNG con transparencia (carpeta <pieza>_vN_png/; respaldo universal, p. ej. sprites)
//   --mp4  H.264 crf 18 (sin transparencia: para composiciones con fondo, listo para Instagram)
// Nunca sobrescribe: busca la última versión de <pieza> en out/<ID>/final/ y exporta la _vN siguiente (o --version N
// si no existe). Verifica el resultado (alfa, cantidad de cuadros, que nada quede cortado en el borde) y anota la
// entrega en src/trabajos/<ID>/TRABAJO.md.
// Uso: node scripts/rig/exportar.mjs <composición> <ID> <pieza_formato> [--mov] [--png] [--mp4] [--nota "cambios"]
import { bundle } from "@remotion/bundler";
import { renderFrames, renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const herr = JSON.parse(readFileSync(join(RAIZ, "scripts/herramientas.json"), "utf8"));
const args = process.argv.slice(2);
const [comp, id, pieza] = args;
if (!comp || !id || !pieza) {
  console.error("Uso: node scripts/rig/exportar.mjs <composición> <ID> <pieza_formato> [--mov] [--png] [--mp4] [--nota texto]");
  process.exit(1);
}
const tiene = (f) => args.includes(`--${f}`);
const opc = (n) => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] : undefined);
const formatos = ["mov", "png", "mp4"].filter(tiene);
if (!formatos.length) formatos.push("mov");

const final = join(RAIZ, "out", id, "final");
mkdirSync(final, { recursive: true });
// Versión: la siguiente a la más alta de esta pieza (en cualquier formato)
const versiones = readdirSync(final)
  .map((a) => a.match(new RegExp(`^${pieza.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_v(\\d+)(\\.|_png$)`)))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const N = opc("version") ? Number(opc("version")) : Math.max(0, ...versiones) + 1;
const base = `${pieza}_v${N}`;
for (const f of formatos) {
  const destino = join(final, f === "png" ? `${base}_png` : `${base}.${f}`);
  if (existsSync(destino)) {
    console.error(`Ya existe ${destino}: no se sobrescribe (usar otra --version)`);
    process.exit(1);
  }
}

console.log(`Empaquetando… (${comp} → ${base}: ${formatos.join(", ")})`);
const serveUrl = await bundle({ entryPoint: join(RAIZ, "src/index.ts"), onProgress: () => undefined });
const composition = await selectComposition({ serveUrl, id: comp });
const { width, height, durationInFrames, fps } = composition;
const entregados = [];
const ffprobe = (archivo, campos) =>
  execFileSync(herr.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", `stream=${campos}`, "-of", "default=nw=1:nk=1", archivo], { encoding: "utf8" }).trim().split(/\r?\n/);

for (const f of formatos) {
  if (f === "mov") {
    const salida = join(final, `${base}.mov`);
    await renderMedia({ composition, serveUrl, codec: "prores", proResProfile: "4444", pixelFormat: "yuva444p10le", imageFormat: "png", outputLocation: salida });
    const [pix, cuadros] = ffprobe(salida, "pix_fmt,nb_frames");
    if (!pix.includes("yuva")) throw new Error(`${salida}: sin canal alfa (${pix})`);
    console.log(`OK ${salida} · ${width}×${height} · ${pix} · ${cuadros} cuadros`);
    entregados.push(`${base}.mov`);
  } else if (f === "mp4") {
    const salida = join(final, `${base}.mp4`);
    await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, outputLocation: salida });
    console.log(`OK ${salida} · ${width}×${height}`);
    entregados.push(`${base}.mp4`);
  } else {
    const carpeta = join(final, `${base}_png`);
    mkdirSync(carpeta, { recursive: true });
    await renderFrames({ composition, serveUrl, imageFormat: "png", outputDir: carpeta, onStart: () => undefined, onFrameUpdate: () => undefined });
    // Nombres simples: <pieza>_0001.png …
    const pngs = readdirSync(carpeta).filter((a) => a.endsWith(".png")).sort();
    pngs.forEach((a, i) => renameSync(join(carpeta, a), join(carpeta, `${pieza}_${String(i + 1).padStart(4, "0")}.png`)));
    if (pngs.length !== durationInFrames) throw new Error(`${carpeta}: ${pngs.length} PNG y la composición tiene ${durationInFrames} cuadros`);
    // Transparencia y borde libre (nada cortado), con Pillow
    const py = `
import sys, glob
from PIL import Image
archivos = sorted(glob.glob(sys.argv[1] + "/*.png"))
con_alfa = cortados = 0
for a in archivos:
    im = Image.open(a)
    if im.mode != "RGBA":
        continue
    al = im.getchannel("A")
    if al.getextrema()[0] == 0:
        con_alfa += 1
    w, h = im.size
    borde = [al.crop((0, 0, w, 2)), al.crop((0, h - 2, w, h)), al.crop((0, 0, 2, h)), al.crop((w - 2, 0, w, h))]
    if any(b.getextrema()[1] > 8 for b in borde):
        cortados += 1
print(con_alfa, cortados, len(archivos))
`;
    const [conAlfa, cortados] = execFileSync(herr.python, ["-c", py, carpeta], { encoding: "utf8" }).trim().split(" ").map(Number);
    console.log(`OK ${carpeta} · ${pngs.length} PNG ${width}×${height} · con transparencia: ${conAlfa} · tocan el borde: ${cortados}`);
    if (cortados) console.log(`   Aviso: ${cortados} cuadros tocan el borde (¿personaje cortado? en un cruce de pantalla es normal al entrar y salir)`);
    entregados.push(`${base}_png/ (${pngs.length} PNG)`);
  }
}

// Anotar la entrega en TRABAJO.md (tabla "Entregas")
const ficha = join(RAIZ, "src/trabajos", id, "TRABAJO.md");
if (existsSync(ficha)) {
  const hoy = new Date().toISOString().slice(0, 10);
  const nota = opc("nota") ?? (N === 1 ? "Primera versión" : "—");
  let txt = readFileSync(ficha, "utf8");
  const fila = `| ${entregados.map((e) => "`" + e + "`").join(" · ")} | ${hoy} | ${nota} (${comp}, ${width}×${height}, ${durationInFrames} cuadros a ${fps} fps) |`;
  const marca = /(## Entregas\n\|[^\n]*\n\|[-| ]*\n(?:\|[^\n]*\n)*)/;
  txt = marca.test(txt) ? txt.replace(marca, (m) => m + fila + "\n") : txt + `\n${fila}\n`;
  writeFileSync(ficha, txt);
  console.log(`Anotado en ${ficha}`);
}
