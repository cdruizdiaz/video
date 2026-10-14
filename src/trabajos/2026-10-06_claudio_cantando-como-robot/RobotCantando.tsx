// El músico del crudo reemplazado por un robot 3D (Robot3D) que sigue su esqueleto cuadro a cuadro
// (datos/esqueleto.json, scripts/rig/esqueleto.py). Capas: video sin el músico ni su guitarra (scripts/limpiar_persona.py)
// con el audio del original (sin tocar) → robot →
// el micrófono real recortado del mismo video (va delante del cantante), anclado con datos/seguimiento_micro.json.
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EscenaRobot3D, type CabezaEsqueleto, type PuntoEsqueleto } from "../../personajes/robot/Robot3D";
import esqueleto from "../../../public/trabajos/2026-10-06_claudio_cantando-como-robot/datos/esqueleto.json";
import micro from "../../../public/trabajos/2026-10-06_claudio_cantando-como-robot/datos/seguimiento_micro.json";

const CARPETA = "trabajos/2026-10-06_claudio_cantando-como-robot";
export const VIDEO = `${CARPETA}/crudos/20220424_144522.mp4`;
// Imagen sin el músico (scripts/limpiar_persona.py): nivel 1 = fondo fijo (v2), nivel 1,5 = fondo con las plantas meciéndose (v3)
const LIMPIO = { 1: `${CARPETA}/crudos/20220424_144522_limpio.mp4`, 1.5: `${CARPETA}/crudos/20220424_144522_limpio15.mp4` } as const;
export const DURACION = esqueleto.cuadros;

// Micrófono en el cuadro 0 (px del video, medido en revision/micro_grilla.png): cabeza redonda y tramos del pie
// [desde, hasta, medio ancho]. La cabeza es el punto seguido (seguimiento_micro.json, rot en grados).
const MICRO = {
  cabeza: [480, 466] as const, // punto seguido
  centro: [480, 462] as [number, number], // centro de la cabeza del micrófono
  radio: 28,
  tramos: [
    [[480, 462], [468, 532], 8], // cuello y pinza
    [[468, 532], [430, 1568], 6], // caño
    [[458, 815], [450, 885], 13], // abrazadera del medio
  ] as [[number, number], [number, number], number][],
};

export type RobotCantandoProps = { capa?: string | null; soloRobot?: boolean; limpio?: 0 | 1 | 1.5 }; // 0 = video original con el músico

const puntosEn = (f: number) => {
  // si en ese cuadro no hubo detección, la más cercana (primero hacia atrás)
  const lista = esqueleto.puntos as (PuntoEsqueleto[] | null)[];
  for (let d = 0; d < lista.length; d++) {
    const a = lista[f - d];
    if (a) return { puntos: a, cabeza: (esqueleto.cabeza as CabezaEsqueleto[])[f - d] };
    const b = lista[f + d];
    if (b) return { puntos: b, cabeza: (esqueleto.cabeza as CabezaEsqueleto[])[f + d] };
  }
  return null;
};

// Contorno del micrófono (cabeza redonda + caño hasta la base) como path de clip-path, en px del cuadro
const contornoMicro = (f: number) => {
  const i = Math.min(f, micro.puntos.length - 1);
  const [cx, cy] = micro.puntos[i];
  const s = micro.escala?.[i] ?? 1;
  const rot = ((micro.rot?.[i] ?? 0) * Math.PI) / 180;
  // de px del cuadro 0 a px de este cuadro (alrededor de la cabeza del micrófono)
  const lleva = ([x, y]: [number, number]) => {
    const dx = x - MICRO.cabeza[0];
    const dy = y - MICRO.cabeza[1];
    return [cx + s * (dx * Math.cos(rot) - dy * Math.sin(rot)), cy + s * (dx * Math.sin(rot) + dy * Math.cos(rot))];
  };
  const tramo = ([a0, b0, ancho]: [[number, number], [number, number], number]) => {
    const [ax, ay] = lleva(a0);
    const [bx, by] = lleva(b0);
    const largo = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (-(by - ay) / largo) * ancho * s;
    const ny = ((bx - ax) / largo) * ancho * s;
    return `M ${ax + nx} ${ay + ny} L ${bx + nx} ${by + ny} L ${bx - nx} ${by - ny} L ${ax - nx} ${ay - ny} Z`;
  };
  const r = MICRO.radio * s;
  const [mx, my] = lleva(MICRO.centro);
  return [`M ${mx - r} ${my} A ${r} ${r} 0 1 0 ${mx + r} ${my} A ${r} ${r} 0 1 0 ${mx - r} ${my} Z`, ...MICRO.tramos.map(tramo)].join(" ");
};

export const RobotCantando: React.FC<RobotCantandoProps> = ({ capa = null, soloRobot = false, limpio = 1.5 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const datos = puntosEn(f);
  const robot = capa ? (
    // capa 3D ya renderizada (scripts/capa3d.mjs): sin WebGL en el render final
    <OffthreadVideo src={staticFile(capa)} transparent muted />
  ) : datos ? (
    <EscenaRobot3D ancho={width} alto={height} puntos={datos.puntos} cabeza={datos.cabeza} guitarra mano="derecha" />
  ) : null;
  if (soloRobot) return <AbsoluteFill>{robot}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* audio original sin cambios; imagen sin el músico (o el original, con limpio: 0) */}
      <Audio src={staticFile(VIDEO)} />
      <OffthreadVideo src={staticFile(limpio ? LIMPIO[limpio] : VIDEO)} muted />
      <AbsoluteFill>{robot}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `path('${contornoMicro(f)}')` }}>
        <OffthreadVideo src={staticFile(VIDEO)} muted />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
