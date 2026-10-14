// Esquemas (zod) del sistema de rig vectorial de personajes.
//  - piezas.json: lo que extrae scripts/rig/extraer_rig.py del .ai (trazos SVG por vista, rostros, visemas, accesorios)
//    o scripts/rig/importar_png.py de hojas PNG (entonces cada trazo es una imagen: img + x, y, w, h)
//  - rig.json:    huesos con pivotes y qué hueso mueve cada pieza (se ajusta en el editor del Studio)
// Unidades: puntos del .ai. Origen de cada vista: en el piso, entre los pies; y hacia abajo.
import { z } from "zod";

// ---------- piezas.json ----------
export const zTrazo = z.object({
  d: z.string(),
  fill: z.string().nullish(),
  stroke: z.string().optional(),
  sw: z.number().optional(),
  evenodd: z.boolean().optional(),
  op: z.number().optional(), // opacidad (sombras y brillos)
  clip: z.string().optional(), // recorte (path) que traía el .ai
  // Pieza de imagen (personajes importados de PNG): ruta en public/ y caja en coordenadas del personaje
  img: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().optional(),
  h: z.number().optional(),
});
export type Trazo = z.infer<typeof zTrazo>;

const zCaja = z.array(z.number()).length(4);

export const zPieza = z.object({
  id: z.string(),
  rol: z.string(), // cabeza, cuerpo, mano, pie, corona, detalle, brazo, pierna…
  z: z.number(), // orden de dibujo
  caja: zCaja,
  dibujos: z.array(z.number()),
  de: z.string(), // auto | capa | mapa | sintetica
  sintetica: z.boolean().optional(),
  clip: z.string().optional(), // recorte propio (piezas que venían unidas en un solo trazado)
  trazos: z.array(zTrazo),
});
export type Pieza = z.infer<typeof zPieza>;

export const zOjo = z.object({
  c: z.array(z.number()).length(2),
  w: z.number(),
  h: z.number(),
  tapa: z.string().nullable(), // color de lo que queda detrás del ojo (para cerrarlo)
  abierto: z.boolean(),
  trazos: z.array(zTrazo),
});
export type Ojo = z.infer<typeof zOjo>;

const zGrupo = z.object({ trazos: z.array(zTrazo) });

export const zRostro = z.object({
  ojos: z.array(zOjo),
  boca: z.object({ trazos: z.array(zTrazo), caja: zCaja, c: z.array(z.number()).length(2) }).optional(),
  cejas: zGrupo.optional(),
  anteojos: zGrupo.optional(),
  tocado: zGrupo.optional(),
  extras: zGrupo.optional(),
  sinBoca: zGrupo.optional(), // (PNG) la cabeza de la expresión sin boca: se dibuja en vez de extras mientras habla
  cerrados: zGrupo.optional(), // (PNG) parche de ojos cerrados: se dibuja encima al parpadear
  de: z.string().optional(),
});
export type Rostro = z.infer<typeof zRostro>;

export const zVista = z.object({
  caja: zCaja,
  origenPagina: z.array(z.number()).length(2),
  piezas: z.array(zPieza),
  cabeza: z.object({ id: z.string(), caja: zCaja, z: z.number() }).optional(),
  rostro: zRostro.optional(),
  // Variantes de piezas que se cambian con la pose ("mano_der:senala" → otra mano), p. ej. gestos de las manos
  variantes: z.record(z.string(), z.object({ trazos: z.array(zTrazo), caja: zCaja })).optional(),
});
export type Vista = z.infer<typeof zVista>;

export const zVisema = z.object({
  trazos: z.array(zTrazo),
  w: z.number(),
  h: z.number(),
  de: z.string(),
  sintetica: z.boolean().optional(),
});

export const zAccesorio = z.object({
  trazos: z.array(zTrazo),
  caja: zCaja,
  de: z.string(),
  detras: z.boolean().optional(),
});
export type AccesorioDatos = z.infer<typeof zAccesorio>;

export const zAlerta = z.object({ nivel: z.string(), texto: z.string(), propuesta: z.string().optional() });

export const zPiezas = z.object({
  version: z.number(),
  nombre: z.string(),
  fuente: z.string(),
  unidad: z.string(),
  bloques: z.array(z.object({ n: z.number(), tipo: z.string(), nombre: z.string(), caja: zCaja, dibujos: z.array(z.number()) })),
  vistas: z.record(z.string(), zVista),
  rostros: z.record(z.string(), zRostro),
  visemas: z.record(z.string(), zVisema),
  accesorios: z.record(z.string(), zAccesorio),
  alertas: z.array(zAlerta),
});
export type DatosPiezas = z.infer<typeof zPiezas>;

// ---------- rig.json ----------
export const zHueso = z.object({
  id: z.string(),
  padre: z.string().nullable(),
  pivote: z.array(z.number()).length(2),
});
export type Hueso = z.infer<typeof zHueso>;

export const zVistaRig = z.object({
  huesos: z.array(zHueso),
  piezas: z.record(z.string(), z.string()), // pieza → hueso
  rostro: z.object({ hueso: z.string() }),
  mano: z.string().nullable().optional(), // mano que agarra (accesorios en la mano)
  orden: z.record(z.string(), z.number()).optional(), // cambios de orden de capas (pieza → z)
  // Profundidad de cada pieza para el giro 2,5D (+ adelante, - atrás; el rostro es +1). Si falta, se deduce del rol.
  profundidad: z.record(z.string(), z.number()).optional(),
});
export type VistaRig = z.infer<typeof zVistaRig>;

export const zRig = z.object({
  version: z.number(),
  personaje: z.string(),
  vistas: z.record(z.string(), zVistaRig),
});
export type Rig = z.infer<typeof zRig>;

// ---------- Pose (lo que mueven las animaciones) ----------
export const zMov = z.object({
  rot: z.number().optional(), // grados (+ = sentido horario en pantalla)
  x: z.number().optional(),
  y: z.number().optional(),
  sx: z.number().optional(),
  sy: z.number().optional(),
});
export type Mov = z.infer<typeof zMov>;

export const zAccesorioPose = z.object({
  hueso: z.string().default("raiz"),
  x: z.number().default(0), // dónde va el centro del accesorio, en coordenadas del hueso
  y: z.number().default(0),
  rot: z.number().default(0),
  escala: z.number().default(1),
  z: z.number().optional(), // orden entre las piezas (por defecto: delante de todo, o detrás si detras)
  detras: z.boolean().optional(),
});
export type AccesorioPose = z.infer<typeof zAccesorioPose>;
