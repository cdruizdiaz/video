// Cálculos puros del desenfoque de movimiento (sin React): en qué tramos de cuadros activarlo.
// El componente está en ./Desenfoque.tsx. Regla de la suite: solo en tramos rápidos, nunca cruzando un corte.

import { z } from "zod";

// ---------- Constantes ----------
export const UMBRAL = 8; // px por cuadro a partir de los que algo "se mueve rápido"
export const MARGEN = 2; // cuadros de blur antes y después de cada tramo rápido
export const UNIR = 3; // huecos de hasta tantos cuadros entre dos tramos (de la misma toma) se rellenan

export type Tramo = { desde: number; hasta: number }; // cuadros; `hasta` no incluido
export type Punto = [number, number];

export type OpcionesTramos = {
  umbral?: number;
  margen?: number;
  unir?: number;
  cortes?: number[]; // cuadros donde empieza una toma nueva: el movimiento de c-1 a c no cuenta y ningún tramo los cruza
};

// Tramos donde algo se mueve a más de `umbral` px por cuadro. `posiciones[f]` es un punto o varios (p. ej. pies y
// cabeza del personaje): cuenta el que más se movió. Cada tramo se agranda `margen` cuadros a cada lado sin salir
// del video ni de su toma, y los tramos de la misma toma separados por `unir` cuadros o menos se juntan.
export const tramosRapidos = (posiciones: (Punto | Punto[])[], { umbral = UMBRAL, margen = MARGEN, unir = UNIR, cortes = [] }: OpcionesTramos = {}): Tramo[] => {
  const n = posiciones.length;
  if (n < 2) return [];
  const puntos = posiciones.map((p) => (typeof p[0] === "number" ? [p as Punto] : (p as Punto[])));
  const esCorte = new Set(cortes.filter((c) => c > 0 && c < n));
  // Toma de cada cuadro (sube en cada corte)
  const toma: number[] = [];
  for (let f = 0, k = 0; f < n; f++) {
    if (esCorte.has(f)) k++;
    toma.push(k);
  }
  const inicioToma: number[] = [];
  const finToma: number[] = [];
  for (let f = 0; f < n; f++) {
    if (f === 0 || toma[f] !== toma[f - 1]) inicioToma[toma[f]] = f;
    finToma[toma[f]] = f;
  }
  const activo = new Array<boolean>(n).fill(false);
  for (let f = 1; f < n; f++) {
    if (esCorte.has(f)) continue;
    const a = puntos[f - 1];
    const b = puntos[f];
    let v = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) v = Math.max(v, Math.hypot(b[i][0] - a[i][0], b[i][1] - a[i][1]));
    if (v <= umbral) continue;
    // El movimiento va del cuadro f-1 al f: se desenfocan los dos (más el margen), dentro de su toma
    const t = toma[f];
    for (let k = Math.max(inicioToma[t], f - 1 - margen); k <= Math.min(finToma[t], f + margen); k++) activo[k] = true;
  }
  const tramos: Tramo[] = [];
  for (let f = 0; f < n; f++) {
    if (!activo[f]) continue;
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && f - ultimo.hasta <= unir && toma[f] === toma[ultimo.hasta - 1]) {
      ultimo.hasta = f + 1;
    } else {
      tramos.push({ desde: f, hasta: f + 1 });
    }
  }
  return tramos;
};

export const enTramos = (tramos: Tramo[] | undefined, f: number) => !tramos || tramos.some((t) => f >= t.desde && f < t.hasta);

// Ordena, junta los que se pisan o se tocan y descarta los vacíos
export const unirTramos = (tramos: Tramo[]): Tramo[] => {
  const orden = tramos.filter((t) => t.hasta > t.desde).sort((a, b) => a.desde - b.desde);
  const res: Tramo[] = [];
  for (const t of orden) {
    const u = res[res.length - 1];
    if (u && t.desde <= u.hasta) u.hasta = Math.max(u.hasta, t.hasta);
    else res.push({ ...t });
  }
  return res;
};

// Entrada y salida de un cartel que dura `dura` cuadros: blur mientras entra y mientras sale, nítido quieto
export const tramosEntradaSalida = (dura: number, entra: number, sale: number, desde = 0): Tramo[] =>
  unirTramos([
    { desde, hasta: Math.min(dura, desde + entra) },
    { desde: Math.max(0, dura - sale), hasta: dura },
  ]);

// Prop `desenfoque` de las plantillas con esquema zod (PersonajeRig, Logo3D): true = automático
export const zDesenfoque = z
  .union([
    z.boolean(),
    z.object({
      modo: z.enum(["camara", "estela"]).optional(),
      muestras: z.number().int().min(1).optional(),
      obturador: z.number().min(0).max(360).optional(),
      tramos: z.array(z.object({ desde: z.number(), hasta: z.number() })).optional(),
      umbral: z.number().optional(),
    }),
  ])
  .default(false);

// ---------- Muestras del modo "camara" ----------
// Instantes (cuadros, con decimales) y pesos de cada muestra para el cuadro f. A diferencia de CameraMotionBlur:
// - el obturador abre en f y dura `obturador`/360 de cuadro (CameraMotionBlur mira de f+0,5 a f+1: adelanta casi
//   un cuadro y el objeto salta al entrar o salir de un tramo con blur). No mira hacia atrás a propósito: lo
//   discreto (cambio de pose entera, boca, parpadeo, vista) queda en el cuadro f; centrado, las muestras de f−¼
//   caían en el cuadro anterior y fundían dos poses (fantasma, visto en la prueba de poses);
// - las muestras no salen del tramo activo (así nunca miran del otro lado de un corte);
// - los pesos varían un poco (suman 1): con pesos iguales de 1/n cada muestra se redondea a 8 bits igual y el color
//   queda posterizado en múltiplos de ~n niveles (bandas en los degradés, muy visibles en 3D).
export const VARIACION_PESOS = 0.35;
const AUREO = 0.618033988749895;
export const pesosMuestras = (n: number): number[] => {
  if (n <= 1) return [1];
  const crudos = Array.from({ length: n }, (_, i) => 1 + VARIACION_PESOS * (2 * ((i * AUREO) % 1) - 1));
  const suma = crudos.reduce((a, b) => a + b, 0);
  return crudos.map((w) => w / suma);
};
export const instantesMuestras = (f: number, n: number, obturador: number, tramo?: Tramo): { cuadro: number; peso: number }[] => {
  const fraccion = obturador / 360;
  const pesos = pesosMuestras(n);
  const min = tramo ? tramo.desde : -Infinity;
  const max = tramo ? tramo.hasta - 1e-3 : Infinity;
  return pesos.map((peso, i) => ({ cuadro: Math.min(max, Math.max(min, f + Math.min(0.999, fraccion) * ((i + 0.5) / n))), peso }));
};
export const tramoEn = (tramos: Tramo[] | undefined, f: number): Tramo | undefined => tramos?.find((t) => f >= t.desde && f < t.hasta);
