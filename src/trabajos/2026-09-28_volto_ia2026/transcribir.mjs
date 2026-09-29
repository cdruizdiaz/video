// Transcribe cada crudo (WAV 16 kHz mono en tmp/volto_ia2026/) con whisper-cli + alineación DTW
// (tiempos por palabra más precisos que los de los segmentos) y guarda la salida cruda en
// public/trabajos/2026-09-28_volto_ia2026/datos/transcripcion_whisper.json.
// La versión corregida por palabras la genera corregir_transcripcion.mjs.
// Uso (desde la raíz del proyecto): node src/trabajos/2026-09-28_volto_ia2026/transcribir.mjs
// Nota: DTW necesita flash attention desactivado (-nfa); si no, t_dtw sale -1.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ID = "2026-09-28_volto_ia2026";
const ENTRADA = "tmp/volto_ia2026";
const SALIDA = `public/trabajos/${ID}/datos/transcripcion_whisper.json`;

const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));
const equipo = JSON.parse(fs.readFileSync(herr.equipo, "utf8"));
const modelo = path.join(herr.carpetaModelosWhisper, `ggml-${herr.modeloWhisper}.bin`);

const resultado = {};
for (const wav of fs.readdirSync(ENTRADA).filter((f) => /^IMG_\d+\.wav$/.test(f)).sort()) {
  const clip = path.basename(wav, ".wav");
  const base = path.join(ENTRADA, `${clip}_dtw`);
  execFileSync(herr.whisperExe, [
    "-m", modelo, "-f", path.join(ENTRADA, wav), "-l", "es",
    "-t", String(equipo.hilosWhisper), "--dtw", "large.v3.turbo", "-nfa", "-ojf", "-of", base, "-np",
  ], { stdio: "ignore" });
  const j = JSON.parse(fs.readFileSync(`${base}.json`, "utf8"));
  // Tokens: texto, tramo del segmento (offsets) y t_dtw (fin aproximado del token, en ms).
  resultado[clip] = j.transcription.flatMap((s) =>
    s.tokens
      .filter((t) => !t.text.startsWith("[_"))
      .map((t) => ({ text: t.text, fromMs: t.offsets.from, toMs: t.offsets.to, dtwMs: t.t_dtw * 10, p: t.p })),
  );
  console.log(`${clip}: ${j.transcription.map((s) => s.text).join("").trim()}`);
}
fs.writeFileSync(SALIDA, JSON.stringify(resultado, null, 2));
console.log(`Guardado ${SALIDA}`);
