// Capa 3D en caché: renderiza UNA vez la composición 3D transparente de un trabajo (WebGL con --gl=angle) a un webm
// VP9 con alfa y la reusa mientras no cambie. Así el render final y las revisiones no vuelven a calcular el 3D:
// la composición final la monta con <OffthreadVideo transparent> (ver src/trabajos/2026-10-04_claudio_prueba-3d/).
// La huella es: props de la composición + código del rig, de los personajes y del trabajo + piezas/rig.json.
// Si algo de eso cambia, la próxima corrida la vuelve a renderizar (y borra la anterior de esa composición).
// Uso: node scripts/capa3d.mjs <composición-capa> <ID> [--gl angle] [--forzar]
// Salida: public/trabajos/<ID>/cache3d/<composición>_<huella>.webm y la entrada en public/trabajos/<ID>/datos/cache3d.json
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const [comp, id] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1] === "--gl"));
if (!comp || !id) {
  console.error("Uso: node scripts/capa3d.mjs <composición-capa> <ID> [--gl angle] [--forzar]");
  process.exit(1);
}
const gl = opc("gl", "angle");

// ---------- Huella ----------
const archivos = (dir, filtro) => {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && filtro.test(e.name))
    .map((e) => path.join(e.parentPath ?? e.path, e.name))
    .sort();
};
const fuentes = [
  ...archivos("src/rig", /\.(ts|tsx)$/),
  ...archivos("src/personajes", /\.(ts|tsx|json)$/),
  ...archivos("src/plantillas/PersonajeRig", /\.(ts|tsx)$/),
  ...archivos(`src/trabajos/${id}`, /\.(ts|tsx)$/),
  ...archivos("public/personajes", /^(piezas|rig)\.json$/),
  ...archivos(`public/trabajos/${id}/datos`, /\.json$/).filter((f) => !f.endsWith("cache3d.json")),
].filter((f) => !f.includes("__tests__"));

const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src/index.ts"), onProgress: () => undefined });
const composition = await selectComposition({ serveUrl, id: comp });
const h = crypto.createHash("sha256");
h.update(JSON.stringify({ props: composition.props, w: composition.width, h: composition.height, d: composition.durationInFrames, fps: composition.fps }));
for (const f of fuentes) h.update(path.relative(RAIZ, f).replaceAll("\\", "/")).update(fs.readFileSync(f));
const huella = h.digest("hex").slice(0, 12);

const carpeta = path.join(RAIZ, "public/trabajos", id, "cache3d");
const archivo = path.join(carpeta, `${comp}_${huella}.webm`);
const relativo = path.relative(path.join(RAIZ, "public"), archivo).replaceAll("\\", "/");
const indice = path.join(RAIZ, "public/trabajos", id, "datos/cache3d.json");
const guardarIndice = () => {
  const d = fs.existsSync(indice) ? JSON.parse(fs.readFileSync(indice, "utf8")) : {};
  d[comp] = relativo;
  fs.mkdirSync(path.dirname(indice), { recursive: true });
  fs.writeFileSync(indice, JSON.stringify(d, null, 2) + "\n");
};

if (fs.existsSync(archivo) && !args.includes("--forzar")) {
  guardarIndice();
  console.log(`OK reusada ${relativo} (huella ${huella}: no cambió nada)`);
  process.exit(0);
}
fs.mkdirSync(carpeta, { recursive: true });
for (const viejo of fs.readdirSync(carpeta).filter((f) => f.startsWith(`${comp}_`))) fs.rmSync(path.join(carpeta, viejo));
const t0 = Date.now();
await renderMedia({
  composition,
  serveUrl,
  codec: "vp9",
  imageFormat: "png",
  pixelFormat: "yuva420p",
  crf: 24,
  muted: true,
  outputLocation: archivo,
  chromiumOptions: { gl },
  onProgress: () => undefined,
});
guardarIndice();
const seg = (Date.now() - t0) / 1000;
console.log(`OK ${relativo} · ${composition.durationInFrames} cuadros en ${seg.toFixed(0)} s (${((seg / composition.durationInFrames) * 1000).toFixed(0)} ms/cuadro) · huella ${huella}`);
