// Prueba del desenfoque de movimiento: Bloomie (rig) cruza la pantalla de un salto en 1 s y un título entra y sale
// de golpe. Variantes: sin blur, "camara" (CameraMotionBlur) y "estela" (Trail). La comparativa pone las tres en una
// grilla 2×2 (la cuarta celda dice qué es cada una); solo la primera celda lleva sonido.
import { loadFont } from "@remotion/google-fonts/Fredoka";
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { ConDesenfoque, type ModoDesenfoque, PorCuadro, tramosRapidos } from "../../plantillas/comunes/Desenfoque";
import { PersonajeRig, type PersonajeRigProps } from "../../plantillas/PersonajeRig/PersonajeRig";

const { fontFamily } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

// ---------- Constantes ----------
export const DURACION = 105;
const FONDO = "#f4efe6";
const TINTA = "#2b2340";
const ACENTO = "#ff6b4a";
const SALTO = { desde: 15, dura: 30, de: [220, 1520], a: [840, 1520], altura: 300 }; // cruza en 1 s (pt de altura del salto)
const TITULO = { entra: 50, entraDura: 5, sale: 92, saleDura: 5, y: 520, tam: 170 };
const WHOOSH = "biblioteca/sfx/mixkit/mixkit-1492-cinematic-whoosh-fast-transition.wav";
const WHOOSH_VOL = 0.5;
const ETIQUETAS: Record<Variante, string> = { sin: "sin blur", camara: "cámara", estela: "estela" };

export type Variante = "sin" | ModoDesenfoque;

export const rig = (variante: Variante, sonidos: boolean): PersonajeRigProps => ({
  personaje: "bloomie",
  x: SALTO.de[0],
  y: SALTO.de[1],
  escala: 1.4,
  expresion: "feliz",
  sombra: true,
  sonidos,
  desenfoque: variante === "sin" ? false : { modo: variante },
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 3 },
    { tipo: "saltar", inicio: SALTO.desde, duracion: SALTO.dura, altura: SALTO.altura },
    { tipo: "trayecto", inicio: SALTO.desde, duracion: SALTO.dura, de: SALTO.de, a: SALTO.a },
  ],
});

// Título: baja de golpe desde arriba y se va de golpe hacia la derecha
const tituloEn = (f: number) => {
  const baja = interpolate(f, [TITULO.entra, TITULO.entra + TITULO.entraDura], [-300, TITULO.y], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.6)),
  });
  const x = interpolate(f, [TITULO.sale, TITULO.sale + TITULO.saleDura], [540, 1800], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return { x, y: baja };
};
const POSICIONES_TITULO = Array.from({ length: DURACION }, (_, f): [number, number] => {
  const p = tituloEn(f);
  return [p.x, p.y];
});
const TRAMOS_TITULO = tramosRapidos(POSICIONES_TITULO);

const Titulo: React.FC<{ f: number }> = ({ f }) => {
  const p = tituloEn(f);
  if (f < TITULO.entra) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        transform: "translate(-50%, -50%) rotate(-4deg)",
        fontFamily,
        fontWeight: 700,
        fontSize: TITULO.tam,
        color: FONDO,
        background: ACENTO,
        padding: "10px 50px 20px",
        borderRadius: 40,
        whiteSpace: "nowrap",
        boxShadow: `0 12px 0 ${TINTA}`,
      }}
    >
      ¡ZAS!
    </div>
  );
};

export const PruebaMotionBlur: React.FC<{ variante: Variante; mudo?: boolean; etiqueta?: boolean }> = ({ variante, mudo = false, etiqueta = false }) => (
  <AbsoluteFill style={{ backgroundColor: FONDO }}>
    <PersonajeRig {...rig(variante, !mudo)} />
    <ConDesenfoque desenfoque={variante === "sin" ? false : { modo: variante }} tramos={TRAMOS_TITULO}>
      <PorCuadro dibujar={(f) => <Titulo f={f} />} />
    </ConDesenfoque>
    {etiqueta && (
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily, fontWeight: 700, fontSize: 96, color: TINTA }}>
        {ETIQUETAS[variante]}
      </div>
    )}
    {!mudo && (
      <Sequence from={TITULO.entra - 3} layout="none" name="whoosh">
        <Audio src={staticFile(WHOOSH)} volume={WHOOSH_VOL} />
      </Sequence>
    )}
  </AbsoluteFill>
);

// Comparativa 2×2: cada celda es la composición entera a la mitad
const Celda: React.FC<{ col: number; fila: number; children: React.ReactNode }> = ({ col, fila, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: (col * width) / 2, top: (fila * height) / 2, width: width / 2, height: height / 2, overflow: "hidden", outline: `3px solid ${TINTA}` }}>
      <div style={{ width, height, transform: "scale(0.5)", transformOrigin: "0 0", position: "relative" }}>{children}</div>
    </div>
  );
};

export const ComparativaMotionBlur: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: TINTA }}>
    <Celda col={0} fila={0}>
      <PruebaMotionBlur variante="sin" etiqueta />
    </Celda>
    <Celda col={1} fila={0}>
      <PruebaMotionBlur variante="camara" etiqueta mudo />
    </Celda>
    <Celda col={0} fila={1}>
      <PruebaMotionBlur variante="estela" etiqueta mudo />
    </Celda>
    <Celda col={1} fila={1}>
      <AbsoluteFill style={{ backgroundColor: FONDO, justifyContent: "center", alignItems: "center", fontFamily, color: TINTA, textAlign: "center" }}>
        <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1.05 }}>
          motion
          <br />
          blur
        </div>
        <div style={{ fontSize: 60, marginTop: 50, lineHeight: 1.4 }}>
          sin · cámara · estela
          <br />
          solo en lo que se mueve rápido
        </div>
      </AbsoluteFill>
    </Celda>
  </AbsoluteFill>
);
