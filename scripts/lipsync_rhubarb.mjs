// Bocas (visemas) a partir del SONIDO con Rhubarb Lip Sync (local, MIT): más fiel que las reglas por letras de
// src/rig/lipsync.ts porque escucha lo que se dice de verdad (pausas, sílabas comidas, ritmo).
// Uso: node scripts/lipsync_rhubarb.mjs <audio.wav> <salida.json> [--texto guion.txt | --texto "frase"] [--ingles]
//   Por defecto usa el reconocedor "phonetic" (sirve para cualquier idioma, incluido español).
//   --ingles  usa el reconocedor de inglés (PocketSphinx), que con --texto alinea todavía mejor.
// Salida: { fuente: "rhubarb", audio, duracion, mouthCues: [{ start, end, value }] } con value A–H o X (segundos).
// Formas de Rhubarb: A labios cerrados (M B P) · B dientes/consonantes · C E abierta · D A bien abierta ·
// E O redonda · F U/W fruncida · G F/V (dientes sobre labio) · H L (lengua) · X reposo.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));

const args = process.argv.slice(2);
const opc = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const [audio, salida] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--texto");
if (!audio || !salida) {
  console.error("Uso: node scripts/lipsync_rhubarb.mjs <audio.wav> <salida.json> [--texto archivo|frase] [--ingles]");
  process.exit(1);
}
if (!fs.existsSync(herr.rhubarb)) {
  console.error(`No está Rhubarb en ${herr.rhubarb}`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "rhubarb-"));
try {
  // Rhubarb lee WAV PCM 16 bits: se convierte siempre (acepta también mp4/mov)
  const wav = path.join(tmp, "audio.wav");
  const c = spawnSync(herr.ffmpeg, ["-y", "-v", "error", "-i", audio, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav]);
  if (c.status !== 0) throw new Error(`ffmpeg: ${c.stderr}`);
  const a = ["-f", "json", "-o", path.join(tmp, "salida.json"), "-r", args.includes("--ingles") ? "pocketSphinx" : "phonetic", "--extendedShapes", "GHX", "-q"];
  const texto = opc("texto");
  if (texto) {
    const dialogo = path.join(tmp, "dialogo.txt");
    fs.writeFileSync(dialogo, fs.existsSync(texto) ? fs.readFileSync(texto, "utf8") : texto);
    a.push("-d", dialogo);
  }
  const t0 = Date.now();
  const r = spawnSync(herr.rhubarb, [...a, wav], { encoding: "utf8", cwd: path.dirname(herr.rhubarb) });
  if (r.status !== 0) throw new Error(`rhubarb: ${(r.stderr || r.stdout).trim().split("\n").at(-1)}`);
  const datos = JSON.parse(fs.readFileSync(path.join(tmp, "salida.json"), "utf8"));
  const salidaJson = { fuente: "rhubarb", audio: path.relative(RAIZ, path.resolve(audio)).replaceAll("\\", "/"), duracion: datos.metadata.duration, mouthCues: datos.mouthCues };
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  // Una boca por línea (se lee y se diffea fácil)
  const { mouthCues, ...cabecera } = salidaJson;
  fs.writeFileSync(salida, JSON.stringify(cabecera).slice(0, -1) + ',"mouthCues":[\n' + mouthCues.map((m) => JSON.stringify(m)).join(",\n") + "\n]}\n");
  const cuenta = {};
  for (const m of datos.mouthCues) cuenta[m.value] = (cuenta[m.value] ?? 0) + 1;
  console.log(`OK ${salida} · ${datos.mouthCues.length} bocas en ${datos.metadata.duration.toFixed(2)} s (${((Date.now() - t0) / 1000).toFixed(1)} s) · ${Object.entries(cuenta).map(([k, v]) => `${k}${v}`).join(" ")}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
