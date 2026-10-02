// Biblioteca de animaciones reutilizables para personajes con rig. Cada una recibe el frame relativo al inicio
// de su pista y sus parámetros, y devuelve una pose parcial que se suma a las demás (ver pose.ts → combinar).
// Sirven para cualquier personaje: buscan los huesos por nombre (cuerpo, cabeza, mano_*, pie_*, petalo_*/pelo_*…)
// y usan solo los que el personaje tenga. Ángulos en grados (+ = horario en pantalla), distancias en puntos del .ai.
import { random } from "remotion";
import { arco, tramo } from "../plantillas/PersonajeAnimado/util";
import type { PoseParcial } from "./pose";
import type { Mov, VistaRig } from "./tipos";

// ---------- Valores por defecto ----------
const RESPIRAR = { periodo: 3.2, cuerpo: 0.022, cabeza: 1.2, corona: 2.2, manos: 2.5 }; // s · escala · pt · grados
const PARPADEAR = { cada: 3.4, variacion: 0.45, duracion: 6, dobleProbabilidad: 0.18 }; // s · fracción · frames
const SALUDAR = { veces: 3, alzar: 110, onda: 22, entrada: 8 }; // grados · frames
const SALTAR = { duracion: 26, altura: 70, agacha: 0.16, estira: 0.12 }; // frames · pt · escalas
const CAMINAR = { periodo: 1.0, paso: 9, balanceo: 3, brazos: 14, rebote: 3 }; // s · pt · grados · grados · pt
const CORRER = { periodo: 0.5, paso: 16, inclina: 9, brazos: 38, rebote: 9 }; // s · pt · grados · grados · pt
const GIRAR = { duracion: 8 }; // frames
const TEMBLOR = { mover: 3.5, rotar: 2.5, cada: 1 }; // pt · grados · frames entre sacudidas
const EXPRESION = { rebote: 6, aplasta: 0.06 }; // frames · escala
const DELANTE = 1e5; // orden de capa "delante de todo"

export type Contexto = { rv: VistaRig; fps: number };

// ---------- Huesos por nombre ----------
const ids = (ctx: Contexto) => ctx.rv.huesos.map((h) => h.id);
const hay = (ctx: Contexto, id: string) => ids(ctx).includes(id);
const corona = (ctx: Contexto) =>
  ctx.rv.huesos.filter((h) => h.padre === "cabeza" && !["ojos", "boca"].includes(h.id)).map((h) => h.id);
const lado = (id: string) => (id.includes("izq") ? -1 : id.includes("der") ? 1 : 0);
const manos = (ctx: Contexto) => ids(ctx).filter((h) => /^(mano|brazo|antebrazo)(_|$)/.test(h));
const pies = (ctx: Contexto) => ids(ctx).filter((h) => /^(pie|pierna)(_|$)/.test(h));
// Pivote de un hueso (para saber hacia dónde queda respecto del cuerpo)
const pivote = (ctx: Contexto, id: string) => ctx.rv.huesos.find((h) => h.id === id)?.pivote ?? [0, 0];

const huesos = (...pares: [string, Mov][]) => Object.fromEntries(pares.filter(([k]) => k));

// =====================================================================================================

// Respiración / reposo: el cuerpo se estira y afloja, la cabeza acompaña, pétalos y manos se mecen
export const respirar = (f: number, ctx: Contexto, o: { velocidad?: number; intensidad?: number } = {}): PoseParcial => {
  const v = o.velocidad ?? 1;
  const i = o.intensidad ?? 1;
  const t = (f / ctx.fps) * v * ((2 * Math.PI) / RESPIRAR.periodo);
  const s = Math.sin(t);
  const h: Record<string, Mov> = {
    cuerpo: { sy: 1 + RESPIRAR.cuerpo * i * s, sx: 1 - RESPIRAR.cuerpo * 0.4 * i * s },
    cabeza: { y: -RESPIRAR.cabeza * i * (s + 1) * 0.5, rot: 0.8 * i * Math.sin(t * 0.5) },
  };
  corona(ctx).forEach((c, k) => (h[c] = { rot: RESPIRAR.corona * i * Math.sin(t - 0.6 - k * 0.5) }));
  manos(ctx).forEach((m) => (h[m] = { rot: RESPIRAR.manos * i * Math.sin(t - 0.9) * (lado(m) || 1) }));
  return { huesos: h };
};

// Parpadeo automático: a intervalos irregulares pero estables (dependen solo de la semilla), a veces doble
export const parpadear = (f: number, ctx: Contexto, o: { cada?: number; semilla?: number } = {}): PoseParcial => {
  const cada = (o.cada ?? PARPADEAR.cada) * ctx.fps;
  const semilla = o.semilla ?? 1;
  let t = cada * 0.4 * random(`parpado-${semilla}-ini`);
  let k = 0;
  let valor = 0;
  while (t <= f && k < 10000) {
    const d = PARPADEAR.duracion;
    valor = Math.max(valor, tramo(f, [t, t + d / 3, t + d / 2, t + d], [0, 1, 1, 0]));
    if (random(`parpado-${semilla}-doble-${k}`) < PARPADEAR.dobleProbabilidad) {
      const t2 = t + d + 3;
      valor = Math.max(valor, tramo(f, [t2, t2 + d / 3, t2 + d / 2, t2 + d], [0, 1, 1, 0]));
    }
    t += cada * (1 + PARPADEAR.variacion * (2 * random(`parpado-${semilla}-${k}`) - 1));
    k++;
  }
  return { parpado: valor };
};

// Cambio de expresión con un pequeño rebote de la cabeza
export const expresion = (f: number, _ctx: Contexto, o: { nombre: string }): PoseParcial => {
  const r = tramo(f, [0, EXPRESION.rebote / 2, EXPRESION.rebote], [0, 1, 0]);
  return { expresion: o.nombre, huesos: { cabeza: { sy: 1 - EXPRESION.aplasta * r, sx: 1 + EXPRESION.aplasta * 0.6 * r } } };
};

// Saludar con una mano: la levanta, la agita `veces` y la baja
export const saludar = (
  f: number,
  ctx: Contexto,
  o: { duracion: number; mano?: string; veces?: number; intensidad?: number },
): PoseParcial => {
  const mano = o.mano && hay(ctx, o.mano) ? o.mano : (["mano_der", "mano", "mano_izq"].find((m) => hay(ctx, m)) ?? "");
  if (!mano) return {};
  const i = o.intensidad ?? 1;
  const d = o.duracion;
  const e = Math.min(SALUDAR.entrada, d / 4);
  const arriba = tramo(f, [0, e, d - e, d], [0, 1, 1, 0]);
  const veces = o.veces ?? SALUDAR.veces;
  const onda = Math.sin(((f - e) / Math.max(1, d - 2 * e)) * veces * 2 * Math.PI) * arriba;
  // Hacia afuera del cuerpo: la mano de la derecha gira antihorario para subir
  const s = lado(mano) === -1 ? 1 : -1;
  const brazo = hay(ctx, mano.replace("mano", "brazo")) ? mano.replace("mano", "brazo") : mano;
  return {
    // Mientras saluda, la mano pasa delante de todo (en el dibujo puede estar detrás del cuerpo o de los pétalos)
    orden: arriba > 0.15 ? { [mano]: DELANTE, [brazo]: DELANTE - 1 } : {},
    huesos: huesos(
      [brazo, { rot: s * SALUDAR.alzar * i * arriba + s * SALUDAR.onda * i * onda }],
      ["cuerpo", { rot: -s * 3 * i * arriba }],
      ["cabeza", { rot: -s * 5 * i * arriba + 2 * onda }],
    ),
  };
};

// Saltar: se agacha (anticipación), sube estirado, cae y se aplasta al tocar el piso
export const saltar = (f: number, ctx: Contexto, o: { duracion?: number; altura?: number; intensidad?: number } = {}): PoseParcial => {
  const d = o.duracion ?? SALTAR.duracion;
  const H = (o.altura ?? SALTAR.altura) * (o.intensidad ?? 1);
  const a = d * 0.25; // fin de la anticipación
  const b = d * 0.8; // aterrizaje
  const agacha = tramo(f, [0, a * 0.8, a], [0, 1, 0]) + tramo(f, [b, b + (d - b) * 0.4, d], [0, 0.8, 0]);
  const vuelo = arco(f, a, b);
  const enAire = f > a && f < b;
  const estira = enAire ? SALTAR.estira * (1 - Math.abs(2 * (f - a) / (b - a) - 1)) : 0;
  const h: Record<string, Mov> = {
    raiz: { y: -H * vuelo },
    cuerpo: { sy: 1 - SALTAR.agacha * agacha + estira, sx: 1 + SALTAR.agacha * 0.6 * agacha - estira * 0.5 },
    cabeza: { y: 4 * agacha },
  };
  manos(ctx).forEach((m) => (h[m] = { rot: (lado(m) === -1 ? 1 : -1) * (60 * vuelo - 10 * agacha) }));
  pies(ctx).forEach((p) => (h[p] = { rot: (lado(p) || 1) * 10 * vuelo, y: -4 * vuelo }));
  corona(ctx).forEach((c, k) => (h[c] = { rot: (k % 2 ? 1 : -1) * 6 * (estira / SALTAR.estira || 0) + 8 * agacha * (k % 2 ? -1 : 1) }));
  return { huesos: h };
};

// Ciclo de caminar o correr (en el lugar; el desplazamiento lo da la pista de trayecto)
const ciclo = (
  f: number,
  ctx: Contexto,
  cfg: typeof CAMINAR | typeof CORRER,
  o: { velocidad?: number; intensidad?: number },
  correr: boolean,
): PoseParcial => {
  const v = o.velocidad ?? 1;
  const i = o.intensidad ?? 1;
  const fase = ((f / ctx.fps) * v) / cfg.periodo; // ciclos
  const ang = fase * 2 * Math.PI;
  const perfil = hay(ctx, "pie") || hay(ctx, "pie_atras");
  const h: Record<string, Mov> = {};
  const rebote = Math.abs(Math.sin(ang)); // dos rebotes por ciclo (uno por paso)
  const inclina = "inclina" in cfg ? cfg.inclina : 0;
  h.raiz = { y: -cfg.rebote * i * rebote };
  h.cuerpo = { rot: (perfil ? inclina : 0) * i + (perfil ? 0 : CAMINAR.balanceo * i * Math.sin(ang)), sy: 1 - 0.03 * i * (1 - rebote) };
  h.cabeza = { rot: perfil ? -inclina * 0.4 * i + 2 * Math.sin(ang * 2) : -CAMINAR.balanceo * 0.6 * i * Math.sin(ang) };
  // Pies: alternan; el que va por el aire sube y avanza
  pies(ctx).forEach((p) => {
    const desfase = p.includes("atras") || p.includes("izq") ? Math.PI : 0;
    const s = Math.sin(ang + desfase);
    const alto = Math.max(0, s);
    if (perfil) {
      h[p] = { x: cfg.paso * i * Math.cos(ang + desfase), y: -cfg.paso * 0.7 * i * alto, rot: (correr ? -25 : -10) * i * Math.sin(ang + desfase + 0.6) };
    } else {
      h[p] = { y: -cfg.paso * 0.6 * i * alto, rot: lado(p) * 6 * i * alto };
    }
  });
  manos(ctx).forEach((m) => {
    const desfase = m.includes("atras") || m.includes("der") ? Math.PI : 0;
    const s = Math.sin(ang + desfase);
    h[m] = { rot: (perfil ? -1 : lado(m) || 1) * cfg.brazos * i * s };
  });
  corona(ctx).forEach((c, k) => {
    h[c] = { rot: (correr ? -6 : -2) * i * (pivote(ctx, c)[0] > 0 ? 1 : -1) + 3 * i * Math.sin(ang * 2 - k * 0.6) };
  });
  return { huesos: h };
};

export const caminar = (f: number, ctx: Contexto, o: { velocidad?: number; intensidad?: number } = {}) =>
  ciclo(f, ctx, CAMINAR, o, false);
export const correr = (f: number, ctx: Contexto, o: { velocidad?: number; intensidad?: number } = {}) =>
  ciclo(f, ctx, CORRER, o, true);

// Girar de vista: se aplasta de costado, cambia de vista en el medio y se vuelve a abrir
export const girar = (
  f: number,
  _ctx: Contexto,
  o: { desde: string; hacia: string; duracion?: number; espejoDesde?: boolean; espejoHacia?: boolean },
): PoseParcial => {
  const d = o.duracion ?? GIRAR.duracion;
  const t = Math.min(1, Math.max(0, f / d));
  const ancho = Math.max(0.08, Math.abs(Math.cos(t * Math.PI)));
  const pasado = t >= 0.5;
  return {
    vista: pasado ? o.hacia : o.desde,
    espejo: pasado ? o.espejoHacia ?? false : o.espejoDesde ?? false,
    giro: ancho,
    huesos: { raiz: { y: -6 * Math.sin(t * Math.PI) } },
  };
};

// Temblor por velocidad o nervios: sacudidas pseudoaleatorias estables
export const temblor = (f: number, ctx: Contexto, o: { intensidad?: number; cada?: number; semilla?: number } = {}): PoseParcial => {
  const i = o.intensidad ?? 1;
  const n = Math.floor(f / Math.max(1, o.cada ?? TEMBLOR.cada));
  const s = o.semilla ?? 7;
  const r = (k: string) => 2 * random(`temblor-${s}-${k}-${n}`) - 1;
  const h: Record<string, Mov> = {
    raiz: { x: TEMBLOR.mover * i * r("x"), y: TEMBLOR.mover * i * r("y"), rot: TEMBLOR.rotar * i * r("r") },
    cabeza: { rot: TEMBLOR.rotar * 1.4 * i * r("c") },
  };
  corona(ctx).forEach((c) => (h[c] = { rot: TEMBLOR.rotar * 2 * i * r(c) }));
  manos(ctx).forEach((m) => (h[m] = { rot: TEMBLOR.rotar * 2 * i * r(m) }));
  pies(ctx).forEach((p) => (h[p] = { rot: TEMBLOR.rotar * 2 * i * r(p) }));
  return { huesos: h };
};

// Vaivén: se echa hacia atrás y hacia adelante (con inclinación según el sentido del movimiento)
export const vaiven = (f: number, ctx: Contexto, o: { amplitud?: number; periodo?: number; inclina?: number } = {}): PoseParcial => {
  const A = o.amplitud ?? 30;
  const T = (o.periodo ?? 1.2) * ctx.fps;
  const ang = (f / T) * 2 * Math.PI;
  return {
    huesos: {
      raiz: { x: A * Math.sin(ang), rot: (o.inclina ?? 8) * Math.cos(ang) },
      cabeza: { rot: -(o.inclina ?? 8) * 0.5 * Math.cos(ang - 0.5) },
    },
  };
};

// Mirar: gira la cabeza (y un poco el cuerpo) hacia un lado
export const mirar = (f: number, _ctx: Contexto, o: { angulo: number; duracion: number; entrada?: number }): PoseParcial => {
  const e = o.entrada ?? 8;
  const t = tramo(f, [0, e, o.duracion - e, o.duracion], [0, 1, 1, 0]);
  return { huesos: { cabeza: { rot: o.angulo * t }, cuerpo: { rot: o.angulo * 0.2 * t } } };
};
