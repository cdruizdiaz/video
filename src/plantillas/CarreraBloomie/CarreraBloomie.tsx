// Bloomie cruza la pantalla corriendo de izquierda a derecha (capa con fondo transparente para poner
// encima de los reels). Usa el ciclo de carrera del kit (src/marcas/bloomie/carrera.ts): la fase del ciclo
// sale de la distancia recorrida, así el pie apoyado nunca patina. Para dar peso: el tronco sube y baja,
// se aplasta al pisar y se estira al impulsarse, los pétalos se atrasan, y cada pisada levanta polvito.
// Lo que cambia según la ocasión llega por props: Halloween = disfraz "bruja" + escoba + estrellas.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BloomieCorriendo, type DisfrazCarrera } from "../../marcas/bloomie/BloomieCorriendo";
import { AVANCE_CARRERA_BLOOMIE, CICLO_CARRERA_BLOOMIE, POSES_CARRERA_BLOOMIE } from "../../marcas/bloomie/carrera";
import { Brillo, COLORES_ESTELA, Estrella, Murcielago } from "../AparicionBloomie/AparicionBloomie";
import { poseCarrera } from "../PersonajeAnimado/Carrera";
import { parpadeo, tramo } from "../PersonajeAnimado/util";

// ---------- Tiempos y recorrido (frames a 30 fps) ----------
export const DURACION_CARRERA = 108; // 3,6 s
const ESCALA = 0.55;
const VELOCIDAD = AVANCE_CARRERA_BLOOMIE * ESCALA; // px por frame (pie sin patinar)
const DESDE_X = -190; // arranca afuera, a la izquierda
const PARPADEOS = [30, 74];
// ---------- Detalles ----------
const POLVO = { vida: 14, bolitas: 3, tamano: 16, color: "#efe2d0", atras: 1.4 };
const SOMBRA = { ancho: 80, alto: 12, opacidad: 0.18 };
const VELOCIDAD_LINEAS = { cantidad: 3, largo: 70, separacion: 34, opacidad: 0.45, color: "#ffffff" };
const ESTELA = { cada: 2, vida: 18, tamano: 22, mano: { x: -95, y: -95 } }; // sale de las cerdas de la escoba
const PISADAS = [0, 0.5]; // fases del ciclo en que apoya un pie (poses "contacto")
const PIE_CONTACTO = POSES_CARRERA_BLOOMIE[0].pieCerca.x;

export type CarreraBloomieProps = {
  disfraz: DisfrazCarrera;
  escoba: boolean; // la lleva en la mano
  estela: "estrellas" | "murcielagos" | "brillos" | "ninguna";
  piso: number; // altura de los pies en el cuadro (px)
  efectos: { desde: number; archivo: string; volumen: number; duracion?: number }[]; // con duracion, se repite
};

const xEn = (f: number) => DESDE_X + VELOCIDAD * f;
const faseEn = (f: number) => (VELOCIDAD * f) / ESCALA / (AVANCE_CARRERA_BLOOMIE * CICLO_CARRERA_BLOOMIE);

export const CarreraBloomie: React.FC<CarreraBloomieProps> = ({ disfraz, escoba, estela, piso, efectos }) => {
  const f = useCurrentFrame();
  const x = xEn(f);
  const pose = poseCarrera(POSES_CARRERA_BLOOMIE, faseEn(f));
  const altura = tramo(-pose.cuerpo.y, [-14, 34], [0, 1]); // 0 abajo … 1 en el vuelo

  // Polvito en cada pisada: nace donde apoya el pie y se queda atrás
  const polvo: React.ReactNode[] = [];
  for (let e = Math.max(0, f - POLVO.vida); e <= f; e++) {
    const pisa = PISADAS.some((p) => Math.floor(faseEn(e) - p) !== Math.floor(faseEn(e - 1) - p));
    if (!pisa || e === 0) continue;
    const t = (f - e) / POLVO.vida;
    const px = xEn(e) + PIE_CONTACTO * ESCALA;
    for (let b = 0; b < POLVO.bolitas; b++) {
      const r = POLVO.tamano * (0.6 + b * 0.25) * (0.5 + t);
      polvo.push(
        <circle
          key={`${e}-${b}`}
          cx={px - (b * 14 + t * 30) * POLVO.atras}
          cy={piso - 6 - b * 7 - t * 16}
          r={r}
          fill={POLVO.color}
          opacity={tramo(t, [0, 0.15, 1], [0, 0.85, 0])}
        />,
      );
    }
  }

  // Estela desde la escoba (o desde los pies si no la lleva)
  const particulas: React.ReactNode[] = [];
  if (estela !== "ninguna") {
    for (let e = Math.max(0, f - ESTELA.vida); e <= f; e += 1) {
      if (e % ESTELA.cada) continue;
      const edad = f - e;
      const q = poseCarrera(POSES_CARRERA_BLOOMIE, faseEn(e));
      const origen = escoba ? ESTELA.mano : { x: -40, y: -20 };
      const px = xEn(e) + origen.x * ESCALA - edad * 2;
      const py = piso + (origen.y + q.cuerpo.y) * ESCALA + edad * 1.4 + Math.sin(e * 1.7) * 10;
      const t = edad / ESTELA.vida;
      const tam = ESTELA.tamano * (0.6 + ((e * 7) % 5) / 8) * (1 - t * 0.7);
      const color = COLORES_ESTELA[(e / ESTELA.cada) % COLORES_ESTELA.length];
      particulas.push(
        <g key={e} transform={`translate(${px} ${py}) rotate(${e * 23 + edad * 6}) scale(${tam})`} opacity={tramo(t, [0, 0.1, 0.7, 1], [0, 1, 1, 0])}>
          {estela === "estrellas" && <Estrella color={color} />}
          {estela === "brillos" && <Brillo color={color} />}
          {estela === "murcielagos" && <Murcielago aleteo={f * 0.9 + e} />}
        </g>,
      );
    }
  }

  // Líneas de velocidad detrás del cuerpo (titilan con el paso)
  const lineas = Array.from({ length: VELOCIDAD_LINEAS.cantidad }, (_, i) => {
    const y = piso + (-150 + i * VELOCIDAD_LINEAS.separacion * 1.6 + pose.cuerpo.y) * ESCALA;
    const largo = VELOCIDAD_LINEAS.largo * (0.7 + 0.3 * Math.abs(Math.sin(f * 0.5 + i * 2)));
    const x0 = x - 110 * ESCALA - i * 12;
    return (
      <line key={i} x1={x0 - largo} x2={x0} y1={y} y2={y} stroke={VELOCIDAD_LINEAS.color} strokeWidth={6} strokeLinecap="round" opacity={VELOCIDAD_LINEAS.opacidad} />
    );
  });

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <ellipse
          cx={x}
          cy={piso + 4}
          rx={SOMBRA.ancho * (1 - altura * 0.35)}
          ry={SOMBRA.alto * (1 - altura * 0.35)}
          fill="#000"
          opacity={SOMBRA.opacidad * (1 - altura * 0.5)}
        />
        {polvo}
        {lineas}
        {particulas}
        <g transform={`translate(${x} ${piso}) scale(${ESCALA})`}>
          <BloomieCorriendo pose={pose} disfraz={disfraz} escoba={escoba} parpadeo={parpadeo(f, ...PARPADEOS)} />
        </g>
      </svg>
      {efectos.map((e, i) => (
        <Sequence key={i} from={e.desde} durationInFrames={e.duracion} layout="none">
          <Audio src={staticFile(e.archivo)} volume={() => e.volumen} loop={e.duracion !== undefined} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
