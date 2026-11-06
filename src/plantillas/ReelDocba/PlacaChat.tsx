// Placa de inicio de la usuaria (MSJwppFondonaranja.ai: conversación estilo iMessage sobre degradado naranja) animada de forma limpia y
// ajustada como la pantalla de un celular: el teclado toca los márgenes izquierdo, derecho e inferior del cuadro. Como la placa es más
// alta que el formato 9:16 una vez ampliada, se achican dos huecos vacíos (entre la cabecera y la línea, y entre "Delivered" y la barra
// de escribir) con tres tajadas de la placa; los globos viajan en las coordenadas compactadas. Cada globo se infla desde su colita y su
// texto se revela de izquierda a derecha, renglón por renglón; al final aparece "Delivered". La placa se disuelve (los globos se van
// escalonados) sobre el video de la host, que ya está corriendo debajo: en R3, ella terminando de usar el celular.
// Las piezas (placa.png, globoN.png, textoN.png, delivered.png) salen de extraer_placa.py, que descompone el .ai en capas.
import React from "react";
import { AbsoluteFill, Easing, Freeze, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

// ---------- Constantes de animación ----------
// Fondo congelado y desenfocado (opcional): el clip de la host puede arrancar con `foco` en ReelDocba con estos mismos valores.
export const FONDO_DESENFOQUE = 28; // px
export const FONDO_BRILLO = 0.78;
export const FONDO_VELO = 0.3; // opacidad del velo oscuro uniforme
export const FONDO_ESCALA = 1.05; // esconde los bordes que deja el desenfoque
type Globo = { globo: [number, number, number, number]; texto: [number, number, number, number]; renglones: [number, number][]; derecha: boolean };
// rects en unidades de página (x0, y0, x1, y1); renglones = franjas verticales del texto relativas a su recorte
type Diseno = {
  pagina: { w: number; h: number };
  teclado: { x0: number; x1: number; abajo: number }; // el teclado llena el ancho del cuadro y termina en su borde inferior
  tajA: { y0: number; y1: number }; // cabecera
  tajM: { y0: number; y1: number }; // mensajes
  globos: Globo[];
  delivered: [number, number, number, number];
};
// tajadas de la placa (y de página → y compactada): A = cabecera, M = mensajes, B = barra de escribir y teclado
const DISENOS: Record<"naranja" | "blanco", Diseno> = {
  // MSJwppFondonaranja.ai (1125x2099, degradado naranja)
  naranja: {
    pagina: { w: 1125, h: 2098.98 },
    teclado: { x0: 76, x1: 1055, abajo: 2039 },
    tajA: { y0: 0, y1: 235 },
    tajM: { y0: 300, y1: 1105 },
    globos: [
      { globo: [123, 469, 756, 645], texto: [170, 497, 676, 620], renglones: [[0, 61], [61, 123]], derecha: false },
      { globo: [441, 663, 1002, 774], texto: [478, 686, 905, 752], renglones: [[0, 66]], derecha: true },
      { globo: [123, 811, 674, 923], texto: [178, 836, 598, 902], renglones: [[0, 66]], derecha: false },
      { globo: [499, 941, 1002, 1052], texto: [534, 964, 942, 1030], renglones: [[0, 66]], derecha: true },
    ],
    delivered: [838, 1052, 978, 1104],
  },
  // MSJwppFondoblanco.ai (710x1350, fondo blanco, sin barra de estado: se achica el hueco entre "Delivered" y la barra de escribir)
  blanco: {
    pagina: { w: 710, h: 1350 },
    teclado: { x0: 4, x1: 709.9, abajo: 1350 },
    tajA: { y0: 20, y1: 200 },
    tajM: { y0: 200, y1: 765 },
    globos: [
      { globo: [32.1, 303.8, 491.9, 433.5], texto: [62, 322, 440, 418], renglones: [[0, 48], [48, 96]], derecha: false },
      { globo: [262, 443.3, 669.5, 527.2], texto: [284, 458, 606, 512], renglones: [[0, 54]], derecha: true },
      { globo: [32.1, 550, 433, 633.9], texto: [68, 566, 386, 620], renglones: [[0, 54]], derecha: false },
      { globo: [303.4, 643.7, 669.5, 727.6], texto: [324, 658, 616, 714], renglones: [[0, 56]], derecha: true },
    ],
    delivered: [548, 726, 652, 764],
  },
};
const POP = 11; // cuadros que tarda en inflarse cada globo
const REVELA = 10; // cuadros que tarda en revelarse cada renglón
const REVELA_PASO = 6; // cuadros entre un renglón y el siguiente
const REVELA_DESDE = 3; // cuadros después de inflarse el globo en que arranca el texto
const SALE = 10; // cuadros que tarda en irse cada globo
const SALE_PASO = 3; // cuadros entre la salida de un globo y el siguiente
const DISUELVE = 16; // cuadros que tarda la placa en disolverse sobre el video
const DERIVA = 0.02; // acercamiento muy leve durante todo el insert
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const entra = Easing.out(Easing.back(1.5));
const suave = Easing.out(Easing.cubic);
const sale = Easing.in(Easing.cubic);

export type PlacaChatProps = {
  carpeta: string; // dentro de public/, con placa.png, globo1-4.png, texto1-4.png y delivered.png
  frames: number[]; // cuadro local en que se infla cada globo (4)
  fondo?: { src: string; desdeS: number }; // opcional: video cuyo primer cuadro se congela y desenfoca debajo de la placa
  salidaDesde?: number; // cuadro local en que empiezan a irse los globos
  diseno?: "naranja" | "blanco"; // qué placa de la usuaria (por defecto la de fondo naranja)
};

const Pieza: React.FC<{ src: string; rect: [number, number, number, number]; style?: React.CSSProperties }> = ({ src, rect, style }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: rect[0], top: rect[1], width: rect[2] - rect[0], height: rect[3] - rect[1], ...style }} />
);

const Tajada: React.FC<{ src: string; yDestino: number; y0: number; alto: number; pagina: { w: number; h: number } }> = ({ src, yDestino, y0, alto, pagina: PAGINA }) => (
  <div style={{ position: "absolute", left: 0, top: yDestino, width: PAGINA.w, height: alto, overflow: "hidden" }}>
    <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: -y0, width: PAGINA.w, height: PAGINA.h }} />
  </div>
);

export const PlacaChat: React.FC<PlacaChatProps & { dur?: number }> = ({ carpeta, frames, fondo, salidaDesde = 116, dur = 138, diseno = "naranja" }) => {
  const frame = useCurrentFrame();
  const { pagina: PAGINA, teclado: TECLADO, tajA: TAJ_A, tajM: TAJ_M, globos: GLOBOS, delivered: DELIVERED } = DISENOS[diseno];
  const ESCALA = 1080 / (TECLADO.x1 - TECLADO.x0);
  const ALTO_U = 1920 / ESCALA; // alto del cuadro en unidades de página
  const TAJ_B_Y0 = TECLADO.abajo - (ALTO_U - (TAJ_A.y1 - TAJ_A.y0) - (TAJ_M.y1 - TAJ_M.y0)); // arranca donde hace falta para que el teclado toque el borde
  const CORTE_M = TAJ_M.y0 - (TAJ_A.y1 - TAJ_A.y0); // lo que sube la tajada de mensajes
  const FPS = 30;
  const deriva = 1 + DERIVA * interpolate(frame, [0, dur], [0, 1], clamp);
  const disuelve = interpolate(frame, [salidaDesde + 6, salidaDesde + 6 + DISUELVE], [1, 0], clamp);
  const placa = `${carpeta}/placa.png`;
  const altoA = TAJ_A.y1 - TAJ_A.y0;
  const altoM = TAJ_M.y1 - TAJ_M.y0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {fondo ? (
        <>
          <AbsoluteFill style={{ overflow: "hidden" }}>
            <Freeze frame={0}>
              <OffthreadVideo
                src={staticFile(fondo.src)}
                trimBefore={Math.round(fondo.desdeS * FPS)}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${FONDO_ESCALA})`, filter: `blur(${FONDO_DESENFOQUE}px) brightness(${FONDO_BRILLO}) saturate(1.1)` }}
              />
            </Freeze>
          </AbsoluteFill>
          <AbsoluteFill style={{ background: `rgba(24,32,38,${FONDO_VELO})` }} />
        </>
      ) : null}
      <AbsoluteFill style={{ opacity: disuelve, transform: `scale(${deriva})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: TECLADO.x1 - TECLADO.x0, height: ALTO_U, transformOrigin: "0 0", transform: `scale(${ESCALA})` }}>
          <div style={{ position: "absolute", left: -TECLADO.x0, top: 0, width: PAGINA.w, height: ALTO_U }}>
            <Tajada src={placa} yDestino={0} y0={TAJ_A.y0} alto={altoA} pagina={PAGINA} />
            <Tajada src={placa} yDestino={altoA} y0={TAJ_M.y0} alto={altoM} pagina={PAGINA} />
            <Tajada src={placa} yDestino={altoA + altoM} y0={TAJ_B_Y0} alto={ALTO_U - altoA - altoM} pagina={PAGINA} />
            {/* globos y "Delivered": en las coordenadas compactadas de la tajada de mensajes */}
            <div style={{ position: "absolute", left: 0, top: -CORTE_M, width: PAGINA.w, height: PAGINA.h }}>
              {GLOBOS.map((g, i) => {
                const f = frame - frames[i];
                if (f < 0) return null;
                const p = interpolate(f, [0, POP], [0, 1], clamp);
                const op = interpolate(f, [0, 5], [0, 1], clamp);
                const sal = sale(interpolate(frame - (salidaDesde + i * SALE_PASO), [0, SALE], [0, 1], clamp));
                const v = entra(p);
                const [gx0, gy0, gx1, gy1] = g.globo;
                const [tx0, ty0, tx1] = g.texto;
                const th = g.renglones[g.renglones.length - 1][1];
                return (
                  <div key={i} style={{ position: "absolute", inset: 0, opacity: op * (1 - sal), transform: `translateY(${(1 - suave(p)) * 14 - sal * 24}px)`, filter: sal > 0 ? `blur(${sal * 6}px)` : undefined }}>
                    <div style={{ position: "absolute", inset: 0, transformOrigin: `${g.derecha ? gx1 : gx0}px ${gy1}px`, transform: `scale(${0.7 + 0.3 * v})` }}>
                      <Pieza src={`${carpeta}/globo${i + 1}.png`} rect={[gx0, gy0, gx1, gy1]} />
                      {g.renglones.map(([y0, y1], k) => {
                        const r = suave(interpolate(f, [REVELA_DESDE + k * REVELA_PASO, REVELA_DESDE + k * REVELA_PASO + REVELA], [0, 1], clamp));
                        return (
                          <div key={k} style={{ position: "absolute", left: tx0, top: ty0, width: tx1 - tx0, height: th, clipPath: `inset(${y0}px ${(1 - r) * (tx1 - tx0)}px ${th - y1}px 0)` }}>
                            <Img src={staticFile(`${carpeta}/texto${i + 1}.png`)} style={{ position: "absolute", left: 0, top: 0, width: tx1 - tx0, height: th }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const f = frame - (frames[3] + 16);
                if (f < 0) return null;
                const p = suave(interpolate(f, [0, 9], [0, 1], clamp));
                const sal = sale(interpolate(frame - (salidaDesde + 4 * SALE_PASO - 6), [0, SALE], [0, 1], clamp));
                return <Pieza src={`${carpeta}/delivered.png`} rect={DELIVERED} style={{ opacity: p * (1 - sal), transform: `translateY(${(1 - p) * 8}px)` }} />;
              })()}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
