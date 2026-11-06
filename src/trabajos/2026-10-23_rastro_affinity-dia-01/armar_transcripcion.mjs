// Transcripción por palabra (datos/tr/<clip>.json, de scripts/transcribir.mjs --sin-vad) → datos/transcripcion.json
// para HablaSubtitulada (mismo criterio que 2026-10-21_rastro_pau-mascota):
//   fin de palabra    = t_dtw de su último token
//   inicio de palabra = fin de la anterior; después de una pausa (> PAUSA_MS), el t_dtw del primer token − ADELANTO_MS
// Uso (raíz del proyecto): node src/trabajos/2026-10-23_rastro_affinity-dia-01/armar_transcripcion.mjs
import fs from "node:fs";

const ID = "2026-10-23_rastro_affinity-dia-01";
const DATOS = `public/trabajos/${ID}/datos`;
const CLIPS = ["IMG_8270", "IMG_8271", "IMG_8272", "IMG_8273", "IMG_8277"];
// segunda pasada: [clip, archivo, desde ms (offset del audio), reemplaza las palabras desde ms]
const TRAMOS = [];
const PAUSA_MS = 300;
const ADELANTO_MS = 150;
// texto: [clip, palabras de Whisper (en minúsculas, sin signos), corregido] — puede juntar varias en una
const TEXTO = [
  ["IMG_8270", ["día"], ["Día"]],
  ["IMG_8270", ["affinity"], ["Affinity."]],
  ["IMG_8271", ["llevo"], ["llegó"]], // "me llegó un mail" (Whisper: "me llevo")
  ["IMG_8271", ["llevo"], ["llegó"], 12000],
  ["IMG_8271", ["huelga"], ["huelga,"]],
  ["IMG_8271", ["affinity"], ["Affinity."], 11000],
  ["IMG_8271", ["dije"], ["dije:"]],
  ["IMG_8271", ["esta"], ["este"], 25000], // "la portada de este reel"
  ["IMG_8271", ["buena"], ["buenas."]], // "cositas extras que están muy buenas"
  ["IMG_8271", ["está"], ["están"], 48000],
  ["IMG_8271", ["haces"], ["hacés"]],
  ["IMG_8272", ["nadobe"], ["Adobe"]],
  ["IMG_8272", ["nadobe"], ["Adobe"], 25000],
  ["IMG_8272", ["arrastras"], ["arrastrás"]],
  ["IMG_8272", ["controlas"], ["controlás"]],
  ["IMG_8272", ["día"], ["Día"], 80000],
  ["IMG_8272", ["probando"], ["probando,"], 90000],
  ["IMG_8272", ["affinity"], ["Affinity."], 94000],
  ["IMG_8273", ["puedes"], ["podés"], 190000],
  ["IMG_8273", ["rastro"], ["RASTRO."], 330000],
  // ⚠️ IMG_8277: Whisper oye "te deja el gel ubicado" / "el eje lo ubicaste"; por el sentido, "te deja elegir:
  // lo ubicás en una computadora…". Preguntar al cliente.
  ["IMG_8277", ["el", "gel", "ubicado"], ["elegir:", "lo", "ubicás"]],
  ["IMG_8277", ["he"], ["re"]], // "re hecho en Canva" ⚠️
  ["IMG_8277", ["repro"], ["re", "pro"]],
  ["IMG_8277", ["repro"], ["re", "pro"], 14000],
];

// finales medidos con la energía de la voz (el DTW estira la última palabra antes de una pausa): [clip, palabra, fin ms]
const FINES = [
];
// inicios medidos con la energía (el DTW los atrasa): [clip, palabra, inicio ms]
const INICIOS = [
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
