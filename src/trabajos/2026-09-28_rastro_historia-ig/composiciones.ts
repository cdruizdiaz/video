// Trabajo 2026-09-28_rastro_historia-ig — historia de Instagram de RASTRO (plantilla HistoriaMarca).
import {
  duracionHistoria,
  type Escena,
  HistoriaMarca,
  type HistoriaMarcaProps,
} from "../../plantillas/HistoriaMarca/HistoriaMarca";
import type { ComposicionTrabajo } from "../tipos";

const ID = "2026-09-28_rastro_historia-ig";
const AUDIO = `trabajos/${ID}/audio`;
const M = "marcas/rastro";

// Contenido de las 6 escenas (duraciones en frames a 30 fps, según la versión)
const escenas = (d: [number, number, number, number, number, number]): Escena[] => [
  {
    tipo: "portada",
    dura: d[0],
    foto: `${M}/portada-estudio.jpg`,
    etiqueta: "Somos Rastro",
    titulo: ["Menos ruido.", "Más historias."],
    subtitulo: "Comunicación que deja marca.",
    pie: "Diseño · Contenido · Estrategia",
  },
  {
    tipo: "equipo",
    dura: d[1],
    numero: "01",
    titulo: ["Un equipo.", "Muchas miradas."],
    fotos: [`${M}/equipo-lula.jpg`, `${M}/equipo-pau.jpg`, `${M}/equipo-sere.jpg`, `${M}/equipo-luco.jpg`],
    texto: ["Creatividad y tecnología para", "marcas y proyectos de Argentina."],
    pie: "Lo pensamos juntas",
  },
  {
    tipo: "pieza",
    dura: d[2],
    numero: "02",
    titulo: ["Tu marca,", "en movimiento."],
    imagen: `${M}/servicio-01.png`,
    texto: ["Reels y carruseles.", "Manejo de redes sociales."],
    pie: "Contenido con identidad",
  },
  {
    tipo: "pieza",
    dura: d[3],
    numero: "03",
    titulo: ["Una identidad", "que se reconoce."],
    imagen: `${M}/servicio-04.png`,
    texto: ["Branding · Marca personal", "Diseño gráfico"],
    pie: "Tu esencia, en cada detalle",
    inclinacion: -7,
  },
  {
    tipo: "pieza",
    dura: d[4],
    numero: "04",
    titulo: ["Cada palabra.", "Con intención."],
    imagen: `${M}/servicio-06.png`,
    texto: ["Estrategia de contenido", "Copywriting · Newsletter"],
    pie: "Historias que conectan",
    oscura: true,
  },
  {
    tipo: "contacto",
    dura: d[5],
    etiqueta: "Tu próxima historia empieza acá.",
    titulo: ["¿Tenés", "una idea?"],
    subtitulo: "Dejemos rastro.",
    boton: "HABLEMOS",
    url: "somosrastro.com.ar",
    usuario: "@somos_rastro",
  },
];

const historia30: HistoriaMarcaProps = {
  marca: "rastro",
  musica: `${AUDIO}/rastro-base.wav`, // compuesta por código: musica_rastro.py <salida> 30
  ritmo: 1,
  escenas: escenas([120, 120, 150, 150, 150, 210]), // 4 + 4 + 5 + 5 + 5 + 7 s
};

const historia15: HistoriaMarcaProps = {
  marca: "rastro",
  // Mixkit "Happy Home" (id 801), tramo 93,7–108,7 s: preparar_musica_15s.sh
  musica: `${AUDIO}/rastro-mixkit-15s.wav`,
  ritmo: 0.45,
  escenas: escenas([75, 75, 60, 60, 60, 120]), // 2,5 + 2,5 + 2 + 2 + 2 + 4 s
};

export const composiciones: ComposicionTrabajo[] = [
  {
    id: "rastro-historia-ig-30s",
    component: HistoriaMarca,
    durationInFrames: duracionHistoria(historia30),
    defaultProps: historia30,
    salida: "historia-30s_9x16",
  },
  {
    id: "rastro-historia-ig-15s",
    component: HistoriaMarca,
    durationInFrames: duracionHistoria(historia15),
    defaultProps: historia15,
    salida: "historia-15s_9x16",
  },
];
