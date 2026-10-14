/* global fetch, Buffer */
// Locución sintética (Piper TTS local, o Edge TTS: voces neuronales de Microsoft, gratis, con internet) lista para usar: voz → (voz de nene) → recorte de silencios → -14 LUFS →
// tiempos por palabra con Whisper (para globos, subtítulos y la boca del personaje).
// Uso: node scripts/voz.mjs <"texto" | archivo.txt> <salida.wav> [opciones]
//   --voz es_AR-daniela-high   modelo de modelos-piper/ (default: vozPiperEs de herramientas.json); una voz que
//                              termina en "Neural" (es-AR-ElenaNeural, es-AR-TomasNeural…) usa Edge TTS
//                              (paquete edge-tts del .venv: `edge-tts --list-voices`)
//   --tono-edge +0Hz           (Edge) tono: "+8Hz", "-5Hz"…  · --volumen-edge +0% (Edge)
//                              una voz "eleven:<voice_id>" usa ElevenLabs (API; clave en ELEVENLABS_API_KEY, también
//                              leída de las variables de usuario de Windows; modelo eleven_multilingual_v2).
//   --estabilidad 0.45 --similitud 0.8 --estilo 0.3   (ElevenLabs) menos estabilidad / más estilo = más expresiva
//   --idioma es|en             para Whisper (default: el de la voz)
//   --velocidad 1              >1 más rápido (Piper usa length-scale = 1/velocidad)
//   --nene [1.35]              sube el tono con rubberband (formantes desplazados)
//   --expresion 0.667          variación de la entonación de Piper (noise-scale; más = más expresiva, menos estable)
//   --ritmo 0.8                variación del largo de cada sonido (noise-w; más = menos monótona)
//   --pausa-oracion 0.2        silencio entre oraciones (segundos)
//   --sin-tiempos              no transcribe (solo el .wav)
//   --datos <carpeta>          dónde van los JSON (default: junto al .wav; en un trabajo: public/trabajos/<ID>/datos)
// Salida: <salida.wav> (48 kHz mono, -14 LUFS) y, salvo --sin-tiempos, <nombre>.json (Whisper, formato de
// transcribir.mjs: globos y subtítulos) y <nombre>_rhubarb.json (bocas para la pista hablar con `rhubarb`).
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
const voz = opc("voz", herr.vozPiperEs);
const edge = /Neural$/.test(voz); // Edge TTS (Microsoft): voces "xx-YY-NombreNeural"
const eleven = voz.startsWith("eleven:"); // ElevenLabs: "eleven:<voice_id>"
// Piper (espeak) lee "¡" y "¿" como sílabas raras: se sacan (la entonación la dan "!" y "?"); Edge los entiende
const original = fs.existsSync(entrada) ? fs.readFileSync(entrada, "utf8").trim() : entrada;
const texto = edge || eleven ? original : original.replace(/[¡¿]/g, "");
const modelo = path.join(herr.carpetaPiper, `${voz}.onnx`);
if (!edge && !eleven && !fs.existsSync(modelo)) {
  console.error(`No está la voz ${modelo}. Bajarla: python -m piper.download_voices --data-dir ${herr.carpetaPiper} ${voz}`);
  process.exit(1);
}
const idioma = opc("idioma", eleven ? "es" : voz.slice(0, 2).toLowerCase());

// Clave de ElevenLabs: del entorno o de las variables de usuario de Windows (setx), sin escribirla en ningún archivo
const claveEleven = () => {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", '[Environment]::GetEnvironmentVariable("ELEVENLABS_API_KEY","User")'], { encoding: "utf8" });
  const k = (r.stdout || "").trim();
  if (!k) throw new Error("Falta ELEVENLABS_API_KEY (setx ELEVENLABS_API_KEY \"clave\" en una terminal).");
  return k;
};
const velocidad = Number(opc("velocidad", "1"));
const nene = opc("nene", false);
const tono = nene === true ? 1.35 : Number(nene);
const extrasPiper = [
  ["expresion", "--noise-scale"],
  ["ritmo", "--noise-w-scale"],
  ["pausa-oracion", "--sentence-silence"],
].flatMap(([o, flag]) => (opc(o, null) !== null ? [flag, String(opc(o, null))] : []));

const correr = (exe, a, input) => {
  // PYTHONUTF8: en Windows Python lee stdin como cp1252 y Piper recibía "Ã¡" en lugar de "á" (leía mal tildes y eñes)
  const env = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };
  const r = spawnSync(exe, a, { input, encoding: "utf8", env, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${path.basename(exe)}: ${(r.stderr || r.stdout || r.error?.message || "").trim().split("\n").at(-1)}`);
  return `${r.stdout}${r.stderr}`;
};

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "voz-"));
try {
  let crudo = path.join(tmp, "piper.wav");
  if (eleven) {
    crudo = path.join(tmp, "eleven.mp3");
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz.slice(7)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": claveEleven(), "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: texto,
        model_id: opc("modelo-eleven", "eleven_multilingual_v2"),
        voice_settings: {
          stability: Number(opc("estabilidad", "0.45")),
          similarity_boost: Number(opc("similitud", "0.8")),
          style: Number(opc("estilo", "0.3")),
          use_speaker_boost: true,
          speed: velocidad,
        },
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
    fs.writeFileSync(crudo, Buffer.from(await res.arrayBuffer()));
  } else if (edge) {
    // Edge TTS: el texto va por archivo UTF-8; velocidad como porcentaje (1,1 → +10%)
    const txt = path.join(tmp, "texto.txt");
    fs.writeFileSync(txt, texto, "utf8");
    crudo = path.join(tmp, "edge.mp3");
    const pct = (v) => `${v >= 0 ? "+" : ""}${Math.round(v)}%`;
    correr(herr.python, [
      "-m", "edge_tts", "--voice", voz, "-f", txt,
      `--rate=${pct((velocidad - 1) * 100)}`, `--pitch=${opc("tono-edge", "+0Hz")}`, `--volume=${opc("volumen-edge", "+0%")}`,
      "--write-media", crudo,
    ]);
  } else {
    correr(herr.python, ["-m", "piper", "-m", modelo, "--length-scale", String(1 / velocidad), ...extrasPiper, "-f", crudo], texto);
  }
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
    const datos = opc("datos", path.dirname(salida));
    const base = path.join(datos, path.basename(salida).replace(/\.wav$/i, ""));
    fs.mkdirSync(datos, { recursive: true });
    const json = `${base}.json`;
    // Prompt = el propio texto: Whisper respeta la ortografía y los nombres propios
    correr("node", ["scripts/transcribir.mjs", salida, json, "--idioma", idioma, "--sin-vad", "--prompt", texto.slice(0, 220)]);
    const tr = JSON.parse(fs.readFileSync(json, "utf8"));
    console.log(`   tiempos → ${json} (${tr.tokens.length} tokens: "${tr.segmentos.map((s) => s.texto).join(" ").trim()}")`);
    // Bocas desde el sonido (pista hablar con `rhubarb`: articula mejor que las reglas por letras)
    if (fs.existsSync(herr.rhubarb ?? "")) {
      correr("node", ["scripts/lipsync_rhubarb.mjs", salida, `${base}_rhubarb.json`, "--texto", texto]);
      console.log(`   bocas  → ${base}_rhubarb.json`);
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
