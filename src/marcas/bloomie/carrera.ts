// Kit de marca Bloomie — carrera: articulaciones del perfil y las 8 poses clave del ciclo de carrera
// (dos pasos: contacto → bajada → impulso → vuelo, con cada pierna). Se interpolan con poseCarrera()
// de src/plantillas/PersonajeAnimado/Carrera.tsx. Hoja de revisión: HojaCarreraBloomie.tsx.
import type { Articulaciones, PoseCarrera } from "../../plantillas/PersonajeAnimado/Carrera";
import { PALETA_BLOOMIE } from "./marca";

export const ARTICULACIONES_BLOOMIE: Articulaciones = {
  cadera: { cerca: [10, -32], lejos: [-10, -32] },
  tobillo: 18,
  hombro: [5, -112],
  cuello: [30, -120],
  raizPetalos: [-5, -190],
  ojoY: -213,
  mano: [8, -72],
  piernas: 22,
  pierna: { grosor: 20, color: PALETA_BLOOMIE.petaloClaro, borde: PALETA_BLOOMIE.borde },
  sombraLejos: "#6e3408",
};

// Frames por ciclo completo (2 pasos) a 30 fps: 18 → 3,3 pasos por segundo, carrera ágil de dibujo animado
export const CICLO_CARRERA_BLOOMIE = 18;

// Un paso (pierna de cámara adelante); el otro es la misma pose con piernas y brazos cambiados
const poses4: PoseCarrera[] = [
  {
    nombre: "contacto",
    cuerpo: { y: -4, inclina: 13, sx: 1, sy: 1 },
    cabeza: -2,
    petalos: 3,
    brazoCerca: 50,
    brazoLejos: -45,
    pieCerca: { x: 80, y: 0, r: -22 },
    pieLejos: { x: -78, y: -44, r: 50 },
  },
  {
    nombre: "bajada",
    cuerpo: { y: 14, inclina: 16, sx: 1.07, sy: 0.92 },
    cabeza: 3,
    petalos: 9,
    brazoCerca: 25,
    brazoLejos: -20,
    pieCerca: { x: 18, y: 0, r: 0 },
    pieLejos: { x: -30, y: -84, r: 75 },
  },
  {
    nombre: "impulso",
    cuerpo: { y: -14, inclina: 18, sx: 0.95, sy: 1.07 },
    cabeza: 0,
    petalos: 2,
    brazoCerca: -15,
    brazoLejos: 18,
    pieCerca: { x: -44, y: 0, r: 30 },
    pieLejos: { x: 44, y: -62, r: -8 },
  },
  {
    nombre: "vuelo",
    cuerpo: { y: -34, inclina: 14, sx: 0.97, sy: 1.05 },
    cabeza: -3,
    petalos: -7,
    brazoCerca: -45,
    brazoLejos: 45,
    pieCerca: { x: -86, y: -34, r: 55 },
    pieLejos: { x: 84, y: -26, r: -20 },
  },
];

const cambiar = (p: PoseCarrera): PoseCarrera => ({
  ...p,
  brazoCerca: p.brazoLejos,
  brazoLejos: p.brazoCerca,
  pieCerca: p.pieLejos,
  pieLejos: p.pieCerca,
});

export const POSES_CARRERA_BLOOMIE: PoseCarrera[] = [...poses4, ...poses4.map(cambiar)];

// Velocidad en el mundo (unidades del personaje por frame) para que el pie apoyado no patine:
// del contacto al impulso el pie retrocede (80 → -44) en 2 de las 8 poses del ciclo
export const AVANCE_CARRERA_BLOOMIE =
  (poses4[0].pieCerca.x - poses4[2].pieCerca.x) / ((CICLO_CARRERA_BLOOMIE * 2) / POSES_CARRERA_BLOOMIE.length);

// Disfraz de bruja de perfil: lentes verdes con marco oscuro + el sombrero del kit sobre la cabeza
export const BRUJA_PERFIL = {
  recolor: { "#80c6d1": PALETA_BLOOMIE.verdeBruja, "#4a90a0": "#201f30" } as Record<string, string>,
  sombrero: { x: 58, y: 4, giro: -4, escala: 0.92 },
};
// Escoba en la mano de adelante (centro de la escoba, en coordenadas del personaje): palo adelante y arriba, cerdas atrás
export const ESCOBA_EN_MANO = { x: 8, y: -72, giro: 52, escala: 1.25 };
