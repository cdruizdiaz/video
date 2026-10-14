// Arma, desde datos/coreografia.json (fuente de verdad de los tiempos), los archivos que usa el render 3D:
//   datos/animacion.json      PersonajeRigProps: dormir → estirarse → mirarse las manos → salto → saludo (motor del 2D)
//   datos/escena_extra.json   luces por cuadro (reflector que se enciende, contraluz), giro rotY (la "órbita" de la
//                             cámara: las luces giran con el personaje) y lo que el rig 2D no tiene: manos hacia la
//                             cámara y cabeceo (huesosExtra → scripts/blender/render.py)
// Reglas de superposición (guion): las manos van SIEMPRE delante del cuerpo (z hacia la cámara cuando se acercan al
// pecho o suben al costado de la cabeza) y nunca por delante de los ojos (al mirarse las manos quedan bajo la cara).
// Uso: node src/trabajos/2026-10-06_claudio_bloomie-toma-vida/armar_escena.mjs
import fs from "node:fs";

const ID = "2026-10-06_claudio_bloomie-toma-vida";
const DATOS = `public/trabajos/${ID}/datos`;
const c = JSON.parse(fs.readFileSync(`${DATOS}/coreografia.json`, "utf8"));
const N = c.duracion;

// ---------- Curvas ----------
const suave = (t) => t * t * (3 - 2 * t);
const tramo = (k, [a, b]) => suave(Math.min(1, Math.max(0, (k - a) / (b - a))));
// sube en [a,b], se queda, baja en [c,d] → 0…1
const campana = (k, sube, baja) => tramo(k, sube) * (1 - tramo(k, baja));
const porCuadro = (fn) => Array.from({ length: N }, (_, k) => +fn(k).toFixed(4));

// ---------- Poses clave (pt del .ai y grados; se suman a respirar/saltar/saludar) ----------
const NEUTRO = { cabeza: { rot: 0 }, cuerpo: { sy: 1 }, mano_izq: { rot: 0 }, mano_der: { rot: 0 }, "petalo_*": { rot: 0 } };
const DORMIDO = {
  cabeza: { rot: -9, y: 7 },
  cuerpo: { rot: 3, sy: 0.96, sx: 1.02 },
  "petalo_*": { rot: 7 },
  mano_izq: { rot: -8 },
  mano_der: { rot: 8 },
};
// Estirarse: los dos brazos arriba (al costado de la cabeza, por fuera de su contorno) y el cuerpo estirado
const ESTIRADO = {
  cabeza: { rot: 0, y: -6 },
  cuerpo: { sy: 1.07, sx: 0.97 },
  "petalo_*": { rot: -6 },
  mano_izq: { rot: 140 },
  mano_der: { rot: -140 },
};
// Mirarse las manos: las dos manos al centro, a la altura del pecho (bajo la cara), un poco giradas hacia adentro
const m = c.mirarManos;
const MANOS = {
  cabeza: { y: 4 },
  mano_izq: { x: m.adentro, y: m.alto, rot: 25 },
  mano_der: { x: -m.adentro, y: m.alto, rot: -25 },
};

const e = c.estirar;
const despertar = {
  nombre: "despertar",
  ciclo: false,
  interpolacion: "suave",
  poses: [
    { huesos: DORMIDO, dura: e.sube[0] },
    { huesos: DORMIDO, dura: e.sube[1] - e.sube[0] },
    { huesos: ESTIRADO, dura: e.arriba[1] - e.arriba[0] },
    { huesos: ESTIRADO, dura: e.baja[1] - e.baja[0] },
    { huesos: NEUTRO },
  ],
};
const mirar = {
  nombre: "mirar-manos",
  ciclo: false,
  interpolacion: "suave",
  poses: [
    { huesos: NEUTRO, dura: m.sube[1] - m.sube[0] },
    { huesos: MANOS, dura: m.mira[1] - m.mira[0] },
    { huesos: MANOS, dura: m.baja[1] - m.baja[0] },
    { huesos: NEUTRO },
  ],
};

const s = c.saludo;
const pistas = [
  { tipo: "respirar", intensidad: 1 },
  { tipo: "secuencia", inicio: 0, fin: e.baja[1], secuencia: despertar, duracion: e.baja[1], veces: 1 },
  { tipo: "secuencia", inicio: m.sube[0], fin: m.baja[1], secuencia: mirar, duracion: m.baja[1] - m.sube[0], veces: 1 },
  { tipo: "saltar", inicio: c.salto.inicio, duracion: c.salto.duracion, altura: c.salto.altura },
  { tipo: "saludar", inicio: s.inicio, duracion: s.duracion, mano: "mano_der", veces: s.veces },
];
const animacion = { personaje: "bloomie", expresion: "base", x: c.pies[0], y: c.pies[1], escala: c.escala, pistas };
fs.writeFileSync(`${DATOS}/animacion.json`, JSON.stringify(animacion, null, 1));

// ---------- Escena 3D ----------
const enc = c.encendido;
const brillo = (k) => {
  // reflector: apagado → parpadeo corto → encendido; baja al final
  if (k < enc.cuadro) return 0;
  const p = enc.parpadeo[k - enc.cuadro];
  const fin = 1 - (1 - c.final.factor) * tramo(k, c.final.baja);
  return (p ?? 1) * fin;
};
const g = c.giro;
const mirando = (k) => campana(k, m.sube, m.baja);
const saludando = (k) => campana(k, [s.inicio, s.inicio + 8], [s.inicio + s.duracion - 8, s.inicio + s.duracion]);
const estirando = (k) => campana(k, e.sube, e.baja);
const extra = {
  luz: {
    angulo: c.luz.angulo,
    altura: c.luz.altura,
    suavidad: c.luz.suavidad,
    color: c.luz.color,
    colorAmbiente: c.luz.colorAmbiente,
    intensidad: porCuadro((k) => c.luz.intensidad * brillo(k)),
    ambiente: porCuadro((k) => c.luz.apagado + (c.luz.ambiente - c.luz.apagado) * brillo(k)),
  },
  recorte: {
    angulo: c.recorte.angulo,
    altura: c.recorte.altura,
    color: c.recorte.color,
    intensidad: porCuadro((k) => c.recorte.intensidad * (0.25 + 0.75 * tramo(k, c.recorte.entra)) * brillo(k)),
  },
  luzSigueGiro: true,
  rotY: porCuadro((k) => g.inicio + (g.fin - g.inicio) * tramo(k, g.tramo)),
  huesosExtra: {
    // mirarse las manos: la cabeza cabecea hacia ellas; las manos vienen hacia la cámara (delante del pecho)
    cabeza: { rx: porCuadro((k) => m.cabeceo * mirando(k)) },
    mano_izq: { z: porCuadro((k) => m.adelante * mirando(k) + 10 * estirando(k)) },
    mano_der: { z: porCuadro((k) => m.adelante * mirando(k) + 10 * estirando(k) + s.adelante * saludando(k)) },
  },
};
fs.writeFileSync(`${DATOS}/escena_extra.json`, JSON.stringify(extra));
console.log(`OK ${DATOS}/animacion.json (${pistas.length} pistas) y escena_extra.json (luces, giro y huesosExtra por cuadro)`);
