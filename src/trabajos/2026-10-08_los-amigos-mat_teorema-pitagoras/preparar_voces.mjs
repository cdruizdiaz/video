// Genera las voces del guion (ElevenLabs, Edge TTS o Piper, según la voz de datos/lineas.json) línea por línea y arma datos/dialogo.json para la composición:
//   public/trabajos/<ID>/audio/voz_<id>.wav (-14 LUFS) + datos/voz_<id>_rhubarb.json (bocas desde el sonido).
// Sin Whisper: los subtítulos muestran la línea entera y Rhubarb saca las bocas del audio (rápido).
// Lee datos/lineas.json (quién dice qué, con qué voz, cara, gesto y pausa antes).
// Uso: node src/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/preparar_voces.mjs [l03 l07 …]
//      (con ids: rehace solo esas voces; sin ids: rehace las que falten). Siempre rearma dialogo.json.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ID = "2026-10-08_los-amigos-mat_teorema-pitagoras";
const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));
const base = path.join("public", "trabajos", ID);
const { voces, lineas } = JSON.parse(fs.readFileSync(path.join(base, "datos", "lineas.json"), "utf8"));
const solo = process.argv.slice(2);
const correr = (exe, args) => {
  const r = spawnSync(exe, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${exe} ${args.join(" ")}\n${r.stderr || r.stdout}`);
  return r.stdout;
};
const dialogo = [];
for (const l of lineas) {
  const wav = path.join(base, "audio", `voz_${l.id}.wav`);
  const bocas = path.join(base, "datos", `voz_${l.id}_rhubarb.json`);
  if (solo.length ? solo.includes(l.id) : !fs.existsSync(wav) || !fs.existsSync(bocas)) {
    const v = voces[l.quien];
    console.log(`${l.id} ${l.quien}: ${l.texto}`);
    // "tts": texto solo para la voz (cuando Piper lee mal una palabra); los subtítulos usan "texto"
    const args = ["scripts/voz.mjs", l.tts ?? l.texto, wav, "--voz", v.voz, "--velocidad", String(v.velocidad ?? 1), "--sin-tiempos"];
    for (const o of ["expresion", "ritmo", "pausa-oracion", "tono-edge", "volumen-edge", "estabilidad", "similitud", "estilo"]) if (v[o] !== undefined) args.push(`--${o}`, String(v[o]));
    if (v.tono) args.push("--nene", String(v.tono));
    correr("node", args);
    correr("node", ["scripts/lipsync_rhubarb.mjs", wav, bocas, "--texto", (l.tts ?? l.texto).replace(/[¡¿]/g, "")]);
  }
  const dur = Number(correr(herr.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).trim());
  const { mouthCues } = JSON.parse(fs.readFileSync(bocas, "utf8"));
  dialogo.push({ ...l, audio: `trabajos/${ID}/audio/voz_${l.id}.wav`, duracionMs: Math.round(dur * 1000), bocas: mouthCues });
}
fs.writeFileSync(path.join(base, "datos", "dialogo.json"), JSON.stringify(dialogo, null, 1));
const total = dialogo.reduce((s, l) => s + l.duracionMs / 1000 + (l.pausaAntes ?? 0.35), 0);
console.log(`dialogo.json: ${dialogo.length} líneas, ~${total.toFixed(1)} s de diálogo con pausas`);
// Voces nuevas → tiempos por palabra de nuevo (subtítulos resaltados)
spawnSync("node", [`src/trabajos/${ID}/tiempos_palabras.mjs`, "--rehacer"], { stdio: "inherit" });
