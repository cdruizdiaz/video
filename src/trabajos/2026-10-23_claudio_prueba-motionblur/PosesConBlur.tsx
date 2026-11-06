// Prueba del desenfoque en ExplicacionGeometrica con personajes por poses (los de Pitágoras): subtítulos con
// desenfoqueEntrada y el "pop" de cada cambio de pose con desenfoque. Sin pizarra ni música (solo lo que se prueba).
import React from "react";
import { ExplicacionGeometrica } from "../../plantillas/ExplicacionGeometrica/ExplicacionGeometrica";
import { PERSONAJES, TIEMPOS } from "../2026-10-08_los-amigos-mat_teorema-pitagoras/Pitagoras";

export const DURACION_POSES = 240;
const CON_BLUR = PERSONAJES.map((p) => ({ ...p, desenfoque: true }));

export const PosesConBlur: React.FC = () => <ExplicacionGeometrica tiempos={TIEMPOS} personajes={CON_BLUR} pizarra={() => null} desenfoqueEntrada />;
