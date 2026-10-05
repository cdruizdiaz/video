// Arma, desde datos/coreografia.json (fuente de verdad de los tiempos), los archivos que usa el render 3D:
//   datos/animacion.json      PersonajeRigProps: secuencias de baile, cuernos, salto (mismo motor que el 2D)
//   datos/escena_extra.json   tarjetas del kit (guitarra, pañuelo, mano de cuernos) y giro rotY por cuadro
// Uso: node src/trabajos/2026-10-04_claudio_bloomie-rock/armar_escena.mjs
import fs from "node:fs";
import path from "node:path";

const ID = "2026-10-04_claudio_bloomie-rock";
const DATOS = `public/trabajos/${ID}/datos`;
const IMG = path.resolve(`public/trabajos/${ID}/img`);
const c = JSON.parse(fs.readFileSync(`${DATOS}/coreografia.json`, "utf8"));
const P = c.pulso; // cuadros por pulso (120 bpm a 30 fps = 15)

// ---------- Secuencias de baile (poses clave; se suman a las demás pistas) ----------
// Onda: cabeceo en cada pulso, rebote en el contratiempo, rasgueo con la mano izquierda (la del cuerpo de la guitarra)
const onda = {
  nombre: "onda-rock",
  ciclo: true,
  interpolacion: "suave",
  poses: [
    { nota: "pulso", huesos: { cabeza: { rot: 6, y: 4 }, cuerpo: { rot: -3, sy: 0.96, sx: 1.02 }, "petalo_*": { rot: 6 }, mano_izq: { rot: -15 } } },
    { nota: "contratiempo", huesos: { cabeza: { rot: -3, y: -3 }, cuerpo: { sy: 1.03 }, raiz: { y: -8 }, "petalo_*": { rot: -6 }, mano_izq: { rot: 20 }, pie_der: { y: -7 } } },
    { nota: "pulso", huesos: { cabeza: { rot: -6, y: 4 }, cuerpo: { rot: 3, sy: 0.96, sx: 1.02 }, "petalo_*": { rot: 6 }, mano_izq: { rot: -15 } } },
    { nota: "contratiempo", huesos: { cabeza: { rot: 3, y: -3 }, cuerpo: { sy: 1.03 }, raiz: { y: -8 }, "petalo_*": { rot: -6 }, mano_izq: { rot: 20 }, pie_izq: { y: -7 } } },
  ],
};
// Headbang: la cabeza baja fuerte en cada pulso (se aplasta) y los pétalos latiguean
const headbang = {
  nombre: "headbang",
  ciclo: true,
  interpolacion: "suave",
  poses: [
    { nota: "abajo", huesos: { cabeza: { rot: 9, y: 14, sy: 0.92 }, cuerpo: { rot: -5, sy: 0.93, sx: 1.04 }, "petalo_*": { rot: 16 }, mano_izq: { rot: -28 }, raiz: { y: 0 } } },
    { nota: "arriba", huesos: { cabeza: { rot: -4, y: -10, sy: 1.05 }, cuerpo: { sy: 1.05 }, "petalo_*": { rot: -14 }, mano_izq: { rot: 28 }, raiz: { y: -14 }, pie_der: { y: -10 } } },
    { nota: "abajo", huesos: { cabeza: { rot: -9, y: 14, sy: 0.92 }, cuerpo: { rot: 5, sy: 0.93, sx: 1.04 }, "petalo_*": { rot: 16 }, mano_izq: { rot: -28 }, raiz: { y: 0 } } },
    { nota: "arriba", huesos: { cabeza: { rot: 4, y: -10, sy: 1.05 }, cuerpo: { sy: 1.05 }, "petalo_*": { rot: -14 }, mano_izq: { rot: 28 }, raiz: { y: -14 }, pie_izq: { y: -10 } } },
  ],
};
// Cuernos: el brazo izquierdo sube (manoCuernos.angulo, hacia afuera y arriba) y se queda arriba
const cuernos = (dura) => ({
  nombre: "cuernos",
  ciclo: false,
  interpolacion: "lineal",
  poses: [
    { huesos: { mano_izq: { rot: 0 } }, dura: 5 },
    { huesos: { mano_izq: { rot: c.manoCuernos.angulo } }, dura: Math.max(1, dura - 10) },
    { huesos: { mano_izq: { rot: c.manoCuernos.angulo } }, dura: 5 },
    { huesos: { mano_izq: { rot: c.cuernos.at(-1)[1] >= c.duracion ? c.manoCuernos.angulo : 0 } } },
  ],
});

const pistas = [
  { tipo: "pose", pose: { huesos: { mano_der: { rot: -22 } } } }, // la mano derecha sostiene el mástil
];
for (const t of c.baile) {
  const sec = t.estilo === "headbang" ? headbang : onda;
  pistas.push({ tipo: "secuencia", inicio: t.desde, fin: t.hasta, secuencia: sec, duracion: 4 * P });
}
for (const [a, b] of c.cuernos) pistas.push({ tipo: "secuencia", inicio: a, fin: b, secuencia: cuernos(b - a), duracion: b - a, veces: 1 });
for (const s of c.saltos) pistas.push({ tipo: "saltar", inicio: s.desde, duracion: s.duracion, altura: s.altura });

const animacion = { personaje: "bloomie", expresion: "base", x: c.pies[0], y: c.pies[1], escala: c.escala, pistas };
fs.writeFileSync(`${DATOS}/animacion.json`, JSON.stringify(animacion, null, 1));

// ---------- Escena 3D: tarjetas del kit y giro ----------
const g = c.guitarra;
const extra = {
  luz: c.luz,
  rotY: Array.from({ length: c.duracion }, (_, k) => +(c.giro.amplitud * Math.sin((2 * Math.PI * k) / (4 * P))).toFixed(4)), // un vaivén por compás
  tarjetas: [
    { imagen: `${IMG}/guitarra_frente.png`, hueso: "cuerpo", centro: g.centro, z: g.z, ancho: g.ancho, rot: g.rot, visible: null },
    { imagen: `${IMG}/panuelo_rock.png`, hueso: "cuerpo", centro: c.panuelo.centro, z: c.panuelo.z, ancho: c.panuelo.ancho, rot: 0, visible: null, sombra: false },
    {
      imagen: `${IMG}/mano_cuernos_izq.png`,
      hueso: "mano_izq",
      centro: c.manoCuernos.centro,
      z: c.manoCuernos.z,
      ancho: c.manoCuernos.ancho,
      rot: -c.manoCuernos.angulo, // con el brazo arriba los dedos quedan para arriba
      visible: c.cuernos.map(([a, b]) => [a + 4, b]),
      ocultar: "mano_izq",
    },
  ],
};
fs.writeFileSync(`${DATOS}/escena_extra.json`, JSON.stringify(extra));
console.log(`OK ${DATOS}/animacion.json (${pistas.length} pistas) y escena_extra.json (${extra.tarjetas.length} tarjetas)`);
