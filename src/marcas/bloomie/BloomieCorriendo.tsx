// Bloomie corriendo de perfil (kit de marca): arma PersonajeCorriendo con las articulaciones y poses de
// carrera.ts. Con disfraz "bruja" lleva el sombrero, los lentes verdes y la escoba en la mano.
import React from "react";
import { PersonajeCorriendo, type PoseCarrera } from "../../plantillas/PersonajeAnimado/Carrera";
import { Accesorio } from "../../plantillas/PersonajeAnimado/Personaje";
import { ARTICULACIONES_BLOOMIE, BRUJA_PERFIL, ESCOBA_EN_MANO } from "./carrera";
import { PERSONAJE_BLOOMIE } from "./marca";

const centro = (nombre: string) => {
  const c = PERSONAJE_BLOOMIE.accesorios?.[nombre]?.caja ?? [0, 0, 0, 0];
  return [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];
};
const [SX, SY] = centro("sombrero");
const [EX, EY] = centro("escoba");

export type DisfrazCarrera = "ninguno" | "bruja";

export const BloomieCorriendo: React.FC<{
  pose: PoseCarrera;
  disfraz?: DisfrazCarrera;
  escoba?: boolean;
  parpadeo?: number;
}> = ({ pose, disfraz = "ninguno", escoba = false, parpadeo = 0 }) => {
  const bruja = disfraz === "bruja";
  const s = BRUJA_PERFIL.sombrero;
  const e = ESCOBA_EN_MANO;
  // el sombrero se apoya en la cabeza de perfil (su centro en el frente era la cabeza de frente)
  const sombrero = bruja ? (
    <g transform={`translate(${s.x + SX} ${s.y + SY}) rotate(${s.giro}) scale(${s.escala}) translate(${-SX} ${-SY})`}>
      <Accesorio datos={PERSONAJE_BLOOMIE} nombre="sombrero" />
    </g>
  ) : undefined;
  const enLaMano = escoba ? (
    <g transform={`translate(${e.x} ${e.y}) rotate(${e.giro}) scale(${e.escala}) translate(${-EX} ${-EY})`}>
      <Accesorio datos={PERSONAJE_BLOOMIE} nombre="escoba" />
    </g>
  ) : undefined;
  return (
    <PersonajeCorriendo
      datos={PERSONAJE_BLOOMIE}
      art={ARTICULACIONES_BLOOMIE}
      pose={pose}
      parpadeo={parpadeo}
      recolor={bruja ? BRUJA_PERFIL.recolor : undefined}
      sombrero={sombrero}
      enLaMano={enLaMano}
    />
  );
};
