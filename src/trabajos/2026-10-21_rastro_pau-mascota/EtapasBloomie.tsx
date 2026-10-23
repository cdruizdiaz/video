// Motion graphic de "Pasamos del papel, Illustrator y de Illustrator a la animación" (pedido 2026-10-21: "saca
// captura de las grabaciones de pantalla y hacé un motion graphic que muestre todas las etapas"). Mismo lenguaje que
// IdearioCei: fondo Royal Blue con flores en relieve, tarjetas, Filson. Tres tarjetas en zigzag unidas por una línea
// punteada que se dibuja, cada una entra con un pop en su palabra:
//   "Pasamos" (beat `papel`) 1 · Papel: la hoja de bocetos (img/etapa_papel.png); entra apenas termina la grabación de
//                      Navidad, sin fondo vacío (borrador D)
//   "Illustrator"      2 · Illustrator: el vectorizado sobre el boceto (etapa_vector.png), que en el segundo
//                      "Illustrator" pasa al personaje a color (etapa_color.png)
//   "animación"        3 · Animación: Bloomie saludando, del video bloomie_entrada_hola_v3 (crudos/bloomie_hola_v3.mp4,
//                      1920×1080 60 fps, fondo blanco), que no tiene el brazo cortado (borrador D; antes el rig 2D)
// Los tiempos (`beats`) son cuadros desde el inicio de la toma (composiciones.ts).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MARCAS } from "../../marcas";
import { PALETA_CEI } from "../../marcas/cei/marca";

// ---------- Constantes ----------
const ID = "2026-10-21_rastro_pau-mascota";
const C = PALETA_CEI;
const PATRON_OPACIDAD = 0.07;
const PATRON_LADO = 230;
const TARJETA = { ancho: 640, alto: 372, radio: 30, borde: 6 };
// esquina superior izquierda de cada tarjeta (zigzag; la última termina arriba de los subtítulos)
const LUGARES = [
  [60, 230],
  [380, 640],
  [60, 1050],
] as const;
const ROTULO_TAMANO = 40;
const CRUCE = 8; // cuadros del fundido vector → color
const LINEA_DIBUJO = 8; // cuadros
// video de Bloomie en su tarjeta: corrido a la derecha para que no lo tape el rótulo; arranca después de su entrada
// desde la izquierda (ya parado), así el saludo (2,25–3,75 s del video) entra en lo que dura la tarjeta
const BLOOMIE = { ancho: 640, x: 40, y: 0, desdeS: 1.8 };
const EFECTOS_VOLUMEN = 0.35;

const ease = MARCAS.cei.ease;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type BeatsEtapas = {
  papel: number;
  illustrator: number;
  illustrator2: number;
  animacion: number;
};

const Tarjeta: React.FC<{
  i: number;
  desde: number;
  rotulo: string;
  children: React.ReactNode;
}> = ({ i, desde, rotulo, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({
    frame: f - desde,
    fps,
    config: { damping: 11, stiffness: 180 },
  });
  const [x, y] = LUGARES[i];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: TARJETA.ancho,
        height: TARJETA.alto,
        borderRadius: TARJETA.radio,
        overflow: "hidden",
        border: `${TARJETA.borde}px solid ${C.hueso}`,
        backgroundColor: C.hueso,
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
        transform: `scale(${e}) rotate(${(1 - e) * (i % 2 ? 6 : -6)}deg)`,
        opacity: f >= desde ? 1 : 0,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 16,
          padding: "6px 20px",
          borderRadius: 999,
          backgroundColor: C.royal,
          color: C.hueso,
          fontFamily: MARCAS.cei.fuente,
          fontWeight: 500,
          fontSize: ROTULO_TAMANO,
        }}
      >
        <span style={{ color: C.agosto, fontWeight: 700 }}>{i + 1}</span> ·{" "}
        {rotulo}
      </div>
    </div>
  );
};

export const EtapasBloomie: React.FC<{ beats: BeatsEtapas }> = ({
  beats: b,
}) => {
  const f = useCurrentFrame();
  const cruce = interpolate(
    f,
    [b.illustrator2, b.illustrator2 + CRUCE],
    [0, 1],
    clamp,
  );
  const imagen = { width: "100%", height: "100%", objectFit: "cover" } as const;
  // centro de cada tarjeta, para la línea que las une
  const centro = (i: number) => [
    LUGARES[i][0] + TARJETA.ancho / 2,
    LUGARES[i][1] + TARJETA.alto / 2,
  ];
  const tramo = (i: number, desde: number) => {
    const [x0, y0] = centro(i);
    const [x1, y1] = centro(i + 1);
    const t = interpolate(f, [desde, desde + LINEA_DIBUJO], [0, 1], {
      ...clamp,
      easing: ease,
    });
    return (
      <line
        x1={x0}
        y1={y0}
        x2={x0 + (x1 - x0) * t}
        y2={y0 + (y1 - y0) * t}
        stroke={C.agosto}
        strokeWidth={10}
        strokeDasharray="2 22"
        strokeLinecap="round"
      />
    );
  };
  return (
    <AbsoluteFill style={{ backgroundColor: C.royal, overflow: "hidden" }}>
      {/* flores en relieve del fondo (como en el ideario) */}
      <AbsoluteFill
        style={{
          opacity: PATRON_OPACIDAD,
          transform: `translateY(${-f * 0.6}px)`,
        }}
      >
        {Array.from({ length: 6 * 11 }, (_, k) => {
          const col = k % 6;
          const fila = Math.floor(k / 6);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: col * PATRON_LADO - (fila % 2) * (PATRON_LADO / 2) + 40,
                top: fila * PATRON_LADO * 0.9 - 60,
                width: PATRON_LADO * 0.5,
                height: PATRON_LADO * 0.5,
                backgroundColor: C.hueso,
                WebkitMaskImage: `url(${staticFile(`trabajos/${ID}/img/flor.png`)})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                transform: `rotate(${(k * 37) % 90}deg)`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {tramo(0, b.illustrator - 4)}
        {tramo(1, b.animacion - 4)}
      </svg>

      <Tarjeta i={0} desde={b.papel} rotulo="Papel">
        <Img
          src={staticFile(`trabajos/${ID}/img/etapa_papel.png`)}
          style={imagen}
        />
      </Tarjeta>
      <Tarjeta i={1} desde={b.illustrator} rotulo="Illustrator">
        <Img
          src={staticFile(`trabajos/${ID}/img/etapa_vector.png`)}
          style={imagen}
        />
        <Img
          src={staticFile(`trabajos/${ID}/img/etapa_color.png`)}
          style={{ ...imagen, position: "absolute", inset: 0, opacity: cruce }}
        />
      </Tarjeta>
      <Tarjeta i={2} desde={b.animacion} rotulo="Animación">
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff" }} />
        <Sequence from={b.animacion} layout="none">
          <OffthreadVideo
            src={staticFile(`trabajos/${ID}/crudos/bloomie_hola_v3.mp4`)}
            muted
            trimBefore={Math.round(BLOOMIE.desdeS * 30)}
            style={{
              position: "absolute",
              left: (TARJETA.ancho - BLOOMIE.ancho) / 2 + BLOOMIE.x,
              top: (TARJETA.alto - (BLOOMIE.ancho * 9) / 16) / 2 + BLOOMIE.y,
              width: BLOOMIE.ancho,
            }}
          />
        </Sequence>
      </Tarjeta>

      {/* un pop por tarjeta, subiendo de tono */}
      {[b.papel, b.illustrator, b.animacion].map((desde, k) => (
        <Sequence key={k} from={desde} name={`pop etapa ${k + 1}`}>
          <Audio
            src={staticFile(`trabajos/${ID}/audio/etapa_${k + 1}.wav`)}
            volume={EFECTOS_VOLUMEN}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
