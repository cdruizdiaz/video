// Arma, desde datos/coreografia.json (fuente de verdad) y las voces (datos/voz_*.json), los archivos del render 3D y
// de los subtítulos:
//   datos/animacion.json      PersonajeRigProps: espera con golpeteo del pie, brazos cruzados, suspiro, hombros caídos,
//                             dos tirones con squash & stretch (los pies NO se mueven), hombros encogidos, rebote final
//   datos/escena_extra.json   luces (constantes, bajan al final), giro rotY (¾ al mirar y al querer irse), huesosExtra
//                             (manos hacia la cámara: delante del cuerpo; cabeceo de la cabeza)
//   datos/subtitulos.json     frases → líneas → palabras con su cuadro de entrada (de los tiempos de Whisper)
// Reglas de superposición (guion): manos siempre delante del cuerpo y nunca delante de los ojos (con los brazos
// cruzados una 6 pt más adelante que la otra), pies quietos, giros de ¾ como máximo (rotY ±0,35).
// Uso: node src/trabajos/2026-10-06_claudio_bloomie-plantado/armar_escena.mjs
import fs from "node:fs";
import path from "node:path";

const ID = "2026-10-06_claudio_bloomie-plantado";
const DATOS = `public/trabajos/${ID}/datos`;
const FPS = 30;
const c = JSON.parse(fs.readFileSync(`${DATOS}/coreografia.json`, "utf8"));
const N = c.duracion;

// ---------- Valores de la actuación ----------
const MIRAR = 0.2; // rotY al mirar a los costados
const IRSE = -0.35; // rotY al querer irse (hacia la derecha de la pantalla)
const CRUZADOS = { adentro: 62, alto: -8, rot: 25, z: [46, 40] }; // pt · grados · pt (izq, der)
const HOMBROS = { rot: 85, z: 22, sube: 1.04 };
const CABECEO = { triste: 8, pies: 12 }; // grados
const GOLPE = { pie: -6, dura: 3 }; // pt · cuadros

// ---------- Curvas ----------
const suave = (t) => t * t * (3 - 2 * t);
// claves [[cuadro, valor], …] → valor por cuadro, interpolación suave entre claves
const porClaves = (claves) =>
  Array.from({ length: N }, (_, k) => {
    if (k <= claves[0][0]) return claves[0][1];
    for (let i = 1; i < claves.length; i++) {
      const [f0, v0] = claves[i - 1];
      const [f1, v1] = claves[i];
      if (k <= f1) return +(v0 + (v1 - v0) * suave((k - f0) / Math.max(1, f1 - f0))).toFixed(4);
    }
    return claves.at(-1)[1];
  });

// ---------- Poses clave (pt del .ai y grados) ----------
const NEUTRA = { cuerpo: { rot: 0, sy: 1, sx: 1 }, cabeza: { rot: 0, y: 0 }, "petalo_*": { rot: 0 }, mano_izq: { rot: 0, x: 0, y: 0 }, mano_der: { rot: 0, x: 0, y: 0 } };
const con = (...cambios) => {
  const p = JSON.parse(JSON.stringify(NEUTRA));
  for (const ch of cambios) for (const [h, m] of Object.entries(ch)) p[h] = { ...p[h], ...m };
  return p;
};
const cruzados = { mano_izq: { x: CRUZADOS.adentro, y: CRUZADOS.alto, rot: CRUZADOS.rot }, mano_der: { x: -CRUZADOS.adentro, y: CRUZADOS.alto, rot: -CRUZADOS.rot } };
const hombros = { mano_izq: { rot: HOMBROS.rot }, mano_der: { rot: -HOMBROS.rot }, cuerpo: { sy: HOMBROS.sube }, cabeza: { y: -3 } };
const [t1, t2] = c.tirones;
const tira = (t) => ({ cuerpo: { rot: t.inclina, sy: t.estira, sx: 2 - t.estira * 0.95 }, cabeza: { y: -8 }, "petalo_*": { rot: -10 }, mano_der: { rot: -45 } });
const suelta = (t) => ({ cuerpo: { rot: -t.inclina / 4, sy: 2 - t.estira * 0.94, sx: t.estira * 0.92 }, "petalo_*": { rot: 12 } });
const claves = [
  [0, con()],
  [24, con()],
  [33, con(cruzados)],
  [70, con(cruzados)],
  [73, con(cruzados, { cuerpo: { sy: 0.97 } })], // suspiro
  [78, con(cruzados)],
  [84, con(cruzados)],
  [92, con({ cuerpo: { sy: 0.96 }, cabeza: { y: 6 }, "petalo_*": { rot: 8 } })], // hombros caídos
  [120, con({ cuerpo: { sy: 0.96 }, cabeza: { y: 6 }, "petalo_*": { rot: 8 } })],
  [t1.desde, con({ cabeza: { y: -3 } })], // levanta el mentón
  [t1.tira, con(tira(t1))],
  [t1.suelta, con(suelta(t1))],
  [t1.quieto, con()],
  [t2.desde, con()],
  [t2.tira, con(tira(t2))],
  [t2.suelta, con(suelta(t2))],
  [t2.suelta + 3, con({ cuerpo: { sy: 1.03 } })],
  [t2.quieto, con()],
  [159, con()],
  [166, con(hombros)],
  [218, con(hombros)],
  [221, con(hombros, { cuerpo: { sy: 0.94, sx: 1.04 } })], // mini rebote (sin despegar los pies)
  [225, con(hombros, { cuerpo: { sy: 1.04, sx: 0.98 } })],
  [229, con(hombros)],
  [238, con()],
  [N - 1, con()],
];
const actuacion = {
  nombre: "plantado",
  ciclo: false,
  interpolacion: "suave",
  poses: claves.map(([f, huesos], i) => ({ huesos, ...(i < claves.length - 1 ? { dura: claves[i + 1][0] - f } : {}) })),
};
// golpeteo del pie derecho (sube y vuelve a su lugar: no se desplaza)
const golpeteo = {
  nombre: "golpeteo",
  ciclo: false,
  interpolacion: "suave",
  poses: [{ huesos: { pie_der: { y: 0 } }, dura: GOLPE.dura }, { huesos: { pie_der: { y: GOLPE.pie } }, dura: GOLPE.dura }, { huesos: { pie_der: { y: 0 } } }],
};
const pistas = [
  { tipo: "respirar", intensidad: 0.7 },
  { tipo: "secuencia", inicio: 0, fin: N, secuencia: actuacion, duracion: N - 1, veces: 1 },
  ...c.golpeteo.map((f) => ({ tipo: "secuencia", inicio: f, fin: f + 2 * GOLPE.dura, secuencia: golpeteo, duracion: 2 * GOLPE.dura, veces: 1 })),
];
const animacion = { personaje: "bloomie", expresion: "base", x: c.pies[0], y: c.pies[1], escala: c.escala, pistas };
fs.writeFileSync(`${DATOS}/animacion.json`, JSON.stringify(animacion, null, 1));

// ---------- Escena 3D ----------
const baja = (k) => 1 - (1 - c.final.factor) * suave(Math.min(1, Math.max(0, (k - c.final.baja[0]) / (c.final.baja[1] - c.final.baja[0]))));
const rotY = porClaves([[0, 0], [6, MIRAR], [11, MIRAR], [18, -MIRAR], [24, -MIRAR], [30, 0], [70, 0], [76, -0.1], [84, 0], [t1.desde, 0], [t1.desde + 6, IRSE], [t2.quieto, IRSE], [159, IRSE * 0.6], [168, 0], [N - 1, 0]]);
const enCruzados = porClaves([[24, 0], [33, 1], [84, 1], [92, 0]]);
const enHombros = porClaves([[159, 0], [166, 1], [229, 1], [238, 0]]);
const extra = {
  luz: { angulo: c.luz.angulo, altura: c.luz.altura, suavidad: c.luz.suavidad, color: c.luz.color, colorAmbiente: c.luz.colorAmbiente, intensidad: Array.from({ length: N }, (_, k) => +(c.luz.intensidad * baja(k)).toFixed(4)), ambiente: Array.from({ length: N }, (_, k) => +(c.luz.ambiente * baja(k)).toFixed(4)) },
  recorte: { ...c.recorte, intensidad: Array.from({ length: N }, (_, k) => +(c.recorte.intensidad * baja(k)).toFixed(4)) },
  luzSigueGiro: true,
  rotY,
  huesosExtra: {
    cabeza: { rx: porClaves([[84, 0], [92, CABECEO.triste], [120, CABECEO.triste], [t1.desde, 0], [t2.quieto - 2, 0], [t2.quieto + 1, CABECEO.pies], [157, CABECEO.pies], [163, 0]]) },
    mano_izq: { z: enCruzados.map((v, k) => +(v * CRUZADOS.z[0] + enHombros[k] * HOMBROS.z).toFixed(3)) },
    mano_der: { z: enCruzados.map((v, k) => +(v * CRUZADOS.z[1] + enHombros[k] * HOMBROS.z).toFixed(3)) },
  },
};
fs.writeFileSync(`${DATOS}/escena_extra.json`, JSON.stringify(extra));

// ---------- Subtítulos (palabra por palabra, de los tiempos de Whisper) ----------
const frases = c.voces.map((v, i) => {
  const j = JSON.parse(fs.readFileSync(`${DATOS}/${path.basename(v.archivo, ".wav")}.json`, "utf8"));
  // une los pedazos de Whisper ("can" + "'t", "I" + "'m") y pega la puntuación a la palabra anterior
  const palabras = [];
  for (const t of j.tokens) {
    const txt = t.text.trim();
    if (!txt) continue;
    if (/^[.!?…,]+$/.test(txt) || txt.startsWith("'")) {
      if (palabras.length) palabras.at(-1).texto += txt === "..." ? "…" : txt;
      continue;
    }
    palabras.push({ texto: txt, cuadro: v.cuadro + Math.round((t.fromMs / 1000) * FPS) });
  }
  if (v.minuscula) palabras[0].texto = palabras[0].texto[0].toLowerCase() + palabras[0].texto.slice(1);
  for (const p of palabras) p.destacar = (v.destacar ?? []).some((d) => p.texto.toLowerCase().startsWith(d));
  return { desde: palabras[0].cuadro, hasta: c.subtitulosHasta[i], lineas: v.lineas.map(([a, b]) => palabras.slice(a, b + 1)) };
});
fs.writeFileSync(`${DATOS}/subtitulos.json`, JSON.stringify(frases, null, 1));
console.log(`OK animacion.json (${pistas.length} pistas, ${claves.length} poses clave) · escena_extra.json · subtitulos.json:`);
for (const f of frases) console.log(`   ${f.desde}–${f.hasta}: ${f.lineas.map((l) => l.map((p) => `${p.texto}@${p.cuadro}`).join(" ")).join(" / ")}`);
