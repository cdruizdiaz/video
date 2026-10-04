// Hoja de giro del modelo 3D de un personaje (8 ángulos, de frente a frente) renderizada en Blender, para revisar
// el modelo de scripts/blender/personaje_desde_rig.py sin abrir Blender.
// Uso: node scripts/blender/hoja_giro.mjs <personaje> [--angulos 8] [--lado 480] [--estilo toon]
// Salida: out/personajes/<personaje>/giro_3d.png
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const personaje = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!personaje) {
  console.error("Uso: node scripts/blender/hoja_giro.mjs <personaje> [--angulos 8] [--lado 480] [--estilo toon]");
  process.exit(1);
}
const n = Number(opc("angulos", 8));
const lado = Number(opc("lado", 480));
const blend = path.join(herr.carpetaPersonajes, personaje, `${personaje}_3d.blend`);
const piezas = JSON.parse(fs.readFileSync(path.join(RAIZ, `public/personajes/${personaje}/piezas.json`), "utf8"));
const caja = piezas.vistas.frente.caja;
const escala = (lado * 0.8) / Math.max(caja[2] - caja[0], caja[3] - caja[1]);
const correr = (exe, a, o = {}) => {
  const r = spawnSync(exe, a, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, cwd: RAIZ, ...o });
  if (r.status !== 0) throw new Error(`${path.basename(exe)}: ${(r.stderr || r.stdout || "").trim().split("\n").slice(-6).join("\n")}`);
  return r.stdout;
};

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "giro-"));
try {
  // Poses en reposo (sin pistas), una por ángulo
  const quieto = { huesos: {}, lugar: { x: lado / 2, y: lado * 0.92, escala, rot: 0 }, expresion: "base" };
  fs.writeFileSync(path.join(tmp, "poses.json"), JSON.stringify({ personaje, fps: 30, cuadros: Array.from({ length: n }, () => quieto) }));
  const escena = {
    poses: path.join(tmp, "poses.json"),
    ancho: lado,
    alto: lado,
    rotY: Array.from({ length: n }, (_, k) => (k * 2 * Math.PI) / n),
    luz: { angulo: 135, altura: 45, intensidad: 3 },
    estilo: opc("estilo", "suave"),
    muestras: 8,
  };
  fs.writeFileSync(path.join(tmp, "escena.json"), JSON.stringify(escena));
  correr(herr.blender, ["-b", blend, "--python-exit-code", "1", "-P", "scripts/blender/render.py", "--", path.join(tmp, "escena.json"), path.join(tmp, "png")]);
  const salida = path.join(RAIZ, "out/personajes", personaje, "giro_3d.png");
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  correr(herr.ffmpeg, ["-y", "-v", "error", "-i", path.join(tmp, "png", "f%04d.png"), "-f", "lavfi", "-i", `color=c=0xe9e4dc:s=${lado}x${lado}`,
    "-filter_complex", `[1][0]overlay=shortest=1,tile=${Math.min(n, 4)}x${Math.ceil(n / 4)}`, "-frames:v", "1", salida]);
  console.log(`OK ${path.relative(RAIZ, salida)} · ${n} ángulos`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
