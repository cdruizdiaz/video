// Transcripción por palabra (datos/tr/<clip>.json, de scripts/transcribir.mjs --sin-vad) → datos/transcripcion.json
// para HablaSubtitulada (mismo criterio que 2026-10-21_rastro_pau-mascota):
//   fin de palabra    = t_dtw de su último token
//   inicio de palabra = fin de la anterior; después de una pausa (> PAUSA_MS), el t_dtw del primer token − ADELANTO_MS
// IMG_9092 tiene dos tomas; Whisper apretó la segunda (8,7–14,3 s) en 12,5–14,3 s: ese tramo sale de una segunda
// pasada solo sobre él (datos/tr/IMG_9092_b.json, audio desde 8,5 s).
// Uso (raíz del proyecto): node src/trabajos/2026-10-21_rastro_consumos-del-mes/armar_transcripcion.mjs
import fs from "node:fs";

const ID = "2026-10-21_rastro_consumos-del-mes";
const DATOS = `public/trabajos/${ID}/datos`;
const CLIPS = ["IMG_9085", "IMG_9086", "IMG_9088", "IMG_9089", "IMG_9091", "IMG_9092", "IMG_9093", "IMG_9094"];
// segunda pasada: [clip, archivo, desde ms (offset del audio), reemplaza las palabras desde ms]
const TRAMOS = [["IMG_9092", "IMG_9092_b", 8500, 8300]];
const PAUSA_MS = 300;
const ADELANTO_MS = 150;
// texto: [clip, palabras de Whisper (en minúsculas, sin signos), corregido] — puede juntar varias en una
const TEXTO = [
  ["IMG_9086", ["guin", "de", "pleasure"], ["guilty", "pleasure."]], // "guilty pleasure"
  ["IMG_9088", ["hot"], ["hot"]], // "hot horror", junto y sin coma (pedido 2026-10-21)
  ["IMG_9088", ["horror"], ["horror,"], 8000], // el segundo "Horror" ("Evan Peters, hot, horror"), no el del título
  ["IMG_9088", ["temporada"], ["temporada"]],
  ["IMG_9089", ["fábrica"], ["Factoria,"]], // dice "La Fábrica"; el subtítulo, con el nombre bien (pedido 2026-10-21)
  ["IMG_9091", ["llama"], ["llama,"]],
  ["IMG_9091", ["un", "river"], ["a", "River,"]],
  ["IMG_9091", ["un"], ["un"]],
  ["IMG_9092", ["dar"], ["Dar"]],
  ["IMG_9092", ["niños"], ["niños,"]],
  ["IMG_9085", ["creativa"], ["creatipa"]], // "creatipa": término de RASTRO (pedido 2026-10-21)
  ["IMG_9094", ["creativa"], ["de creatipas,"]], // dice "comunidad de creatipas" (Whisper no oyó el "de")
];

// finales medidos con la energía de la voz (el DTW estira la última palabra antes de una pausa): [clip, palabra, fin ms]
const FINES = [
  ["IMG_9089", "embarques,", 7100],
  ["IMG_9089", "pensando.", 12620],
];

const leer = (archivo, offset = 0) => {
  const j = JSON.parse(fs.readFileSync(`${DATOS}/tr/${archivo}.json`, "utf8"));
  const palabras = [];
  for (const t of j.tokens) {
    if (t.text.startsWith("[_")) continue;
    if (/^\s/.test(t.text) || !palabras.length)
      palabras.push({ text: t.text.trim(), primero: t.dtwMs + offset, endMs: t.dtwMs + offset });
    else {
      palabras.at(-1).text += t.text;
      palabras.at(-1).endMs = t.dtwMs + offset;
    }
  }
  return palabras.filter((w) => /[\p{L}\p{N}]/u.test(w.text));
};
const limpio = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const salida = {};
for (const clip of CLIPS) {
  let palabras = leer(clip);
  for (const [c, archivo, offset, desde] of TRAMOS)
    if (c === clip) palabras = [...palabras.filter((w) => w.primero < desde), ...leer(archivo, offset)];
  // correcciones de texto (pueden juntar palabras: el tiempo va del primero al último)
  for (const [c, de, a, desdeMs = 0] of TEXTO) {
    if (c !== clip) continue;
    const i = palabras.findIndex(
      (w, k) => w.primero >= desdeMs && de.every((d, j) => palabras[k + j] && limpio(palabras[k + j].text) === d),
    );
    if (i < 0) continue;
    const grupo = palabras.slice(i, i + de.length);
    const nuevas = a.map((text, j) => {
      const g = grupo[Math.min(j, grupo.length - 1)];
      const ultima = j === a.length - 1;
      return { text, primero: g.primero, endMs: ultima ? grupo.at(-1).endMs : g.endMs };
    });
    palabras.splice(i, de.length, ...nuevas);
  }
  for (const [c, texto, ms] of FINES)
    if (c === clip) for (const w of palabras) if (w.text === texto) w.endMs = ms;
  let fin = 0;
  salida[clip] = palabras.map((w) => {
    const startMs = w.primero - fin > PAUSA_MS ? Math.max(fin, w.primero - ADELANTO_MS) : fin;
    fin = w.endMs;
    return { text: w.text, startMs, endMs: w.endMs };
  });
}
fs.writeFileSync(`${DATOS}/transcripcion.json`, JSON.stringify(salida, null, 1) + "\n");
console.log(`OK ${DATOS}/transcripcion.json · ${Object.values(salida).reduce((s, x) => s + x.length, 0)} palabras`);
for (const [c, ws] of Object.entries(salida)) console.log(c, ws.map((w) => w.text).join(" "));
