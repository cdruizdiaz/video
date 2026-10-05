// Trabajo 2026-10-04_claudio_prueba-mocap — prueba de la fase 2 del plan de mejoras: captura de movimiento desde
// video (scripts/rig/mocap.py) y lip sync con Rhubarb (habla: izquierda reglas por letras, derecha Rhubarb, misma voz de Piper). Material: dos tramos de 10 s de crudos archivados de
// 2026-09-29_claudio_musica (guitarrista de cuerpo entero y nene cantando en primer plano).
import { zSecuencia } from "../../rig/secuencia";
import mocapGuitarra from "../../../public/trabajos/2026-10-04_claudio_prueba-mocap/datos/mocap_guitarra.json";
import mocapNene from "../../../public/trabajos/2026-10-04_claudio_prueba-mocap/datos/mocap_nene.json";
import vozWhisper from "../../../public/trabajos/2026-10-04_claudio_prueba-mocap/datos/voz_bloomie_whisper.json";
import vozRhubarb from "../../../public/trabajos/2026-10-04_claudio_prueba-mocap/datos/voz_bloomie_rhubarb.json";
import type { ComposicionTrabajo } from "../tipos";
import { PersonajeRig, type PersonajeRigProps, zPersonajeRig } from "../../plantillas/PersonajeRig/PersonajeRig";
import { HablaComparar, type HablaCompararProps, MocapComparar, type MocapCompararProps } from "./MocapComparar";

const ID = "2026-10-04_claudio_prueba-mocap";

const comparar = (video: string, datos: { duracionCuadros: number }): MocapCompararProps => ({
  video: `trabajos/${ID}/crudos/${video}`,
  personaje: "bloomie",
  secuencia: zSecuencia.parse(datos),
  duracion: datos.duracionCuadros,
});
const guitarra = comparar("guitarra.mp4", mocapGuitarra);
const nene = comparar("nene.mp4", mocapNene);
const habla: HablaCompararProps = { audio: `trabajos/${ID}/audio/voz_bloomie.wav`, whisper: vozWhisper, rhubarb: vozRhubarb };

// Efectos de sonido automáticos: salto, cambio de cara, disfraz y giro (sonidos: true)
const sonidos: PersonajeRigProps = {
  personaje: "bloomie",
  x: 540,
  y: 1500,
  escala: 1.6,
  fondo: "#efe9df",
  sombra: true,
  sonidos: true,
  pistas: [
    { tipo: "respirar" },
    { tipo: "parpadear" },
    { tipo: "saltar", inicio: 15, duracion: 30 },
    { tipo: "expresion", inicio: 60, nombre: "feliz" },
    { tipo: "disfraz", inicio: 90, nombre: "birrete" },
    { tipo: "girar", inicio: 120, de: "frente", a: "perfil", duracion: 8 },
  ],
};

export const composiciones: ComposicionTrabajo[] = [
  { id: "claudio-prueba-mocap-guitarra", component: MocapComparar, durationInFrames: guitarra.duracion, defaultProps: guitarra, salida: "mocap-guitarra_9x16" },
  { id: "claudio-prueba-mocap-nene", component: MocapComparar, durationInFrames: nene.duracion, defaultProps: nene, salida: "mocap-nene_9x16" },
  { id: "claudio-prueba-mocap-habla", component: HablaComparar, durationInFrames: 150, defaultProps: habla, salida: "habla-letras-vs-rhubarb_9x16" },
  { id: "claudio-prueba-mocap-sonidos", component: PersonajeRig, durationInFrames: 150, defaultProps: sonidos, schema: zPersonajeRig, salida: "sonidos-auto_9x16" },
];
