// Corta la transcripción de voz_todas.wav (todas las frases separadas por silencios) en una entrada por frase,
// con los tokens de Whisper en tiempos relativos al inicio de cada frase_N.wav (para el lip sync) y las palabras
// del guion con su tiempo (para los globos: se muestra el texto del guion, no el que escuchó Whisper, que puede
// escribir "blooming" en vez de "bloomin'"). Salida: public/trabajos/<ID>/datos/frases.json
// Uso: node src/trabajos/2026-10-02_lucia_chiste-navidad/separar_frases.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const ID = "2026-10-02_lucia_chiste-navidad";
const SILENCIO_MS = 1500;
const herr = JSON.parse(readFileSync("scripts/herramientas.json", "utf8"));
const FRASES = [
  "This year, I want to be part of Christmas too!",
  "Hmm… not quite enough tummy for Father Christmas.",
  "I'm a reindeer! Ready for take-off!",
  "…Reindeer don't have petals.",
  "Hang on! Someone's missing up there!",
  "I'm not a reindeer, I'm not Father Christmas… I'm a bloomin' star!",
];

const duracionMs = (archivo) =>
  1000 * Number(execFileSync(herr.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo], { encoding: "utf8" }).trim());

const tr = JSON.parse(readFileSync(`public/trabajos/${ID}/datos/voz_todas.json`, "utf8"));
// En esta pista fromMs/toMs de Whisper se corren; el tiempo confiable es dtwMs (alineamiento por palabra):
// cada token empieza en su dtwMs y termina donde empieza el siguiente
const crudos = tr.tokens.filter((t) => !/^\s*\[/.test(t.text));
tr.tokens = crudos.map((t, i) => {
  const desde = t.dtwMs ?? t.fromMs;
  const sig = crudos[i + 1];
  const hasta = sig ? Math.max(desde + 60, Math.min(sig.dtwMs ?? sig.fromMs, desde + 700)) : desde + 300;
  return { ...t, fromMs: desde, toMs: hasta };
});
const limpiar = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
let inicio = 0;
const salida = FRASES.map((texto, i) => {
  const dur = duracionMs(`public/trabajos/${ID}/audio/frase_${i + 1}.wav`);
  const fin = inicio + dur;
  const tokens = tr.tokens
    .filter((t) => t.fromMs >= inicio - 80 && t.fromMs < fin && !/^\s*\[/.test(t.text))
    .map((t) => ({ text: t.text, fromMs: Math.max(0, t.fromMs - inicio), toMs: Math.min(dur, t.toMs - inicio) }));
  // Palabras de Whisper (un token con espacio adelante abre palabra)
  const ws = [];
  for (const t of tokens) {
    const l = limpiar(t.text);
    if (!l) continue;
    if (t.text.startsWith(" ") || !ws.length) ws.push({ l, desde: t.fromMs, hasta: t.toMs });
    else Object.assign(ws[ws.length - 1], { l: ws[ws.length - 1].l + l, hasta: t.toMs });
  }
  // Palabras del guion con tiempo: emparejadas en orden; si no coinciden, la del guion toma la siguiente de Whisper
  const guion = texto.split(/\s+/);
  let k = 0;
  const palabras = guion.map((w, j) => {
    const objetivo = limpiar(w);
    const desde = ws.findIndex((x, n) => n >= k && (x.l === objetivo || x.l.startsWith(objetivo.slice(0, 4))));
    const elegido = desde >= 0 && desde - k <= 2 ? desde : Math.min(k, ws.length - 1);
    const x = ws[elegido] ?? { desde: (dur * j) / guion.length, hasta: (dur * (j + 1)) / guion.length };
    k = elegido + 1;
    return { texto: w, desdeMs: Math.round(x.desde), hastaMs: Math.round(x.hasta) };
  });
  // Tiempos crecientes (por si el emparejamiento repitió alguna)
  for (let j = 1; j < palabras.length; j++) palabras[j].desdeMs = Math.max(palabras[j].desdeMs, palabras[j - 1].desdeMs + 40);
  inicio = fin + SILENCIO_MS;
  return { n: i + 1, texto, duracionMs: Math.round(dur), archivo: `trabajos/${ID}/audio/frase_${i + 1}.wav`, palabras, tokens };
});
writeFileSync(`public/trabajos/${ID}/datos/frases.json`, JSON.stringify(salida, null, 1));
for (const f of salida) console.log(`${f.n} · ${(f.duracionMs / 1000).toFixed(2)} s · ${f.palabras.map((p) => `${p.texto}@${p.desdeMs}`).join(" ")}`);
