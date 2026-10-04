// Subir resolución con Real-ESRGAN (realesrgan-ncnn-vulkan: gráfica por Vulkan, también Intel integrada).
// Para fotos viejas de clientes, logos chicos o material de 720p. Imagen o video (el video conserva el audio).
// Uso: node scripts/subir_resolucion.mjs <imagen|video> <salida> [--x 2|3|4] [--anime] [--modelo nombre] [--ancho N]
//   Fotos/imagen real: realesrgan-x4plus (default para imágenes).
//   Video: realesr-animevideov3 (default para video: mucho más rápido y estable entre cuadros; sirve también para real).
//   --anime   dibujos/ilustraciones/logos planos (realesrgan-x4plus-anime en imagen).
//   --ancho N redimensiona al final a ese ancho exacto (lanczos), p. ej. 1920 desde un x2 de 720p.
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
const [entrada, salida] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !["--anime"].includes(args[i - 1])));
if (!entrada || !salida) {
  console.error("Uso: node scripts/subir_resolucion.mjs <imagen|video> <salida> [--x 2|3|4] [--anime] [--modelo nombre] [--ancho N]");
  process.exit(1);
}
const esVideo = /\.(mp4|mov|mkv|avi|webm|m4v)$/i.test(entrada);
const anime = args.includes("--anime");
const x = Number(opc("x", esVideo ? "2" : "4"));
const modelo = opc("modelo", esVideo ? `realesr-animevideov3-x${x}` : anime ? "realesrgan-x4plus-anime" : "realesrgan-x4plus");
const ancho = opc("ancho");

const correr = (exe, a, o = {}) => {
  const r = spawnSync(exe, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...o });
  if (r.status !== 0) throw new Error(`${path.basename(exe)}: ${(r.stderr || r.stdout || r.error?.message || "").trim().split("\n").slice(-3).join(" | ")}`);
  return `${r.stdout}${r.stderr}`;
};
// Los modelos x4plus solo escalan ×4: para ×2/×3 se escala ×4 y se reduce con lanczos
const escalaModelo = /x4plus/.test(modelo) ? 4 : x;
const esrgan = (i, o) => correr(herr.realesrgan, ["-i", i, "-o", o, "-n", modelo, "-s", String(escalaModelo), "-f", "png"], { cwd: path.dirname(herr.realesrgan) });
const filtroFinal = ancho ? `scale=${ancho}:-2:flags=lanczos` : escalaModelo !== x ? `scale=iw*${x / escalaModelo}:-2:flags=lanczos` : null;

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "esrgan-"));
const t0 = Date.now();
try {
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  if (!esVideo) {
    const png = path.join(tmp, "in.png");
    correr(herr.ffmpeg, ["-y", "-v", "error", "-i", entrada, png]);
    const sal = path.join(tmp, "out.png");
    esrgan(png, sal);
    correr(herr.ffmpeg, ["-y", "-v", "error", "-i", sal, ...(filtroFinal ? ["-vf", filtroFinal] : []), salida]);
  } else {
    const dIn = path.join(tmp, "in");
    const dOut = path.join(tmp, "out");
    fs.mkdirSync(dIn);
    fs.mkdirSync(dOut);
    const fps = correr(herr.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", entrada]).trim();
    correr(herr.ffmpeg, ["-v", "error", "-i", entrada, "-fps_mode", "passthrough", path.join(dIn, "%08d.png")]);
    esrgan(dIn, dOut);
    const codec = equipo.codecBorrador.split(" ");
    correr(herr.ffmpeg, ["-y", "-v", "error", "-framerate", fps, "-i", path.join(dOut, "%08d.png"), "-i", entrada, "-map", "0:v", "-map", "1:a?", ...(filtroFinal ? ["-vf", filtroFinal] : []), ...codec, "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", salida]);
  }
  const [w, h] = correr(herr.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", salida]).trim().split(",");
  console.log(`OK ${salida} · ${modelo} · ${w}×${h} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
