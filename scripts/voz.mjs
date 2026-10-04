// Locución sintética local (Piper TTS) lista para usar: voz → (voz de nene) → recorte de silencios → -14 LUFS →
// tiempos por palabra con Whisper (para globos, subtítulos y la boca del personaje).
// Uso: node scripts/voz.mjs <"texto" | archivo.txt> <salida.wav> [opciones]
//   --voz es_AR-daniela-high   modelo de modelos-piper/ (default: vozPiperEs de herramientas.json)
//   --idioma es|en             para Whisper (default: el de la voz)
//   --velocidad 1              >1 más rápido (Piper usa length-scale = 1/velocidad)
//   --nene [1.35]              sube el tono con rubberband (formantes desplazados)
//   --sin-tiempos              no transcribe (solo el .wav)
// Salida: <salida.wav> (48 kHz mono, -14 LUFS) y, salvo --sin-tiempos, <salida>.json con el formato de transcribir.mjs.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const RECORTE = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse";
const COLA = "afade=t=in:d=0.02,apad=pad_dur=0.15";
const OBJETIVO = -14; // LUFS
const LIMITE = "alimiter=limit=0.84:level=false"; // ≈ -1,5 dBTP

const args = process.argv.slice(2);
const opc = (n, d) => {
  const i = args.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = args[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};
const posicionales = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !/^--(sin-tiempos)$/.test(args[i - 1]) && args[i - 1] !== "--nene"));
const [entrada, salida] = posicionales;
if (!entrada || !salida) {
  console.error('Uso: node scripts/voz.mjs <"texto" | archivo.txt> <salida.wav> [--voz X] [--idioma es] [--velocidad 1] [--nene [1.35]] [--sin-tiempos]');
  process.exit(1);
}
// Piper (espeak) lee "¡" y "¿" como sílabas raras: se sacan (la entonación la dan "!" y "?")
const texto = (fs.existsSync(entrada) ? fs.readFileSync(entrada, "utf8").trim() : entrada).replace(/[¡¿]/g, "");
const voz = opc("voz", herr.vozPiperEs);
const modelo = path.join(herr.carpetaPiper, `${voz}.onnx`);
if (!fs.existsSync(modelo)) {
  console.error(`No está la voz ${modelo}. Bajarla: python -m piper.download_voices --data-dir ${herr.carpetaPiper} ${voz}`);
  process.exit(1);
}
const idioma = opc("idioma", voz.slice(0, 2));
const velocidad = Number(opc("velocidad", "1"));
const nene = opc("nene", false);
const tono = nene === true ? 1.35 : Number(nene);

const correr = (exe, a, input) => {
  const r = spawnSync(exe, a, { input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${path.basename(exe)}: ${(r.stderr || r.stdout || r.error?.message || "").trim().split("\n").at(-1)}`);
  return `${r.stdout}${r.stderr}`;
};

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "voz-"));
try {
  const crudo = path.join(tmp, "piper.wav");
  correr(herr.python, ["-m", "piper", "-m", modelo, "--length-scale", String(1 / velocidad), "-f", crudo], texto);
  const filtros = [nene ? `rubberband=pitch=${tono}:formant=shifted` : null, RECORTE, COLA].filter(Boolean).join(",");
  const limpio = path.join(tmp, "limpio.wav");
  correr(herr.ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-i", crudo, "-af", filtros, "-ar", "48000", "-ac", "1", limpio]);
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  // Normalización: se mide con ebur128 (lo mismo con que se verifica) y se aplica la ganancia que falta + limitador.
  // Hasta 3 vueltas porque el limitador puede comerse algo de nivel en frases con picos.
  const integrado = (f) => Number(correr(herr.ffmpeg, ["-hide_banner", "-nostats", "-i", f, "-af", "ebur128", "-f", "null", "-"]).match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0]);
  let ganancia = OBJETIVO - integrado(limpio);
  let lufs;
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    correr(herr.ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-i", limpio, "-af", `volume=${ganancia.toFixed(2)}dB,${LIMITE}`, "-ar", "48000", "-ac", "1", salida]);
    lufs = integrado(salida);
    if (Math.abs(lufs - OBJETIVO) <= 0.5) break;
    ganancia += OBJETIVO - lufs;
  }
  lufs = `${lufs} LUFS`;
  const dur = Number(correr(herr.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", salida]));
  console.log(`OK ${salida} · ${voz}${nene ? ` · tono ${tono}` : ""} · ${dur.toFixed(2)} s · ${lufs}`);
  if (!opc("sin-tiempos", false)) {
    const json = salida.replace(/\.wav$/i, "") + ".json";
    // Prompt = el propio texto: Whisper respeta la ortografía y los nombres propios
    correr("node", ["scripts/transcribir.mjs", salida, json, "--idioma", idioma, "--sin-vad", "--prompt", texto.slice(0, 220)]);
    const tr = JSON.parse(fs.readFileSync(json, "utf8"));
    console.log(`   tiempos → ${json} (${tr.tokens.length} tokens: "${tr.segmentos.map((s) => s.texto).join(" ").trim()}")`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
