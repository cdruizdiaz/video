// Transcripción por palabra (datos/tr/<clip>.json, de scripts/transcribir.mjs) → datos/transcripcion.json para
// HablaSubtitulada, con las claves de los clips que usa el montaje (IMG_9053b e IMG_9054b: los clips con Bloomie).
//   fin de palabra    = t_dtw de su último token (o el de FINES, medido con la energía de la voz)
//   inicio de palabra = fin de la anterior; después de una pausa (> PAUSA_MS), el t_dtw del primer token − ADELANTO_MS
// Uso (raíz del proyecto): node src/trabajos/2026-10-21_rastro_pau-mascota/armar_transcripcion.mjs
import fs from "node:fs";

const ID = "2026-10-21_rastro_pau-mascota";
const DATOS = `public/trabajos/${ID}/datos`;
const CLIPS = {
  IMG_9053: "IMG_9053b",
  IMG_9054: "IMG_9054b",
  IMG_9055: "IMG_9055",
  IMG_9059: "IMG_9059",
  IMG_9060: "IMG_9060",
  IMG_9061: "IMG_9061",
  IMG_9064: "IMG_9064",
};
const PAUSA_MS = 300;
const ADELANTO_MS = 150;
// texto: [clip, texto de Whisper, corregido]
const TEXTO = [
  ["*", "Bloomy,", "Bloomie,"],
  ["*", "ilustrator", "Illustrator"],
];
// finales medidos con la energía (el DTW estira la última palabra antes de una pausa): [clip, palabra, segundo aprox., fin ms]
const FINES = [["IMG_9060", "flor.", 12.27, 10980]];

const salida = {};
for (const [clip, clave] of Object.entries(CLIPS)) {
  const j = JSON.parse(fs.readFileSync(`${DATOS}/tr/${clip}.json`, "utf8"));
  const palabras = [];
  for (const t of j.tokens) {
    if (/^\s/.test(t.text) || !palabras.length)
      palabras.push({ text: t.text.trim(), primero: t.dtwMs, endMs: t.dtwMs });
    else {
      palabras.at(-1).text += t.text;
      palabras.at(-1).endMs = t.dtwMs;
    }
  }
  let fin = 0;
  salida[clave] = palabras
    .filter((w) => /[\p{L}\p{N}]/u.test(w.text))
    .map((w) => {
      let text = w.text;
      for (const [c, de, a] of TEXTO)
        if (
          (c === "*" || c === clip) &&
          text.toLowerCase() === de.toLowerCase()
        )
          text = a;
      let endMs = w.endMs;
      for (const [c, p, seg, ms] of FINES)
        if (c === clip && text === p && Math.abs(endMs / 1000 - seg) < 0.3)
          endMs = ms;
      const startMs =
        w.primero - fin > PAUSA_MS
          ? Math.max(fin, w.primero - ADELANTO_MS)
          : fin;
      fin = endMs;
      return { text, startMs, endMs };
    });
}
fs.writeFileSync(
  `${DATOS}/transcripcion.json`,
  JSON.stringify(salida, null, 1) + "\n",
);
console.log(
  `OK ${DATOS}/transcripcion.json · ${Object.values(salida).reduce((s, x) => s + x.length, 0)} palabras`,
);
