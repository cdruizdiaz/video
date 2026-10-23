// Mezcla de audio de "Bloomie toma vida" (5 s): efectos de Mixkit puestos en los cuadros de datos/coreografia.json,
// todo a -14 LUFS (en dos pasadas: se mide con ebur128 y se aplica la ganancia exacta; loudnorm de una pasada no
// llega al objetivo en clips tan cortos) → public/trabajos/<ID>/audio/mezcla.wav
//   encendido del reflector (2579) · melodía mágica (2986, de colchón desde que se despierta) · whoosh suave en la
//   órbita y en el despegue (1492) · pop al asombrarse (731) · boing al aterrizar (2894) · destello en el saludo (3062)
// Uso: node src/trabajos/2026-10-06_claudio_bloomie-toma-vida/preparar_audio.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const ID = "2026-10-06_claudio_bloomie-toma-vida";
const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));
const c = JSON.parse(fs.readFileSync(`public/trabajos/${ID}/datos/coreografia.json`, "utf8"));
const FPS = 30;
const SFX = "public/biblioteca/sfx/mixkit";
const aterriza = c.salto.inicio + Math.round(c.salto.duracion * 0.8); // = saltar() de src/rig/animaciones.ts
const despega = c.salto.inicio + Math.round(c.salto.duracion * 0.25);
// [archivo, cuadro, volumen, fundido de salida (s, opcional)]
const EFECTOS = [
  [`${SFX}/mixkit-2579-light-switch-sound.wav`, c.encendido.cuadro, 1.0],
  [`${SFX}/mixkit-2986.wav`, c.giro.tramo[0], 0.5, 0.8],
  [`${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, c.giro.tramo[0] + 4, 0.22],
  [`${SFX}/mixkit-731-cartoon-bubble-pop.wav`, c.mirarManos.sube[0], 0.55],
  [`${SFX}/mixkit-1492-cinematic-whoosh-fast-transition.wav`, despega - 2, 0.25],
  [`${SFX}/mixkit-2894-boing-hit-sound.wav`, aterriza, 0.6],
  [`${SFX}/mixkit-3062.wav`, c.saludo.inicio, 0.7, 0.6],
];
const dur = c.duracion / FPS;
const entradas = EFECTOS.flatMap(([f]) => ["-i", f]);
const cadenas = EFECTOS.map(([, cuadro, vol, fin], i) => {
  const ms = Math.round((cuadro / FPS) * 1000);
  const fade = fin ? `,afade=t=out:st=${(dur - ms / 1000 - fin).toFixed(2)}:d=${fin}` : "";
  return `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol}${fade},adelay=${ms}|${ms}[e${i}]`;
});
const filtro = `${cadenas.join(";")};${EFECTOS.map((_, i) => `[e${i}]`).join("")}amix=inputs=${EFECTOS.length}:normalize=0,atrim=0:${dur},afade=t=out:st=${dur - 0.3}:d=0.3[s]`;
const OBJETIVO = -14;
const salida = `public/trabajos/${ID}/audio/mezcla.wav`;
const cruda = `public/trabajos/${ID}/audio/mezcla_cruda.wav`;
const ff = (a) => {
  const r = spawnSync(herr.ffmpeg, a, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};
const medir = (f) => {
  const t = ff(["-hide_banner", "-nostats", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  return { lufs: Number(t.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).split(/\s+/)[1]), pico: Number(t.match(/Peak:\s+(-?[\d.]+) dBFS/g).at(-1).split(/\s+/)[1]) };
};
ff(["-y", "-v", "error", ...entradas, "-filter_complex", filtro, "-map", "[s]", "-ar", "48000", "-t", String(dur), cruda]);
const antes = medir(cruda);
const ganancia = OBJETIVO - antes.lufs;
if (antes.pico + ganancia > -1.5) throw new Error(`con +${ganancia.toFixed(1)} dB el pico pasaría de -1,5 dBFS: bajar el volumen del efecto más fuerte`);
ff(["-y", "-v", "error", "-i", cruda, "-af", `volume=${ganancia.toFixed(2)}dB`, salida]);
fs.rmSync(cruda);
const fin = medir(salida);
console.log(`OK ${salida} · ${dur} s · ${fin.lufs} LUFS · pico ${fin.pico} dBFS · aterriza en el cuadro ${aterriza}`);
