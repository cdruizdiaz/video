// Hoja de contactos chica de una composición (para revisar animaciones sin abrir videos ni imágenes grandes).
// Empaqueta el proyecto una vez, renderiza los frames pedidos a escala reducida con la API de Remotion y los arma
// en una grilla con Pillow (Python del .venv), cada uno con su número de frame.
// Uso: node scripts/rig/hoja_animacion.mjs <composición> <salida.png> [--frames 0,10,20 | --cada 15]
//        [--desde 0] [--hasta N] [--columnas 6] [--escala 0.25] [--fondo "#e9e4dc"] [--props '{"…"}'] [--gl angle]
// (--gl angle para composiciones 3D con Three.js)
// Las composiciones con transparencia se componen sobre --fondo.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const herr = JSON.parse(readFileSync(join(RAIZ, "scripts/herramientas.json"), "utf8"));

const args = process.argv.slice(2);
const [comp, salida] = args;
if (!comp || !salida) {
  console.error("Uso: node scripts/rig/hoja_animacion.mjs <composición> <salida.png> [--frames a,b,c | --cada N] [--desde] [--hasta] [--columnas] [--escala] [--fondo] [--props json]");
  process.exit(1);
}
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const escala = Number(opc("escala", "0.25"));
const columnas = Number(opc("columnas", "6"));
const fondo = opc("fondo", "#e9e4dc");
const props = opc("props") ? JSON.parse(opc("props")) : undefined;
const chromiumOptions = opc("gl") ? { gl: opc("gl") } : {};

const serveUrl = await bundle({ entryPoint: join(RAIZ, "src/index.ts"), onProgress: () => undefined });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: props });
let frames;
if (opc("frames")) frames = opc("frames").split(",").map(Number);
else {
  const desde = Number(opc("desde", "0"));
  const hasta = Number(opc("hasta", String(composition.durationInFrames - 1)));
  const cada = Number(opc("cada", "15"));
  frames = [];
  for (let f = desde; f <= hasta; f += cada) frames.push(f);
}
frames = frames.filter((f) => f < composition.durationInFrames);

const tmp = join(RAIZ, "tmp", `hoja-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const navegador = await openBrowser("chrome", { chromiumOptions });
try {
  const archivos = [];
  for (const f of frames) {
    const nombre = `f${String(f).padStart(5, "0")}.png`;
    await renderStill({ composition, serveUrl, frame: f, output: join(tmp, nombre), scale: escala, imageFormat: "png", inputProps: props, puppeteerInstance: navegador, chromiumOptions });
    archivos.push(nombre);
  }
  // Grilla con Pillow: cada frame sobre el fondo, con su número
  const py = `
import sys
from PIL import Image, ImageDraw
carpeta, salida, columnas, fondo = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
nombres = sys.argv[5:]
ims = [Image.open(carpeta + "/" + n).convert("RGBA") for n in nombres]
w = max(i.width for i in ims); h = max(i.height for i in ims)
filas = (len(ims) + columnas - 1) // columnas
hoja = Image.new("RGB", (min(columnas, len(ims)) * (w + 4) + 4, filas * (h + 4) + 4), fondo)
d = ImageDraw.Draw(hoja)
for k, (im, n) in enumerate(zip(ims, nombres)):
    x = 4 + (k % columnas) * (w + 4); y = 4 + (k // columnas) * (h + 4)
    hoja.paste(im, (x, y), im)
    d.text((x + 4, y + 2), str(int(n[1:6])), fill=(0, 0, 0))
hoja.save(salida)
`;
  mkdirSync(dirname(resolve(RAIZ, salida)), { recursive: true });
  execFileSync(herr.python, ["-c", py, tmp, resolve(RAIZ, salida), String(columnas), fondo, ...archivos], { stdio: "inherit" });
  console.log(`OK ${salida} (${frames.length} frames: ${frames.slice(0, 10).join(", ")}${frames.length > 10 ? "…" : ""})`);
} finally {
  await navegador.close({ silent: true });
  rmSync(tmp, { recursive: true, force: true });
}
