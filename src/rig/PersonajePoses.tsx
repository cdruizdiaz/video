// Dibuja un personaje por poses (stop motion): la pose entera (sin boca mientras habla) y la boca A–F del kit encima.
// Al cambiar de pose da un pequeño "pop" (crece un poco y vuelve). En todo momento se mece apenas (vaiven.ts): la
// imagen y la boca juntas, como un solo bloque que gira sobre los pies (nunca se cambia de imagen para "moverse").
import React from "react";
import { Img, staticFile } from "remotion";
import { poseDe, visemaDe } from "./poses";
import { faseDe, vaivenEnCuadro } from "./vaiven";

const POP = 0.045; // cuánto crece al cambiar de pose
const POP_CUADROS = 5;

const conPiel = (img: string, piel?: string) => (piel ? img.replace("/poses/", `/poses_${piel}/`) : img);

export type PersonajePosesProps = {
  personaje: string;
  pose: string;
  visema: string | null; // A–F mientras habla; null o "X" = boca cerrada (la de la pose)
  x: number; // pies en el cuadro
  y: number;
  escala: number;
  espejo?: boolean;
  desdeCambio?: number; // cuadros desde el último cambio de pose (para el pop)
  f: number; // cuadro (vaivén de espera)
  vaiven?: boolean; // false = quieto
  piel?: string; // tono de piel: usa public/personajes/<nombre>/poses_<piel>/ (scripts/rig/tono_piel.py)
};

export const PersonajePoses: React.FC<PersonajePosesProps> = ({ personaje, pose, visema, x, y, escala, espejo = false, desdeCambio = 99, f, vaiven = true, piel }) => {
  const p = poseDe(personaje, pose);
  const habla = visema && visema !== "X" && p.boca && p.sinBoca;
  const vis = habla ? visemaDe(personaje, visema!) : null;
  const pop = desdeCambio < POP_CUADROS ? POP * (1 - desdeCambio / POP_CUADROS) : 0;
  const v = vaiven ? vaivenEnCuadro(f, faseDe(personaje)) : { grados: 0, dx: 0, sy: 1 };
  // Posiciones calculadas en px del cuadro (pies en x, y); el espejo da vuelta solo cada imagen
  const s = escala * (1 + pop);
  const espejar = (x0: number, w: number) => (espejo ? -(x0 + w) : x0);
  const ve = (p.boca?.escala ?? 1) * s;
  const volteo = espejo ? "scaleX(-1)" : undefined;
  // Gira y respira con el origen en los pies: los pies no se despegan del piso
  const mece = {
    position: "absolute" as const,
    inset: 0,
    transformOrigin: `${x}px ${y}px`,
    transform: `translateX(${v.dx}px) rotate(${espejo ? -v.grados : v.grados}deg) scaleY(${v.sy})`,
  };
  return (
    <div style={mece}>
      <Img
        src={staticFile(conPiel(habla ? p.sinBoca! : p.img, piel))}
        style={{ position: "absolute", left: x + espejar(p.x, p.w) * s, top: y + p.y * s, width: p.w * s, height: p.h * s, transform: volteo }}
      />
      {vis && p.boca && (
        <Img
          src={staticFile(vis.img)}
          style={{
            position: "absolute",
            left: x + (espejo ? -p.boca.c[0] : p.boca.c[0]) * s - (vis.w * ve) / 2,
            top: y + p.boca.c[1] * s - (vis.h * ve) / 2,
            width: vis.w * ve,
            height: vis.h * ve,
            transform: volteo,
          }}
        />
      )}
    </div>
  );
};
