// Personajes "por poses" (stop motion, sin articulaciones): cada pose es el personaje entero en una imagen
// (scripts/rig/importar_poses.py). Datos, bocas y cajas (para que los carteles no pisen la cabeza). Coordenadas:
// origen en el piso, en el centro de los pies; y hacia abajo; px de la hoja de poses.
import { z } from "zod";
import { DATOS_POSES } from "../personajes";
import type { Caja } from "./cajas";
import { cargarPersonaje } from "./personajes";

const zPose = z.object({
  img: z.string(),
  sinBoca: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  cabeza: z.array(z.number()).length(4),
  boca: z.object({ c: z.array(z.number()).length(2), w: z.number(), escala: z.number().optional() }).optional(),
});
export type DatosPose = z.infer<typeof zPose>;
const zPoses = z.object({ version: z.number(), personaje: z.string(), fuente: z.string(), poses: z.record(z.string(), zPose), alertas: z.array(z.string()) });
export type DatosPoses = z.infer<typeof zPoses>;

const cache = new Map<string, DatosPoses>();
export const cargarPoses = (nombre: string): DatosPoses => {
  const listo = cache.get(nombre);
  if (listo) return listo;
  const d = DATOS_POSES[nombre];
  if (!d) throw new Error(`«${nombre}» no tiene poses (src/personajes/index.ts → DATOS_POSES)`);
  const r = zPoses.safeParse(d);
  if (!r.success) throw new Error(`public/personajes/${nombre}/poses.json no es válido: ${r.error.message}`);
  cache.set(nombre, r.data);
  return r.data;
};

export const poseDe = (nombre: string, pose: string): DatosPose => {
  const p = cargarPoses(nombre).poses;
  return p[pose] ?? p.neutra ?? Object.values(p)[0];
};

// Bocas A–F del kit del personaje (imágenes de piezas.json) para hablar sobre cada pose
export const visemaDe = (nombre: string, v: string) => {
  const vis = cargarPersonaje(nombre).piezas.visemas[v];
  const t = vis?.trazos.find((x) => x.img);
  return t ? { img: t.img!, w: t.w!, h: t.h! } : null;
};

export const cajasDePose = (nombre: string, pose: string, espejo = false): { cuerpo: Caja; cabeza: Caja } => {
  const p = poseDe(nombre, pose);
  const s = espejo ? -1 : 1;
  const x = (a: number, b: number) => ({ x0: Math.min(a * s, b * s), x1: Math.max(a * s, b * s) });
  return {
    cuerpo: { ...x(p.x, p.x + p.w), y0: p.y, y1: p.y + p.h },
    cabeza: { ...x(p.cabeza[0], p.cabeza[2]), y0: p.cabeza[1], y1: p.cabeza[3] },
  };
};
