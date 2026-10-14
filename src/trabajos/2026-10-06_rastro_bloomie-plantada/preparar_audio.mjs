// Mezcla del audio de "Bloomie — Planted": las tres voces (Piper, ya a -14 LUFS) y los efectos de Mixkit en sus tiempos
// (datos/plantada.json, de armar_escena.mjs). Cada efecto se recorta, se mide (ebur128) y se lleva a "db" respecto de
// la voz; después la mezcla entera va a -14 LUFS con loudnorm en dos pasadas y se verifica con ebur128.
// Uso: node src/trabajos/2026-10-06_rastro_bloomie-plantada/preparar_audio.mjs → public/trabajos/<ID>/audio/mezcla.wav
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ID = "2026-10-06_rastro_bloomie-plantada";
const RAIZ = process.cwd();
const herr = JSON.parse(fs.readFileSync("scripts/herramientas.json", "utf8"));
const plan = JSON.parse(fs.readFileSync(`public/trabajos/${ID}/datos/plantada.json`, "utf8"));
const VOZ = -14; // LUFS de cada voz
const OBJETIVO = "I=-14:TP=-1.5:LRA=11";
const SFX = "public/biblioteca/sfx/mixkit";
const SAL = `public/trabajos/${ID}/audio/mezcla.wav`;
const dur = plan.duracion / plan.fps;

const ff = (a) => {
  const r = spawnSync(herr.ffmpeg, ["-hide_banner", "-y", ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(r.stderr.split("\n").slice(-5).join("\n"));
  return r.stderr;
};
const lufs = (archivo) => Number(/I:\s+(-?[\d.]+) LUFS/.exec(ff(["-i", archivo, "-af", "ebur128=peak=true", "-f", "null", "-"]).split("Summary:")[1])[1]);

const tmp = fs.mkdtempSync(path.join(RAIZ, "tmp", "audio-"));
try {
  const entradas = [];
  const filtros = [];
  for (const v of plan.voces) {
    entradas.push("-i", path.join("public", v.archivo));
    filtros.push(`[${entradas.length / 2 - 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(v.inicio * 1000)}:all=1[v${v.id}]`);
  }
  for (const [i, e] of plan.efectos.entries()) {
    // recorte (+ tempo) del efecto a un wav, medido para saber cuánto subirlo o bajarlo
    const corte = path.join(tmp, `e${i}.wav`);
    const tempo = e.tempo ? `,atempo=${e.tempo}` : "";
    ff(["-i", path.join(SFX, e.archivo), "-af", `atrim=${e.desde}:${e.desde + e.dura},asetpts=N/SR/TB${tempo},aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st=${Math.max(0, e.dura / (e.tempo ?? 1) - e.fundido)}:d=${e.fundido},apad=pad_dur=0.5`, corte]);
    const medido = lufs(corte);
    const ganancia = VOZ + e.db - medido;
    console.log(`  ${e.nombre.padEnd(11)} en ${e.en.toFixed(2)} s · ${medido.toFixed(1)} LUFS → ${(VOZ + e.db).toFixed(0)} (${ganancia >= 0 ? "+" : ""}${ganancia.toFixed(1)} dB)`);
    entradas.push("-i", corte);
    filtros.push(`[${entradas.length / 2 - 1}:a]volume=${ganancia.toFixed(2)}dB,adelay=${Math.round(e.en * 1000)}:all=1[e${i}]`);
  }
  const etiquetas = [...plan.voces.map((v) => `[v${v.id}]`), ...plan.efectos.map((_, i) => `[e${i}]`)].join("");
  filtros.push(`${etiquetas}amix=inputs=${plan.voces.length + plan.efectos.length}:normalize=0:duration=longest,atrim=0:${dur},afade=t=out:st=${dur - 0.3}:d=0.3[m]`);
  const crudo = path.join(tmp, "mezcla_cruda.wav");
  ff([...entradas, "-filter_complex", filtros.join(";"), "-map", "[m]", "-ar", "48000", crudo]);
  // loudnorm en dos pasadas (lineal: no cambia la dinámica de la mezcla)
  const j = JSON.parse(/\{[\s\S]*\}/.exec(ff(["-i", crudo, "-af", `loudnorm=${OBJETIVO}:print_format=json`, "-f", "null", "-"]))[0]);
  ff(["-i", crudo, "-af", `loudnorm=${OBJETIVO}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`, "-c:a", "pcm_s16le", SAL]);
  const fin = ff(["-i", SAL, "-af", "ebur128=peak=true", "-f", "null", "-"]).split("Summary:")[1];
  console.log(`OK ${SAL} · ${/I:\s+(-?[\d.]+ LUFS)/.exec(fin)[1]} · pico ${/Peak:\s+(-?[\d.]+ dBFS)/.exec(fin)[1]}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
