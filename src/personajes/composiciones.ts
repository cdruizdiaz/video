// Composiciones de la biblioteca de personajes (carpeta "personajes" del Studio):
//  - personaje-<nombre>-editor-<vista>: editor del rig (pivotes, huesos, piezas) con botón para guardar rig.json
//  - personaje-<nombre>-muestrario: todas las animaciones de la biblioteca en un solo video (revisión rápida)
import { type PersonajeRigProps, PersonajeRig, zPersonajeRig } from "../plantillas/PersonajeRig/PersonajeRig";
import { duracionPistas } from "../plantillas/PersonajeRig/calculos";
import { EditorRig, propsEditor, zEditorRig } from "../rig/EditorRig";
import { DURACION_3D, Muestra3D } from "./bloomie/Muestra3D";
import { cargarPersonaje, NOMBRES_PERSONAJES, vistasDe } from "../rig/personajes";
import type { ComposicionTrabajo } from "../trabajos/tipos";

const FONDO = "#f4efe6";
const LADO = 1080; // cuadro del muestrario (1:1)
const ALTO_PERSONAJE = 620; // px que ocupa el personaje de frente

// Transcripción de demostración (sin audio): para ver las bocas en el muestrario
const DEMO_HABLA = "hola soy un personaje con rig y puedo hablar mucho";
const tokensDemo = (desdeMs: number) =>
  DEMO_HABLA.split(" ").map((w, i) => ({ text: " " + w, fromMs: desdeMs + i * 330, toMs: desdeMs + i * 330 + 270 }));

export const muestrario = (nombre: string): PersonajeRigProps => {
  const p = cargarPersonaje(nombre);
  const vistas = vistasDe(p);
  const caja = p.piezas.vistas.frente?.caja ?? Object.values(p.piezas.vistas)[0].caja;
  const escala = ALTO_PERSONAJE / (caja[3] - caja[1]);
  const expresiones = Object.keys(p.piezas.rostros).filter((r) => r !== "base");
  const pistas: PersonajeRigProps["pistas"] = [
    { tipo: "respirar" },
    { tipo: "parpadear" },
    // Expresiones: una cada 12 frames
    ...expresiones.map((e, i) => ({ tipo: "expresion" as const, nombre: e, inicio: 60 + i * 12, fin: 60 + (i + 1) * 12 })),
  ];
  let t = 60 + expresiones.length * 12 + 10;
  pistas.push({ tipo: "saludar", inicio: t, duracion: 60 });
  t += 66;
  pistas.push({ tipo: "saltar", inicio: t, duracion: 30 });
  t += 36;
  pistas.push({ tipo: "hablar", inicio: t, fin: t + 120, transcripcion: { tokens: tokensDemo(0) }, idioma: "es" });
  t += 126;
  pistas.push({ tipo: "caminar", inicio: t, fin: t + 60 });
  t += 60;
  const perfil = vistas.includes("perfil");
  const espalda = vistas.includes("espalda");
  if (perfil) {
    pistas.push({ tipo: "girar", inicio: t, fin: t + 8, de: "frente", a: "perfil", duracion: 8 });
    pistas.push({ tipo: "pose", inicio: t + 8, fin: t + 98, pose: { vista: "perfil", huesos: {}, dura: 1 } });
    pistas.push({ tipo: "correr", inicio: t + 8, fin: t + 98 });
    t += 98;
  }
  if (espalda) {
    pistas.push({ tipo: "girar", inicio: t, fin: t + 8, de: perfil ? "perfil" : "frente", a: "espalda", duracion: 8 });
    pistas.push({ tipo: "pose", inicio: t + 8, fin: t + 50, pose: { vista: "espalda", huesos: {}, dura: 1 } });
    t += 50;
    pistas.push({ tipo: "girar", inicio: t, fin: t + 8, de: "espalda", a: "frente", duracion: 8 });
    t += 8;
  }
  pistas.push({ tipo: "temblor", inicio: t, fin: t + 45, intensidad: 1 });
  pistas.push({ tipo: "expresion", inicio: t, fin: t + 45, nombre: expresiones.includes("preocupado") ? "preocupado" : expresiones[0] ?? "base" });
  t += 60;
  return {
    personaje: nombre,
    vista: "frente",
    expresion: "base",
    espejo: false,
    x: LADO / 2,
    y: LADO / 2 + ALTO_PERSONAJE / 2,
    escala,
    rot: 0,
    pasos: 1,
    fondo: FONDO,
    sombra: true,
    audio: null,
    pistas: [...pistas, { tipo: "pose", inicio: t - 1, fin: t, pose: { huesos: {}, dura: 1 } }],
  };
};

// Muestra 2,5D: giro ¾ a cada lado (yaw por profundidades) sin y con volumen de luz
export const LUZ_DEMO = { angulo: -135, intensidad: 1 }; // luz de arriba a la izquierda
export const muestra25d = (nombre: string, conLuz: boolean): PersonajeRigProps => {
  const base = muestrario(nombre);
  return {
    ...base,
    luz: conLuz ? LUZ_DEMO : null,
    pistas: [
      { tipo: "respirar" },
      { tipo: "yaw", inicio: 0, fin: 30, valor: -0.8, duracion: 30, entrada: 10 },
      { tipo: "yaw", inicio: 30, fin: 60, valor: 0.8, duracion: 30, entrada: 10 },
      { tipo: "pose", inicio: 89, fin: 90, pose: { huesos: {}, dura: 1 } },
    ],
  };
};

export const COMPOSICIONES_PERSONAJES: ComposicionTrabajo[] = NOMBRES_PERSONAJES.flatMap((nombre): ComposicionTrabajo[] => {
  const p = cargarPersonaje(nombre);
  const m = muestrario(nombre);
  return [
    ...vistasDe(p).map((v) => ({
      id: `personaje-${nombre}-editor-${v}`,
      component: EditorRig,
      durationInFrames: 120,
      defaultProps: propsEditor(nombre, v),
      schema: zEditorRig,
      width: 1080,
      height: 1080,
      salida: `editor-${v}`,
    })),
    {
      id: `personaje-${nombre}-muestra-25d`,
      component: PersonajeRig,
      durationInFrames: 90,
      defaultProps: muestra25d(nombre, true),
      schema: zPersonajeRig,
      width: LADO,
      height: LADO,
      salida: "muestra-25d_1x1",
    },
    {
      id: `personaje-${nombre}-muestrario`,
      component: PersonajeRig,
      durationInFrames: duracionPistas(m),
      defaultProps: m,
      schema: zPersonajeRig,
      width: LADO,
      height: LADO,
      salida: "muestrario_1x1",
    },
  ];
}).concat([
  {
    id: "personaje-bloomie-3d",
    component: Muestra3D,
    durationInFrames: DURACION_3D,
    defaultProps: {},
    width: 1080,
    height: 1080,
    salida: "muestra-3d_1x1",
  },
]);
