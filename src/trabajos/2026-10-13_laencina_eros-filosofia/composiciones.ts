// Trabajo 2026-10-13_laencina_eros-filosofia — extracto de Krishnamurti subtitulado ES/EN + cierre del taller.
import { LAENCINA_ORO } from "../../marcas/laencina/marca";
import {
  ExtractoBilingue,
  type ExtractoBilingueProps,
  type Frase,
} from "../../plantillas/ExtractoBilingue/ExtractoBilingue";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-13_laencina_eros-filosofia";
const FPS = 30;
const DURACION_S = 59; // máx. 60 s incluyendo el cierre
const AUDIO_HASTA_S = 45.7; // la voz se corta justo después de "sorrow" (45,64 s), sin que siga hablando
const CIERRE_DESDE_S = 46.0; // el cierre entra de inmediato

// Tiempos según datos/transcripcion.json (Whisper, tiempos por palabra)
const frases: Frase[] = [
  { desde: 0.1, hasta: 4.8, es: "Esta cuestión del amor es realmente algo extraordinario,", en: "So, this question of love is really an extraordinary thing," },
  { desde: 4.9, hasta: 9.2, es: "porque una mente que tiene miedo,", en: "because a mind that is frightened," },
  { desde: 9.6, hasta: 12.0, es: "obviamente, no puede amar.", en: "obviously, cannot love." },
  { desde: 12.1, hasta: 16.9, es: "Una mente ocupada en sí misma, en sus ambiciones,", en: "A mind that is self-concerned with its own ambitions," },
  { desde: 17.0, hasta: 20.7, es: "su codicia, sus miedos, su culpa, su sufrimiento,", en: "greed, fears, guilt, suffering," },
  { desde: 21.1, hasta: 26.2, es: "no tiene capacidad de amar.", en: "has no capacity to love." },
  { desde: 26.3, hasta: 31.2, es: "Una mente dividida en sí misma, que vive en fragmentos,", en: "A mind that is divided in itself, that lives in fragments," },
  { desde: 31.6, hasta: 36.5, es: "obviamente, no puede amar.", en: "obviously, cannot love." },
  { desde: 36.6, hasta: 43.9, es: "Una mente que vive en la división.", en: "A mind that lives in division." },
  { desde: 44.4, hasta: 45.8, es: "La división implica dolor.", en: "Division implies sorrow." },
];

const base: ExtractoBilingueProps = {
  video: `trabajos/${ID}/crudos/krishnamurti_amor.mp4`,
  capturaPerfil: `trabajos/${ID}/img/perfil_instagram_captura.png`,
  usuario: "@laencina.taller",
  logoEsquina: "marcas/laencina/logo-oscuro.png", // provisorio: la hoja; reemplazar por el logo que mandó el cliente
  frases,
  audioHasta: AUDIO_HASTA_S,
  cierreDesde: CIERRE_DESDE_S,
  subtitulos: true,
  marca: "laencina",
  oro: LAENCINA_ORO,
  textoCierre: {
    pregunta: "¿Te animás a discutir sobre el amor?",
    invitacionAntes: "Te esperamos en el taller",
    invitacionDestacado: "Eros y Filosofía",
    lugar: "Santa Fe, 1 de mayo 1372",
    fecha: "Inicio 3/11",
    inscripcion: "Inscribite desde el link en bio o por DM.",
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "laencina-eros-filosofia-9x16",
    component: ExtractoBilingue,
    durationInFrames: DURACION_S * FPS,
    defaultProps: base,
    salida: "eros-filosofia_9x16",
  },
  {
    id: "laencina-eros-filosofia-sinsubs-9x16",
    component: ExtractoBilingue,
    durationInFrames: DURACION_S * FPS,
    defaultProps: { ...base, subtitulos: false },
    salida: "eros-filosofia-sin-subtitulos_9x16",
  },
];
