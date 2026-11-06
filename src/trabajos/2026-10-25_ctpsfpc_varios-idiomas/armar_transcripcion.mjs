// Transcripción por palabra (datos/trans/<clip>.json, de scripts/transcribir.mjs) → datos/transcripcion.json
// para HablaSubtitulada (mismo criterio que 2026-10-21_rastro_consumos-del-mes):
//   fin de palabra    = t_dtw de su último token
//   inicio de palabra = fin de la anterior; después de una pausa (> PAUSA_MS), el t_dtw del primer token − ADELANTO_MS
// El texto de los subtítulos se escribe a mano en composiciones.ts (grupos); acá solo cuentan los tiempos.
// Uso (raíz del proyecto): node src/trabajos/2026-10-25_ctpsfpc_varios-idiomas/armar_transcripcion.mjs
import fs from "node:fs";

const ID = "2026-10-25_ctpsfpc_varios-idiomas";
const DATOS = `public/trabajos/${ID}/datos`;
const CLIPS = ["IMG_8365", "IMG_8369", "IMG_8378", "IMG_8384", "IMG_8387", "IMG_8389", "IMG_8412", "IMG_8418", "IMG_8422"];
const PAUSA_MS = 300;
const ADELANTO_MS = 150;
// palabras que no van (fuera de la toma): [clip, hasta ms]
const DESCARTAR = [["IMG_8365", 4000]]; // "Avisame si no estoy presentable" (antes de empezar)
// finales medidos con la energía de la voz (el DTW estira la última palabra antes de una pausa): [clip, palabra, fin ms]
const FINES = [
  ["IMG_8365", "firmar", 8100],
  ["IMG_8369", "traducción.", 1880],
  ["IMG_8378", "idiomas.", 9420],
  ["IMG_8384", "ratificación", 3240],
  ["IMG_8387", "idiomas.", 6740],
  ["IMG_8389", "dictamen.", 2840],
  ["IMG_8412", "específicos.", 10020],
  ["IMG_8418", "traductor.", 6840],
  ["IMG_8422", "intérpretes", 5540],
];
// errores de Whisper que el chequeo de subtítulos no perdona: [clip, dicha, corregida]
const CORREGIR = [["IMG_8378", "holografas,", "ológrafas,"]]; // RAE: sin h (corrección del cliente, v2)

const leer = (archivo) => {
  const j = JSON.parse(fs.readFileSync(`${DATOS}/trans/${archivo}.json`, "utf8"));
  const palabras = [];
  for (const t of j.tokens) {
    if (t.text.startsWith("[_")) continue;
    if (/^\s/.test(t.text) || !palabras.length)
      palabras.push({ text: t.text.trim(), primero: t.dtwMs, endMs: t.dtwMs });
    else {
      palabras.at(-1).text += t.text;
      palabras.at(-1).endMs = t.dtwMs;
    }
  }
  return palabras.filter((w) => /[\p{L}\p{N}]/u.test(w.text));
};

const salida = {};
for (const clip of CLIPS) {
  let palabras = leer(clip);
  for (const [c, hasta] of DESCARTAR) if (c === clip) palabras = palabras.filter((w) => w.primero >= hasta);
  for (const [c, texto, ms] of FINES)
    if (c === clip) for (const w of palabras) if (w.text === texto) w.endMs = ms;
  for (const [c, dicha, corregida] of CORREGIR)
    if (c === clip) for (const w of palabras) if (w.text === dicha) w.text = corregida;
  let fin = 0;
  salida[clip] = palabras.map((w) => {
    const startMs = w.primero - fin > PAUSA_MS ? Math.max(fin, w.primero - ADELANTO_MS) : fin;
    fin = w.endMs;
    return { text: w.text, startMs, endMs: w.endMs };
  });
}
fs.writeFileSync(`${DATOS}/transcripcion.json`, JSON.stringify(salida, null, 1) + "\n");
console.log(`OK ${DATOS}/transcripcion.json · ${Object.values(salida).reduce((s, x) => s + x.length, 0)} palabras`);
for (const [c, ws] of Object.entries(salida)) console.log(c, ws[0].startMs, ws.map((w) => w.text).join(" "));
