// Recursos de historieta reutilizables: globo de diálogo con las palabras apareciendo al decirlas (tiempos por
// palabra de Whisper → @remotion/captions) y sticker de onomatopeya ("PLOP!", "BOING!"…).
// El globo entra con un "pop" (escala con rebote), su colita apunta a un punto (la boca del personaje, que puede
// moverse) y se va un rato después de la última palabra.
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import React from "react";
import { interpolate, spring } from "remotion";

const TINTA = "#3b2418";
// ---------- Globo ----------
const GLOBO = {
  borde: 9, // contorno grueso
  padX: 46,
  padY: 34,
  radio: 54,
  interlinea: 1.22,
  anchoLetra: 0.53, // ancho medio de un carácter de Fredoka respecto del tamaño (para partir líneas)
  colaBase: 0.16, // ancho de la base de la colita (fracción del ancho del globo, máx. 90 px)
  queda: 24, // frames que se queda después de la última palabra
  sale: 6, // frames de salida
  antes: 4, // frames de pop antes de la primera palabra
  aparece: 3, // frames de fundido de cada palabra
  sombra: 10, // desplazamiento de la sombra
  colaMax: 150, // largo máximo de la colita (px): apunta a la boca pero no llega
};

export type PalabraTiempo = { texto: string; desdeMs: number; hastaMs: number };

// Frames que ocupa un globo (desde su inicio) para una frase
export const duracionGlobo = (palabras: PalabraTiempo[], fps: number, queda = GLOBO.queda) =>
  GLOBO.antes + Math.ceil(((palabras[palabras.length - 1]?.hastaMs ?? 0) / 1000) * fps) + queda + GLOBO.sale;

// Parte el texto en líneas que entren en `anchoMax`
const partir = (palabras: string[], tamano: number, anchoMax: number) => {
  const lineas: number[][] = [[]];
  let actual = 0;
  palabras.forEach((p, i) => {
    const w = (p.length + 1) * tamano * GLOBO.anchoLetra;
    if (actual + w > anchoMax && lineas[lineas.length - 1].length) {
      lineas.push([]);
      actual = 0;
    }
    lineas[lineas.length - 1].push(i);
    actual += w;
  });
  return lineas;
};

export const GloboHistorieta: React.FC<{
  palabras: PalabraTiempo[];
  f: number; // frame relativo al inicio de la frase (la primera palabra suena en f = 0 + desdeMs)
  fps: number;
  x: number; // centro del globo
  y: number;
  cola: [number, number]; // punta de la colita (p. ej. la boca)
  fuente: string;
  tamano?: number;
  anchoMax?: number;
  fondo?: string;
  letraPorLetra?: boolean; // las palabras largas (estiradas al decirlas) se escriben de a una letra mientras duran
  temblor?: number; // px de temblor del globo (ruego, susto…)
  queda?: number; // frames que se queda después de la última palabra (por defecto GLOBO.queda)
  giro3d?: number; // grados de giro en perspectiva con que entra (2,5D); 0 = entra plano
}> = ({ palabras, f, fps, x, y, cola, fuente, tamano = 64, anchoMax = 820, fondo = "#ffffff", letraPorLetra = false, temblor = 0, queda, giro3d = 0 }) => {
  const dur = duracionGlobo(palabras, fps, queda);
  const local = f + GLOBO.antes;
  if (local < 0 || local > dur) return null;
  // Palabras con @remotion/captions: una sola página por frase, con el tiempo de cada palabra
  const captions: Caption[] = palabras.map((p, i) => ({
    text: (i ? " " : "") + p.texto,
    startMs: p.desdeMs,
    endMs: p.hastaMs,
    timestampMs: p.desdeMs,
    confidence: 1,
  }));
  const { pages } = createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1e9 });
  const tokens = pages.flatMap((pg) => pg.tokens);
  const ms = (f / fps) * 1000;
  const lineas = partir(palabras.map((p) => p.texto), tamano, anchoMax);
  const anchoLinea = (l: number[]) => l.reduce((a, i) => a + (palabras[i].texto.length + (a ? 1 : 0)) * tamano * GLOBO.anchoLetra, 0);
  const w = Math.max(...lineas.map(anchoLinea)) + 2 * GLOBO.padX;
  const h = lineas.length * tamano * GLOBO.interlinea + 2 * GLOBO.padY;
  // Pop de entrada y salida
  const pop = spring({ frame: local, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const salida = interpolate(local, [dur - GLOBO.sale, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const esc = pop * salida;
  // Temblor: sacudida pseudoaleatoria que cambia cada 2 frames
  const sac = (k: number) => (temblor ? temblor * Math.sin(Math.floor(local / 2) * 12.9898 + k * 78.233) : 0);
  // Colita: base en el borde del globo más cercano a la punta
  const [cx, cy] = [cola[0] - x, cola[1] - y];
  const abajo = Math.abs(cy) / h > Math.abs(cx) / w;
  const base = Math.min(90, w * GLOBO.colaBase) / 2;
  let b1: [number, number];
  let b2: [number, number];
  if (abajo) {
    const by = cy > 0 ? h / 2 - GLOBO.borde : -h / 2 + GLOBO.borde;
    const bx = Math.max(-w / 2 + GLOBO.radio + base, Math.min(w / 2 - GLOBO.radio - base, cx * 0.35));
    b1 = [bx - base, by];
    b2 = [bx + base, by];
  } else {
    const bx = cx > 0 ? w / 2 - GLOBO.borde : -w / 2 + GLOBO.borde;
    const by = Math.max(-h / 2 + GLOBO.radio + base, Math.min(h / 2 - GLOBO.radio - base, cy * 0.35));
    b1 = [bx, by - base];
    b2 = [bx, by + base];
  }
  // La colita apunta a la boca pero no llega: 80 % del camino, como mucho colaMax
  const medio = [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2];
  const dist = Math.hypot(cx - medio[0], cy - medio[1]) || 1;
  const largoCola = Math.min(dist * 0.8, GLOBO.colaMax);
  const punta: [number, number] = [medio[0] + ((cx - medio[0]) / dist) * largoCola, medio[1] + ((cy - medio[1]) / dist) * largoCola];
  const cola1 = `M${b1[0]} ${b1[1]}L${punta[0]} ${punta[1]}L${b2[0]} ${b2[1]}`;
  let n = 0;
  return (
    <g transform={`translate(${x + sac(1)} ${y + sac(2)}) ${perspectiva(giro3d * (1 - Math.min(1, pop)), cola[0] > x ? 1 : -1)} scale(${esc})`}>
      {/* Sombra */}
      <g transform={`translate(${GLOBO.sombra} ${GLOBO.sombra})`} opacity={0.25}>
        <path d={`${cola1}Z`} fill={TINTA} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={GLOBO.radio} fill={TINTA} />
      </g>
      <path d={`${cola1}Z`} fill={fondo} stroke={TINTA} strokeWidth={GLOBO.borde} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={GLOBO.radio} fill={fondo} stroke={TINTA} strokeWidth={GLOBO.borde} />
      {/* Tapa la unión de la colita con el globo */}
      <path d={`M${b1[0]} ${b1[1]}L${b2[0]} ${b2[1]}`} stroke={fondo} strokeWidth={GLOBO.borde * 1.6} />
      {lineas.map((l, li) => (
        <text
          key={li}
          x={0}
          y={-h / 2 + GLOBO.padY + tamano * GLOBO.interlinea * (li + 0.8)}
          textAnchor="middle"
          fontFamily={fuente}
          fontWeight={600}
          fontSize={tamano}
          fill={TINTA}
        >
          {l.map((i, j) => {
            const tk = tokens[n++];
            const desde = tk ? tk.fromMs : palabras[i].desdeMs;
            const visible = Math.max(0, Math.min(1, (ms - desde) / ((GLOBO.aparece * 1000) / fps) + 1));
            const texto = palabras[i].texto;
            const dura = palabras[i].hastaMs - desde;
            if (letraPorLetra && dura > LETRAS_DESDE_MS && texto.length > 3) {
              // Palabra estirada: las letras aparecen a lo largo de toda la palabra (las primeras dos de entrada)
              const n2 = Math.max(2, Math.min(texto.length, Math.floor(2 + ((ms - desde) / dura) * (texto.length - 2))));
              return (
                <tspan key={j} opacity={visible}>
                  {j > 0 ? " " : ""}
                  {texto.slice(0, n2)}
                  <tspan opacity={0}>{texto.slice(n2)}</tspan>
                </tspan>
              );
            }
            return (
              <tspan key={j} opacity={visible}>
                {j > 0 ? " " : ""}
                {texto}
              </tspan>
            );
          })}
        </text>
      ))}
    </g>
  );
};

// Giro en perspectiva aproximado en 2D (rotateY): se angosta y el borde lejano se inclina
const perspectiva = (grados: number, lado: number) => {
  if (!grados) return "";
  const r = (grados * Math.PI) / 180;
  return `matrix(${Math.cos(r).toFixed(4)} ${(lado * Math.sin(r) * 0.18).toFixed(4)} 0 1 0 0)`;
};

const LETRAS_DESDE_MS = 450; // palabras que duran más que esto se escriben letra por letra (con letraPorLetra)

// ---------- Sticker de onomatopeya ----------
const STICKER = { puntas: 14, entra: 10, queda: 30, sale: 8, tiembla: 4 };

export const duracionSticker = () => STICKER.entra + STICKER.queda + STICKER.sale;

export const StickerOnomatopeya: React.FC<{
  texto: string;
  f: number; // frame relativo al golpe
  fps: number;
  x: number;
  y: number;
  fuente: string;
  tamano?: number;
  rot?: number;
  colores?: { fondo: string; borde: string; letra: string };
  volumen?: number; // capas de extrusión (2,5D): 0 = plano
}> = ({ texto, f, fps, x, y, fuente, tamano = 120, rot = -10, colores = { fondo: "#ffd23f", borde: "#c0261f", letra: "#c0261f" }, volumen = 0 }) => {
  const dur = duracionSticker();
  if (f < 0 || f > dur) return null;
  const pop = spring({ frame: f, fps, config: { damping: 7, stiffness: 220, mass: 0.5 } });
  const salida = interpolate(f, [dur - STICKER.sale, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tiembla = f < STICKER.entra ? Math.sin(f * 2.5) * STICKER.tiembla : 0;
  const ancho = texto.length * tamano * 0.62 + tamano * 0.9;
  const alto = tamano * 1.9;
  const puntos = Array.from({ length: STICKER.puntas * 2 }, (_, i) => {
    const a = (i * Math.PI) / STICKER.puntas;
    const r = i % 2 ? 0.72 : 1;
    return `${(Math.cos(a) * ancho * r) / 2} ${(Math.sin(a) * alto * r) / 2}`;
  });
  return (
    <g transform={`translate(${x + tiembla} ${y}) rotate(${rot}) scale(${pop * salida})`}>
      {/* Extrusión: copias oscuras corridas hacia abajo a la derecha (detrás) */}
      {Array.from({ length: volumen }, (_, k) => volumen - k).map((k) => (
        <path key={k} d={`M${puntos.join("L")}Z`} transform={`translate(${k * 1.6} ${k * 2.2})`} fill={colores.borde} stroke={colores.borde} strokeWidth={10} strokeLinejoin="round" />
      ))}
      <path d={`M${puntos.join("L")}Z`} fill={colores.fondo} stroke={colores.borde} strokeWidth={10} strokeLinejoin="round" />
      {Array.from({ length: Math.ceil(volumen / 2) }, (_, k) => Math.ceil(volumen / 2) - k).map((k) => (
        <text key={k} x={k * 1.4} y={tamano * 0.36 + k * 1.8} textAnchor="middle" fontFamily={fuente} fontWeight={700} fontSize={tamano} fill="#7a1410">
          {texto}
        </text>
      ))}
      <text
        x={0}
        y={tamano * 0.36}
        textAnchor="middle"
        fontFamily={fuente}
        fontWeight={700}
        fontSize={tamano}
        fill={colores.letra}
        stroke="#ffffff"
        strokeWidth={10}
        paintOrder="stroke"
      >
        {texto}
      </text>
    </g>
  );
};
