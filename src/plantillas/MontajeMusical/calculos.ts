// Cálculos del montaje de MontajeMusical, sin React ni Remotion: los usan la composición
// (MontajeMusical.tsx) y la exportación a Premiere (premiere.ts), así las dos dan lo mismo.

// ---------- Constantes de montaje ----------
export const FPS = 30;
export const ANCHO = 1080;
export const ALTO = 1920;
export const ANCLA_Y = 0.36; // altura de salida donde quedan las caras (fracción del alto)
export const GOLPE_ZOOM = 0.1; // zoom extra al entrar en cada toma, que se resuelve en GOLPE_FRAMES
export const GOLPE_FRAMES = 9;
export const ZOOM_LENTO = 0.04; // acercamiento a lo largo de cada toma
export const CRUCE_AUDIO = 8; // frames de fundido cruzado de audio en cada corte (mitad antes, mitad después)
export const FUNDIDO_FINAL = 20; // frames de fundido de audio al final
export const WHOOSH_ANTES = 7; // frames que el whoosh arranca antes del corte
export const WHOOSH_DURA = 30; // frames que dura la Sequence del whoosh
export const WHOOSH_DB = -18; // si no se indica whooshDb

// ---------- Datos ----------
export type PuntoEncuadre = { ms: number; cx: number; cy: number }; // ms en el clip; cx, cy fracciones del cuadro

export type TomaMusical = {
  clip: string; // `${carpetaVideos}/${clip}.mp4`
  desdeMs: number;
  hastaMs: number;
  gananciaDb?: number;
  etiqueta?: string; // p. ej. "2022"; se muestra al empezar la toma
  encuadre?: { zoom: number; puntos: PuntoEncuadre[] };
  // Ancho (px de salida) del video escalado a ALTO. Por defecto ANCHO: el video se recorta a 9:16 por el
  // centro y cx/cy son fracciones de ese recorte. Con un video más ancho (4:3 → 2560) el encuadre puede
  // recorrerlo entero y cx/cy son fracciones del cuadro completo.
  anchoFuente?: number;
};

// ---------- Tiempos ----------
export const framesTomaMusical = (t: TomaMusical) =>
  Math.round(((t.hastaMs - t.desdeMs) / 1000) * FPS);

export const iniciosTomas = (tomas: TomaMusical[]) => {
  let acc = 0;
  return tomas.map((t) => {
    const ini = acc;
    acc += framesTomaMusical(t);
    return ini;
  });
};

export const duracionMontajeMusical = (p: { tomas: TomaMusical[] }) =>
  p.tomas.reduce((s, t) => s + framesTomaMusical(t), 0);

export const frameDesde = (t: TomaMusical) =>
  Math.round((t.desdeMs / 1000) * FPS);

export const dbAVolumen = (db: number) => Math.pow(10, db / 20);

// ---------- Encuadre ----------
const lineal = (x: number, xs: number[], ys: number[]) => {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let i = 1;
  while (xs[i] < x) i++;
  const k = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
  return ys[i - 1] + (ys[i] - ys[i - 1]) * k;
};

const salidaCubica = (k: number) => 1 - Math.pow(1 - k, 3); // Easing.out(Easing.cubic)
const recorte = (x: number) => Math.min(Math.max(x, 0), 1);

// Zoom y esquina superior izquierda de la zona visible (fracciones del cuadro) en el frame `frame` de la toma
export const encuadreEn = (t: TomaMusical, frame: number, dura: number) => {
  const z0 = t.encuadre?.zoom ?? 1;
  const golpe = GOLPE_ZOOM * (1 - salidaCubica(recorte(frame / GOLPE_FRAMES)));
  const lento = ZOOM_LENTO * recorte(frame / dura);
  const z = z0 * (1 + golpe + lento);

  // centro del encuadre en este instante (tiempo del clip)
  const ms = t.desdeMs + (frame / FPS) * 1000;
  const puntos = t.encuadre?.puntos ?? [];
  const xs = puntos.map((q) => q.ms);
  const cx =
    puntos.length > 1
      ? lineal(
          ms,
          xs,
          puntos.map((q) => q.cx),
        )
      : (puntos[0]?.cx ?? 0.5);
  const cy =
    puntos.length > 1
      ? lineal(
          ms,
          xs,
          puntos.map((q) => q.cy),
        )
      : (puntos[0]?.cy ?? ANCLA_Y);

  // sin salirse del cuadro
  const visible = 1 / z;
  const visibleX = (ANCHO / (t.anchoFuente ?? ANCHO)) * visible;
  const izq = Math.min(Math.max(cx - 0.5 * visibleX, 0), 1 - visibleX);
  const arriba = Math.min(Math.max(cy - ANCLA_Y * visible, 0), 1 - visible);
  return { z, izq, arriba };
};
