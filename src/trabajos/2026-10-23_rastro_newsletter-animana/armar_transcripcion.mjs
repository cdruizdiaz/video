// Transcripción por palabra (datos/tr/<clip>.json, de scripts/transcribir.mjs --sin-vad) → datos/transcripcion.json
// para HablaSubtitulada (mismo criterio que 2026-10-21_rastro_pau-mascota):
//   fin de palabra    = t_dtw de su último token
//   inicio de palabra = fin de la anterior; después de una pausa (> PAUSA_MS), el t_dtw del primer token − ADELANTO_MS
// Uso (raíz del proyecto): node src/trabajos/2026-10-23_rastro_newsletter-animana/armar_transcripcion.mjs
import fs from "node:fs";

const ID = "2026-10-23_rastro_newsletter-animana";
const DATOS = `public/trabajos/${ID}/datos`;
const CLIPS = ["IMG_9072", "IMG_9074", "IMG_9078", "IMG_9080", "IMG_9082", "IMG_9083"];
// segunda pasada: [clip, archivo, desde ms (offset del audio), reemplaza las palabras desde ms]
const TRAMOS = [];
const PAUSA_MS = 300;
const ADELANTO_MS = 150;
// texto: [clip, palabras de Whisper (en minúsculas, sin signos), corregido] — puede juntar varias en una
const TEXTO = [
  ["IMG_9072", ["newsletter"], ["newsletter?"]],
  ["IMG_9078", ["click"], ["clic"]], // RAE
  // ⚠️ IMG_9080: tres pasadas de Whisper (original, voz limpia, con y sin --prompt) oyen "si me dice sobre los
  // cabrieros/cabrieron se llaman CTOR y es más bonito/bueno". Por el sentido: "sobre los que abrieron" (CTOR = clics
  // sobre aperturas). Preguntar al cliente.
  ["IMG_9080", ["y"], ["Y"], 4900],
  ["IMG_9080", ["cabrieros"], ["que", "abrieron,"]],
  ["IMG_9080", ["llaman"], ["llama"]],
  ["IMG_9080", ["ctor"], ["CTOR"], 6000], // lo deletrea: C-T-O-R
  ["IMG_9082", ["así"], ["Así,"]],
  ["IMG_9082", ["después"], ["después:"]],
  ["IMG_9082", ["compró"], ["compró,"]],
  ["IMG_9083", ["utm"], ["UTM,"]],
  ["IMG_9083", ["les"], ["le"]], // "si les sirve a tu negocio" → "le" (concuerda con "tu negocio")
  ["IMG_9083", ["quieres"], ["¿Querés"]], // voseo (Whisper lo pasa a "quieres")
];

// finales medidos con la energía de la voz (el DTW estira la última palabra antes de una pausa): [clip, palabra, fin ms]
const FINES = [
  ["IMG_9072", "newsletter?", 13150],
  ["IMG_9074", "segundos.", 12460],
  ["IMG_9078", "convence.", 7610],
  ["IMG_9080", "bonito.", 8600],
  ["IMG_9082", "fue.", 6800],
  ["IMG_9083", "leyeron,", 4440],
  ["IMG_9083", "negocio,", 6380],
];
// inicios medidos con la energía (el DTW los atrasa): [clip, palabra, inicio ms]
const INICIOS = [
  ["IMG_9072", "¿Cómo", 10000], // el DTW del "¿" la ponía en 8,7 s (antes de la toma)
  ["IMG_9074", "y", 9880],
  ["IMG_9080", "Y", 4980],
  ["IMG_9083", "Aperturas", 2380],
  ["IMG_9083", "¿Querés", 8520],
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
  for (const [c, texto, ms] of INICIOS)
    if (c === clip) for (const w of palabras) if (w.text === texto) w.primero = ms + ADELANTO_MS;
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
