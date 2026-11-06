// Desenfoque de movimiento (motion blur), sobre @remotion/motion-blur.
//   modo "camara" → borroso realista: varias muestras dentro del obturador, sumadas. Es el mismo método que
//     <CameraMotionBlur>, reescrito acá (instantesMuestras en tramosDesenfoque.ts) porque el del paquete adelanta
//     la imagen casi un cuadro y posteriza los degradés (bandas en 3D); medido en 2026-10-23_claudio_prueba-motionblur.
//   modo "estela" → <Trail> del paquete: copias atrasadas que se desvanecen (tipo dibujo animado)
// Fuera de los `tramos` dibuja los hijos tal cual (sin costo extra); sin tramos está siempre activo.
// IMPORTANTE: el blur congela a los hijos en sub-cuadros (<Freeze>), así que lo que se mueve tiene que calcular su
// posición con useCurrentFrame DENTRO del desenfoque (no recibirla ya calculada por props): para eso está
// <PorCuadro dibujar={(f) => …} />. Nunca envolver <Audio> (se repite el sonido), <OffthreadVideo> (lo decodifica
// N veces) ni el fondo; y que ningún tramo cruce un corte (tramosRapidos ya lo respeta).
// Calidad por inputProps: --props='{"calidad":"borrador"}' → 5 muestras; "final" (por defecto) → 10.
import { Trail } from "@remotion/motion-blur";
import React from "react";
import { AbsoluteFill, Freeze, getInputProps, useCurrentFrame } from "remotion";
import { enTramos, instantesMuestras, type Tramo, tramoEn } from "./tramosDesenfoque";

export { tramosEntradaSalida, tramosRapidos, type Tramo } from "./tramosDesenfoque";

// ---------- Constantes ----------
export const MUESTRAS = { borrador: 5, final: 10 };
export const OBTURADOR = 180; // grados: 180 = medio cuadro de exposición (cine)
export const OBTURADOR_BAJO = 90; // cambios cortos (pop de pose, cartel que entra): menos borroso
export const ESTELA = { capas: 5, desfase: 1, opacidad: 1 }; // copias · cuadros entre copias · opacidad máxima

export type ModoDesenfoque = "camara" | "estela";
export type OpcionesDesenfoque = {
  modo?: ModoDesenfoque;
  muestras?: number; // fuerza la cantidad de muestras (si no, sale de la calidad)
  obturador?: number;
  tramos?: Tramo[]; // cuadros (del Sequence donde está); si no se dan, la plantilla los calcula o va siempre
  umbral?: number; // px por cuadro para los tramos automáticos (tramosRapidos)
};
// Lo que aceptan las plantillas: true = automático con los valores por defecto
export type Desenfoque = boolean | OpcionesDesenfoque;

export const opcionesDe = (d: Desenfoque | null | undefined): OpcionesDesenfoque | null => (!d ? null : d === true ? {} : d);

export const muestrasDeCalidad = (): number => {
  const p = getInputProps() as { calidad?: string };
  return p.calidad === "borrador" ? MUESTRAS.borrador : MUESTRAS.final;
};

// Dibuja lo que devuelve `dibujar` con el cuadro actual: así lo de adentro se recalcula en cada muestra del blur
export const PorCuadro: React.FC<{ dibujar: (f: number) => React.ReactNode }> = ({ dibujar }) => {
  const f = useCurrentFrame();
  return <>{dibujar(f)}</>;
};

// Modo "camara": las muestras se suman (plus-lighter) cada una con su peso. En "pantalla" cada muestra es un
// AbsoluteFill; en "bloque" (dentro del flujo del texto) se apilan en la misma celda de una grilla y ocupan lo mismo
// que los hijos.
const celda: React.CSSProperties = { gridArea: "1 / 1" };
const Camara: React.FC<{ muestras: number; obturador: number; tramo?: Tramo; capa: "pantalla" | "bloque"; children: React.ReactNode }> = ({
  muestras,
  obturador,
  tramo,
  capa,
  children,
}) => {
  const f = useCurrentFrame();
  const capas = instantesMuestras(f, muestras, obturador, tramo).map((m, i) => {
    const estilo: React.CSSProperties = { mixBlendMode: "plus-lighter", filter: `opacity(${m.peso})` };
    const hijo = <Freeze frame={m.cuadro}>{children}</Freeze>;
    return capa === "pantalla" ? (
      <AbsoluteFill key={i} style={estilo}>
        {hijo}
      </AbsoluteFill>
    ) : (
      <div key={i} style={{ ...celda, ...estilo }}>
        {hijo}
      </div>
    );
  });
  return capa === "pantalla" ? <AbsoluteFill style={{ isolation: "isolate" }}>{capas}</AbsoluteFill> : <div style={{ display: "grid", isolation: "isolate" }}>{capas}</div>;
};
const BloqueEstela: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "grid" }}>
      {Array.from({ length: ESTELA.capas }, (_, i) => (
        <div key={i} style={{ ...celda, opacity: ESTELA.opacidad - ((ESTELA.capas - i) / ESTELA.capas) * ESTELA.opacidad }}>
          <Freeze frame={f - ESTELA.desfase * (ESTELA.capas - i)}>{children}</Freeze>
        </div>
      ))}
      <div style={celda}>{children}</div>
    </div>
  );
};

export const DesenfoqueMovimiento: React.FC<
  OpcionesDesenfoque & {
    children: React.ReactNode;
    capa?: "pantalla" | "bloque"; // "pantalla" = AbsoluteFill (lo de siempre); "bloque" = en el flujo (textos)
    activo?: boolean; // false = hijos tal cual
  }
> = ({ children, modo = "camara", muestras, obturador = OBTURADOR, tramos, capa = "pantalla", activo = true }) => {
  const f = useCurrentFrame();
  const n = muestras ?? muestrasDeCalidad();
  if (!activo || !enTramos(tramos, f) || n <= 1) {
    return capa === "pantalla" ? <AbsoluteFill>{children}</AbsoluteFill> : <>{children}</>;
  }
  if (modo === "camara") {
    return (
      <Camara muestras={n} obturador={obturador} tramo={tramoEn(tramos, f)} capa={capa}>
        {children}
      </Camara>
    );
  }
  return capa === "bloque" ? (
    <BloqueEstela>{children}</BloqueEstela>
  ) : (
    <Trail layers={ESTELA.capas} lagInFrames={ESTELA.desfase} trailOpacity={ESTELA.opacidad}>
      {children}
    </Trail>
  );
};

// Envoltorio para las plantillas: sin desenfoque deja los hijos exactamente como estaban (mismo árbol);
// con desenfoque usa sus tramos o, si no trae, los `tramos` que calculó la plantilla
export const ConDesenfoque: React.FC<{ desenfoque?: Desenfoque | null; tramos?: Tramo[]; obturador?: number; children: React.ReactNode }> = ({
  desenfoque,
  tramos,
  obturador,
  children,
}) => {
  const d = opcionesDe(desenfoque);
  if (!d) return <>{children}</>;
  return (
    <DesenfoqueMovimiento obturador={obturador} {...d} tramos={d.tramos ?? tramos}>
      {children}
    </DesenfoqueMovimiento>
  );
};

// Carteles: las plantillas que tienen `desenfoqueEntrada` lo pasan por contexto a sus piezas de texto
export const DesenfoqueEntrada = React.createContext<OpcionesDesenfoque | null>(null);
