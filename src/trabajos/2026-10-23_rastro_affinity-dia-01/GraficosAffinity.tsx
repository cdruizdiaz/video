// Gráficos de "Día 1/20 probando Affinity" (RASTRO, video orgánico): lo que se ve son las grabaciones de pantalla de
// Pau en Affinity, como insertos mientras cuenta lo que hace; los gráficos propios, pocos y con la identidad de RASTRO
// (papel, tinta, turquesa; Inter):
//   Pantalla   inserto a pantalla completa: uno o varios tramos de las grabaciones (montaje), cada uno con su
//              recorte (px de la grabación 1920×1020) escalado a lo ancho, sobre el gris de la interfaz de Affinity
//   Pildoras   "el sangrado, los márgenes, si querés que tenga reglas": tres píldoras con tilde, cada una en su palabra
//   Serie      "Día 1/20 · probando Affinity": etiqueta de la serie, arriba a la izquierda, todo el video
// `y` es el BORDE DE ABAJO del gráfico. Los tiempos son cuadros desde que empieza el gráfico.
import React from "react";
import {
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { MARCAS } from "../../marcas";
import { paletaRastro } from "../../marcas/rastro/marca";

// ---------- Fuentes ----------
const INTER = MARCAS.rastro.fuente;

// ---------- Constantes ----------
const ID = "2026-10-23_rastro_affinity-dia-01";
const FPS = 30;
const R = paletaRastro;
const ENTRA = 9;
const REBOTE = 1.7;
const SOMBRA = "0 18px 44px rgba(0, 0, 0, 0.35)";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const entra = (f: number, desde = 0) =>
  interpolate(f - desde, [0, ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(REBOTE)),
  });

// ---------- Pantalla ----------
const GRABACION = { ancho: 1920, alto: 1020 };
const PANTALLA_FONDO = "#1d1d1f"; // el gris oscuro de la interfaz de Affinity
const PANTALLA_CAJA = { arriba: 170, alto: 1290 }; // zona libre: arriba de los subtítulos (y 1545)
export type Recorte = [number, number, number, number]; // x, y, ancho, alto en px de la grabación
export type TramoPantalla = {
  grabacion: string; // crudos/pantalla/<grabacion>.mp4
  desdeS: number; // segundo de la grabación en que arranca
  cuadros: number; // cuánto dura en el video (el último tramo: hasta el final del inserto)
  velocidad?: number;
  recorte: Recorte;
};
const Recortado: React.FC<{ t: TramoPantalla }> = ({ t }) => {
  const [x, y, w, h] = t.recorte;
  const escala = Math.min(1080 / w, PANTALLA_CAJA.alto / h);
  const ancho = w * escala;
  const alto = h * escala;
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - ancho) / 2,
        top: PANTALLA_CAJA.arriba + (PANTALLA_CAJA.alto - alto) / 2,
        width: ancho,
        height: alto,
        overflow: "hidden",
      }}
    >
      <OffthreadVideo
        src={staticFile(`trabajos/${ID}/crudos/pantalla/${t.grabacion}.mp4`)}
        trimBefore={Math.round(t.desdeS * FPS)}
        playbackRate={t.velocidad ?? 1}
        muted
        style={{
          position: "absolute",
          left: -x * escala,
          top: -y * escala,
          width: GRABACION.ancho * escala,
          height: GRABACION.alto * escala,
          maxWidth: "none",
        }}
      />
    </div>
  );
};
export const Pantalla: React.FC<{ tramos: TramoPantalla[]; dura: number }> = ({
  tramos,
  dura,
}) => {
  let desde = 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: PANTALLA_FONDO }}>
      {tramos.map((t, k) => {
        const ultimo = k === tramos.length - 1;
        const cuadros = ultimo ? Math.max(1, dura - desde) : t.cuadros;
        const el = (
          <Sequence
            key={k}
            from={desde}
            durationInFrames={cuadros}
            layout="none"
          >
            <Recortado t={t} />
          </Sequence>
        );
        desde += cuadros;
        return el;
      })}
    </div>
  );
};

// ---------- Píldoras con tilde ----------
const TILDE_D = "M6 13 L11 18 L20 7";
export const Pildoras: React.FC<{
  y: number;
  textos: string[];
  beats: number[];
}> = ({ y, textos, beats }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 18,
      }}
    >
      {textos.map((t, k) => {
        const s = entra(f, beats[k]);
        return (
          <div
            key={k}
            style={{ zoom: Math.max(0.001, s), opacity: s > 0.02 ? 1 : 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: R.papel,
                borderRadius: 40,
                padding: "14px 26px 14px 16px",
                boxShadow: SOMBRA,
                fontFamily: INTER,
                fontWeight: 600,
                fontSize: 50,
                color: R.tinta,
                transform: `rotate(${[-3, 2, -2][k % 3]}deg)`,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  background: R.turquesa,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={28} height={28} viewBox="0 0 26 26">
                  <path
                    d={TILDE_D}
                    fill="none"
                    stroke={R.papel}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {t}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Etiqueta de la serie ----------
export const Serie: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [4, 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 70,
        opacity: t,
        transform: `translateX(${(1 - t) * -30}px)`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: R.papel,
        borderRadius: 30,
        padding: "10px 22px 10px 14px",
        boxShadow: SOMBRA,
        fontFamily: INTER,
        fontSize: 32,
        color: R.tinta,
      }}
    >
      <div
        style={{
          background: R.turquesa,
          color: R.papel,
          fontWeight: 700,
          borderRadius: 18,
          padding: "4px 12px",
        }}
      >
        Día 1/20
      </div>
      <span style={{ fontWeight: 500 }}>probando Affinity</span>
    </div>
  );
};
