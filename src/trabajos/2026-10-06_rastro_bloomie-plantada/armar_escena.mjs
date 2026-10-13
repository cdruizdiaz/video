// Arma, desde el guion (tiempos en las constantes de abajo) y las voces (datos/voz_*.json y voz_*_rhubarb.json), los
// archivos que usan el render 3D y la composición:
//   datos/animacion.json      PersonajeRigProps: una secuencia de 255 poses, una por cuadro (interpolación "paso")
//   datos/escena_extra.json   giro rotY por cuadro, luces y huesosExtra (z hacia la cámara, cabeceo, giro de la cabeza)
//   datos/caras_cuadros.json  ojos + boca (o cara completa) + espejo por cuadro → caras.py
//   datos/plantada.json       duración, lugar, voces, subtítulos palabra por palabra y efectos (composición y audio)
// Uso: node src/trabajos/2026-10-06_rastro_bloomie-plantada/armar_escena.mjs
import fs from "node:fs";

const ID = "2026-10-06_rastro_bloomie-plantada";
const DATOS = `public/trabajos/${ID}/datos`;
const FPS = 30;
const N = 255; // 8,5 s
const PIES = [540, 1330];
const ESCALA = 1.95;
const s = (seg) => seg * FPS; // segundos → cuadros

// ---------- Voces (inicio en s) y subtítulos (líneas del guion, en orden) ----------
const VOCES = [
  { id: "a", inicio: 0.8, lineas: ["I waited for my date", "for hours…"], borra: 2.5 },
  { id: "b", inicio: 2.84, lineas: ["and I got stood up!"], borra: 3.95 },
  { id: "c", inicio: 5.3, lineas: ["And I can't even leave…", "I'm planted!"], borra: 7.25, grande: "planted!" },
];
// ---------- Efectos (s; archivo de public/biblioteca/sfx/mixkit; desde = s dentro del archivo; dB respecto de la voz) ----------
const EFECTOS = [
  { nombre: "tic-tac", archivo: "mixkit-1060.wav", en: 0, desde: 0.25, dura: 2.3, db: -10, fundido: 0.3 },
  { nombre: "womp-womp", archivo: "mixkit-744.wav", en: 3.66, desde: 0, dura: 0.9, db: -9, fundido: 0.15 },
  { nombre: "estiron-1", archivo: "mixkit-616.wav", en: 3.85, desde: 0.1, dura: 1.0, tempo: 2.4, db: -8, fundido: 0.06 },
  { nombre: "boing-1", archivo: "mixkit-2894-boing-hit-sound.wav", en: 4.2, desde: 0, dura: 0.6, db: -7, fundido: 0.1 },
  { nombre: "estiron-2", archivo: "mixkit-616.wav", en: 4.5, desde: 0.1, dura: 1.0, tempo: 2.1, db: -7, fundido: 0.06 },
  { nombre: "boing-2", archivo: "mixkit-2894-boing-hit-sound.wav", en: 4.92, desde: 0, dura: 0.6, db: -6, fundido: 0.1 },
  { nombre: "ba-dum-tss", archivo: "mixkit-578-joke-drums.wav", en: 7.25, desde: 0, dura: 1.25, db: -6, fundido: 0.3 },
  { nombre: "destello", archivo: "mixkit-3062.wav", en: 7.3, desde: 0, dura: 1.0, db: -10, fundido: 0.3 },
];

// ---------- Pistas de animación: claves [cuadro, valor] con transición suave entre claves ----------
// giro: + = mira hacia la derecha de la pantalla (render.py lo recibe como -giro). Nunca más de ±0,35 (¾, sin perfil).
// rot en grados (+ = horario en pantalla), x/y/z en pt del .ai (y + = abajo, z + = hacia la cámara), sy/sx escalas.
const MANO_REPOSO = { x: 0, y: 0, rot: 0, z: 0 };
const BRAZOS_CRUZADOS = { izq: { x: 100, y: 6, rot: -20, z: 46 }, der: { x: -100, y: 10, rot: 20, z: 40 } };
const HOMBROS = { izq: { x: -44, y: -58, rot: 60, z: 20 }, der: { x: 44, y: -58, rot: -60, z: 20 } };
const TIRON = { izq: { x: 26, y: -16, rot: -25, z: 18 }, der: { x: 34, y: -24, rot: -35, z: 18 } }; // las manos "tiran" hacia la salida

const P = {
  giro: [[0, 0], [7, -0.2], [12, -0.2], [19, 0.2], [24, 0.2], [30, 0], [70, 0], [74, -0.08], [82, -0.08], [86, 0], [114, 0], [124, 0.35], [159, 0.35], [168, 0], [N, 0]],
  "cuerpo.rot": [[0, 0], [116, 0], [125, 12, "tension"], [126, -3, "golpe"], [130, 0], [135, 0], [147, 18, "tension"], [148, -5, "golpe"], [153, 0], [N, 0]],
  "cuerpo.sy": [[0, 1], [70, 1], [76, 0.97], [84, 1], [92, 0.96], [114, 0.96], [116, 1], [125, 1.12, "tension"], [126, 0.92, "golpe"], [130, 1], [135, 1], [147, 1.16, "tension"], [148, 0.88, "golpe"], [151, 1.03], [154, 1], [162, 1], [172, 1.03], [218, 1.03], [222, 0.94], [226, 1.04], [231, 1], [N, 1]],
  "cabeza.y": [[0, 0], [86, 0], [94, 6], [114, 6], [117, 0], [125, -8, "tension"], [126, 3, "golpe"], [130, 0], [135, 0], [147, -10, "tension"], [148, 4, "golpe"], [152, 0], [N, 0]],
  "cabeza.rot": [[0, 0], [190, 0], [200, -5], [215, -5], [222, 0], [N, 0]],
  "cabeza.cabeceo": [[0, 0], [24, 0], [28, 2], [36, 0], [46, 3], [52, 0], [60, 3], [68, 0], [86, 0], [94, 8], [114, 8], [118, -6], [125, -6], [126, 0, "golpe"], [130, -4], [147, -4], [148, 0, "golpe"], [152, 0], [156, 12], [159, 12], [166, 0], [N, 0]],
  "pie_der.y": [[0, 0], [3, 0], [4.5, -6], [6, 0], [12, 0], [13.5, -6], [15, 0], [21, 0], [22.5, -6], [24, 0], [N, 0]],
};
// Manos: tramos [desde, hasta, pose] (la transición dura lo que el tramo; después se quedan)
const MANOS = [
  [0, 24, MANO_REPOSO, MANO_REPOSO],
  [24, 33, MANO_REPOSO, BRAZOS_CRUZADOS],
  [84, 92, BRAZOS_CRUZADOS, MANO_REPOSO],
  [114, 124, MANO_REPOSO, TIRON],
  [152, 160, TIRON, MANO_REPOSO],
  [162, 172, MANO_REPOSO, HOMBROS],
  [226, 238, HOMBROS, MANO_REPOSO],
];
const RESPIRAR = { periodo: 2.4, sy: 0.008 }; // s · amplitud
const PETALOS = { rigidez: 0.16, freno: 0.78, ganancia: 0.9, caidaTriste: 8 };
const TEMBLOR = { amp: 1.2, cada: 2 }; // grados en el esfuerzo (cada 2 cuadros)

// ---------- Caras (tramos de cuadros; "habla" = boca de Rhubarb de esa voz) ----------
const CARAS = [
  { desde: 0, hasta: 12, ojos: "costado", boca: "cerrada" },
  { desde: 12, hasta: 15, ojos: "cansado", boca: "cerrada" }, // parpadeo
  { desde: 15, hasta: 24, ojos: "costado", boca: "cerrada", espejo: true },
  { desde: 24, hasta: 70, ojos: "cansado", habla: "a" },
  { desde: 70, hasta: 84, ojos: "costado", boca: "cerrada" }, // suspiro, de reojo
  { desde: 84, hasta: 114, ojos: "triste", habla: "b" },
  { desde: 114, hasta: 115, ojos: "triste" },
  { desde: 115, hasta: 126, ojos: "esfuerzo" },
  { desde: 126, hasta: 135, ojos: "asombro" },
  { desde: 135, hasta: 148, ojos: "esfuerzo" },
  { desde: 148, hasta: 159, ojos: "asombro" },
  { desde: 159, hasta: 190, ojos: "normal", habla: "c" },
  { desde: 190, hasta: 218, ojos: "resignado", habla: "c" },
  { desde: 218, hasta: N, ojos: "alegria" },
];
const RHUBARB = { X: null, A: "mbp", B: "entreabierta", C: "e", D: "a", E: "o", F: "u", G: "f", H: "l" };

// ---------- Utilidades ----------
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const curvas = { suave, tension: (t) => 1 - (1 - t) ** 2, golpe: () => 1, lineal: (t) => t };
const evaluar = (claves, f) => {
  if (f <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    const [f1, v1, tipo = "suave"] = claves[i];
    const [f0, v0] = claves[i - 1];
    if (f <= f1) return v0 + (v1 - v0) * curvas[tipo](Math.min(1, Math.max(0, (f - f0) / Math.max(1e-6, f1 - f0))));
  }
  return claves.at(-1)[1];
};
const manoEn = (lado, f) => {
  let pose = MANO_REPOSO;
  for (const [a, b, de, a_] of MANOS) {
    const pa = de[lado] ?? de;
    const pb = a_[lado] ?? a_;
    if (f < a) break;
    const t = suave(Math.min(1, (f - a) / (b - a)));
    pose = Object.fromEntries(Object.keys(MANO_REPOSO).map((k) => [k, pa[k] + (pb[k] - pa[k]) * t]));
  }
  return pose;
};
const r3 = (v) => +v.toFixed(3);

// ---------- Voces: tiempos por palabra (Whisper) → palabras de los subtítulos ----------
const plan = { duracion: N, fps: FPS, pies: PIES, escala: ESCALA, voces: [], subtitulos: [], efectos: EFECTOS };
const bocas = {};
for (const v of VOCES) {
  const w = JSON.parse(fs.readFileSync(`${DATOS}/voz_${v.id}.json`, "utf8"));
  bocas[v.id] = JSON.parse(fs.readFileSync(`${DATOS}/voz_${v.id}_rhubarb.json`, "utf8")).mouthCues;
  // tokens → palabras: se pegan los que no empiezan con espacio ("can" + "'t"); se descarta la puntuación sola
  const pal = [];
  for (const t of w.tokens) {
    const txt = t.text;
    if (/^[\s]*[.!?,…]+$/.test(txt)) {
      if (pal.length) pal.at(-1).hasta = Math.max(pal.at(-1).hasta, t.toMs);
      continue;
    }
    if (!txt.startsWith(" ") && pal.length) pal.at(-1).hasta = t.toMs;
    else pal.push({ desde: t.fromMs, hasta: t.toMs });
  }
  const textos = v.lineas.flatMap((l, i) => l.split(" ").map((p) => ({ p, linea: i })));
  if (textos.length !== pal.length) throw new Error(`voz ${v.id}: ${pal.length} palabras de Whisper y ${textos.length} en el guion`);
  plan.voces.push({ id: v.id, archivo: `trabajos/${ID}/audio/voz_${v.id}.wav`, inicio: v.inicio });
  plan.subtitulos.push({
    lineas: v.lineas,
    borra: Math.round(s(v.borra)),
    palabras: textos.map(({ p, linea }, i) => ({
      texto: p,
      linea,
      desde: Math.round(s(v.inicio + pal[i].desde / 1000)),
      hasta: Math.round(s(v.inicio + pal[i].hasta / 1000)),
      grande: p === v.grande,
    })),
  });
}

// ---------- Cuadro por cuadro ----------
const poses = [];
const extra = { giro: [], z: {}, cabeceo: [], yawCabeza: [] };
const caras = [];
const lado = { izq: "mano_izq", der: "mano_der" };
for (const k of Object.values(lado)) extra.z[k] = [];
let pet = { x: 0, v: 0 }; // resorte de los pétalos (sigue al movimiento con retardo)
for (let f = 0; f < N; f++) {
  const giro = evaluar(P.giro, f);
  const tension = (f >= 116 && f < 126) || (f >= 136 && f < 148);
  const tiembla = tension ? TEMBLOR.amp * (Math.floor(f / TEMBLOR.cada) % 2 ? 1 : -1) : 0;
  const respira = 1 + RESPIRAR.sy * Math.sin((2 * Math.PI * f) / (RESPIRAR.periodo * FPS));
  const syC = evaluar(P["cuerpo.sy"], f) * respira;
  const rotC = evaluar(P["cuerpo.rot"], f) + tiembla;
  const huesos = {
    raiz: { x: 0, y: 0, rot: 0 },
    cuerpo: { rot: r3(rotC), sy: r3(syC), sx: r3(1 / Math.sqrt(syC)) }, // conserva el volumen
    cabeza: { y: r3(evaluar(P["cabeza.y"], f)), rot: r3(evaluar(P["cabeza.rot"], f)) },
    pie_izq: { x: 0, y: 0, rot: 0 },
    pie_der: { x: 0, y: r3(evaluar(P["pie_der.y"], f)), rot: 0 },
  };
  for (const [l, id] of Object.entries(lado)) {
    const m = manoEn(l, f);
    huesos[id] = { x: r3(m.x), y: r3(m.y), rot: r3(m.rot) };
    extra.z[id].push(r3(m.z));
  }
  // pétalos: un resorte sigue a la "fuerza" del cuerpo (inclinación + estirón); el atraso es el latigazo
  const objetivo = rotC + (syC - 1) * 60 + evaluar(P["cabeza.rot"], f);
  pet.v = pet.v * PETALOS.freno + (objetivo - pet.x) * PETALOS.rigidez;
  pet.x += pet.v;
  const latigo = (pet.x - objetivo) * PETALOS.ganancia;
  const caida = f >= 88 && f < 116 ? PETALOS.caidaTriste * Math.min(1, (f - 88) / 6) * Math.min(1, (116 - f) / 4) : 0;
  for (const [p, signo] of [["petalo_sup", 0.6], ["petalo_der", 1], ["petalo_inf_der", 1], ["petalo_sup_izq", -1], ["petalo_inf_izq", -1]])
    huesos[p] = { rot: r3(latigo + signo * caida) };
  poses.push({ huesos, dura: 1 });
  extra.giro.push(r3(giro));
  extra.cabeceo.push(r3(evaluar(P["cabeza.cabeceo"], f)));
  extra.yawCabeza.push(r3(evaluar(P.giro, f - 3) - giro)); // la cabeza acompaña el giro con 3 cuadros de retardo
  // cara
  const tramo = CARAS.find((c) => f >= c.desde && f < c.hasta);
  let boca = tramo.boca ?? null;
  if (tramo.habla) {
    const v = VOCES.find((x) => x.id === tramo.habla);
    const t = f / FPS - v.inicio;
    const cue = bocas[v.id].find((c) => t >= c.start && t < c.end);
    boca = cue ? RHUBARB[cue.value] : null;
  }
  caras.push({ ojos: tramo.ojos, boca, espejo: !!tramo.espejo });
}
poses.push(poses.at(-1)); // la secuencia no cíclica llega a la última pose en t = 1

const animacion = {
  personaje: "bloomie",
  expresion: "base",
  x: PIES[0],
  y: PIES[1],
  escala: ESCALA,
  pistas: [{ tipo: "secuencia", inicio: 0, fin: N, duracion: N, veces: 1, secuencia: { nombre: "plantada", ciclo: false, interpolacion: "paso", poses } }],
};
const escena = {
  luz: { angulo: 125, altura: 42, intensidad: 3.2, ambiente: 0.55, color: "#ffd59a" },
  contraluz: { angulo: -35, altura: 20, intensidad: 4.5, color: "#8fd8ff" }, // desde atrás a la derecha
  rotY: extra.giro.map((g) => -g),
  huesosExtra: {
    mano_izq: { z: extra.z.mano_izq },
    mano_der: { z: extra.z.mano_der },
    cabeza: { cabeceo: extra.cabeceo, yaw: extra.yawCabeza }, // yaw del hueso: + = hacia la derecha de la pantalla (como el giro)
  },
};
fs.writeFileSync(`${DATOS}/animacion.json`, JSON.stringify(animacion));
fs.writeFileSync(`${DATOS}/escena_extra.json`, JSON.stringify(escena));
fs.writeFileSync(`${DATOS}/caras_cuadros.json`, JSON.stringify(caras));
fs.writeFileSync(`${DATOS}/plantada.json`, JSON.stringify(plan, null, 1));
console.log(`OK ${N} cuadros: animacion.json, escena_extra.json, caras_cuadros.json, plantada.json`);
for (const sub of plan.subtitulos) console.log("  " + sub.palabras.map((p) => `${p.texto}@${p.desde}`).join(" "));
