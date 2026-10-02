// Transcribe un audio o video con whisper.cpp, con tiempos por palabra (DTW), saltando los silencios.
//
// Por qué no el --vad de whisper-cli: con --vad solo los tiempos de los segmentos vuelven al audio
// original; los de cada palabra (offsets y t_dtw) quedan en la línea de tiempo "sin silencios" y no
// sirven para subtítulos ni cortes. Acá el recorte de silencios lo hace ffmpeg (silencedetect) y el
// script guarda el mapa para devolver cada palabra a su tiempo real.
//
// Uso (desde la raíz del proyecto):
//   node scripts/transcribir.mjs <entrada.wav|mp4|mov> <salida.json> [opciones]
//     --sin-vad            transcribe el audio completo (sin saltar silencios)
//     --umbral -35         nivel en dB por debajo del cual se considera silencio (default -35)
//     --silencio-min 0.8   pausa mínima en segundos para recortarla (default 0.8)
//     --modelo <nombre>    modelo de Whisper (default: modeloWhisper de herramientas.json)
//     --prompt "<texto>"   vocabulario/contexto para Whisper (nombres propios: "Odoo, Tango, Volto")
//     --idioma en          idioma del audio (default es)
//
// Salida (JSON): { archivo, modelo, duracionMs, vad, segmentos: [{desdeMs, hastaMs, texto}],
//                  tokens: [{text, fromMs, toMs, dtwMs, p}] }  ← mismo formato de tokens que el trabajo Volto.
// Con varios archivos, correrlo una vez por archivo (se puede en segundo plano si son largos).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const herr = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/herramientas.json"), "utf8"));
const equipo = JSON.parse(fs.readFileSync(herr.equipo, "utf8"));

const args = process.argv.slice(2);
const opcion = (nombre, def) => {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : def;
};
const posicionales = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && args[i - 1] !== "--sin-vad"));
const [entrada, salida] = posicionales;
if (!entrada || !salida) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).join("\n"));
  process.exit(1);
}
const conVad = !args.includes("--sin-vad");
const UMBRAL = Number(opcion("--umbral", -35));
const SILENCIO_MIN = Number(opcion("--silencio-min", 0.8));
const MODELO = opcion("--modelo", herr.modeloWhisper);
const PROMPT = opcion("--prompt", null);
const IDIOMA = opcion("--idioma", "es");
const MARGEN = 0.25; // s de aire que se deja a cada lado de la voz
const SEPARACION = 0.3; // s de silencio entre tramos de voz en el audio compactado
const MIN_AHORRO = 0.1; // si los silencios son menos del 10 %, no vale la pena compactar

const TMP = path.join(RAIZ, "tmp/transcribir");
fs.mkdirSync(TMP, { recursive: true });
const base = path.join(TMP, path.basename(entrada).replace(/\.[^.]+$/, ""));

const correr = (exe, a) => {
  const r = spawnSync(exe, a, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${path.basename(exe)} falló (${r.status}):\n${(r.stderr || "").slice(-1500)}`);
  return r.stderr;
};

// 1. WAV 16 kHz mono.
const wav = `${base}.wav`;
correr(herr.ffmpeg, ["-v", "error", "-y", "-i", entrada, "-vn", "-ar", "16000", "-ac", "1", wav]);
const duracion = Number(
  spawnSync(herr.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], { encoding: "utf8" }).stdout,
);

// 2. Tramos de voz = complemento de los silencios largos, con margen.
let tramos = [{ desde: 0, hasta: duracion }];
if (conVad) {
  const log = correr(herr.ffmpeg, ["-hide_banner", "-nostats", "-i", wav, "-af", `silencedetect=noise=${UMBRAL}dB:d=${SILENCIO_MIN}`, "-f", "null", "-"]);
  const inicios = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const fines = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const voz = [];
  let cursor = 0;
  inicios.forEach((ini, i) => {
    const fin = fines[i] ?? duracion;
    if (ini > cursor) voz.push({ desde: Math.max(0, cursor - MARGEN), hasta: Math.min(duracion, ini + MARGEN) });
    cursor = fin;
  });
  if (cursor < duracion) voz.push({ desde: Math.max(0, cursor - MARGEN), hasta: duracion });
  // Unir tramos que quedaron pegados o superpuestos por el margen.
  const unidos = [];
  for (const t of voz) {
    const u = unidos.at(-1);
    if (u && t.desde <= u.hasta + 0.05) u.hasta = Math.max(u.hasta, t.hasta);
    else unidos.push({ ...t });
  }
  const conVoz = unidos.reduce((s, t) => s + t.hasta - t.desde, 0);
  if (unidos.length && 1 - conVoz / duracion >= MIN_AHORRO) tramos = unidos;
}
const compactado = tramos.length > 1 || tramos[0].desde > 0 || tramos[0].hasta < duracion;

// 3. Audio compactado + mapa (tiempo compactado → tiempo original).
const mapa = [];
let audioWhisper = wav;
if (compactado) {
  let t = 0;
  const partes = tramos.map((tr, i) => {
    mapa.push({ compDesde: t, compHasta: t + (tr.hasta - tr.desde), origDesde: tr.desde });
    t += tr.hasta - tr.desde + SEPARACION;
    return `[0:a]atrim=${tr.desde.toFixed(3)}:${tr.hasta.toFixed(3)},asetpts=PTS-STARTPTS,apad=pad_dur=${SEPARACION}[p${i}]`;
  });
  const filtro = `${partes.join(";\n")};\n${tramos.map((_, i) => `[p${i}]`).join("")}concat=n=${tramos.length}:v=0:a=1[out]`;
  const script = `${base}_filtro.txt`;
  fs.writeFileSync(script, filtro);
  audioWhisper = `${base}_voz.wav`;
  correr(herr.ffmpeg, ["-v", "error", "-y", "-i", wav, "-/filter_complex", script, "-map", "[out]", "-ar", "16000", "-ac", "1", audioWhisper]);
}
// Si un tiempo cae en la separación entre dos tramos: un inicio salta al comienzo del tramo
// siguiente y un fin se pega al final del anterior.
const aOriginal = (ms, lado = "fin") => {
  if (!compactado) return ms;
  const s = ms / 1000;
  let i = 0;
  for (let k = 0; k < mapa.length; k++) if (s >= mapa[k].compDesde) i = k;
  const m = mapa[i];
  if (s > m.compHasta && lado === "inicio" && mapa[i + 1]) return Math.round(mapa[i + 1].origDesde * 1000);
  return Math.round((m.origDesde + Math.min(s, m.compHasta) - m.compDesde) * 1000);
};

// 4. Whisper con DTW (tiempos por palabra). DTW necesita flash attention desactivado (-nfa).
const archivoModelo = path.join(herr.carpetaModelosWhisper, `ggml-${MODELO}.bin`);
const presetDtw = MODELO.replace(/-q\d_\d$/, "").replaceAll("-", ".");
const t0 = Date.now();
const wa = ["-m", archivoModelo, "-f", audioWhisper, "-l", IDIOMA, "-t", String(equipo.hilosWhisper),
  "--dtw", presetDtw, "-nfa", "-ojf", "-of", `${base}_whisper`, "-np"];
if (PROMPT) wa.push("--prompt", PROMPT);
correr(herr.whisperExe, wa);
const seg = (Date.now() - t0) / 1000;
const crudo = JSON.parse(fs.readFileSync(`${base}_whisper.json`, "utf8"));

// 5. Devolver cada tiempo al audio original.
const segmentos = crudo.transcription.map((s) => ({
  desdeMs: aOriginal(s.offsets.from, "inicio"),
  hastaMs: aOriginal(s.offsets.to),
  texto: s.text.trim(),
}));
const tokens = crudo.transcription.flatMap((s) =>
  s.tokens
    .filter((t) => !t.text.startsWith("[_"))
    .map((t) => ({
      text: t.text,
      fromMs: aOriginal(t.offsets.from, "inicio"),
      toMs: aOriginal(t.offsets.to),
      dtwMs: t.t_dtw >= 0 ? aOriginal(t.t_dtw * 10) : -1,
      p: t.p,
    })),
);

const conVozSeg = tramos.reduce((s, t) => s + t.hasta - t.desde, 0);
fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
fs.writeFileSync(
  salida,
  JSON.stringify(
    {
      archivo: path.basename(entrada),
      modelo: MODELO,
      duracionMs: Math.round(duracion * 1000),
      vad: compactado
        ? { metodo: "silencedetect", umbralDb: UMBRAL, silencioMinSeg: SILENCIO_MIN, margenSeg: MARGEN, tramos: tramos.map((t) => [Math.round(t.desde * 1000), Math.round(t.hasta * 1000)]) }
        : null,
      segmentos,
      tokens,
    },
    null,
    2,
  ),
);
console.log(
  `${path.basename(entrada)}: ${duracion.toFixed(1)} s` +
    (compactado ? ` → ${conVozSeg.toFixed(1)} s de voz (${tramos.length} tramos)` : " (sin compactar)") +
    ` · Whisper ${MODELO} ${seg.toFixed(0)} s (${(seg / duracion).toFixed(1)}x el tiempo real) → ${salida}`,
);
for (const s of segmentos) console.log(`  [${(s.desdeMs / 1000).toFixed(2)}–${(s.hastaMs / 1000).toFixed(2)}] ${s.texto}`);
