// Cálculos puros de la plantilla ExplicacionGeometrica (sin React): línea de tiempo del diálogo (cuándo dice cada
// personaje cada línea, según la duración real de las voces) y las pistas de animación de cada personaje
// (hablar con las bocas de Rhubarb, cara y gesto por línea, respirar y parpadear).
import { z } from "zod";
import type { Pista } from "../PersonajeRig/calculos";
import type { PoseClave } from "../../rig/secuencia";

const zToken = z.object({ text: z.string(), fromMs: z.number(), toMs: z.number() });
const zBoca = z.object({ start: z.number(), end: z.number(), value: z.string() });

export const zLineaDialogo = z.object({
  id: z.string(),
  escena: z.number(),
  quien: z.string(), // nombre del personaje (biblioteca de rigs)
  texto: z.string(),
  audio: z.string(), // ruta en public/ (staticFile)
  duracionMs: z.number(),
  palabras: z.array(zToken).default([]), // Whisper (subtítulos)
  bocas: z.array(zBoca).default([]), // Rhubarb (boca)
  pausaAntes: z.number().default(0.35), // segundos de silencio antes de la línea (lugar para lo que pasa en la pizarra)
  cara: z.string().optional(), // expresión mientras habla
  gesto: z.string().optional(), // pose de la tabla de gestos del personaje mientras habla
});
export type LineaDialogo = z.input<typeof zLineaDialogo>;
type Linea = z.output<typeof zLineaDialogo>;

export type LineaEnTiempo = Linea & { desde: number; hasta: number }; // frames
export type Tiempos = {
  lineas: LineaEnTiempo[];
  escenas: Record<number, { desde: number; hasta: number }>;
  total: number;
  linea: (id: string) => LineaEnTiempo; // atajo para sincronizar la pizarra
};

export const INICIO = 12; // frames antes de la primera pausa
export const COLA = 75; // frames después de la última línea (cierre)

export const armarTiempos = (entrada: LineaDialogo[], fps: number, o: { inicio?: number; cola?: number } = {}): Tiempos => {
  const lineas = entrada.map((l) => zLineaDialogo.parse(l));
  let f = o.inicio ?? INICIO;
  const res: LineaEnTiempo[] = [];
  const escenas: Tiempos["escenas"] = {};
  for (const l of lineas) {
    const inicioPausa = f;
    f += Math.round(l.pausaAntes * fps);
    const desde = f;
    const hasta = desde + Math.max(1, Math.round((l.duracionMs / 1000) * fps));
    res.push({ ...l, desde, hasta });
    if (!escenas[l.escena]) escenas[l.escena] = { desde: res.length === 1 ? 0 : inicioPausa, hasta };
    escenas[l.escena].hasta = hasta;
    f = hasta;
  }
  const total = f + (o.cola ?? COLA);
  // Cada escena dura hasta que empieza la siguiente (la última, hasta el final)
  const nums = Object.keys(escenas)
    .map(Number)
    .sort((a, b) => a - b);
  nums.forEach((n, i) => {
    escenas[n].hasta = i + 1 < nums.length ? escenas[nums[i + 1]].desde : total;
  });
  const porId = new Map(res.map((l) => [l.id, l]));
  return {
    lineas: res,
    escenas,
    total,
    linea: (id) => {
      const l = porId.get(id);
      if (!l) throw new Error(`No hay línea «${id}» en el diálogo`);
      return l;
    },
  };
};

// ---------- Pistas de cada personaje ----------
export const ENTRADA_GESTO = 7; // frames para llegar al gesto (y para volver)
export const RESTO_CARA = 12; // frames que la cara se queda después de terminar la línea

export type ConfigPersonaje = {
  nombre: string;
  caraBase?: string;
  gestos?: Record<string, PoseClave>; // poses (huesos y variantes de manos) por nombre de gesto
  extras?: Pista[]; // pistas sueltas (saludar, saltar…) que pone el trabajo
};

const NEUTRA: PoseClave = { huesos: {}, dura: 1 };

export const pistasDe = (cfg: ConfigPersonaje, t: Tiempos): Pista[] => {
  const pistas: Pista[] = [{ tipo: "respirar", inicio: 0 }, { tipo: "parpadear", inicio: 0, semilla: cfg.nombre.length }];
  const propias = t.lineas.filter((l) => l.quien === cfg.nombre);
  propias.forEach((l, i) => {
    const sig = propias[i + 1];
    if (l.cara) pistas.push({ tipo: "expresion", inicio: l.desde, fin: Math.min(l.hasta + RESTO_CARA, sig ? sig.desde : Infinity), nombre: l.cara });
    pistas.push({ tipo: "hablar", inicio: l.desde, fin: l.hasta, rhubarb: { mouthCues: l.bocas }, idioma: "es" });
    const g = l.gesto ? cfg.gestos?.[l.gesto] : undefined;
    if (g) {
      // Sube al gesto, lo sostiene mientras habla y vuelve (una pasada, sin ciclo)
      const dur = Math.max(2 * ENTRADA_GESTO + 2, l.hasta - l.desde + ENTRADA_GESTO);
      const sostener = dur - 2 * ENTRADA_GESTO;
      pistas.push({
        tipo: "secuencia",
        inicio: l.desde - 2,
        fin: l.desde - 2 + dur,
        duracion: dur,
        veces: 1,
        secuencia: {
          nombre: l.gesto!,
          ciclo: false,
          interpolacion: "suave",
          poses: [
            { ...NEUTRA, dura: ENTRADA_GESTO },
            { ...g, dura: sostener },
            { ...g, dura: ENTRADA_GESTO },
            { ...NEUTRA, variantes: Object.fromEntries(Object.keys(g.variantes ?? {}).map((k) => [k, null])) },
          ],
        },
      });
    }
  });
  return [...pistas, ...(cfg.extras ?? [])];
};

// Línea que se está diciendo (o la última dicha, hasta `resto` frames después): para los subtítulos
export const lineaEn = (t: Tiempos, f: number, resto = 8): LineaEnTiempo | null =>
  t.lineas.find((l) => f >= l.desde && f < l.hasta + resto) ?? null;

// ---------- Personajes por poses (stop motion) ----------
export type SegmentoPose = { desde: number; hasta: number; pose: string };
export const RESTO_POSE = 10; // cuadros que se queda la pose del gesto después de terminar la línea

// Qué pose tiene el personaje en cada tramo: la del gesto de cada línea suya (tabla gesto → pose) y las sueltas
// del trabajo (saludo final…). Dos líneas seguidas con la misma pose se unen (no baja y vuelve a subir el brazo).
export const UNIR_SI_FALTAN = 24; // cuadros: si entre dos tramos de la misma pose hay menos, se unen
export const lineaDePoses = (nombre: string, t: Tiempos, poseDeGesto: Record<string, string>, extras: SegmentoPose[] = []): SegmentoPose[] => {
  const segs: SegmentoPose[] = [];
  for (const l of t.lineas) {
    if (l.quien !== nombre || !l.gesto || !poseDeGesto[l.gesto]) continue;
    const s = { desde: l.desde - 2, hasta: l.hasta + RESTO_POSE, pose: poseDeGesto[l.gesto] };
    const ant = segs[segs.length - 1];
    if (ant && ant.pose === s.pose && s.desde - ant.hasta < UNIR_SI_FALTAN) ant.hasta = s.hasta;
    else segs.push(s);
  }
  return [...segs, ...extras];
};

// Movimiento por poses intermedias (stop motion): para llegar a una pose se pasa por su camino (p. ej. neutra →
// paso1_festejo → paso2_festejo → festejo), `paso` cuadros por imagen, y al terminar se vuelve por el mismo camino.
// `espera` alterna variantes de la pose base cada `esperaCada` cuadros. OJO: con poses generadas por IA (no alineadas
// al píxel) se ve a los saltos aunque las diferencias sean mínimas; no usar salvo variantes calcadas (v5 de Pitágoras).
export type Movimiento = { caminos?: Record<string, string[]>; paso?: number; espera?: string[]; esperaCada?: number };

// Pose en un cuadro y cuadros desde que se llegó a ella (para el "pop", solo cuando no hay camino)
export const poseEnCuadro = (segs: SegmentoPose[], f: number, base = "neutra", mov: Movimiento = {}): { pose: string; desdeCambio: number } => {
  const paso = mov.paso ?? 3;
  const activos = segs.filter((s) => f >= s.desde && f < s.hasta);
  if (activos.length) {
    const s = activos[activos.length - 1];
    const camino = mov.caminos?.[s.pose] ?? [];
    const n = camino.length;
    const local = f - s.desde;
    const resto = s.hasta - 1 - f;
    const mitad = (s.hasta - s.desde) / 2;
    if (n && local < n * paso && local <= mitad) return { pose: camino[Math.floor(local / paso)], desdeCambio: 99 };
    if (n && resto < n * paso && local > mitad) return { pose: camino[Math.floor(resto / paso)], desdeCambio: 99 };
    return { pose: s.pose, desdeCambio: n ? 99 : local };
  }
  const espera = mov.espera;
  if (espera?.length) return { pose: espera[Math.floor(f / (mov.esperaCada ?? 6)) % espera.length], desdeCambio: 99 };
  const terminados = segs.filter((s) => s.hasta <= f).map((s) => s.hasta);
  return { pose: base, desdeCambio: terminados.length ? f - Math.max(...terminados) : 99 };
};

// ---------- Subtítulos resaltados (palabra por palabra) ----------
// Palabras clave con su color (p. ej. "hipotenusa" del color de su lado). Varios colores = degradé ("catetos").
export type Resaltado = { patron: string; color: string | string[] };
const sinTildes = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");
export const resaltadoDe = (palabra: string, lista: Resaltado[]): Resaltado | undefined => {
  const p = sinTildes(palabra);
  return p ? lista.find((r) => new RegExp(`^(?:${r.patron})$`).test(p)) : undefined;
};

// Índice de la palabra que se está diciendo a `ms` del comienzo de la línea: la última que ya empezó (se queda
// marcada durante la pausa hasta que empieza la siguiente); -1 antes de la primera
export const palabraEn = (palabras: { fromMs: number }[], ms: number): number => {
  let k = -1;
  for (let i = 0; i < palabras.length && palabras[i].fromMs <= ms; i++) k = i;
  return k;
};
