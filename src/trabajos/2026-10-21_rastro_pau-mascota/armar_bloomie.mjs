// Arma, desde las anclas de Pau (datos/ancla_<x>.json, de seguir_puntos.py: un punto preciso de la palma y del hombro
// seguido con flujo óptico), las animaciones de Bloomie 2D (rig vectorial, plano, estilo motion graphic como
// bloomie_hola_v2.gif):
//   datos/bloomie_palma.json   PersonajeRigProps: parado en la palma, entra con un pop y saluda (IMG_9053)
//   datos/bloomie_hombro.json  PersonajeRigProps: parado donde empieza el hombro (sobre la costura negra de la remera),
//                              tranquilo, saludando todo el plano (IMG_9054)
// Borrador D (2026-10-21): "se sigue moviendo mucho… busca un punto preciso… que no se mueva de allí". Hasta el C:
// pose de MediaPipe (muñeca, hombro) suavizada; el detector no marca un punto de la piel ni de la tela y Bloomie
// "patinaba". El Bloomie 3D de Blender se descartó (2026-10-21: "se ve muy robótico").
// Desde el borrador E, Bloomie es el video animado del cliente (BloomieSobreVideo): de estos datos se usa solo el lugar
// (x, y, escala, seguimiento); las pistas del rig (saludo, patas) quedan para el Studio y para volver al rig si hiciera falta.
// Uso (raíz del proyecto): node src/trabajos/2026-10-21_rastro_pau-mascota/armar_bloomie.mjs
import fs from "node:fs";

const ID = "2026-10-21_rastro_pau-mascota";
const DATOS = `public/trabajos/${ID}/datos`;

// ---------- Constantes ----------
const PALMA = {
  ancla: "palma", // cuadros 100–159 de IMG_9053
  escala: 0.52, // px por pt: Bloomie ~200 px de alto (la mancha mide ~150×260)
  giro: 0.5, // fracción del giro de la mano que sigue (parado, se mantiene derecho)
  suavizado: 1, // sigma (cuadros): solo el ruido de subpíxel del flujo óptico, sin retraso visible
  // [cuadro, escala relativa] de la entrada: pop con rebote
  pop: [
    [0, 0.05],
    [4, 1.15],
    [7, 0.94],
    [10, 1],
  ],
  saludo: [3, 4], // [inicio, veces]: saluda hasta el final del plano
  patas: 10, // pt que se abre cada pie hacia afuera (más estable sobre la palma)
};
const HOMBRO = {
  ancla: "hombro", // cuadros 0–208 de IMG_9054
  escala: 0.42,
  giro: 0.6,
  suavizado: 1,
  saludo: [36, 160, 4], // [inicio, duración, veces]: saluda tranquilo todo el plano
  patas: 8,
};

// ---------- Utilidades ----------
const leerAncla = (n) =>
  JSON.parse(fs.readFileSync(`${DATOS}/ancla_${n}.json`, "utf8"));
// suavizado gaussiano centrado (sin retraso), con los bordes repetidos
const suavizar = (xs, sigma) => {
  const r = Math.ceil(sigma * 3);
  const pesos = Array.from({ length: 2 * r + 1 }, (_, k) =>
    Math.exp(-((k - r) ** 2) / (2 * sigma * sigma)),
  );
  const total = pesos.reduce((a, b) => a + b, 0);
  return xs.map((_, i) =>
    xs[0].map(
      (_, c) =>
        pesos.reduce(
          (s, p, k) =>
            s + p * xs[Math.min(xs.length - 1, Math.max(0, i + k - r))][c],
          0,
        ) / total,
    ),
  );
};
const tramo = (claves, f) => {
  if (f <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    const [f1, v1] = claves[i];
    const [f0, v0] = claves[i - 1];
    if (f <= f1) {
      const t = (f - f0) / (f1 - f0);
      return v0 + (v1 - v0) * (t * t * (3 - 2 * t));
    }
  }
  return claves.at(-1)[1];
};
const r1 = (v) => +v.toFixed(1);
const r3 = (v) => +v.toFixed(3);
const guardar = (nombre, datos) => {
  fs.writeFileSync(`${DATOS}/${nombre}`, JSON.stringify(datos) + "\n");
  console.log(`OK ${DATOS}/${nombre}`);
};
// ancla → [x, y, giro, escala] por cuadro, con el giro reducido (Bloomie se mantiene derecho)
const seguir = (A) => {
  const a = leerAncla(A.ancla);
  return suavizar(
    a.puntos.map(([x, y], k) => [x, y, a.rot[k] * A.giro, a.escala[k]]),
    A.suavizado,
  );
};
const patasAbiertas = (pt) => ({
  tipo: "pose",
  pose: {
    huesos: { pie_izq: { x: -pt, rot: 6 }, pie_der: { x: pt, rot: -6 } },
  },
});

// ---------- Palma ----------
{
  const P = PALMA;
  const s = seguir(P);
  const n = s.length;
  const pop = s.map(([, , , e], k) => r3(e * tramo(P.pop, k)));
  guardar("bloomie_palma.json", {
    personaje: "bloomie",
    expresion: "feliz",
    x: r1(s[0][0]),
    y: r1(s[0][1]),
    escala: r3(P.escala * pop[0]),
    seguimiento: {
      puntos: s.map(([x, y]) => [r1(x), r1(y)]),
      rot: s.map(([, , g]) => r1(g)),
      escala: pop,
      factor: 1,
      desde: 0,
    },
    pistas: [
      patasAbiertas(P.patas),
      {
        tipo: "saludar",
        inicio: P.saludo[0],
        duracion: n - P.saludo[0],
        mano: "mano_izq",
        veces: P.saludo[1],
      },
    ],
  });
  console.log(`  palma: ${n} cuadros, pies de (${s[0].slice(0, 2).map(r1)}) a (${s.at(-1).slice(0, 2).map(r1)})`);
}

// ---------- Hombro ----------
{
  const H = HOMBRO;
  const s = seguir(H);
  const n = s.length;
  guardar("bloomie_hombro.json", {
    personaje: "bloomie",
    expresion: "feliz",
    x: r1(s[0][0]),
    y: r1(s[0][1]),
    escala: H.escala,
    seguimiento: {
      puntos: s.map(([x, y]) => [r1(x), r1(y)]),
      rot: s.map(([, , g]) => r1(g)),
      escala: s.map(([, , , e]) => r3(e)),
      factor: 1,
      desde: 0,
    },
    pistas: [
      { tipo: "parpadear", semilla: 7 },
      patasAbiertas(H.patas),
      {
        tipo: "saludar",
        inicio: H.saludo[0],
        duracion: H.saludo[1],
        mano: "mano_der",
        veces: H.saludo[2],
        intensidad: 0.8,
      },
    ],
  });
  console.log(`  hombro: ${n} cuadros`);
}
