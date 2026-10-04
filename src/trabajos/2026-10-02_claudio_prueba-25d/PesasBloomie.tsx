// Trabajo 2026-10-02_claudio_prueba-25d — Bloomie hace pesas (prueba 2,5D, 5 s, 9:16, fondo de croma verde).
// Bloomie con el rig (volumen de luz, giros ¾), la barra con discos en 2,5D (src/plantillas/comunes/objetos25d.tsx)
// y un globo de historieta con las palabras sincronizadas con su voz (Piper en_GB + Whisper → datos/frases.json).
// La barra pasa por delante del cuerpo y las manos se dibujan encima (segunda pasada del rig solo con las manos).
// La barra nunca pierde el contacto con las manos: pasa siempre por la punta de cada una (agarre), calculada con los
// huesos del rig en cada cuadro; para levantarla, las manos rotan como en un curl y la barra las sigue.
// Sobre croma no hay sombra en el piso (los keyers la ensucian); con `fondo: null` sale transparente.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { bloomie } from "../../marcas/bloomie/marca";
import { GloboHistorieta, type PalabraTiempo } from "../../plantillas/comunes/historieta";
import { Barra25D, GotaSudor } from "../../plantillas/comunes/objetos25d";
import { poseEn, puntoPersonaje, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";
import { aplicar, matricesMundo } from "../../rig/pose";
import { cargarPersonaje } from "../../rig/personajes";
import { EnEscena, type Luz, PersonajeRig } from "../../rig/Rig";
import type { PoseClave } from "../../rig/secuencia";
import frasesJson from "../../../public/trabajos/2026-10-02_claudio_prueba-25d/datos/frases.json";

export const FPS = 30;
export const DURACION = 150; // 5 s
const ANCHO = 1080;
const ALTO = 1920;
export const CROMA = "#00B140";

// ---------- Bloomie y la barra (px) ----------
const X = 540;
const PIES = 1640;
const ESCALA = 2.15; // pt del .ai → px (~820 px de alto)
const LUZ: Luz = { angulo: -135, intensidad: 0.85 };
const BARRA = { largo: 960, radio: 120 };
// Punto de agarre de cada mano: la punta de la manito (pt, en coordenadas de su pieza antes de rotar)
const AGARRE = { adentro: 10, arriba: 14 }; // desde el borde de afuera y desde abajo de la pieza

// ---------- Tiempos (frames) ----------
const AGACHADO = [0, 8];
const SUBE_CINTURA = [8, 28];
const SUBE_PECHO = [28, 40];
const F1 = 40; // "I've got to get strong for my social media debut!"
const EMPUJON = [126, 134, 142]; // sube, arriba, vuelve
const FIN = 138; // se pone contento y guiña
const GOTAS = [
  { t: [58, 84], lado: -1 },
  { t: [92, 118], lado: 1 },
];

type Frase = { n: number; texto: string; duracionMs: number; archivo: string; palabras: PalabraTiempo[]; tokens: { text: string; fromMs: number; toMs: number }[] };
const FRASE = (frasesJson as Frase[])[0];
const LARGO = Math.ceil((FRASE.duracionMs / 1000) * FPS);

const hacia = (inicio: number, dur: number, fin: number, a: PoseClave["huesos"], b: PoseClave["huesos"], extra: Partial<PoseClave> = {}) => ({
  tipo: "secuencia" as const,
  inicio,
  fin,
  duracion: dur,
  veces: 1,
  secuencia: { nombre: "transicion", ciclo: false, interpolacion: "suave" as const, poses: [{ huesos: a, dura: 1 }, { huesos: b, dura: 1, ...extra }] },
});

// Brazos siempre en diagonal (la barra los cruza en la punta, nunca queda a lo largo del brazo): el levantamiento
// lo hace sobre todo el cuerpo al pararse; los brazos suben un poco más en el empujón
const AGACHA = { cuerpo: { sy: 0.84, sx: 1.09 }, cabeza: { y: 14 }, mano_izq: { rot: 12 }, mano_der: { rot: -12 } };
const CINTURA = { cuerpo: { sy: 1.02, sx: 0.99 }, cabeza: { y: -2 }, mano_izq: { rot: 32 }, mano_der: { rot: -32 } };
const PECHO = { cuerpo: { sy: 0.97, sx: 1.02 }, cabeza: { y: 2 }, mano_izq: { rot: 45 }, mano_der: { rot: -45 } };
const ARRIBA = { cuerpo: { sy: 1.05, sx: 0.97 }, cabeza: { y: -5 }, mano_izq: { rot: 62 }, mano_der: { rot: -62 } };

export const RIG: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "enojado", // cara de esfuerzo (la boca la reemplazan las bocas al hablar)
  x: 0,
  y: 0,
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 9 },
    // Agachado mirando la barra (de ¾), la levanta hasta la cintura y después al pecho
    hacia(AGACHADO[0], 1, AGACHADO[1], AGACHA, AGACHA),
    hacia(SUBE_CINTURA[0], SUBE_CINTURA[1] - SUBE_CINTURA[0], SUBE_PECHO[0], AGACHA, CINTURA),
    hacia(SUBE_PECHO[0], SUBE_PECHO[1] - SUBE_PECHO[0], EMPUJON[0], CINTURA, PECHO),
    { tipo: "yaw", inicio: 0, fin: SUBE_CINTURA[1], valor: 0.4, duracion: SUBE_CINTURA[1], entrada: 2 },
    { tipo: "mirada", inicio: 0, fin: SUBE_CINTURA[1], x: 0.2, y: 1, duracion: SUBE_CINTURA[1], entrada: 2 },
    // Tiembla del esfuerzo mientras habla
    { tipo: "temblor", inicio: SUBE_PECHO[1], fin: EMPUJON[0], intensidad: 0.55, cada: 2, semilla: 3 },
    { tipo: "hablar", inicio: F1, fin: F1 + LARGO + 3, transcripcion: { tokens: FRASE.tokens }, idioma: "en" },
    // Último empujón (la barra se curva) y termina contento, con un guiño
    hacia(EMPUJON[0], EMPUJON[1] - EMPUJON[0], EMPUJON[1], PECHO, ARRIBA),
    hacia(EMPUJON[1], EMPUJON[2] - EMPUJON[1], DURACION, ARRIBA, PECHO),
    { tipo: "temblor", inicio: EMPUJON[0], fin: EMPUJON[1] + 4, intensidad: 1, cada: 2, semilla: 5 },
    { tipo: "expresion", nombre: "feliz", inicio: FIN, fin: DURACION },
    { tipo: "yaw", inicio: FIN, fin: DURACION, valor: -0.3, entrada: 8 },
    hacia(FIN + 2, 4, FIN + 10, {}, {}, { guino: 1 }),
  ],
};

const MANOS_SOLAS = cargarPersonaje("bloomie").piezas.vistas.frente.piezas.map((p) => p.id).filter((id) => !id.startsWith("mano_"));

// Agarre: punta de cada mano en coordenadas del personaje (pt, origen en los pies), con la pose del frame
const piezasFrente = cargarPersonaje("bloomie").piezas.vistas.frente.piezas;
const rigFrente = cargarPersonaje("bloomie").rig.vistas.frente;
const puntaMano = (id: "mano_izq" | "mano_der") => {
  const c = piezasFrente.find((p) => p.id === id)!.caja;
  return id === "mano_izq" ? [c[0] + AGARRE.adentro, c[3] - AGARRE.arriba] : [c[2] - AGARRE.adentro, c[3] - AGARRE.arriba];
};
const PUNTAS = { izq: puntaMano("mano_izq"), der: puntaMano("mano_der") };
const agarres = (pose: ReturnType<typeof poseEn>) => {
  const mundo = matricesMundo(rigFrente, pose);
  return {
    izq: aplicar(mundo[rigFrente.piezas.mano_izq], PUNTAS.izq[0], PUNTAS.izq[1]),
    der: aplicar(mundo[rigFrente.piezas.mano_der], PUNTAS.der[0], PUNTAS.der[1]),
  };
};

const curvaBarra = (f: number) =>
  interpolate(f, [SUBE_CINTURA[0], SUBE_CINTURA[0] + 6, SUBE_PECHO[1], EMPUJON[0], EMPUJON[1], EMPUJON[2]], [0, 0.35, 0.45, 0.5, 1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export type PesasBloomieProps = {
  fondo: string | null; // color de croma o null (transparente)
  efectos: { archivo: string; desde: number; volumen: number }[];
};

const MEZCLA = 0.7;

export const PesasBloomie: React.FC<PesasBloomieProps> = ({ fondo, efectos }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pose = poseEn(RIG, f, fps);
  // La barra pasa por las dos manos: centro entre los agarres e inclinación de la recta que los une
  const a = agarres(pose);
  const bx = X + ((a.izq[0] + a.der[0]) / 2) * ESCALA;
  const by = PIES + ((a.izq[1] + a.der[1]) / 2) * ESCALA;
  const inclina = (Math.atan2(a.der[1] - a.izq[1], a.der[0] - a.izq[0]) * 180) / Math.PI;
  const boca = puntoPersonaje(RIG, f, fps, "boca");
  const cabeza = puntoPersonaje(RIG, f, fps, "cabeza");
  return (
    <AbsoluteFill style={{ backgroundColor: fondo ?? "transparent" }}>
      <svg width={ANCHO} height={ALTO}>
        <EnEscena x={X} y={PIES} escala={ESCALA}>
          <PersonajeRig personaje="bloomie" pose={pose} luz={LUZ} />
        </EnEscena>
        <Barra25D x={bx} y={by} largo={BARRA.largo} radioDisco={BARRA.radio} curva={curvaBarra(f)} inclina={inclina} luz={LUZ.angulo} />
        {/* Las manos agarran la barra: se dibujan otra vez, encima */}
        <EnEscena x={X} y={PIES} escala={ESCALA}>
          <PersonajeRig personaje="bloomie" pose={pose} luz={LUZ} piezasOcultas={MANOS_SOLAS} />
        </EnEscena>
        {GOTAS.map((g, i) => (
          <GotaSudor
            key={i}
            x={X + (cabeza[0] + g.lado * 95) * ESCALA}
            y={PIES + (cabeza[1] - 40) * ESCALA}
            t={interpolate(f, g.t, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            lado={g.lado}
            tamano={30}
          />
        ))}
        <GloboHistorieta
          palabras={FRASE.palabras}
          f={f - F1}
          fps={fps}
          x={540}
          y={500}
          cola={[X + boca[0] * ESCALA, PIES + boca[1] * ESCALA]}
          fuente={bloomie.fuente}
          tamano={76}
          anchoMax={860}
          giro3d={50}
        />
      </svg>
      <Sequence from={F1} layout="none">
        <Audio src={staticFile(FRASE.archivo)} volume={() => MEZCLA} />
      </Sequence>
      {efectos.map((e, i) => (
        <Sequence key={i} from={e.desde} layout="none">
          <Audio src={staticFile(e.archivo)} volume={() => MEZCLA * e.volumen} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const CUADROS_CLAVE = [4, 24, 70, 132, 146];
