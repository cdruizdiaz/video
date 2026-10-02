// Personaje de perfil articulado para correr: separa el perfil del kit (perfilPartes) en pies, cuerpo, mano,
// cabeza y pétalos, y lo arma según una pose. Las poses clave de cada personaje viven en su kit de marca
// (p. ej. src/marcas/bloomie/carrera.ts) y se interpolan en un ciclo con poseCarrera(poses, fase).
// Coordenadas del personaje: origen en el piso, entre los pies; mira a la derecha; y hacia abajo.
import React from "react";
import type { DatosPersonaje, Trazo } from "./Personaje";

export type Pie = { x: number; y: number; r: number }; // y = 0 apoyado; r en grados (+ = punta hacia abajo)

export type PoseCarrera = {
  nombre: string;
  cuerpo: { y: number; inclina: number; sx: number; sy: number }; // y: subida (-) o bajada (+) del tronco
  cabeza: number; // grados, sobre el cuello
  petalos: number; // grados, atraso de los pétalos (inercia)
  brazoCerca: number; // grados (+ = hacia atrás)
  brazoLejos: number;
  pieCerca: Pie; // pierna del lado de cámara
  pieLejos: Pie;
};

// Articulaciones (en coordenadas del personaje)
export type Articulaciones = {
  cadera: { cerca: [number, number]; lejos: [number, number] };
  tobillo: number; // altura del tobillo sobre la base del pie
  hombro: [number, number];
  cuello: [number, number];
  raizPetalos: [number, number];
  ojoY: number; // centro del ojo de perfil (eje del parpadeo)
  mano: [number, number]; // centro de la mano de adelante (lo que lleva se estabiliza ahí)
  piernas: number; // cuánto se levanta el tronco al correr para que se vean las piernas
  pierna: { grosor: number; color: string; borde: string };
  sombraLejos: string; // tono para oscurecer lo que queda del lado de atrás
};

// ---------- Interpolación del ciclo ----------
const NUMEROS = ["y", "inclina", "sx", "sy"] as const;
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

const mezclaPie = (a: Pie, b: Pie, c: Pie, d: Pie, t: number): Pie => {
  // Pie apoyado entre dos poses: va en línea recta y a velocidad constante (no patina)
  if (b.y === 0 && c.y === 0) return { x: b.x + (c.x - b.x) * t, y: 0, r: b.r + (c.r - b.r) * t };
  return { x: cr(a.x, b.x, c.x, d.x, t), y: Math.min(0, cr(a.y, b.y, c.y, d.y, t)), r: cr(a.r, b.r, c.r, d.r, t) };
};

// Pose en una fase del ciclo (0…1, se repite): Catmull-Rom cíclico entre las poses clave
export const poseCarrera = (poses: PoseCarrera[], fase: number): PoseCarrera => {
  const n = poses.length;
  const u = (((fase % 1) + 1) % 1) * n;
  const i = Math.floor(u);
  const t = u - i;
  const [a, b, c, d] = [-1, 0, 1, 2].map((k) => poses[(i + k + n) % n]);
  const num = (sel: (p: PoseCarrera) => number) => cr(sel(a), sel(b), sel(c), sel(d), t);
  const cuerpo = Object.fromEntries(NUMEROS.map((k) => [k, num((p) => p.cuerpo[k])])) as PoseCarrera["cuerpo"];
  return {
    nombre: t < 0.5 ? b.nombre : c.nombre,
    cuerpo,
    cabeza: num((p) => p.cabeza),
    petalos: num((p) => p.petalos),
    brazoCerca: num((p) => p.brazoCerca),
    brazoLejos: num((p) => p.brazoLejos),
    pieCerca: mezclaPie(a.pieCerca, b.pieCerca, c.pieCerca, d.pieCerca, t),
    pieLejos: mezclaPie(a.pieLejos, b.pieLejos, c.pieLejos, d.pieLejos, t),
  };
};

// ---------- Dibujo ----------
const Path: React.FC<{ t: Trazo; tono?: string }> = ({ t, tono }) => (
  <path d={t.d} fill={t.fill ? (tono ?? t.fill) : "none"} stroke={t.stroke ? (tono ?? t.stroke) : undefined} strokeWidth={t.sw} fillRule={t.evenodd ? "evenodd" : undefined} />
);

const Grupo: React.FC<{ trazos: Trazo[]; recolor?: Record<string, string> }> = ({ trazos, recolor }) => (
  <>
    {trazos.map((t, i) => (
      <Path key={i} t={{ ...t, fill: t.fill ? (recolor?.[t.fill] ?? t.fill) : t.fill, stroke: t.stroke ? (recolor?.[t.stroke] ?? t.stroke) : t.stroke }} />
    ))}
  </>
);

// Lo de atrás se ve un poco más oscuro (las mismas formas con un velo encima)
const Sombreado: React.FC<{ trazos: Trazo[]; tono: string }> = ({ trazos, tono }) => (
  <>
    <Grupo trazos={trazos} />
    <g opacity={0.28}>
      {trazos.map((t, i) => (
        <Path key={i} t={t} tono={tono} />
      ))}
    </g>
  </>
);

const Pierna: React.FC<{ cadera: [number, number]; pie: Pie; art: Articulaciones; pieTrazos: Trazo[]; lejos?: boolean }> = ({
  cadera,
  pie,
  art,
  pieTrazos,
  lejos,
}) => {
  const rad = (pie.r * Math.PI) / 180;
  // tobillo: arriba del centro del pie, rotado con el pie
  const tx = pie.x + Math.sin(rad) * art.tobillo;
  const ty = pie.y - Math.cos(rad) * art.tobillo;
  const { grosor, color, borde } = art.pierna;
  return (
    <g>
      <line x1={cadera[0]} y1={cadera[1]} x2={tx} y2={ty} stroke={borde} strokeWidth={grosor + 8} strokeLinecap="round" />
      <line x1={cadera[0]} y1={cadera[1]} x2={tx} y2={ty} stroke={lejos ? borde : color} strokeWidth={grosor} strokeLinecap="round" />
      <g transform={`translate(${pie.x} ${pie.y - art.tobillo / 2}) rotate(${pie.r}) translate(0 ${art.tobillo / 2})`}>
        {lejos ? <Sombreado trazos={pieTrazos} tono={art.sombraLejos} /> : <Grupo trazos={pieTrazos} />}
      </g>
    </g>
  );
};

export const PersonajeCorriendo: React.FC<{
  datos: DatosPersonaje;
  art: Articulaciones;
  pose: PoseCarrera;
  parpadeo?: number; // 0 abierto … 1 cerrado (achica el ojo de perfil)
  recolor?: Record<string, string>; // colores del perfil que cambia un disfraz (p. ej. lentes verdes de bruja)
  sombrero?: React.ReactNode; // va sobre la cabeza (coordenadas del personaje)
  enLaMano?: React.ReactNode; // algo en la mano de adelante (coordenadas del personaje, brazo colgando)
  firmeza?: number; // 0…1: cuánto compensa lo que lleva en la mano el balanceo del brazo
}> = ({ datos, art, pose, parpadeo = 0, recolor, sombrero, enLaMano, firmeza = 0.75 }) => {
  const partes = datos.perfilPartes ?? {};
  const de = (k: string) => (partes[k] ?? []).map((i) => datos.perfil[i]);
  const pie = de("pie");
  const cabeza = de("cabeza");
  const ojo = de("ojo");
  const cuerpo = { ...pose.cuerpo, y: pose.cuerpo.y - art.piernas };
  const [mx, my] = art.mano;
  const [hx, hy] = art.hombro;
  const [cx, cy] = art.cuello;
  const [px, py] = art.raizPetalos;
  const caderaY = (c: [number, number]): [number, number] => [c[0], c[1] + cuerpo.y];
  return (
    <g>
      {/* pierna y brazo de atrás */}
      <Pierna cadera={caderaY(art.cadera.lejos)} pie={pose.pieLejos} art={art} pieTrazos={pie} lejos />
      <g transform={`translate(0 ${cuerpo.y}) rotate(${cuerpo.inclina} 0 -30)`}>
        <g transform={`translate(${-14} 0) rotate(${pose.brazoLejos} ${hx} ${hy})`}>
          <Sombreado trazos={de("mano")} tono={art.sombraLejos} />
        </g>
      </g>
      <Pierna cadera={caderaY(art.cadera.cerca)} pie={pose.pieCerca} art={art} pieTrazos={pie} />
      {/* tronco: cuerpo, cabeza y pétalos */}
      <g transform={`translate(0 ${cuerpo.y}) rotate(${cuerpo.inclina} 0 -30) translate(0 -30) scale(${cuerpo.sx} ${cuerpo.sy}) translate(0 30)`}>
        <Grupo trazos={de("cuerpo")} />
        <Grupo trazos={de("hoja")} />
        <g transform={`rotate(${pose.cabeza} ${cx} ${cy})`}>
          {/* cabeza en su orden de dibujo; el ojo se achica al parpadear */}
          {cabeza.map((t, i) =>
            ojo.includes(t) ? (
              <g key={i} transform={`translate(0 ${art.ojoY}) scale(1 ${1 - parpadeo * 0.85}) translate(0 ${-art.ojoY})`}>
                <Grupo trazos={[t]} />
              </g>
            ) : (
              <Grupo key={i} trazos={[t]} recolor={recolor} />
            ),
          )}
          <g transform={`rotate(${pose.petalos} ${px} ${py})`}>
            <Grupo trazos={de("petalos")} />
          </g>
          {sombrero}
        </g>
      </g>
      {/* brazo de adelante (encima de todo) */}
      <g transform={`translate(0 ${cuerpo.y}) rotate(${cuerpo.inclina} 0 -30)`}>
        <g transform={`rotate(${pose.brazoCerca} ${hx} ${hy})`}>
          <g transform={`rotate(${-pose.brazoCerca * firmeza} ${mx} ${my})`}>{enLaMano}</g>
          <Grupo trazos={de("mano")} />
        </g>
      </g>
    </g>
  );
};
