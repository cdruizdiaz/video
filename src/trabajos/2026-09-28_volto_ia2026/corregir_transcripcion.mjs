// Pasa la salida cruda de whisper (tokens con t_dtw) a palabras enteras con inicio/fin
// y aplica las correcciones de texto revisadas a mano.
//   fin de palabra   = t_dtw de su último token (alineación DTW de whisper.cpp)
//   inicio de palabra = fin de la palabra anterior, o el final de una pausa real si la hay
//                       entre ambas (silencedetect -35 dB, >= 150 ms: las oclusivas como la "p"
//                       de "respuestas" dejan ~100 ms de silencio dentro de la palabra)
// Uso (desde la raíz del proyecto): node src/trabajos/2026-09-28_volto_ia2026/corregir_transcripcion.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const DATOS = "public/trabajos/2026-09-28_volto_ia2026/datos";
const WAVS = "tmp/volto_ia2026";
const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));
const crudo = JSON.parse(fs.readFileSync(`${DATOS}/transcripcion_whisper.json`, "utf8"));

// Texto: whisper confunde palabras dichas rápido; se corrigen por contexto (verificado
// re-transcribiendo con vocabulario: "IA" confirmado; "Odoo" y "el agente" por sentido).
const TEXTO = {
  IMG_2822: [["la", "La"], ["guía", "IA"], ["textos", "textos,"], ["respuestas", "respuestas,"], ["imágenes", "imágenes."]],
  IMG_2835: [["UDU,", "Odoo,"]],
  IMG_2836: [["la", "el"], ["gente", "agente"]],
};
const PRIMERA_PALABRA_MAX_MS = 450; // si no hay pausa medida antes de la primera palabra

// Pausas reales [inicioMs, finMs] del clip (ffmpeg informa silencedetect por stderr)
const pausas = (clip) => {
  const r = spawnSync(herr.ffmpeg, ["-hide_banner", "-nostats", "-i", `${WAVS}/${clip}.wav`,
    "-af", "silencedetect=n=-35dB:d=0.15", "-f", "null", "-"], { encoding: "utf8" });
  const ini = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1] * 1000);
  const fin = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1] * 1000);
  return ini.map((a, i) => [a, fin[i] ?? Infinity]);
};

const aPalabras = (tokens) => {
  const palabras = [];
  for (const t of tokens) {
    const esPuntuacion = /^[.,:;!?¿¡]+$/.test(t.text.trim());
    const nueva = palabras.length === 0 || (t.text.startsWith(" ") && !esPuntuacion);
    if (nueva) palabras.push({ text: t.text.trim(), endMs: t.dtwMs });
    else {
      const p = palabras.at(-1);
      p.text += t.text.trim();
      if (!esPuntuacion) p.endMs = Math.max(p.endMs, t.dtwMs);
    }
  }
  return palabras;
};

const salida = {};
for (const [clip, tokens] of Object.entries(crudo)) {
  const palabras = aPalabras(tokens);
  const ps = pausas(clip);
  let anterior = 0;
  palabras.forEach((p, i) => {
    // última pausa que termina antes del fin de esta palabra y después del fin de la anterior
    const pausa = ps.filter(([, b]) => b > anterior && b < p.endMs - 60).at(-1);
    p.startMs = pausa ? Math.round(pausa[1]) : i === 0 ? Math.max(0, p.endMs - PRIMERA_PALABRA_MAX_MS) : anterior;
    anterior = p.endMs;
  });
  for (const [de, a] of TEXTO[clip] ?? []) {
    const p = palabras.find((w) => w.text === de && !w.corregido);
    if (!p) throw new Error(`${clip}: no encontré "${de}"`);
    p.text = a;
    p.corregido = true;
  }
  salida[clip] = palabras.map(({ text, startMs, endMs }) => ({ text, startMs, endMs }));
  console.log(`${clip}: ${salida[clip].map((w) => `${w.text}[${(w.startMs / 1000).toFixed(2)}-${(w.endMs / 1000).toFixed(2)}]`).join(" ")}`);
}
fs.writeFileSync(`${DATOS}/transcripcion.json`, JSON.stringify(salida, null, 2));
console.log(`Guardado ${DATOS}/transcripcion.json`);
