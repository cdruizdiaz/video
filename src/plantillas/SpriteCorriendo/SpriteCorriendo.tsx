// Un personaje en sprites (secuencia de PNG con transparencia) cruza la pantalla corriendo de izquierda a
// derecha, como un auto de carreras: va inclinado hacia adelante, tiembla un poco por la velocidad y detrás
// levanta una estela de tierra que se queda flotando y se asienta después de que pasó.
// Capa con fondo transparente para poner encima de los reels. Sirve para cualquier hoja de sprites:
// se cambian `sprites`, `escala` y `piso`; el sonido llega por `efectos`.
// Con `volando` cruza por el aire (escoba, alfombra…): sin sombra ni inclinación, flota subiendo y bajando y
// deja una estela de humo desde `volando.humoDesde` en lugar de tierra. Con `unaVez`, la hoja no es un ciclo
// sino una actuación: se pasa una sola vez durante el cruce.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, random, staticFile, useCurrentFrame } from "remotion";
import { tramo } from "../PersonajeAnimado/util";

// ---------- Recorrido (frames a 30 fps) ----------
const INCLINACION = 6; // grados hacia adelante
const TEMBLOR = 2.5; // px de vibración vertical por la velocidad
// ---------- Tierra levantada ----------
const TIERRA = {
  pisada: 12, // cuadros del ciclo entre pisadas: en cada una sale una bocanada
  enPisada: 5, // nubes por frame en los 3 frames de la pisada
  entrePisadas: 1, // nubes por frame el resto del tiempo (polvo fino continuo)
  vida: 45, // frames que tarda cada nube en deshacerse (la última se va justo al final)
  tamano: 22, // radio inicial
  crece: 3, // cuánto se agranda al final de su vida (×)
  sube: 110, // px que sube como máximo (las más viejas, más arriba)
  atras: 70, // px que se va hacia atrás (arrastrada por el paso)
  desenfoque: 8,
  opacidad: 0.6,
  colores: ["#c9a27a", "#b8916a", "#d9c09e", "#a98059"],
};
const PIEDRITAS = { porFrame: 1, vida: 18, tamano: 5, color: "#8a6a4a", salto: 70, atras: 160 };
const SOMBRA = { ancho: 0.42, alto: 16, opacidad: 0.22 }; // ancho como fracción del sprite
// ---------- Humo (versión volando) ----------
const HUMO = {
  porFrame: 3, // bocanadas por frame mientras vuela
  vida: 45, // frames hasta deshacerse (la última se va justo al final)
  tamano: 18, // radio inicial
  crece: 4, // cuánto se agranda al final de su vida (×)
  sube: 40, // px que sube como máximo (el humo caliente)
  atras: 60, // px que se va hacia atrás
  ondula: 30, // px de ondulación vertical
  dispersion: 26, // px de variación vertical al nacer
  desenfoque: 10,
  opacidad: 0.55,
  colores: ["#f4f3f7", "#dcdbe3", "#c6c4d0", "#e9e4f2"],
};
const FLOTA_PERIODO = 40; // frames de una subida y bajada

export type SpriteCorriendoProps = {
  sprites: string[]; // rutas dentro de public/, en orden del ciclo
  anchoSprite: number; // px del PNG
  altoSprite: number;
  pieY: number; // altura de los pies dentro del PNG (px desde arriba)
  escala: number;
  piso: number; // altura de los pies en el cuadro (px)
  entra: number; // frame en que asoma por la izquierda
  sale: number; // frame en que termina de salir por la derecha
  cuadrosPorFrame: number; // velocidad del ciclo (1 = un sprite por frame de video)
  tierra: boolean;
  volando?: { flota: number; humoDesde: { x: number; y: number } }; // humoDesde en fracción del sprite
  unaVez?: boolean;
  efectos: { desde: number; archivo: string; volumen: number; duracion?: number }[];
};

export const SpriteCorriendo: React.FC<SpriteCorriendoProps> = ({
  sprites,
  anchoSprite,
  altoSprite,
  pieY,
  escala,
  piso,
  entra,
  sale,
  cuadrosPorFrame,
  tierra,
  volando,
  unaVez,
  efectos,
}) => {
  const f = useCurrentFrame();
  const ancho = anchoSprite * escala;
  const alto = altoSprite * escala;
  // x = centro del personaje: de afuera a la izquierda a afuera a la derecha, a velocidad constante
  const xEn = (e: number) => tramo(e, [entra, sale], [-ancho / 2 - 20, 1080 + ancho / 2 + 20]);
  const enCuadro = (e: number) => e >= entra && e <= sale;
  const x = xEn(f);
  const sprite = unaVez
    ? sprites[Math.min(sprites.length - 1, Math.max(0, Math.floor((f - entra) * cuadrosPorFrame)))]
    : sprites[Math.floor(f * cuadrosPorFrame) % sprites.length];
  const flotaEn = (e: number) => (volando ? Math.sin((e / FLOTA_PERIODO) * Math.PI * 2) * volando.flota : 0);
  const temblor = (random(`t${f}`) - 0.5) * 2 * TEMBLOR * (volando ? 0.4 : 1) + flotaEn(f);

  // Humo: bocanadas que salen de la escoba y quedan donde nacieron, crecen, suben un poco y se deshacen
  const humo: React.ReactNode[] = [];
  if (volando) {
    for (let e = Math.max(entra, f - HUMO.vida); e <= Math.min(f, sale); e++) {
      const edad = f - e;
      const t = edad / HUMO.vida;
      const ox = xEn(e) - ancho / 2 + volando.humoDesde.x * ancho;
      const oy = piso - pieY * escala + flotaEn(e) + volando.humoDesde.y * alto;
      for (let k = 0; k < HUMO.porFrame; k++) {
        const r = (s: string) => random(`h${s}-${e}-${k}`);
        const lento = (v: number) => 1 - (1 - v) ** 2;
        humo.push(
          <circle
            key={`h${e}-${k}`}
            cx={ox - HUMO.atras * (0.4 + r("a")) * lento(t) + (r("x") - 0.3) * 30}
            cy={oy - HUMO.sube * r("s") * lento(t) + Math.sin(e * 0.3 + k * 2.1) * HUMO.ondula * t + (r("y") - 0.5) * HUMO.dispersion}
            r={HUMO.tamano * (0.4 + r("r") ** 2 * 1.6) * tramo(t, [0, 1], [0.8, HUMO.crece])}
            fill={HUMO.colores[Math.floor(r("c") * HUMO.colores.length)]}
            opacity={HUMO.opacidad * tramo(t, [0, 0.3, 1], [0.9, 0.55, 0]) * (0.6 + r("o") * 0.4)}
          />,
        );
      }
    }
  }

  // Tierra: nubes que nacen a los pies en cada frame que corre y quedan donde nacieron
  const nubes: React.ReactNode[] = [];
  const piedras: React.ReactNode[] = [];
  if (tierra) {
    for (let e = Math.max(entra, f - TIERRA.vida); e <= Math.min(f, sale); e++) {
      const edad = f - e;
      const t = edad / TIERRA.vida;
      const pisa = Math.floor((e - entra) * cuadrosPorFrame) % TIERRA.pisada < 3;
      const cuantas = pisa ? TIERRA.enPisada : TIERRA.entrePisadas;
      for (let k = 0; k < cuantas; k++) {
        const r = (s: string) => random(`${s}-${e}-${k}`);
        const sube = TIERRA.sube * (0.2 + r("s") * 0.8) * (pisa ? 1 : 0.35) * tramo(t, [0, 1], [0, 1], (v) => 1 - (1 - v) ** 2);
        const cx = xEn(e) - ancho * 0.18 - TIERRA.atras * (0.3 + r("a")) * tramo(t, [0, 0.4], [0, 1]) + (r("x") - 0.5) * 40;
        const cy = piso - 8 - sube + (r("y") - 0.5) * 16;
        const radio = TIERRA.tamano * (0.5 + r("r") * (pisa ? 1.1 : 0.4)) * tramo(t, [0, 1], [0.5, TIERRA.crece]);
        nubes.push(
          <circle
            key={`${e}-${k}`}
            cx={cx}
            cy={cy}
            r={radio}
            fill={TIERRA.colores[Math.floor(r("c") * TIERRA.colores.length)]}
            opacity={TIERRA.opacidad * tramo(t, [0, 0.08, 0.4, 1], [0, 1, 0.55, 0])}
          />,
        );
      }
      if (edad <= PIEDRITAS.vida) {
        for (let k = 0; k < PIEDRITAS.porFrame; k++) {
          const r = (s: string) => random(`p${s}-${e}-${k}`);
          const tp = edad / PIEDRITAS.vida;
          piedras.push(
            <circle
              key={`p${e}-${k}`}
              cx={xEn(e) - ancho * 0.15 - PIEDRITAS.atras * (0.5 + r("a")) * tp}
              cy={piso - 4 - PIEDRITAS.salto * (0.5 + r("s")) * 4 * tp * (1 - tp)}
              r={PIEDRITAS.tamano * (0.6 + r("r"))}
              fill={PIEDRITAS.color}
              opacity={tramo(tp, [0, 0.8, 1], [1, 1, 0])}
            />,
          );
        }
      }
    }
  }

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute" }}>
        <defs>
          <filter id="tierra" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={TIERRA.desenfoque} />
          </filter>
          <filter id="humo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={HUMO.desenfoque} />
          </filter>
        </defs>
        {enCuadro(f) && !volando && (
          <ellipse cx={x} cy={piso + 4} rx={ancho * SOMBRA.ancho} ry={SOMBRA.alto} fill="#000" opacity={SOMBRA.opacidad} />
        )}
        <g filter="url(#tierra)">{nubes}</g>
        <g filter="url(#humo)">{humo}</g>
        {piedras}
      </svg>
      {enCuadro(f) && (
        <Img
          src={staticFile(sprite)}
          style={{
            position: "absolute",
            width: ancho,
            height: alto,
            left: x - ancho / 2,
            top: piso - pieY * escala + temblor,
            transform: `rotate(${volando ? 0 : INCLINACION}deg)`,
            transformOrigin: `50% ${(pieY / altoSprite) * 100}%`,
          }}
        />
      )}
      {efectos.map((e, i) => (
        <Sequence key={i} from={e.desde} durationInFrames={e.duracion} layout="none">
          <Audio src={staticFile(e.archivo)} volume={() => e.volumen} loop={e.duracion !== undefined} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
