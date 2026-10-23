// Composiciones del trabajo 2026-10-20_claudio_motion-graphic-prueba: promo de HiperPrecios (15 s, 9:16) con
// la plantilla MotionGraphicRitmo. Datos: pulsos de la música (preparar_musica.sh → datos/pulsos.json) y una voz
// por frase (scripts/voz.mjs → datos/voz_N.json de Whisper y datos/voz_N_rhubarb.json). Cada frase arranca en un
// pulso de la música.
import pulsos from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/pulsos.json";
import voz1 from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_1.json";
import voz1r from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_1_rhubarb.json";
import voz2 from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_2.json";
import voz2r from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_2_rhubarb.json";
import voz3 from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_3.json";
import voz3r from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_3_rhubarb.json";
import voz4 from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_4.json";
import voz4r from "../../../public/trabajos/2026-10-20_claudio_motion-graphic-prueba/datos/voz_4_rhubarb.json";
import { MotionGraphicRitmo, type MotionGraphicRitmoProps } from "../../plantillas/MotionGraphicRitmo/MotionGraphicRitmo";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-10-20_claudio_motion-graphic-prueba";
const FPS = 30;
const DURACION = 15 * FPS;
// Inicio de cada frase (s): dos en compás y dos en pulso, para que no se pisen
const INICIOS = [1.44, 3.715, 7.152, 10.008];

const voces = [
  [voz1, voz1r],
  [voz2, voz2r],
  [voz3, voz3r],
  [voz4, voz4r],
].map(([w, r], i) => ({
  archivo: `trabajos/${ID}/audio/voz_${i + 1}.wav`,
  desde: INICIOS[i],
  duracion: (r as { duracion: number }).duracion,
  tokens: (w as { tokens: { text: string; fromMs: number; toMs: number; dtwMs?: number }[] }).tokens,
  rhubarb: r as { mouthCues: { start: number; end: number; value: string }[] },
}));

const props: MotionGraphicRitmoProps = {
  musica: { archivo: `trabajos/${ID}/audio/musica_15s.wav`, volumen: 1, bajoVoz: -8 },
  pulsos,
  voces,
  bloques: [
    {
      expresion: "preocupado",
      lineas: [
        { texto: "¿Cansado de", palabra: "cansado", voz: 0 },
        { texto: "pagar de más?", palabra: "pagar", voz: 0, estilo: "acento" },
      ],
    },
    {
      expresion: "feliz",
      lineas: [
        { texto: "El mejor precio", palabra: "mejor", voz: 1 },
        { texto: "al instante", palabra: "instant", voz: 1 },
        { texto: "HiperPrecios", palabra: "hiper", voz: 1, estilo: "marca" },
      ],
    },
    {
      expresion: "guino",
      lineas: [
        { texto: "Inteligencia", palabra: "intel", voz: 2, estilo: "acento" },
        { texto: "aplicada a", palabra: "aplic", voz: 2 },
        { texto: "tu bolsillo", palabra: "bolsillo", voz: 2 },
      ],
    },
    {
      expresion: "feliz",
      lineas: [{ texto: "Probalo gratis", palabra: "probalo", voz: 3 }],
    },
  ],
  cta: { boton: "hiperprecios.ar", color: "#FFD60A" },
  fondo: { tipo: "gondola", rotulo: "HiperPrecios" }, // cuando llegue super_base_01.mp4: { tipo: "video", video, recorte } (ver TRABAJO.md)
  personaje: {
    nombre: "bloomie",
    x: 540,
    y: 1650,
    escala: 1.9,
    // Pose de las manos en cada compás (se alternan). mano_izq: rot + y x - = hacia afuera; mano_der: rot - y x +.
    // y negativa = sube (pt del personaje): x ±105 = afuera de los pétalos; -150 ≈ a la altura de los ojos, -230 ≈ arriba
    poses: [
      { mano_izq: { rot: 30, x: -105, y: -150 }, mano_der: { rot: -10, x: 6, y: 0 } },
      { mano_izq: { rot: 10, x: -6, y: 0 }, mano_der: { rot: -30, x: 105, y: -150 } },
      { mano_izq: { rot: 40, x: -110, y: -205 }, mano_der: { rot: -40, x: 110, y: -205 } },
      { mano_izq: { rot: 20, x: -95, y: -80 }, mano_der: { rot: -50, x: 110, y: -235 } },
    ],
  },
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "claudio-hiperprecios-promo",
    component: MotionGraphicRitmo,
    durationInFrames: DURACION,
    fps: FPS,
    defaultProps: props,
    salida: "hiperprecios-promo_9x16",
  },
];
