// Cálculos puros de la plantilla MotionGraphicRitmo (sin React): esquema de props, palabras de Whisper, todo
// llevado al pulso de la música (pulsos.json de scripts/pulsos.py), camera punch en cada compás, poses de los
// brazos del personaje con desfasaje entre brazos y armado de los bloques de títulos en la zona libre.
import { z } from "zod";
import { lineasDe } from "../comunes/zonaSegura";
import type { Pista } from "../PersonajeRig/calculos";

// ---------- Constantes ----------
export const TOLERANCIA_PULSO = 0.3; // s: una palabra se corre al pulso más cercano si está a menos de esto
export const PUNCH = { escala: 1.025, ataque: 2, caida: 9 }; // escala máxima · frames de subida · frames de bajada
export const BRAZOS = { desfase: 2, transicion: 4, delante: 1e5, alzada: -20 }; // frames entre brazos · frames del cambio · capa · y (pt) desde la que la mano pasa delante
export const SALIDA_ANTES = 6; // frames: un bloque termina de salir antes de que entre el siguiente

// ---------- Esquema de props ----------
const zToken = z.object({ text: z.string(), fromMs: z.number(), toMs: z.number(), dtwMs: z.number().optional() });
const zMovMano = z.object({ rot: z.number().default(0), x: z.number().default(0), y: z.number().default(0) });
export type MovMano = z.input<typeof zMovMano>;
const zCue = z.object({ start: z.number(), end: z.number(), value: z.string() });

export const zLinea = z.object({
  texto: z.string(),
  palabra: z.string(), // primera palabra de la voz con la que entra (se busca por prefijo, sin tildes)
  voz: z.number().int().min(0), // índice en `voces`
  estilo: z.enum(["normal", "acento", "marca"]).default("normal"),
});

export const zMotionGraphicRitmo = z.object({
  musica: z.object({ archivo: z.string(), volumen: z.number().default(1), bajoVoz: z.number().default(-8) }), // dB extra bajo la voz
  pulsos: z.object({ pulsos: z.array(z.number()), compases: z.array(z.number()), golpes: z.array(z.number()).default([]) }),
  voces: z.array(
    z.object({
      archivo: z.string(),
      desde: z.number(), // s del video (conviene que sea un pulso)
      duracion: z.number(), // s
      tokens: z.array(zToken),
      rhubarb: z.object({ mouthCues: z.array(zCue) }),
    }),
  ),
  bloques: z.array(z.object({ lineas: z.array(zLinea).min(1), expresion: z.string().optional() })),
  cta: z.object({ boton: z.string(), color: z.string().default("#FFD60A") }).nullable().default(null),
  fondo: z
    .discriminatedUnion("tipo", [
      z.object({ tipo: z.literal("gondola"), frente: z.number().default(1520), rotulo: z.string().nullable().default(null) }), // dibujada por código (sin video); frente = y del mueble de adelante; rotulo = cartel en el frente
      z.object({ tipo: z.literal("video"), video: z.string(), recorte: z.string(), desde: z.number().default(0) }), // DetrasDePersona
    ])
    .default({ tipo: "gondola", frente: 1520, rotulo: null }),
  personaje: z.object({
    nombre: z.string(),
    x: z.number(),
    y: z.number(), // pies (px)
    escala: z.number(),
    // Pose de cada mano en cada compás (se alternan): rot en grados y x, y en puntos del personaje (subir = y negativa)
    poses: z.array(z.record(z.string(), zMovMano)).min(1),
  }),
  zona: z.object({ techo: z.number(), ancho: z.number(), x0: z.number() }).default({ techo: 150, ancho: 960, x0: 60 }),
  tamanios: z.array(z.number()).default([150, 132, 116, 100, 88, 76]), // px de letra a probar, de mayor a menor
});
export type MotionGraphicRitmoProps = z.input<typeof zMotionGraphicRitmo>;
export type Props = z.output<typeof zMotionGraphicRitmo>;

// ---------- Palabras de Whisper ----------
export type Palabra = { texto: string; ms: number };
const normal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, "");

// Une los tokens (pedazos de palabra) de whisper.cpp: una palabra empieza en el token con espacio adelante.
// El tiempo es el de DTW si está (más preciso que fromMs).
export const palabrasDeTokens = (tokens: z.infer<typeof zToken>[]): Palabra[] => {
  const out: Palabra[] = [];
  for (const t of tokens) {
    if (!normal(t.text)) continue; // puntuación
    if (out.length === 0 || t.text.startsWith(" ")) out.push({ texto: t.text.trim(), ms: t.dtwMs ?? t.fromMs });
    else out[out.length - 1].texto += t.text;
  }
  return out;
};

export const buscarPalabra = (palabras: Palabra[], prefijo: string): Palabra | undefined => {
  const p = normal(prefijo);
  return palabras.find((w) => normal(w.texto).startsWith(p));
};

// ---------- Pulso ----------
export const alPulso = (seg: number, pulsos: number[], tolerancia = TOLERANCIA_PULSO) => {
  let mejor = seg;
  let dist = tolerancia;
  for (const p of pulsos) {
    const d = Math.abs(p - seg);
    if (d <= dist) {
      dist = d;
      mejor = p;
    }
  }
  return mejor;
};

// Camera punch: 1 → escala en `ataque` frames y vuelta en `caida` (curva suave), en cada compás
export const punchEn = (f: number, compasesFrames: number[], o = PUNCH) => {
  let extra = 0;
  for (const c of compasesFrames) {
    const d = f - c;
    let v = 0;
    if (d >= 0 && d < o.ataque) v = d / o.ataque;
    else if (d >= o.ataque && d < o.ataque + o.caida) {
      const t = (d - o.ataque) / o.caida;
      v = (1 - t) * (1 - t);
    }
    extra = Math.max(extra, v);
  }
  return 1 + (o.escala - 1) * extra;
};

// ---------- Brazos al compás ----------
// Una pista "secuencia" por brazo y por compás: pasa de la pose anterior a la nueva en `transicion` frames y la
// sostiene hasta el compás siguiente. El brazo derecho arranca `desfase` frames después del izquierdo.
export const pistasBrazos = (compasesFrames: number[], poses: Record<string, MovMano>[], o = BRAZOS): Pista[] => {
  const manos = [...new Set(poses.flatMap((p) => Object.keys(p)))];
  const orden = [...manos.filter((m) => m.includes("izq")), ...manos.filter((m) => !m.includes("izq"))];
  const mov = (m?: MovMano) => ({ rot: m?.rot ?? 0, x: m?.x ?? 0, y: m?.y ?? 0 });
  const pistas: Pista[] = [];
  orden.forEach((mano, k) => {
    const corr = k * o.desfase;
    let antes = mov();
    compasesFrames.forEach((c, i) => {
      const ahora = mov(poses[i % poses.length][mano]);
      const sig = compasesFrames[i + 1];
      // Mano alzada: delante de la cabeza y los pétalos (como en saludar)
      const capa = Math.min(antes.y, ahora.y) <= o.alzada ? { [mano]: o.delante } : undefined;
      pistas.push({
        tipo: "secuencia",
        inicio: c + corr,
        fin: sig !== undefined ? sig + corr : undefined,
        duracion: o.transicion,
        veces: 1,
        secuencia: {
          nombre: `${mano}-${i}`,
          ciclo: false,
          interpolacion: "suave",
          poses: [
            { huesos: { [mano]: antes }, dura: 1, orden: capa },
            { huesos: { [mano]: ahora }, dura: 1, orden: capa },
          ],
        },
      } as Pista);
      antes = ahora;
    });
  });
  return pistas;
};

// ---------- Línea de tiempo de los títulos ----------
export type LineaEnTiempo = { texto: string; estilo: "normal" | "acento" | "marca"; entra: number }; // frame
export type BloqueEnTiempo = { lineas: LineaEnTiempo[]; entra: number; sale: number | null; expresion?: string };

export const tiemposBloques = (p: Props, fps: number): BloqueEnTiempo[] => {
  const palabras = p.voces.map((v) => palabrasDeTokens(v.tokens));
  const bloques = p.bloques.map((b) => ({
    expresion: b.expresion,
    lineas: b.lineas.map((l) => {
      const w = buscarPalabra(palabras[l.voz] ?? [], l.palabra);
      const seg = p.voces[l.voz].desde + (w ? w.ms / 1000 : 0);
      return { texto: l.texto, estilo: l.estilo, entra: Math.round(alPulso(seg, p.pulsos.pulsos) * fps) };
    }),
  }));
  return bloques.map((b, i) => {
    // Las líneas de un bloque entran en orden (nunca dos en el mismo frame)
    const lineas = b.lineas.map((l, k) => ({ ...l, entra: Math.max(l.entra, ...b.lineas.slice(0, k).map((x) => x.entra + 3)) }));
    const sig = bloques[i + 1];
    return {
      lineas,
      expresion: b.expresion,
      entra: lineas[0].entra,
      sale: sig ? Math.min(...sig.lineas.map((l) => l.entra)) - SALIDA_ANTES : null,
    };
  });
};

// Tamaño de letra del bloque: el mayor con el que todas las líneas entran en 1 renglón y el bloque cabe entre
// el techo y el piso libre (encima de la cabeza del personaje). Si ninguno entra, el más chico.
export const INTERLINEA = 1.08;
export const ESPACIO_LINEAS = 0.12; // × tamaño de letra
export const ANCHO_LETRA_SORA = 0.62; // Sora 800: ancho medio de un carácter / tamaño
export const tamanioBloque = (lineas: string[], ancho: number, alto: number, tamanios: number[]) => {
  for (const tam of tamanios) {
    const unaLinea = lineas.every((t) => lineasDe(t, ancho, tam, ANCHO_LETRA_SORA) === 1);
    const total = lineas.length * tam * INTERLINEA + (lineas.length - 1) * tam * ESPACIO_LINEAS;
    if (unaLinea && total <= alto) return tam;
  }
  return tamanios[tamanios.length - 1];
};
