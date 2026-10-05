// Aparición de Bloomie para identificar una sección en los reels: capa con fondo transparente (se pone encima
// del reel en Premiere / CapCut). Bloomie entra volando por una esquina de arriba, se queda flotando, saluda
// y guiña, se da vuelta y se va por donde vino, dejando una estela. Todo lo que cambia según la ocasión
// (cara, estela, si va en escoba, sonidos) llega por props: Halloween = cara "bruja" + escoba + estrellas.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { PALETA_BLOOMIE, PERSONAJE_BLOOMIE, type CaraBloomie } from "../../marcas/bloomie/marca";
import { Brazo } from "../PersonajeAnimado/escenario";
import { Accesorio, Personaje } from "../PersonajeAnimado/Personaje";
import { arco, entrada, parpadeo, salida, suave, tramo } from "../PersonajeAnimado/util";

// ---------- Tiempos (frames a 30 fps) ----------
export const DURACION_APARICION = 120; // 4 s
const T = {
  entra: [0, 30], // vuela desde afuera hasta la esquina
  asienta: [30, 42], // rebote al frenar
  saluda: [38, 82], // brazo
  guina: [50, 66],
  gira: [80, 90], // se da vuelta para irse
  sale: [88, 118],
};

// ---------- Posición y tamaño (lado izquierdo; la versión derecha es el espejo) ----------
const ESCALA = 0.55;
const REPOSO = { x: 250, y: 470 }; // pies de Bloomie en la esquina
const AFUERA_ENTRA = { x: -260, y: 170 };
const AFUERA_SALE = { x: -300, y: 40 };
const FLOTA = { amplitud: 10, velocidad: 0.16 };
// Escoba montada: horizontal debajo del cuerpo (en coordenadas del personaje)
const ESCOBA = { escala: 2.3, giro: 66.4, y: -70, x: 0 };
const CAJA_ESCOBA = PERSONAJE_BLOOMIE.accesorios?.escoba?.caja ?? [0, 0, 0, 0];
const CENTRO_ESCOBA = [(CAJA_ESCOBA[0] + CAJA_ESCOBA[2]) / 2, (CAJA_ESCOBA[1] + CAJA_ESCOBA[3]) / 2];
const COLA_ESCOBA = { x: -230, y: -40 }; // de dónde sale la estela (cerdas), en coordenadas del personaje
// Brazo que saluda
const BRAZO = { x: 150, y: -120, largo: 80, grosor: 34, reposo: -20, arriba: -150, vaiven: 25 };
// Estela
const ESTELA = { cada: 2, vida: 20, tamano: 26 };

// ---------- Piezas de la estela ----------
export const Estrella: React.FC<{ color: string }> = ({ color }) => (
  <path
    d="M0 -1L0.29 -0.4L0.95 -0.31L0.48 0.15L0.59 0.81L0 0.5L-0.59 0.81L-0.48 0.15L-0.95 -0.31L-0.29 -0.4Z"
    fill={color}
    stroke="#3b2418"
    strokeWidth={0.08}
    strokeLinejoin="round"
  />
);
export const Murcielago: React.FC<{ aleteo: number }> = ({ aleteo }) => {
  const a = 0.5 + 0.5 * Math.sin(aleteo);
  return (
    <path
      d={`M0 -0.15C0.2 -0.5 0.6 ${-0.7 * a} 1.2 ${-0.5 * a}C0.95 -0.2 0.95 0.1 0.8 0.25C0.6 0.05 0.45 0.15 0.35 0.3C0.25 0.15 0.12 0.15 0 0.35C-0.12 0.15 -0.25 0.15 -0.35 0.3C-0.45 0.15 -0.6 0.05 -0.8 0.25C-0.95 0.1 -0.95 -0.2 -1.2 ${-0.5 * a}C-0.6 ${-0.7 * a} -0.2 -0.5 0 -0.15Z`}
      fill="#201f30"
    />
  );
};
export const Brillo: React.FC<{ color: string }> = ({ color }) => (
  <path d="M0 -1Q0.12 -0.12 1 0Q0.12 0.12 0 1Q-0.12 0.12 -1 0Q-0.12 -0.12 0 -1Z" fill={color} />
);
export const COLORES_ESTELA = ["#f6c748", "#ffffff", PALETA_BLOOMIE.violetaBruja, "#f6c748", PALETA_BLOOMIE.anteojos];

export type AparicionBloomieProps = {
  lado: "izquierda" | "derecha";
  cara: CaraBloomie;
  escoba: boolean; // va montado en la escoba (Halloween)
  estela: "estrellas" | "murcielagos" | "brillos" | "ninguna";
  efectos: { desde: number; archivo: string; volumen: number }[]; // rutas dentro de public/
};

// Recorrido: dónde están los pies, cuánto se inclina y para dónde mira en cada frame
const recorrido = (f: number) => {
  const tEntra = tramo(f, T.entra, [0, 1], salida);
  const tSale = tramo(f, T.sale, [0, 1], entrada);
  // entrada en curva: baja en picada y remonta hasta la esquina
  const xEntra = AFUERA_ENTRA.x + (REPOSO.x - AFUERA_ENTRA.x) * tEntra;
  const yEntra = AFUERA_ENTRA.y + (REPOSO.y - AFUERA_ENTRA.y) * tEntra + Math.sin(tEntra * Math.PI) * 90;
  const x = xEntra + (AFUERA_SALE.x - REPOSO.x) * tSale;
  const y = yEntra + (AFUERA_SALE.y - REPOSO.y) * tSale - Math.sin(tSale * Math.PI) * 60;
  const flota = Math.sin(f * FLOTA.velocidad) * FLOTA.amplitud * tramo(f, [20, 34], [0, 1]);
  const inclina = tramo(f, [0, 22, 34], [18, 10, 0], suave) + tramo(f, [T.sale[0], T.sale[0] + 10], [0, 16], suave);
  // mira a la derecha (hacia la pantalla) y gira para irse a la izquierda
  const mira = tramo(f, T.gira, [1, -1], suave);
  return { x, y: y + flota, inclina, mira };
};

export const AparicionBloomie: React.FC<AparicionBloomieProps> = ({ lado, cara, escoba, estela, efectos }) => {
  const f = useCurrentFrame();
  const p = recorrido(f);
  const golpe = tramo(f, [T.asienta[0], T.asienta[0] + 3, T.asienta[1]], [0, 1, 0]);
  const sx = (1 + golpe * 0.1) * p.mira;
  const sy = 1 - golpe * 0.1;
  const brazo =
    BRAZO.reposo +
    tramo(f, [T.saluda[0], T.saluda[0] + 8, T.saluda[1] - 8, T.saluda[1]], [0, 1, 1, 0], suave) *
      (BRAZO.arriba - BRAZO.reposo + Math.sin((f - T.saluda[0]) * 0.45) * BRAZO.vaiven);
  const guino = tramo(f, [T.guina[0], T.guina[0] + 3, T.guina[1] - 3, T.guina[1]], [0, 1, 1, 0]);
  const caraActual = f >= T.saluda[0] + 6 && f < T.gira[0] && cara === "normal" ? "feliz" : cara;

  // Estela: cada partícula nace en la cola de la escoba (o en los pies) y se desvanece
  const particulas: React.ReactNode[] = [];
  if (estela !== "ninguna") {
    for (let e = 0; e <= f; e += ESTELA.cada) {
      const edad = f - e;
      if (edad > ESTELA.vida) continue;
      const q = recorrido(e);
      const enMovimiento = e < T.entra[1] + 2 || e > T.sale[0] - 2;
      if (!enMovimiento) continue;
      const cola = escoba ? COLA_ESCOBA : { x: 0, y: -20 };
      const px = q.x + cola.x * ESCALA * q.mira;
      const py = q.y + cola.y * ESCALA + edad * 1.6 + Math.sin(e * 1.7) * 14;
      const t = edad / ESTELA.vida;
      const tam = ESTELA.tamano * (0.6 + ((e * 7) % 5) / 8) * (1 - t * 0.7);
      const op = tramo(t, [0, 0.1, 0.7, 1], [0, 1, 1, 0]);
      const color = COLORES_ESTELA[(e / ESTELA.cada) % COLORES_ESTELA.length];
      particulas.push(
        <g key={e} transform={`translate(${px} ${py}) rotate(${e * 23 + edad * 6}) scale(${tam})`} opacity={op}>
          {estela === "estrellas" && <Estrella color={color} />}
          {estela === "brillos" && <Brillo color={color} />}
          {estela === "murcielagos" && <Murcielago aleteo={f * 0.9 + e} />}
        </g>,
      );
    }
  }

  const salto = arco(f, T.gira[0], T.gira[1]) * 24; // saltito al darse vuelta
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform={lado === "derecha" ? "translate(1080 0) scale(-1 1)" : undefined}>
          {particulas}
          <g transform={`translate(${p.x} ${p.y - salto}) rotate(${p.inclina * p.mira}) scale(${ESCALA * sx} ${ESCALA * sy})`}>
            <Personaje
              datos={PERSONAJE_BLOOMIE}
              cara={caraActual}
              parpadeo={parpadeo(f, 24, 100)}
              guino={guino}
              detras={
                <Brazo
                  x={BRAZO.x}
                  y={BRAZO.y}
                  angulo={brazo}
                  largo={BRAZO.largo}
                  grosor={BRAZO.grosor}
                  color={PALETA_BLOOMIE.naranja}
                  borde={PALETA_BLOOMIE.borde}
                />
              }
              delante={
                escoba ? (
                  <g transform={`translate(${ESCOBA.x} ${ESCOBA.y}) rotate(${ESCOBA.giro}) scale(${ESCOBA.escala}) translate(${-CENTRO_ESCOBA[0]} ${-CENTRO_ESCOBA[1]})`}>
                    <Accesorio datos={PERSONAJE_BLOOMIE} nombre="escoba" />
                  </g>
                ) : null
              }
            />
          </g>
        </g>
      </svg>
      {efectos.map((e, i) => (
        <Sequence key={i} from={e.desde} layout="none">
          <Audio src={staticFile(e.archivo)} volume={() => e.volumen} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
