// Render repartido: parte una composición en tramos de cuadros, los renderiza por separado (en esta PC o en varias,
// con una carpeta de cola compartida) y los une con ffmpeg SIN recodificar. El audio se renderiza una sola vez entero
// (los fundidos y la normalización tienen que verse sobre el total, no por partes) y se mezcla al final.
//
// Uso: node scripts/render_partes.mjs <composición> <salida.mp4> [--partes 4] [--cola <carpeta>] [--crf 18] [--gl angle]
//   sin --cola   las partes se hacen una tras otra en esta PC (sirve para retomar: las partes hechas no se rehacen)
//   --cola X     escribe una tarea por parte en la carpeta X (compartida en red, p. ej. \\RYZEN\Videos\cola o
//                carpetaCola de herramientas.json) y trabaja también en esta PC; en la otra PC correr
//                `node scripts/trabajador.mjs --cola X`. Cuando están todas, une y verifica.
// Requisito para repartir entre PCs: el mismo commit del repo y los mismos archivos de public/ en las dos (las
// tareas llevan el commit; el trabajador se niega si no coincide).
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";
import { hacerTarea, tomarTarea } from "./trabajador.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const [comp, salida] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!comp || !salida) {
  console.error("Uso: node scripts/render_partes.mjs <composición> <salida.mp4> [--partes 4] [--cola carpeta] [--crf 18] [--gl angle]");
  process.exit(1);
}
const partes = Number(opc("partes", 4));
const crf = Number(opc("crf", 18));
const gl = opc("gl");
const cola = opc("cola") ? path.resolve(opc("cola")) : null;
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: RAIZ, encoding: "utf8" }).trim();
const sucio = execFileSync("git", ["status", "--porcelain", "--", "src", "scripts"], { cwd: RAIZ, encoding: "utf8" }).trim();
if (cola && sucio) console.warn("⚠ Hay cambios sin commitear en src/ o scripts/: la otra PC renderizaría otra cosa. Commitear antes de repartir.");

// Duración de la composición
const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src/index.ts"), onProgress: () => undefined });
const total = (await selectComposition({ serveUrl, id: comp })).durationInFrames;
const id = crypto.createHash("sha1").update(`${comp}|${commit}|${total}|${crf}|${partes}`).digest("hex").slice(0, 10);
const carpeta = cola ?? path.join(RAIZ, "tmp", "partes");
const dir = path.join(carpeta, `${comp}_${id}`);
fs.mkdirSync(dir, { recursive: true });

// Tareas: tramos de cuadros parejos
const tareas = [];
for (let k = 0; k < partes; k++) {
  const desde = Math.floor((k * total) / partes);
  const hasta = Math.floor(((k + 1) * total) / partes) - 1;
  const t = { comp, desde, hasta, crf, gl, commit, salida: path.join(dir, `parte_${String(k).padStart(3, "0")}.mp4`), nombre: `parte_${String(k).padStart(3, "0")}` };
  tareas.push(t);
  const archivo = path.join(dir, `${t.nombre}.json`);
  const hecha = fs.existsSync(t.salida) && fs.existsSync(`${t.salida}.ok`);
  if (!hecha && !fs.readdirSync(dir).some((f) => f.startsWith(`${t.nombre}.json`))) fs.writeFileSync(archivo, JSON.stringify(t, null, 2));
}
const t0 = Date.now();
console.log(`${comp}: ${total} cuadros en ${partes} partes → ${dir}${cola ? " (cola compartida)" : ""}`);

// Esta PC también trabaja: toma tareas libres hasta que no quede ninguna
let propias = 0;
for (;;) {
  const t = tomarTarea(dir, (process.env.PC_NOMBRE ?? os.hostname()));
  if (!t) break;
  hacerTarea(t, (process.env.PC_NOMBRE ?? os.hostname()));
  propias++;
}
// Esperar las que tomaron otras PC
const listas = () => tareas.filter((t) => fs.existsSync(`${t.salida}.ok`)).length;
while (listas() < partes) {
  const fallas = fs.readdirSync(dir).filter((f) => f.endsWith(".error"));
  if (fallas.length) throw new Error(`Falló una parte: ${fallas.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join(" | ")}`);
  process.stdout.write(`\r  esperando partes de otras PC: ${listas()}/${partes}   `);
  spawnSync(process.platform === "win32" ? "timeout" : "sleep", process.platform === "win32" ? ["/t", "5", "/nobreak"] : ["5"], { stdio: "ignore", shell: true });
}
const tVideo = (Date.now() - t0) / 1000;

// Audio entero (una sola vez) y unión sin recodificar el video
const audio = path.join(dir, "audio.wav");
if (!fs.existsSync(audio)) {
  execFileSync("npx", ["remotion", "render", "src/index.ts", comp, `"${audio}"`, "--codec=wav", "--log=error"], { cwd: RAIZ, shell: true, stdio: "inherit" });
}
const lista = path.join(dir, "lista.txt");
fs.writeFileSync(lista, tareas.map((t) => `file '${t.salida.replaceAll("\\", "/")}'`).join("\n"));
fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
execFileSync(herr.ffmpeg, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", salida]);

// Verificación: cuadros y duración
const cuadros = Number(
  execFileSync(herr.ffprobe, ["-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", salida], { encoding: "utf8" }).trim().split(",")[0],
);
if (cuadros !== total) throw new Error(`La unión tiene ${cuadros} cuadros y la composición ${total}`);
const quien = tareas.map((t) => (fs.readFileSync(`${t.salida}.ok`, "utf8").trim() || "?")).join(", ");
console.log(`\nOK ${salida} · ${total} cuadros (verificado) · video ${tVideo.toFixed(0)} s en ${partes} partes (esta PC hizo ${propias}; por parte: ${quien}) · total ${((Date.now() - t0) / 1000).toFixed(0)} s`);
