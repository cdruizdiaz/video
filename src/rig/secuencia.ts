// Secuencias de poses clave: el reemplazo de "haceme una secuencia de 24 posiciones" con IA generativa.
// Se escriben en JSON (texto: barato en tokens) y el rig dibuja cada pose con las piezas reales del personaje,
// así que no se deforma ni cambia entre cuadros. Entre poses se interpola con Catmull-Rom (suave), lineal o
// sin interpolar (paso: una pose por tramo, como sprites). Formato: ver src/rig/README.md.
import { z } from "zod";
import { mezclarMov, type PoseParcial } from "./pose";
import { type AccesorioPose, type Mov, zAccesorioPose, zMov } from "./tipos";

export const zPoseClave = z.object({
  huesos: z.record(z.string(), zMov).default({}),
  dura: z.number().positive().default(1), // duración relativa de esta pose hasta la siguiente
  expresion: z.string().optional(),
  visema: z.string().nullable().optional(),
  parpado: z.number().optional(),
  guino: z.number().optional(),
  vista: z.string().optional(),
  espejo: z.boolean().optional(),
  accesorios: z.record(z.string(), zAccesorioPose).optional(),
  orden: z.record(z.string(), z.number()).optional(),
  disfraz: z.string().nullable().optional(), // rostro del que se toma el disfraz (gorro, cuernos, nariz…)
  disfrazY: z.number().optional(),
  mirada: z.array(z.number()).length(2).optional(), // pupilas: -1…1 en x e y
  ojos: z.number().optional(), // tamaño de los ojos (1 normal)
  nota: z.string().optional(), // descripción libre de la pose (para el que la lee)
});
export type PoseClave = z.infer<typeof zPoseClave>;

export const zSecuencia = z.object({
  nombre: z.string(),
  descripcion: z.string().optional(),
  ciclo: z.boolean().default(true), // la última pose vuelve a la primera
  interpolacion: z.enum(["suave", "lineal", "paso"]).default("suave"),
  poses: z.array(zPoseClave).min(1),
});
export type Secuencia = z.infer<typeof zSecuencia>;

const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

const CANALES = ["rot", "x", "y", "sx", "sy"] as const;
const NEUTRO: Record<(typeof CANALES)[number], number> = { rot: 0, x: 0, y: 0, sx: 1, sy: 1 };

// Pose de la secuencia en la fase t (0…1 de una pasada)
export const poseSecuencia = (sec: Secuencia, t: number): PoseParcial => {
  const n = sec.poses.length;
  if (n === 1) return aParcial(sec.poses[0], sec.poses[0].huesos);
  const tramos = sec.ciclo ? n : n - 1;
  const pesos = sec.poses.slice(0, tramos).map((p) => p.dura);
  const total = pesos.reduce((a, b) => a + b, 0);
  let u = (sec.ciclo ? ((t % 1) + 1) % 1 : Math.min(1, Math.max(0, t))) * total;
  let i = 0;
  while (i < tramos - 1 && u >= pesos[i]) u -= pesos[i++];
  const local = Math.min(1, u / pesos[i]);
  const idx = (k: number) => (sec.ciclo ? ((k % n) + n) % n : Math.min(n - 1, Math.max(0, k)));
  const [a, b, c, d] = [idx(i - 1), idx(i), idx(i + 1), idx(i + 2)].map((k) => sec.poses[k]);
  if (sec.interpolacion === "paso") return aParcial(b, b.huesos);
  const claves = new Set([...Object.keys(b.huesos), ...Object.keys(c.huesos), ...Object.keys(a.huesos), ...Object.keys(d.huesos)]);
  const huesos: Record<string, Mov> = {};
  for (const k of claves) {
    if (sec.interpolacion === "lineal") {
      huesos[k] = mezclarMov(b.huesos[k], c.huesos[k], local);
      continue;
    }
    const m: Mov = {};
    for (const ch of CANALES) {
      const v = (p: PoseClave) => p.huesos[k]?.[ch] ?? NEUTRO[ch];
      m[ch] = cr(v(a), v(b), v(c), v(d), local);
    }
    huesos[k] = m;
  }
  const parcial = aParcial(b, huesos);
  // Accesorios: se interpolan posición, giro y escala (el hueso y el orden son los de la pose actual)
  if (b.accesorios) {
    const acc: Record<string, AccesorioPose> = {};
    for (const [k, ab] of Object.entries(b.accesorios)) {
      const ac = c.accesorios?.[k] ?? ab;
      const aa = a.accesorios?.[k] ?? ab;
      const ad = d.accesorios?.[k] ?? ac;
      const f = (ch: "x" | "y" | "rot" | "escala") =>
        sec.interpolacion === "lineal" ? ab[ch] + (ac[ch] - ab[ch]) * local : cr(aa[ch], ab[ch], ac[ch], ad[ch], local);
      acc[k] = { ...ab, x: f("x"), y: f("y"), rot: f("rot"), escala: f("escala") };
    }
    parcial.accesorios = acc;
  }
  // Parpadeo y guiño también se interpolan
  const num = (k: "parpado" | "guino") => (b[k] !== undefined || c[k] !== undefined ? (b[k] ?? 0) + ((c[k] ?? 0) - (b[k] ?? 0)) * local : undefined);
  parcial.parpado = num("parpado");
  parcial.guino = num("guino");
  return parcial;
};

const aParcial = (p: PoseClave, huesos: Record<string, Mov>): PoseParcial => {
  const r: PoseParcial = { huesos };
  if (p.expresion !== undefined) r.expresion = p.expresion;
  if (p.visema !== undefined) r.visema = p.visema;
  if (p.parpado !== undefined) r.parpado = p.parpado;
  if (p.guino !== undefined) r.guino = p.guino;
  if (p.vista !== undefined) r.vista = p.vista;
  if (p.espejo !== undefined) r.espejo = p.espejo;
  if (p.accesorios) r.accesorios = p.accesorios;
  if (p.orden) r.orden = p.orden;
  if (p.disfraz !== undefined) r.disfraz = p.disfraz;
  if (p.disfrazY !== undefined) r.disfrazY = p.disfrazY;
  if (p.mirada) r.mirada = [p.mirada[0], p.mirada[1]];
  if (p.ojos !== undefined) r.ojos = p.ojos;
  return r;
};
