// Mezcla de audio de "Bloomie — Planted" (8,5 s): las tres voces (Piper, ya a -14 LUFS cada una) y los efectos de
// Mixkit en los cuadros de datos/coreografia.json ("voces" y "efectos"), todo a -14 LUFS en dos pasadas (se mide con
// ebur128 y se aplica la ganancia exacta) → public/trabajos/<ID>/audio/mezcla.wav
// Efectos: tic-tac 1070 · trombón triste 471 · chirrido de goma 1009 · boing 2894 · ba-dum-tss 578 · destello 3062
// Uso: node src/trabajos/2026-10-06_claudio_bloomie-plantado/preparar_audio.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const ID = "2026-10-06_claudio_bloomie-plantado";
const P = `public/trabajos/${ID}`;
const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));
const c = JSON.parse(fs.readFileSync(`${P}/datos/coreografia.json`, "utf8"));
const FPS = 30;
const OBJETIVO = -14;
const PICO_MAX = -1.5;
const SFX = "public/biblioteca/sfx/mixkit";
const ARCHIVOS = {
  tictac: `${SFX}/mixkit-1070-big-old-clock-ticking.wav`,
  womp: `${SFX}/mixkit-471-sad-game-over-trombone.wav`,
  estiron: `${SFX}/mixkit-1009-rubber-squeaking.wav`,
  boing: `${SFX}/mixkit-2894-boing-hit-sound.wav`,
  badumtss: `${SFX}/mixkit-578-joke-drums.wav`,
  destello: `${SFX}/mixkit-3062.wav`,
};
const DURA_EFECTO = { estiron: 0.45, womp: 1.4 }; // s: se cortan (con fundido) para que no se pisen con lo que sigue
const dur = c.duracion / FPS;

// [archivo, cuadro, volumen, duración máxima (s)]
const pistas = [
  ...c.voces.map((v) => [`${P}/${v.archivo}`, v.cuadro, 1.0, null]),
  ...c.efectos.map((e) => [ARCHIVOS[e.id], e.cuadro, e.volumen, e.hasta ? (e.hasta - e.cuadro) / FPS : DURA_EFECTO[e.id] ?? null]),
];
const entradas = pistas.flatMap(([f]) => ["-i", f]);
const cadenas = pistas.map(([, cuadro, vol, max], i) => {
  const ms = Math.round((cuadro / FPS) * 1000);
  const corte = max ? `,atrim=0:${max.toFixed(2)},afade=t=out:st=${Math.max(0, max - 0.15).toFixed(2)}:d=0.15` : "";
  return `[${i}:a]aresample=48000,aformat=channel_layouts=stereo${corte},volume=${vol},adelay=${ms}|${ms}[e${i}]`;
});
const filtro = `${cadenas.join(";")};${pistas.map((_, i) => `[e${i}]`).join("")}amix=inputs=${pistas.length}:normalize=0,atrim=0:${dur},afade=t=out:st=${dur - 0.3}:d=0.3[s]`;

const ff = (a) => {
  const r = spawnSync(herr.ffmpeg, a, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};
const medir = (f) => {
  const t = ff(["-hide_banner", "-nostats", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  return { lufs: Number(t.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).split(/\s+/)[1]), pico: Number(t.match(/Peak:\s+(-?[\d.]+) dBFS/g).at(-1).split(/\s+/)[1]) };
};
const salida = `${P}/audio/mezcla.wav`;
const cruda = `${P}/audio/mezcla_cruda.wav`;
ff(["-y", "-v", "error", ...entradas, "-filter_complex", filtro, "-map", "[s]", "-ar", "48000", "-t", String(dur), cruda]);
const antes = medir(cruda);
let ganancia = OBJETIVO - antes.lufs;
let limite = "";
if (antes.pico + ganancia > PICO_MAX) limite = `,alimiter=limit=${Math.pow(10, PICO_MAX / 20).toFixed(3)}:level=false`; // un golpe puntual no frena el nivel
ff(["-y", "-v", "error", "-i", cruda, "-af", `volume=${ganancia.toFixed(2)}dB${limite}`, salida]);
let fin = medir(salida);
if (Math.abs(fin.lufs - OBJETIVO) > 0.3) {
  // el limitador comió algo de nivel: una segunda corrección
  ganancia += OBJETIVO - fin.lufs;
  ff(["-y", "-v", "error", "-i", cruda, "-af", `volume=${ganancia.toFixed(2)}dB${limite}`, salida]);
  fin = medir(salida);
}
fs.rmSync(cruda);
console.log(`OK ${salida} · ${dur} s · ${pistas.length} pistas · ${fin.lufs} LUFS · pico ${fin.pico} dBFS${limite ? " (con limitador)" : ""}`);
