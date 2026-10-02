// Trabajo 2026-10-02_rastro_bloomie-creators — Bloomie presenta a las creadoras de RASTRO (guion_bloomie-creators.md).
// Video real sin modificar (tramo 61–71 s de IMG_6838.MOV, cámara fija) + Bloomie con el rig vectorial (src/rig/),
// sombra de contacto, globos de historieta sincronizados con su voz y sticker "HA HA HA!". Las frases (Piper en_GB +
// Whisper) están en public/trabajos/<ID>/datos/frases.json: sus duraciones marcan los tiempos.
// Con `soloPersonaje` queda solo Bloomie, la sombra, los globos y el sticker sobre transparente (Premiere / CapCut).
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { bloomie } from "../../marcas/bloomie/marca";
import { GloboHistorieta, StickerOnomatopeya, type PalabraTiempo } from "../../plantillas/comunes/historieta";
import { poseEn, puntoPersonaje, type PersonajeRigProps } from "../../plantillas/PersonajeRig/calculos";
import { cargarPersonaje } from "../../rig/personajes";
import { EnEscena, PersonajeRig } from "../../rig/Rig";
import type { PoseClave } from "../../rig/secuencia";
import frasesJson from "../../../public/trabajos/2026-10-02_rastro_bloomie-creators/datos/frases.json";

const ID = "2026-10-02_rastro_bloomie-creators";
export const FPS = 30;
export const DURACION = 300; // 10 s
const VIDEO = `trabajos/${ID}/crudos/tramo_61-71.mov`; // 61–71 s del original, 1080×1920, 30 fps

// ---------- Ubicación (verificada sobre el video: zona de la referencia, abajo a la derecha) ----------
const SUELO = 1895; // pies de Bloomie (bajo: así el pétalo de arriba no toca el reflector)
const X_FINAL = 790;
const X_ENTRA = -380; // fuera de cuadro
const ALTO_PX = 720; // alto de Bloomie de frente ("mediano")
const CAJA = cargarPersonaje("bloomie").piezas.vistas.frente.caja;
const ESCALA = ALTO_PX / (CAJA[3] - CAJA[1]);
const SOMBRA = { ancho: 0.36, alto: 26, opacidad: 0.34, blur: 9 }; // ancho en fracción del alto de Bloomie

// ---------- Frases ----------
type Frase = { n: number; texto: string; duracionMs: number; archivo: string; palabras: PalabraTiempo[]; tokens: { text: string; fromMs: number; toMs: number }[] };
const FRASES = frasesJson as Frase[];
const largo = (i: number) => Math.ceil((FRASES[i].duracionMs / 1000) * FPS);

// ---------- Tiempos (frames a 30 fps) ----------
const CAMINA = [0, 40]; // entra caminando de perfil
const GIRA = 40; // perfil → frente
const F1 = 54; // "Hi, I'm Bloomie."
const SALUDO = [50, 92];
const MIRA = [92, 113]; // mira a las creadoras
const F2 = 115; // "These are my creators."
const F3 = F2 + largo(1) + 2; // "They work really hard."
const F4 = F3 + largo(2) + 2; // "Hire them, please!"
const RUEGO = F4 + 26; // empieza el "please" estirado
const RISA = F4 + largo(3) - 3; // carcajada
export const INICIO_FRASE = [F1, F2, F3, F4];

// ---------- Globos: abajo a la izquierda, sobre el piso (sin tapar caras, reflector ni cámara) ----------
const GLOBOS = [
  { x: 300, y: 1560, tamano: 62, ancho: 480 },
  { x: 300, y: 1560, tamano: 62, ancho: 480 },
  { x: 300, y: 1560, tamano: 62, ancho: 480 },
  { x: 270, y: 1590, tamano: 56, ancho: 470 }, // HIRE THEM PLEEEEEASEEEE!: en mayúsculas (más presencia), sin llegar a la cara
];
const STICKER = { x: 300, y: 1560 };

// ---------- Pistas del rig ----------
const hacia = (inicio: number, dur: number, fin: number, a: PoseClave["huesos"], b: PoseClave["huesos"]) => ({
  tipo: "secuencia" as const,
  inicio,
  fin,
  duracion: dur,
  veces: 1,
  secuencia: { nombre: "transicion", ciclo: false, interpolacion: "suave" as const, poses: [{ huesos: a, dura: 1 }, { huesos: b, dura: 1 }] },
});
// Asentamiento al frenar: se aplasta, se estira un poco y vuelve (con pétalos que siguen de largo)
const asentar = (inicio: number) => ({
  tipo: "secuencia" as const,
  inicio,
  fin: inicio + 12,
  duracion: 12,
  veces: 1,
  secuencia: {
    nombre: "asentar",
    ciclo: false,
    interpolacion: "suave" as const,
    poses: [
      { huesos: { cuerpo: { sy: 1, sx: 1 }, "petalo_*": { rot: 0 } }, dura: 1 },
      { huesos: { cuerpo: { sy: 0.92, sx: 1.06 }, "petalo_*": { rot: 7 } }, dura: 1 },
      { huesos: { cuerpo: { sy: 1.03, sx: 0.98 }, "petalo_*": { rot: -4 } }, dura: 1 },
      { huesos: { cuerpo: { sy: 1, sx: 1 }, "petalo_*": { rot: 0 } }, dura: 1 },
    ],
  },
});
// Carcajada: rebota en el lugar (se aplasta al bajar) y tira la cabeza hacia atrás
const carcajada = {
  tipo: "secuencia" as const,
  inicio: RISA,
  fin: DURACION,
  duracion: 8,
  secuencia: {
    nombre: "carcajada",
    ciclo: true,
    interpolacion: "suave" as const,
    poses: [
      { huesos: { raiz: { y: 0 }, cuerpo: { sy: 0.94, sx: 1.04 }, cabeza: { rot: -6 } }, dura: 1 },
      { huesos: { raiz: { y: -22 }, cuerpo: { sy: 1.04, sx: 0.98 }, cabeza: { rot: -10 } }, dura: 1 },
    ],
  },
};

export const RIG: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "normal",
  x: 0,
  y: 0,
  escala: 1,
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 6 },
    // 1. Entra caminando de perfil, con rebote
    { tipo: "pose", inicio: 0, fin: GIRA, pose: { vista: "perfil", huesos: {}, dura: 1 } },
    { tipo: "caminar", inicio: CAMINA[0], fin: CAMINA[1], velocidad: 1.7, intensidad: 1.2 },
    // 2. Se detiene y gira a frente, con un asentamiento
    { tipo: "girar", inicio: GIRA, fin: GIRA + 10, de: "perfil", a: "frente", duracion: 10 },
    asentar(GIRA + 10),
    // 3. Saluda, alegre
    { tipo: "expresion", nombre: "feliz", inicio: GIRA + 6, fin: MIRA[0] + 2 },
    { tipo: "saludar", inicio: SALUDO[0], duracion: SALUDO[1] - SALUDO[0], mano: "mano_der", veces: 2 },
    // 4. Mira a las creadoras (atrás, a la izquierda) con admiración
    { tipo: "expresion", nombre: "enamorado", inicio: MIRA[0] + 2, fin: MIRA[1] },
    { tipo: "mirada", inicio: MIRA[0], x: -1, y: -0.8, duracion: MIRA[1] - MIRA[0], entrada: 5 },
    hacia(MIRA[0], 7, MIRA[1] - 6, { cabeza: { rot: 0 }, cuerpo: { rot: 0 } }, { cabeza: { rot: -12 }, cuerpo: { rot: -4 } }),
    hacia(MIRA[1] - 6, 7, MIRA[1] + 2, { cabeza: { rot: -12 }, cuerpo: { rot: -4 } }, { cabeza: { rot: 0 }, cuerpo: { rot: 0 } }),
    // 5. Vuelve a cámara: "These are my creators. They work really hard."
    { tipo: "expresion", nombre: "normal", inicio: MIRA[1], fin: F4 - 2 },
    // … y suplica: cara preocupada, ojos de cachorro mirando hacia arriba, cuerpo encogido, manos juntas, tiembla
    { tipo: "expresion", nombre: "preocupado", inicio: F4 - 2, fin: RISA },
    { tipo: "ojos", inicio: RUEGO - 6, fin: RISA, escala: 1.38, entrada: 6 },
    { tipo: "mirada", inicio: RUEGO - 6, fin: RISA, x: 0, y: -0.7, entrada: 6 },
    hacia(RUEGO - 8, 8, RISA, { cuerpo: { sy: 1, sx: 1 }, cabeza: { y: 0 }, mano_izq: { rot: 0 }, mano_der: { rot: 0 } }, {
      cuerpo: { sy: 0.9, sx: 1.05 },
      cabeza: { y: 8 },
      mano_izq: { rot: -38 }, // las manos bajan hacia el centro, delante del cuerpo: "manos juntas"
      mano_der: { rot: 38 },
    }),
    { tipo: "pose", inicio: RUEGO - 8, fin: RISA, pose: { huesos: {}, orden: { mano_izq: 1e5, mano_der: 1e5 }, dura: 1 } },
    { tipo: "temblor", inicio: RUEGO, fin: RISA, intensidad: 0.45, cada: 2, semilla: 4 },
    // 6. Carcajada: ojos cerrados de felicidad, rebota y tiembla
    { tipo: "expresion", nombre: "feliz", inicio: RISA, fin: DURACION },
    carcajada,
    { tipo: "temblor", inicio: RISA, fin: DURACION, intensidad: 0.8, cada: 2, semilla: 8 },
    // Voz
    ...INICIO_FRASE.map((inicio, i) => ({
      tipo: "hablar" as const,
      inicio,
      fin: inicio + largo(i) + 3,
      transcripcion: { tokens: FRASES[i].tokens },
      idioma: "en" as const,
    })),
  ],
};

const xBloomie = (f: number) =>
  interpolate(f, CAMINA, [X_ENTRA, X_FINAL], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0, 0.35, 1) });

// ---------- Componente ----------
export type BloomieCreatorsProps = {
  soloPersonaje: boolean;
  risa: { archivo: string; volumen: number } | null;
  bajaVideo: number; // volumen del audio original mientras habla Bloomie (1 = igual)
};

const MARGEN = 6; // frames antes/después de cada frase con el audio del video ya bajo
const RAMPA = 6;
const MEZCLA = 0.7; // ganancia general (margen para que la suma no sature; se normaliza a -14 LUFS al final)

export const BloomieCreators: React.FC<BloomieCreatorsProps> = ({ soloPersonaje, risa, bajaVideo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pose = poseEn(RIG, f, fps);
  const x = xBloomie(f);
  const enEscena = (p: [number, number]): [number, number] => [x + p[0] * ESCALA, SUELO + p[1] * ESCALA];
  const boca = enEscena(puntoPersonaje(RIG, f, fps, "boca"));
  const altura = Math.max(0, -(pose.huesos.raiz?.y ?? 0)); // cuánto se despega del piso
  const sombra = Math.max(0.55, 1 - altura / 60);
  const volVideo = (fr: number) => {
    const cerca = Math.max(
      0,
      ...INICIO_FRASE.map((ini, i) =>
        interpolate(fr, [ini - MARGEN - RAMPA, ini - MARGEN, ini + largo(i) + MARGEN, ini + largo(i) + MARGEN + RAMPA], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      ),
    );
    return MEZCLA * (1 - cerca * (1 - bajaVideo));
  };
  return (
    <AbsoluteFill style={{ backgroundColor: soloPersonaje ? "transparent" : "#000000" }}>
      {!soloPersonaje && <OffthreadVideo src={staticFile(VIDEO)} volume={volVideo} />}
      {soloPersonaje && <Audio src={staticFile(VIDEO)} volume={volVideo} />}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <filter id="sombra-contacto" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation={SOMBRA.blur} />
          </filter>
        </defs>
        {/* Sombra de contacto en el piso (parte de la capa de Bloomie) */}
        <ellipse
          cx={x}
          cy={SUELO - 4}
          rx={ALTO_PX * SOMBRA.ancho * sombra * pose.giro}
          ry={SOMBRA.alto * sombra}
          fill="#1a120c"
          opacity={SOMBRA.opacidad * sombra}
          filter="url(#sombra-contacto)"
        />
        <EnEscena x={x} y={SUELO} escala={ESCALA}>
          <PersonajeRig personaje="bloomie" pose={pose} />
        </EnEscena>
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
            tamano={GLOBOS[i].tamano}
            anchoMax={GLOBOS[i].ancho}
            letraPorLetra={i === 3}
            temblor={i === 3 && f >= RUEGO ? 4 : 0}
            queda={i === 3 ? 4 : undefined}
          />
        ))}
        <StickerOnomatopeya texto="HA HA HA!" f={f - (RISA + 10)} fps={fps} x={STICKER.x} y={STICKER.y} fuente={bloomie.fuente} tamano={78} rot={-8} />
      </svg>
      {FRASES.map((fr, i) => (
        <Sequence key={fr.n} from={INICIO_FRASE[i]} layout="none">
          <Audio src={staticFile(fr.archivo)} volume={() => MEZCLA} />
        </Sequence>
      ))}
      {risa && (
        <Sequence from={RISA} durationInFrames={DURACION - RISA} layout="none">
          <Audio
            src={staticFile(risa.archivo)}
            volume={(fr) => MEZCLA * risa.volumen * interpolate(fr, [DURACION - RISA - 8, DURACION - RISA], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// Cuadros clave para la hoja de revisión: entrada, saludo con globo, mirada a las creadoras, ruego, carcajada
export const CUADROS_CLAVE = [22, F1 + 24, MIRA[0] + 12, RUEGO + 22, RISA + 20];
