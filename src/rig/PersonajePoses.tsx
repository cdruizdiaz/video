// Dibuja un personaje por poses (stop motion): la pose entera (sin boca mientras habla) y la boca A–F del kit encima.
// Al cambiar de pose da un pequeño "pop" (crece un poco y vuelve). En todo momento se mece apenas (vaiven.ts): la
// imagen y la boca juntas, como un solo bloque que gira sobre los pies (nunca se cambia de imagen para "moverse").
// Desenfoque de movimiento: PersonajePosesAnimado (abajo) recibe el estado como función del cuadro y lo desenfoca
// en los traslados rápidos y en el "pop" de cada cambio de pose (con obturador bajo).
import React, { useMemo } from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Desenfoque, DesenfoqueMovimiento, OBTURADOR_BAJO, opcionesDe } from "../plantillas/comunes/Desenfoque";
import { type Tramo, tramosRapidos, unirTramos } from "../plantillas/comunes/tramosDesenfoque";
import { poseDe, visemaDe } from "./poses";
import { faseDe, vaivenEnCuadro } from "./vaiven";

const POP = 0.045; // cuánto crece al cambiar de pose
export const POP_CUADROS = 5;
const popDe = (desdeCambio: number) => (desdeCambio < POP_CUADROS ? POP * (1 - desdeCambio / POP_CUADROS) : 0);

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
  const pop = popDe(desdeCambio);
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

// ---------- Con desenfoque de movimiento ----------
export type EstadoPoses = Omit<PersonajePosesProps, "f">;

// Tramos a desenfocar: donde los pies o la cabeza se corren rápido (traslados) y los cuadros del "pop" de cada
// cambio de pose. `estados[f]` = estado en el cuadro f.
export const tramosDePoses = (estados: EstadoPoses[], umbral?: number): Tramo[] => {
  const pos = estados.map((e): [number, number][] => {
    const p = poseDe(e.personaje, e.pose);
    const s = e.escala * (1 + popDe(e.desdeCambio ?? 99));
    const cx = ((p.cabeza[0] + p.cabeza[2]) / 2) * (e.espejo ? -1 : 1);
    const cy = (p.cabeza[1] + p.cabeza[3]) / 2;
    return [
      [e.x, e.y],
      [e.x + cx * s, e.y + cy * s],
    ];
  });
  const pops: Tramo[] = [];
  estados.forEach((e, f) => {
    if ((e.desdeCambio ?? 99) < POP_CUADROS) pops.push({ desde: f, hasta: f + 1 });
  });
  return unirTramos([...tramosRapidos(pos, { umbral }), ...pops]);
};

export const PersonajePosesAnimado: React.FC<{
  estadoEn: (f: number) => EstadoPoses;
  desenfoque?: Desenfoque;
  tramos?: Tramo[]; // ya calculados (si no, se calculan con tramosDePoses en toda la duración)
}> = ({ estadoEn, desenfoque, tramos }) => {
  const { durationInFrames } = useVideoConfig();
  const d = opcionesDe(desenfoque);
  const auto = useMemo(
    () => (d && !d.tramos && !tramos ? tramosDePoses(Array.from({ length: durationInFrames }, (_, f) => estadoEn(f)), d.umbral) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estadoEn, durationInFrames, !!d, tramos],
  );
  const cuadro = <EnCuadro estadoEn={estadoEn} />;
  if (!d) return cuadro;
  return (
    <DesenfoqueMovimiento obturador={OBTURADOR_BAJO} {...d} tramos={d.tramos ?? tramos ?? auto}>
      {cuadro}
    </DesenfoqueMovimiento>
  );
};

const EnCuadro: React.FC<{ estadoEn: (f: number) => EstadoPoses }> = ({ estadoEn }) => {
  const f = useCurrentFrame();
  return <PersonajePoses {...estadoEn(f)} f={f} />;
};
