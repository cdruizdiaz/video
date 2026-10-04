// Prueba 3.1: texto grande y Bloomie DETRÁS del nene que canta (recorte de scripts/mascaras.py).
import { loadFont } from "@remotion/google-fonts/Fredoka";
import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { DetrasDePersona } from "../../plantillas/comunes/DetrasDePersona";
import { PersonajeRig } from "../../plantillas/PersonajeRig/PersonajeRig";

const { fontFamily } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

const ID = "2026-10-04_claudio_prueba-25d-video";
const DESDE = 165; // el tramo del nene (5,5 s del proxy): el recorte empieza ahí
const TEXTO = { entra: 6, dura: 14, y: 520, tamano: 330, color: "#ffd23f", borde: "#3b2418" };
const BLOOMIE = { x: 700, y: 1130, escala: 1.05, asoma: [30, 50] }; // asoma desde detrás del hombro

export const DetrasNene: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [TEXTO.entra, TEXTO.entra + TEXTO.dura], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const asoma = interpolate(f, BLOOMIE.asoma, [260, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <DetrasDePersona video={`trabajos/${ID}/crudos/nene.mp4`} recorte={`trabajos/${ID}/crudos/nene_persona.webm`} desde={DESDE}>
      <AbsoluteFill style={{ alignItems: "center", top: TEXTO.y - TEXTO.tamano / 2 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: TEXTO.tamano,
            lineHeight: 1,
            color: TEXTO.color,
            WebkitTextStroke: `14px ${TEXTO.borde}`,
            paintOrder: "stroke",
            transform: `scale(${0.6 + 0.4 * t})`,
            opacity: t,
          }}
        >
          CANTÁ
        </div>
      </AbsoluteFill>
      <PersonajeRig
        personaje="bloomie"
        x={BLOOMIE.x}
        y={BLOOMIE.y + asoma}
        escala={BLOOMIE.escala}
        fondo={null}
        pistas={[{ tipo: "respirar" }, { tipo: "parpadear" }, { tipo: "expresion", inicio: 50, nombre: "feliz" }, { tipo: "saludar", inicio: 55, duracion: 50 }]}
      />
    </DetrasDePersona>
  );
};

// Prueba 3.2: Bloomie camina por detrás del guitarrista y del teclado. El recorte "lo que está más cerca que el
// lugar donde pisa Bloomie" sale de scripts/profundidad.py --punto 800,1150 (mapa de Depth Anything V2).
const CAMINA = { de: [1180, 1150], a: [380, 1150], dura: 110, escala: 0.85 };
export const DetrasGuitarra: React.FC = () => (
  <DetrasDePersona video={`trabajos/${ID}/crudos/guitarra.mp4`} recorte={`trabajos/${ID}/crudos/guitarra_cerca.webm`} volumen={0.6}>
    <PersonajeRig
      personaje="bloomie"
      vista="perfil"
      espejo
      x={CAMINA.de[0]}
      y={CAMINA.de[1]}
      escala={CAMINA.escala}
      fondo={null}
      sombra
      sonidos
      pistas={[
        { tipo: "caminar" },
        { tipo: "parpadear" },
        { tipo: "trayecto", de: CAMINA.de, a: CAMINA.a, duracion: CAMINA.dura, suave: false },
      ]}
    />
  </DetrasDePersona>
);

// Prueba 3.3: cámara en mano (lucia70, 7–13 s). Bloomie parado en el piso, anclado con scripts/seguimiento.py:
// la cámara se corre ~270 px y Bloomie se queda en su lugar del piso (sin seguimiento "flotaría" con el cuadro).
export const AncladoCamara: React.FC<{ seguimiento: { puntos: number[][]; escala: number[]; rot: number[] } }> = ({ seguimiento }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(`trabajos/${ID}/crudos/camara.mp4`)} muted style={{ width: "100%", height: "100%" }} />
    <PersonajeRig
      personaje="bloomie"
      x={540}
      y={930}
      escala={0.62}
      fondo={null}
      sombra
      seguimiento={{ ...seguimiento, factor: 1, desde: 0 }}
      pistas={[{ tipo: "respirar" }, { tipo: "parpadear" }, { tipo: "saludar", inicio: 30, duracion: 60 }]}
    />
  </AbsoluteFill>
);
