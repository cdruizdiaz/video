// Trabajo 2026-10-02_claudio_rig-bloomie — prueba del sistema de rig vectorial (plantilla PersonajeRig).
// Bloomie de bruja volando en escoba: la secuencia de 24 posiciones frenéticas está escrita como poses clave en
// public/trabajos/<ID>/datos/secuencia_escoba.json (en lugar de pedirle 24 sprites a una IA).
//  - escoba-ciclo: los 24 cuadros en el lugar, lienzo recortado al personaje (reemplazo directo de la hoja de sprites)
//  - escoba-cruce: cruza la pantalla de izquierda a derecha (9:16, como lucia-bloomie-volando-escoba)
//  - habla: lip sync con la voz de Bloomie (Whisper → visemas)
import { PersonajeRig, type PersonajeRigProps, zPersonajeRig } from "../../plantillas/PersonajeRig/PersonajeRig";
import { duracionPistas, encuadreRecortado } from "../../plantillas/PersonajeRig/calculos";
import { zSecuencia } from "../../rig/secuencia";
import secuenciaEscoba from "../../../public/trabajos/2026-10-02_claudio_rig-bloomie/datos/secuencia_escoba.json";
import vozBloomie from "../../../public/trabajos/2026-10-02_claudio_rig-bloomie/datos/voz_bloomie_en.json";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-02_claudio_rig-bloomie";
const FPS = 30;
const SECUENCIA = zSecuencia.parse(secuenciaEscoba);
const POSICIONES = SECUENCIA.poses.length; // 24

// ---------- Ciclo en el lugar: un cuadro por posición ----------
const cicloBase: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "bruja",
  x: 0,
  y: 0,
  escala: 1,
  pasos: 1,
  fondo: null,
  pistas: [
    { tipo: "secuencia", secuencia: SECUENCIA, duracion: POSICIONES },
    { tipo: "temblor", intensidad: 0.5, semilla: 3 },
  ],
};
const encuadre = encuadreRecortado(cicloBase, POSICIONES, FPS, 20);
const ciclo: PersonajeRigProps = { ...cicloBase, x: encuadre.dx, y: encuadre.dy };

// ---------- Cruce de izquierda a derecha (5 s, capa transparente 9:16) ----------
const CRUCE = 150;
const cruce: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "bruja",
  x: -300,
  y: 760,
  escala: 1.15,
  pasos: 1,
  fondo: null,
  pistas: [
    { tipo: "trayecto", de: [-320, 820], a: [1400, 700], duracion: CRUCE, suave: false, arco: 120 },
    { tipo: "secuencia", secuencia: SECUENCIA, duracion: 48 }, // 24 posiciones en 1,6 s, se repite
    { tipo: "temblor", intensidad: 0.6, semilla: 5 },
  ],
};

// ---------- Habla (lip sync con Whisper) ----------
const voz = vozBloomie as { duracionMs: number; tokens: { text: string; fromMs: number; toMs: number }[] };
const HABLA = Math.ceil((voz.duracionMs / 1000) * FPS) + 20;
const habla: PersonajeRigProps = {
  personaje: "bloomie",
  vista: "frente",
  expresion: "feliz",
  x: 540,
  y: 1500,
  escala: 2,
  fondo: "#f4efe6",
  sombra: true,
  audio: { archivo: `trabajos/${ID}/audio/voz_bloomie_en_14lufs.wav`, desde: 10, volumen: 1 },
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear", semilla: 4 },
    { tipo: "expresion", nombre: "base", inicio: 10 },
    { tipo: "hablar", inicio: 10, transcripcion: voz, idioma: "en" },
    { tipo: "saludar", inicio: 8, duracion: 30, veces: 2 },
  ],
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "claudio-rig-bloomie-escoba-ciclo",
    component: PersonajeRig,
    durationInFrames: POSICIONES,
    defaultProps: ciclo,
    schema: zPersonajeRig,
    width: encuadre.width,
    height: encuadre.height,
    salida: "escoba-ciclo_alfa",
  },
  {
    id: "claudio-rig-bloomie-escoba-cruce",
    component: PersonajeRig,
    durationInFrames: CRUCE,
    defaultProps: cruce,
    schema: zPersonajeRig,
    salida: "escoba-cruce_9x16",
  },
  {
    id: "claudio-rig-bloomie-habla",
    component: PersonajeRig,
    durationInFrames: Math.max(HABLA, duracionPistas(habla)),
    defaultProps: habla,
    schema: zPersonajeRig,
    salida: "habla_9x16",
  },
];
