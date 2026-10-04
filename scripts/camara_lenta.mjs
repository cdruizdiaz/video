// Cámara lenta suave inventando los cuadros intermedios con RIFE (rife-ncnn-vulkan: usa la gráfica por Vulkan,
// también la Intel integrada). Sin RIFE, ralentizar un video de 30 fps repite cuadros y se ve "a saltos".
// Uso: node scripts/camara_lenta.mjs <video> <salida.mp4> [--factor 2|3|4] [--desde s] [--hasta s]
//        [--modo lento|fluido] [--modelo rife-v4.6] [--escala 1]
//   --modo lento   (default) mismo fps que el original y factor veces más largo: cámara lenta.
//   --modo fluido  misma duración a fps × factor (p. ej. 30 → 60 fps).
//   --escala 0.5   procesa a media resolución (4× más rápido; para pruebas).
// El audio no se copia (en cámara lenta no sirve). Códec de salida: codecBorrador de equipo.json.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const equipo = JSON.parse(fs.readFileSync(herr.equipo, "utf8"));

const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const [entrada, salida] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!entrada || !salida) {
  console.error("Uso: node scripts/camara_lenta.mjs <video> <salida.mp4> [--factor 2] [--desde s] [--hasta s] [--modo lento|fluido] [--escala 1]");
  process.exit(1);
}
const factor = Number(opc("factor", "2"));
const modo = opc("modo", "lento");
const modelo = opc("modelo", "rife-v4.6");
const escala = Number(opc("escala", "1"));
const desde = opc("desde");
const hasta = opc("hasta");

const correr = (exe, a, o = {}) => {
  const r = spawnSync(exe, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...o });
  if (r.status !== 0) throw new Error(`${path.basename(exe)}: ${(r.stderr || r.stdout || r.error?.message || "").trim().split("\n").slice(-3).join(" | ")}`);
  return `${r.stdout}${r.stderr}`;
};

const fpsTxt = correr(herr.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", entrada]).trim();
const [num, den] = fpsTxt.split("/").map(Number);
const fps = num / (den || 1);

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "rife-"));
const dEntrada = path.join(tmp, "in");
const dSalida = path.join(tmp, "out");
fs.mkdirSync(dEntrada);
fs.mkdirSync(dSalida);
try {
  const t0 = Date.now();
  const recorte = [...(desde ? ["-ss", desde] : []), ...(hasta ? ["-to", hasta] : [])];
  const vf = escala !== 1 ? ["-vf", `scale=trunc(iw*${escala}/2)*2:-2`] : [];
  correr(herr.ffmpeg, ["-v", "error", ...recorte, "-i", entrada, ...vf, "-fps_mode", "passthrough", path.join(dEntrada, "%08d.png")]);
  const n = fs.readdirSync(dEntrada).length;
  const objetivo = n * factor;
  // -n: cantidad de cuadros de salida (los modelos v4 aceptan cualquier factor) · -f: nombres en orden
  correr(herr.rife, ["-i", dEntrada, "-o", dSalida, "-n", String(objetivo), "-m", modelo, "-f", "%08d.png"], { cwd: path.dirname(herr.rife) });
  const tRife = (Date.now() - t0) / 1000;
  const fpsSalida = modo === "fluido" ? fps * factor : fps;
  const codec = equipo.codecBorrador.split(" ");
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  correr(herr.ffmpeg, ["-y", "-v", "error", "-framerate", String(fpsSalida), "-i", path.join(dSalida, "%08d.png"), ...codec, "-pix_fmt", "yuv420p", salida]);
  const dur = objetivo / fpsSalida;
  console.log(`OK ${salida} · ${n} → ${objetivo} cuadros (${modelo}) · ${fpsSalida} fps · ${dur.toFixed(2)} s · RIFE ${tRife.toFixed(0)} s (${((tRife / objetivo) * 1000).toFixed(0)} ms/cuadro)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
