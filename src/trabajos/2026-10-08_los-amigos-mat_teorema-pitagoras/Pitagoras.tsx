// "Teorema de Pitágoras" (Los Amigos Mat, demo del canal): plantilla ExplicacionGeometrica con la pizarra de este
// trabajo (Pizarra.tsx), Benja y Sofi por poses de cuerpo entero (stop motion: kit de poses importado con
// scripts/rig/importar_poses.py) y el diálogo de datos/dialogo.json (voces Edge TTS: preparar_voces.mjs).
import React from "react";
import { ExplicacionGeometrica, type PersonajeEnEscena, type Resaltado } from "../../plantillas/ExplicacionGeometrica/ExplicacionGeometrica";
import { armarTiempos, type LineaDialogo } from "../../plantillas/ExplicacionGeometrica/calculos";
import { poseDe } from "../../rig/poses";
import dialogo from "../../../public/trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/datos/dialogo.json";
import { COLOR_A, COLOR_B, COLOR_C, efectosPizarra, Pizarra } from "./Pizarra";

export const FPS = 30;
const ALTO_PERSONAJE = 600; // px de los pies a la punta de la gorra / el piluso
const PISO = 1895; // y de los pies
// Personajes por poses (stop motion): la escala sale del alto de la pose neutra
const escalaDe = (n: string) => ALTO_PERSONAJE / poseDe(n, "neutra").h;

// Gesto de cada línea (datos/lineas.json) → pose entera del kit de poses
const POSE_DE_GESTO: Record<string, string> = {
  senala: "senalando",
  indice: "explicando",
  pulgar: "pulgar",
  puno: "festejo",
  abierta: "dudando",
  pensando: "pensando",
  cruzados: "cruzados",
};

export const TIEMPOS = armarTiempos(dialogo as LineaDialogo[], FPS);
export const DURACION = TIEMPOS.total;
const SALUDO = TIEMPOS.linea("l25").hasta + 8; // los dos saludan cuando aparece el logo
// Saludo a cámara al final: sube por los pasos y después la mano va y viene (saludando ↔ paso2_saludando)
const saludo = [
  { desde: SALUDO, hasta: DURACION + 30, pose: "saludando" },
  ...[0, 1, 2, 3].map((i) => ({ desde: SALUDO + 14 + i * 12, hasta: SALUDO + 19 + i * 12, pose: "paso2_saludando" })),
];

// Poses intermedias (hojas *_intermedias): camino desde la neutra hasta cada pose
const MOVIMIENTO = {
  paso: 3,
  caminos: {
    senalando: ["paso_senalando"],
    dudando: ["paso_dudando"],
    cruzados: ["paso_cruzados"],
    pulgar: ["paso_pulgar"],
    festejo: ["paso1_festejo", "paso2_festejo"],
    saludando: ["paso1_saludando", "paso2_saludando"],
    explicando: ["paso_explicando"],
    pensando: ["paso_pensando"],
  },
  // Sin "temblor" de espera: alternar neutra/neutra_b/neutra_c (dibujadas por la IA sin alinear al píxel) se veía a los
  // saltos (v5). En espera quedan en la neutra y se mecen enteras, de forma continua (src/rig/vaiven.ts).
};

export const PERSONAJES: PersonajeEnEscena[] = [
  { nombre: "benja", etiqueta: "Benja", color: "#23295e", x: 290, y: PISO, escala: escalaDe("benja"), modo: "poses", poseDeGesto: POSE_DE_GESTO, posesExtra: saludo, movimiento: MOVIMIENTO, piel: "clara" },
  // Sofi: sus hojas ya vienen mirando a la izquierda (hacia Benja): sin espejo
  { nombre: "sofi", etiqueta: "Sofi", color: "#d4146f", x: 790, y: PISO, escala: escalaDe("sofi"), modo: "poses", poseDeGesto: POSE_DE_GESTO, posesExtra: saludo, movimiento: MOVIMIENTO, piel: "media" },
];

const EFECTOS = efectosPizarra(TIEMPOS);

// Subtítulos: cada palabra clave del color de su lado en la pizarra (a = 3 celeste, b = 4 naranja, c = 5 fucsia);
// los números, del color de su cuadrado (9 = a², 16 = b², 25 = c²)
const RESALTAR: Resaltado[] = [
  { patron: "hipotenusa", color: COLOR_C },
  { patron: "catetos?", color: [COLOR_A, COLOR_B] },
  { patron: "nueve", color: COLOR_A },
  { patron: "dieciseis", color: COLOR_B },
  { patron: "veinticinco", color: COLOR_C },
  { patron: "pitagoras", color: [COLOR_A, COLOR_B, COLOR_C] },
];

export const Pitagoras: React.FC = () => (
  <ExplicacionGeometrica tiempos={TIEMPOS} personajes={PERSONAJES} pizarra={(t) => <Pizarra t={t} />} musica={{ archivo: "trabajos/2026-10-08_los-amigos-mat_teorema-pitagoras/audio/musica.wav", volumen: 0.45 }} efectos={EFECTOS} resaltar={RESALTAR} />
);
