// Trabajo 2026-10-02_lucia_chiste-navidad — "Bloomie busca papel en Navidad" (guion_chiste-navidad.md).
// Bloomie con el rig vectorial (src/rig/) sobre una noche nevada (src/plantillas/Navidad/escena.tsx), con globos de
// historieta sincronizados con su voz (src/plantillas/comunes/historieta.tsx). Las frases (Piper en_GB + Whisper)
// están en public/trabajos/<ID>/datos/frases.json: sus duraciones reales marcan los tiempos de cada escena.
// Con `soloPersonaje` queda solo Bloomie, los globos, el sticker y el destello sobre fondo transparente (capa para
// Premiere / CapCut).
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { bloomie } from "../../marcas/bloomie/marca";
import { GloboHistorieta, StickerOnomatopeya, duracionGlobo, type PalabraTiempo } from "../../plantillas/comunes/historieta";
import { Arbolito, Destello, FondoNocheNevada, NAVIDAD, Nieve, puntaArbolito } from "../../plantillas/Navidad/escena";
import { poseEn, puntoPersonaje, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";
import { EnEscena, PersonajeRig } from "../../rig/Rig";
import type { PoseClave } from "../../rig/secuencia";
import frasesJson from "../../../public/trabajos/2026-10-02_lucia_chiste-navidad/datos/frases.json";

// ---------- Cuadro ----------
export const FPS = 30;
export const DURACION = 1200; // 40 s
const ANCHO = 1080;
const ALTO = 1920;
const SUELO = 1580; // pies de Bloomie y base del arbolito
const ESCALA = 1.45; // Bloomie en el piso (pt del .ai → px)
const ESCALA_ESTRELLA = 0.9; // Bloomie en la punta del árbol
const X_BLOOMIE = 540;

// ---------- Frases (Piper + Whisper) ----------
type Frase = { n: number; texto: string; duracionMs: number; archivo: string; palabras: PalabraTiempo[]; tokens: { text: string; fromMs: number; toMs: number }[] };
const FRASES = frasesJson as Frase[];
export const INICIO_FRASE = [24, 262, 462, 604, 782, 1052]; // frame en que empieza cada frase
const largo = (i: number) => Math.ceil((FRASES[i].duracionMs / 1000) * FPS);

// ---------- Escenas (frames) ----------
const E2 = 150; // Father Christmas
const E3 = 420; // reno
const SALTO = 535; // despega
const SALTO_DUR = 34;
const PLOP = SALTO + Math.round(SALTO_DUR * 0.8); // toca el piso
const SIN_DISFRAZ = 694; // gira y se saca el disfraz
const E4 = 720; // arbolito
const ARBOL = { x: 835, alto: 760, entra: E4, llega: E4 + 40 };
const CAMINA = [850, 922];
const SUBE = [924, 968]; // salto hasta la punta
const X_PIE_ARBOL = 690;

const DESTELLO = [1034, 1058];
const RISA = INICIO_FRASE[5] + largo(5) + 2;

// ---------- Globos: dónde va cada uno (centro) ----------
const GLOBOS: { x: number; y: number; ancho: number }[] = [
  { x: 540, y: 720, ancho: 780 },
  { x: 540, y: 700, ancho: 780 }, // más alto: el gorro
  { x: 540, y: 680, ancho: 780 }, // más alto: los cuernos
  { x: 540, y: 690, ancho: 780 },
  { x: 430, y: 720, ancho: 700 },
  { x: 340, y: 1060, ancho: 560 }, // a la izquierda del árbol (Bloomie está arriba, en la punta)
];
const STICKER = { x: 250, y: 900 }; // PLOP: arriba a la izquierda, sin tapar la cara

// ---------- Pistas del rig ----------
// Transición suave de una pose a otra (y queda en la segunda hasta `fin`)
const hacia = (inicio: number, dur: number, fin: number, a: PoseClave["huesos"], b: PoseClave["huesos"]) => ({
  tipo: "secuencia" as const,
  inicio,
  fin,
  duracion: dur,
  veces: 1,
  secuencia: { nombre: "transicion", ciclo: false, interpolacion: "suave" as const, poses: [{ huesos: a, dura: 1 }, { huesos: b, dura: 1 }] },
});
const giro = (inicio: number, conDisfraz?: { nombre: string | null; y?: number; hasta: number }) => [
  { tipo: "girar" as const, inicio, fin: inicio + 12, de: "frente", a: "espalda", duracion: 12 },
  { tipo: "pose" as const, inicio: inicio + 12, fin: inicio + 18, pose: { vista: "espalda", huesos: {}, dura: 1 } },
  { tipo: "girar" as const, inicio: inicio + 18, fin: inicio + 30, de: "espalda", a: "frente", duracion: 12 },
  ...(conDisfraz ? [{ tipo: "disfraz" as const, inicio: inicio + 12, fin: conDisfraz.hasta, nombre: conDisfraz.nombre, y: conDisfraz.y ?? 0 }] : []),
];

export const RIG: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "normal",
  x: 0,
  y: 0,
  escala: 1,
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 3 },
    // Escena 1: se alegra al hablar
    { tipo: "expresion", nombre: "feliz", inicio: INICIO_FRASE[0] - 4, fin: E2 },
    // Escena 2: gira y vuelve con el gorro (que le tapa un poco los ojos); se mira la panza y se pone triste
    ...giro(E2, { nombre: "navidad", y: 16, hasta: E3 + 12 }),
    { tipo: "mirada", inicio: 200, x: 0, y: 1, duracion: 64, entrada: 6 },
    hacia(200, 10, 254, { cabeza: { y: 0, rot: 0 } }, { cabeza: { y: 10, rot: 4 } }),
    hacia(254, 10, 266, { cabeza: { y: 10, rot: 4 } }, { cabeza: { y: 0, rot: 0 } }),
    { tipo: "expresion", nombre: "triste", inicio: 244, fin: E3 + 30 },
    // Escena 3: reno entusiasmado, despega, cae (¡PLOP!) y se enoja
    ...giro(E3, { nombre: "reno", hasta: SIN_DISFRAZ + 12 }),
    { tipo: "expresion", nombre: "feliz", inicio: E3 + 30, fin: PLOP + 6 },
    { tipo: "saltar", inicio: SALTO, duracion: SALTO_DUR, altura: 230 },
    { tipo: "temblor", inicio: PLOP, fin: PLOP + 18, intensidad: 1.6, cada: 2, semilla: 9 },
    { tipo: "expresion", nombre: "enojado", inicio: PLOP + 6, fin: SIN_DISFRAZ + 30 },
    ...giro(SIN_DISFRAZ),
    // Escena 4: ve el arbolito (enamorado), habla, camina y salta a la punta
    { tipo: "mirada", inicio: ARBOL.llega + 4, fin: SUBE[0], x: 1, y: -0.4, entrada: 8 },
    { tipo: "expresion", nombre: "enamorado", inicio: ARBOL.llega + 8, fin: SUBE[0] },
    { tipo: "caminar", inicio: CAMINA[0], fin: CAMINA[1], velocidad: 1.5 },
    { tipo: "saltar", inicio: SUBE[0] - 8, duracion: SUBE[1] - SUBE[0] + 10, altura: 0 },
    // Escena 5: estrella del árbol; destello en los anteojos; se ríe
    { tipo: "expresion", nombre: "feliz", inicio: SUBE[0], fin: DURACION }, // escena 5 desde que llega a la punta
    { tipo: "temblor", inicio: RISA, fin: RISA + 34, intensidad: 0.5, cada: 3, semilla: 2 },
    ...INICIO_FRASE.map((inicio, i) => ({
      tipo: "hablar" as const,
      inicio,
      fin: inicio + largo(i) + 4,
      transcripcion: { tokens: FRASES[i].tokens },
      idioma: "en" as const,
    })),
  ],
};

// Dónde está Bloomie (pies) y a qué escala, en cada frame
const lugar = (f: number) => {
  const camina = interpolate(f, CAMINA, [X_BLOOMIE, X_PIE_ARBOL], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = interpolate(f, SUBE, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const xArbol = ARBOL.x;
  const yPunta = SUELO + puntaArbolito(ARBOL.alto) + 14; // los pies apenas hundidos en la punta
  return {
    x: camina + (xArbol - camina) * t,
    y: SUELO + (yPunta - SUELO) * t - 260 * 4 * t * (1 - t),
    escala: ESCALA + (ESCALA_ESTRELLA - ESCALA) * t,
  };
};

// ---------- Componente ----------
export type ChisteNavidadProps = {
  soloPersonaje: boolean;
  musica: { archivo: string; volumen: number; bajaConVoz: number } | null; // bajaConVoz: factor durante la voz
  efectos: { archivo: string; desde: number; volumen: number; dura?: number }[]; // dura: frames (corta con fundido)
};

const MARGEN_VOZ = 8; // frames antes y después de cada frase en que la música ya está baja
const RAMPA = 8; // frames de la bajada / subida de la música
const CORTE = 8; // frames de fundido al cortar un efecto
const MEZCLA = 0.6; // ganancia general (≈ -4,4 dB): deja margen para que la suma no sature; se normaliza a -14 LUFS al final

export const ChisteNavidad: React.FC<ChisteNavidadProps> = ({ soloPersonaje, musica, efectos }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pose = poseEn(RIG, f, fps);
  const l = lugar(f);
  const enEscena = (p: [number, number]): [number, number] => [l.x + p[0] * l.escala, l.y + p[1] * l.escala];
  const boca = enEscena(puntoPersonaje(RIG, f, fps, "boca"));
  const ojos = enEscena(puntoPersonaje(RIG, f, fps, "ojos"));
  const xArbol = interpolate(f, [ARBOL.entra, ARBOL.llega], [ANCHO + 420, ARBOL.x], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });
  const estrella = interpolate(f, [SUBE[1], SUBE[1] + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Música: baja mientras habla Bloomie (ducking)
  const volumenMusica = (fr: number) => {
    if (!musica) return 0;
    const cerca = Math.max(
      0,
      ...INICIO_FRASE.map((ini, i) =>
        interpolate(fr, [ini - MARGEN_VOZ - RAMPA, ini - MARGEN_VOZ, ini + largo(i) + MARGEN_VOZ, ini + largo(i) + MARGEN_VOZ + RAMPA], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      ),
    );
    const fundido = interpolate(fr, [0, 15, DURACION - 45, DURACION], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return musica.volumen * fundido * (1 - cerca * (1 - musica.bajaConVoz));
  };

  return (
    <AbsoluteFill style={{ backgroundColor: soloPersonaje ? "transparent" : NAVIDAD.cieloArriba }}>
      <svg width={ANCHO} height={ALTO}>
        {!soloPersonaje && (
          <>
            <FondoNocheNevada ancho={ANCHO} alto={ALTO} suelo={SUELO - 40} f={f} />
            <Nieve ancho={ANCHO} alto={ALTO} f={f} capa="atras" />
            {f >= ARBOL.entra && (
              <g transform={`translate(${xArbol} ${SUELO})`}>
                <Arbolito alto={ARBOL.alto} f={f} />
              </g>
            )}
            {/* Halo de estrella detrás de Bloomie en la punta */}
            {estrella > 0 && (
              <>
                <defs>
                  <radialGradient id="halo-estrella">
                    <stop offset="0" stopColor="#fff3b0" stopOpacity={0.75} />
                    <stop offset="0.45" stopColor={NAVIDAD.dorado} stopOpacity={0.35} />
                    <stop offset="1" stopColor={NAVIDAD.dorado} stopOpacity={0} />
                  </radialGradient>
                </defs>
                <circle cx={l.x} cy={l.y - 170 * l.escala} r={300 * estrella * (1 + 0.05 * Math.sin(f * 0.2))} fill="url(#halo-estrella)" />
              </>
            )}
          </>
        )}
        {/* Sombra en el piso (mientras está en el suelo) */}
        {!soloPersonaje && f < SUBE[0] + 10 && (
          <ellipse cx={l.x} cy={SUELO + 4} rx={130 * l.escala * (1 - Math.min(0.5, -(pose.huesos.raiz?.y ?? 0) / 400))} ry={18} fill="#1d335f" opacity={0.25} />
        )}
        <EnEscena x={l.x} y={l.y} escala={l.escala}>
          <PersonajeRig personaje="bloomie" pose={pose} />
        </EnEscena>
        {!soloPersonaje && <Nieve ancho={ANCHO} alto={ALTO} f={f} capa="adelante" />}
        <Destello x={ojos[0] + 52 * l.escala} y={ojos[1] - 18 * l.escala} t={interpolate(f, DESTELLO, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} tamano={90} />
        <StickerOnomatopeya texto="PLOP!" f={f - PLOP} fps={fps} x={STICKER.x} y={STICKER.y} fuente={bloomie.fuente} tamano={115} rot={-12} />
        {FRASES.map((fr, i) => (
          <GloboHistorieta
            key={i}
            palabras={fr.palabras}
            f={f - INICIO_FRASE[i]}
            fps={fps}
            x={GLOBOS[i].x}
            y={GLOBOS[i].y}
            cola={boca}
            fuente={bloomie.fuente}
            tamano={66}
            anchoMax={GLOBOS[i].ancho}
          />
        ))}
      </svg>
      {/* Audio: voz de Bloomie, música con ducking y efectos */}
      {FRASES.map((fr, i) => (
        <Sequence key={fr.n} from={INICIO_FRASE[i]} layout="none">
          <Audio src={staticFile(fr.archivo)} volume={() => MEZCLA} />
        </Sequence>
      ))}
      {musica && <Audio src={staticFile(musica.archivo)} volume={(fr) => MEZCLA * volumenMusica(fr)} />}
      {efectos.map((e, i) => (
        <Sequence key={i} from={e.desde} durationInFrames={e.dura} layout="none">
          <Audio
            src={staticFile(e.archivo)}
            volume={(fr) =>
              MEZCLA * (e.dura ? e.volumen * interpolate(fr, [e.dura - CORTE, e.dura], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : e.volumen)
            }
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Momentos de los efectos (para composiciones.ts)
export const MOMENTOS = { giros: [E2, E3, SIN_DISFRAZ], arbol: ARBOL.entra, salto: SALTO, plop: PLOP, camina: CAMINA, sube: SUBE, destello: DESTELLO[0], risa: RISA };

// Frames clave por escena (para la hoja de revisión)
export const CUADROS_CLAVE = [
  INICIO_FRASE[0] + 50,
  INICIO_FRASE[1] + 40,
  PLOP + 8,
  INICIO_FRASE[4] + 40,
  INICIO_FRASE[5] + 80,
];
export const duracionGlobos = FRASES.map((fr) => duracionGlobo(fr.palabras, FPS));
