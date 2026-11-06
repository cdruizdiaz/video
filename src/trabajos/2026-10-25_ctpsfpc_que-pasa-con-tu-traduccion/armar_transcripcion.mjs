// Transcripción por palabra (datos/trans/<clip>.json, de scripts/transcribir.mjs) → datos/transcripcion.json
// para HablaSubtitulada (mismo criterio que 2026-10-21_rastro_consumos-del-mes):
//   fin de palabra    = t_dtw de su último token
//   inicio de palabra = fin de la anterior; después de una pausa (> PAUSA_MS), el t_dtw del primer token − ADELANTO_MS
// El texto de los subtítulos se escribe a mano en composiciones.ts (grupos); acá solo cuentan los tiempos.
// Uso (raíz del proyecto): node src/trabajos/2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion/armar_transcripcion.mjs
import fs from "node:fs";

const ID = "2026-10-25_ctpsfpc_que-pasa-con-tu-traduccion";
const DATOS = `public/trabajos/${ID}/datos`;
const CLIPS = ["IMG_8443", "IMG_8447", "IMG_8456", "IMG_8479", "IMG_8481", "IMG_8488", "IMG_8497", "IMG_8500"];
// archivo de Whisper por clip, si no es el del mismo nombre: IMG_8500 transcrito con --sin-vad (con el salto de
// silencios Whisper solo devolvía "¿Tenés que legalizar una traducción?" y perdía "Consultá horarios…")
const ARCHIVO = { IMG_8500: "IMG_8500_b" };
const PAUSA_MS = 300;
const ADELANTO_MS = 150;
// palabras que no van: [clip, desde ms, hasta ms]
const DESCARTAR = [["IMG_8479", 4300, Infinity]]; // "y verificamos": retoma, lo dice entero al principio de IMG_8481
// finales medidos con la energía de la voz (el DTW estira la última palabra antes de una pausa): [clip, palabra, fin ms]
const FINES = [
  ["IMG_8443", "colegio?", 5050],
  ["IMG_8447", "vigente.", 4100],
  ["IMG_8456", "registro", 3700],
  ["IMG_8479", "legalización", 4200],
  ["IMG_8481", "habilitados.", 4350],
  ["IMG_8488", "trámite", 7300],
  ["IMG_8497", "documento.", 6550],
  ["IMG_8500", "www.traductoresantafe.org.ar", 7250],
];

// números dichos de cada paso, en palabras en los subtítulos (pedido 2026-10-25 sobre la v2; Whisper los da en cifras)
const EN_LETRAS = { "1.": "Uno:", "2.": "Dos:", "3.": "Tres:", "4.": "Cuatro:" }; // con dos puntos, no punto (pedido sobre la v3)
// inicios medidos con la energía de la voz (el DTW adelanta la primera palabra de una toma): [clip, palabra, inicio ms]
const INICIOS = [["IMG_8443", "¿Qué", 2180]]; // la voz empieza en 2,2 s; Whisper la daba en 1,43

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
  let palabras = leer(ARCHIVO[clip] ?? clip);
  for (const [c, desde, hasta] of DESCARTAR)
    if (c === clip) palabras = palabras.filter((w) => w.primero < desde || w.primero >= hasta);
  for (const [c, texto, ms] of FINES)
    if (c === clip) for (const w of palabras) if (w.text === texto) w.endMs = ms;
  let fin = 0;
  salida[clip] = palabras.map((w) => {
    const medido = INICIOS.find(([c, texto]) => c === clip && texto === w.text);
    const startMs = medido ? medido[2] : w.primero - fin > PAUSA_MS ? Math.max(fin, w.primero - ADELANTO_MS) : fin;
    fin = w.endMs;
    return { text: EN_LETRAS[w.text] ?? w.text, startMs, endMs: w.endMs };
  });
}
fs.writeFileSync(`${DATOS}/transcripcion.json`, JSON.stringify(salida, null, 1) + "\n");
console.log(`OK ${DATOS}/transcripcion.json · ${Object.values(salida).reduce((s, x) => s + x.length, 0)} palabras`);
for (const [c, ws] of Object.entries(salida)) console.log(c, ws[0].startMs, ws.map((w) => w.text).join(" "));
