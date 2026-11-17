// Logo de Cipax por piezas (logo.json): isotipo [cuadrado, trazo azul, trazo oscuro], letras y rombo azul de la A.
// Coordenadas = las del PDF del cliente; cada pieza se anima con un transform SVG alrededor de su centro.
import React from "react";
import { CIPAX_AZUL, CIPAX_OSCURO, LOGO_CIPAX as L } from "../../marcas/cipax/marca";

export type Caja = { x0: number; y0: number; x1: number; y1: number };
const unir = (cajas: number[][]): Caja => ({
  x0: Math.min(...cajas.map((c) => c[0])),
  y0: Math.min(...cajas.map((c) => c[1])),
  x1: Math.max(...cajas.map((c) => c[2])),
  y1: Math.max(...cajas.map((c) => c[3])),
});
export const CAJA_LOGO: Caja = { x0: -L.desplaza[0], y0: -L.desplaza[1], x1: -L.desplaza[0] + L.ancho, y1: -L.desplaza[1] + L.alto };
export const CAJA_ISO = unir(L.isotipo.map((p) => p.caja));
export const CAJA_LETRAS = unir([...L.letras.map((p) => p.caja), L.rombo.caja]);
// Punto dentro del trazo azul por el que se "atraviesa" el isotipo en la transición (medido sobre el SVG del cliente)
export const PIVOTE_AZUL = { x: 96, y: 151 };

export type EstiloPieza = { dx?: number; dy?: number; escala?: number; giro?: number; opacidad?: number; color?: string };
const centro = (c: number[]) => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];
const transformar = (caja: number[], e: EstiloPieza) => {
  const [cx, cy] = centro(caja);
  return `translate(${(e.dx ?? 0) + cx} ${(e.dy ?? 0) + cy}) rotate(${e.giro ?? 0}) scale(${e.escala ?? 1}) translate(${-cx} ${-cy})`;
};

export const Pieza: React.FC<{ d: string; caja: number[]; color: string; e?: EstiloPieza }> = ({ d, caja, color, e = {} }) =>
  (e.opacidad ?? 1) <= 0 || (e.escala ?? 1) <= 0 ? null : (
    <path d={d} fill={e.color ?? color} fillRule="evenodd" opacity={e.opacidad ?? 1} transform={transformar(caja, e)} />
  );

export type ColoresLogo = { oscuro: string; azul: string; letras: string };
export const COLORES_SOBRE_CLARO: ColoresLogo = { oscuro: CIPAX_OSCURO, azul: CIPAX_AZUL, letras: CIPAX_OSCURO };
export const COLORES_SOBRE_OSCURO: ColoresLogo = { oscuro: "#FFFFFF", azul: CIPAX_AZUL, letras: "#FFFFFF" };

// SVG del logo (o de una parte: `caja` recorta el viewBox). `iso`, `letra`, `rombo` devuelven el estilo de cada pieza.
// `mascaraLetras`: las letras se ven solo dentro de su caja (para que suban "por máscara").
export const SvgLogo: React.FC<{
  ancho: number;
  caja?: Caja;
  colores: ColoresLogo;
  iso?: (i: number) => EstiloPieza | null;
  letra?: (i: number) => EstiloPieza | null;
  rombo?: () => EstiloPieza | null;
  mascaraLetras?: boolean;
  idUnico: string;
  extra?: React.ReactNode; // se dibuja encima, en coordenadas del logo (p. ej. el brillo)
  style?: React.CSSProperties;
}> = ({ ancho, caja = CAJA_LOGO, colores, iso, letra, rombo, mascaraLetras, idUnico, extra, style }) => {
  const w = caja.x1 - caja.x0;
  const h = caja.y1 - caja.y0;
  const idMascara = `cpx-letras-${idUnico}`;
  const est = (f: ((i: number) => EstiloPieza | null) | undefined, i: number) => (f ? f(i) : {});
  return (
    <svg width={ancho} height={(ancho * h) / w} viewBox={`${caja.x0} ${caja.y0} ${w} ${h}`} style={{ display: "block", overflow: "visible", ...style }}>
      {mascaraLetras ? (
        <defs>
          <clipPath id={idMascara}>
            <rect x={CAJA_LETRAS.x0 - 4} y={CAJA_LETRAS.y0 - 6} width={CAJA_LETRAS.x1 - CAJA_LETRAS.x0 + 8} height={CAJA_LETRAS.y1 - CAJA_LETRAS.y0 + 12} />
          </clipPath>
        </defs>
      ) : null}
      {L.isotipo.map((p, i) => {
        const e = est(iso, i);
        return e ? <Pieza key={`i${i}`} d={p.d} caja={p.caja} color={p.azul ? colores.azul : colores.oscuro} e={e} /> : null;
      })}
      <g clipPath={mascaraLetras ? `url(#${idMascara})` : undefined}>
        {L.letras.map((p, i) => {
          const e = est(letra, i);
          return e ? <Pieza key={`l${i}`} d={p.d} caja={p.caja} color={colores.letras} e={e} /> : null;
        })}
      </g>
      {(() => {
        const e = rombo ? rombo() : {};
        return e ? <Pieza d={L.rombo.d} caja={L.rombo.caja} color={colores.azul} e={e} /> : null;
      })()}
      {extra}
    </svg>
  );
};

// Todas las rutas del logo (para recortar un brillo con la forma exacta)
export const RUTAS_LOGO = [...L.isotipo.map((p) => p.d), ...L.letras.map((p) => p.d), L.rombo.d];
export const ALTO_SOBRE_ANCHO = (CAJA_LOGO.y1 - CAJA_LOGO.y0) / (CAJA_LOGO.x1 - CAJA_LOGO.x0);
