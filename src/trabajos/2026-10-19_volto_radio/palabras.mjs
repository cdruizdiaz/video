// Lista las palabras de la transcripción cruda de Whisper con su tiempo (DTW, en s) para elegir los cortes.
// Uso: node src/trabajos/2026-10-19_volto_radio/palabras.mjs <clip> [desde_s] [hasta_s]
import fs from "node:fs";

const ID = "2026-10-19_volto_radio";
const [clip, desde = "0", hasta = "1e9"] = process.argv.slice(2);
const j = JSON.parse(
  fs.readFileSync(`public/trabajos/${ID}/datos/transcripciones_whisper/${clip}.json`, "utf8"),
);

const palabras = [];
for (const t of j.tokens) {
  if (/^\[_|^\[/.test(t.text.trim())) continue; // tokens especiales de Whisper
  if (t.text.startsWith(" ") || palabras.length === 0)
    palabras.push({ texto: t.text.trim(), ms: t.dtwMs ?? t.fromMs });
  else palabras[palabras.length - 1].texto += t.text;
}

let renglon = "";
for (const p of palabras) {
  const s = p.ms / 1000;
  if (s < +desde || s > +hasta) continue;
  const pieza = `${p.texto}(${s.toFixed(2)}) `;
  if (renglon.length + pieza.length > 150) {
    console.log(renglon);
    renglon = "";
  }
  renglon += pieza;
}
if (renglon) console.log(renglon);
