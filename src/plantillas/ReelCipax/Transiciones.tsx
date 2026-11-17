// Transiciones de Cipax (análisis de las referencias en src/marcas/cipax/CRITERIOS.md → Movimiento).
// Cada transición tiene dos partes:
//  - `estiloEntrante` / `estiloSaliente`: máscara, fundido o desenfoque que se aplica a las tomas mismas;
//  - <CapaTransicion>: las formas de marca que van por encima del video.
// `t` = cuadros relativos al corte (negativo antes, 0 en el primer cuadro de la toma nueva).
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  CIPAX_AZUL,
  CIPAX_AZUL_PROFUNDO,
  CIPAX_EASE,
  CIPAX_MENTA,
  CIPAX_OSCURO,
  CIPAX_SALIDA,
} from "../../marcas/cipax/marca";
import { campana, type TipoTransicion } from "./calculos";
import { CAJA_ISO, CAJA_LETRAS, CAJA_LOGO, COLORES_SOBRE_OSCURO, PIVOTE_AZUL, SvgLogo } from "./LogoCipax";

// ---------- Constantes de animación ----------
const W = 1080;
const H = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// píldora
const PILDORA_CENTRO_Y = 600; // a la altura de la cara: la cara de la toma nueva aparece adentro
const PILDORA_CHICA = { w: 380, h: 150 }; // tamaño de la ventanita antes de abrirse
const PILDORA_ABRE = -2; // cuadro (rel. al corte) en que deja de ser chica y empieza a abrirse
const PILDORA_BORDE = 10; // px del aro azul alrededor de la ventana
// círculo
const CIRCULO_PUNTO = 46; // px de diámetro del punto
const CIRCULO_REBOTE = [-13, -7]; // el punto cae y rebota
const CIRCULO_CUBRE = [-7, 0]; // crece hasta tapar todo
const CIRCULO_ABRE = [0, 11]; // el plano nuevo se abre desde el centro
const RADIO_TOTAL = Math.hypot(W, H) / 2 + 20;
// bandas
const BANDAS = 5;
const BANDA_ESCALON = 0.75; // cuadros entre una banda y la siguiente
const BANDA_SUBE = 5; // cuadros que tarda cada banda en tapar
const BANDA_SALE = 6;
// isotipo
const LOGO_ANCHO = 470; // px del logo cuando aparece sobre la cabeza
const LOGO_CENTRO = { x: 540, y: 262 };
const LOGO_ARMA = 14; // cuadros que tarda en armarse
const ISO_VIAJA = [-10, -3]; // las letras se van y el isotipo se corre apenas hacia el centro (sin bajar a la cara)
const ISO_ZOOM = [-8, 0]; // atraviesa el trazo azul desde arriba de la cabeza
const ISO_ESCALA_CENTRO = 1.25;
const ISO_ESCALA_FINAL = 200; // con el pivote arriba hace falta más escala para tapar hasta abajo
const AZUL_SUBE = 10; // cuadros que tarda el azul en irse hacia arriba
// cámara
const CAMARA_DESENFOQUE = 34; // px de desenfoque vertical en el corte
const CAMARA_ANCHO = 4; // cuadros de rampa del desenfoque a cada lado
const CAMARA_FUNDIDO = 2; // cuadros de fundido a cada lado
// placa
const PLACA_SUBE = 11;
export const FONDO_PLACA = `linear-gradient(172deg, ${CIPAX_AZUL} 0%, #1E55E0 20%, ${CIPAX_AZUL_PROFUNDO} 44%, #141A2E 62%, ${CIPAX_OSCURO} 100%)`; // el logo cae sobre la parte oscura (versión oscura del manual: blanco + azul)
const AZUL_PLANO = `radial-gradient(circle at 50% 35%, #3A76FF 0%, ${CIPAX_AZUL} 45%, #1D50D6 100%)`; // azul "lleno" con degradé (no queda un cuadro de un solo color)

const p01 = (t: number, a: number, b: number, ease: (x: number) => number = CIPAX_EASE) => ease(interpolate(t, [a, b], [0, 1], clamp));

// ---------- Máscaras sobre las tomas ----------
export const estiloEntrante = (tipo: TipoTransicion, t: number): React.CSSProperties => {
  if (tipo === "pildora") {
    if (t >= 11) return {};
    const chica = p01(t, -9, PILDORA_ABRE, CIPAX_SALIDA);
    const abre = p01(t, PILDORA_ABRE, 11);
    const w = interpolate(abre, [0, 1], [PILDORA_CHICA.w * chica, W + 4]);
    const h = interpolate(abre, [0, 1], [PILDORA_CHICA.h * chica, H + 4]);
    const r = interpolate(abre, [0, 0.7, 1], [h / 2, 160, 0]);
    const cy = interpolate(abre, [0, 1], [PILDORA_CENTRO_Y, H / 2]);
    return { clipPath: `inset(${cy - h / 2}px ${(W - w) / 2}px ${H - cy - h / 2}px ${(W - w) / 2}px round ${r}px)` };
  }
  if (tipo === "camara") {
    return { opacity: interpolate(t, [-CAMARA_FUNDIDO, CAMARA_FUNDIDO], [0, 1], clamp) };
  }
  return {};
};

// Desenfoque vertical (px) de las tomas alrededor de un corte de cámara
export const desenfoqueCamara = (t: number) => CAMARA_DESENFOQUE * campana(t, CAMARA_ANCHO, 1) ** 1.6;

// ---------- Capas de forma ----------
const Pildora: React.FC<{ t: number }> = ({ t }) => {
  const chica = p01(t, -9, PILDORA_ABRE, CIPAX_SALIDA);
  const abre = p01(t, PILDORA_ABRE, 11);
  const w = interpolate(abre, [0, 1], [PILDORA_CHICA.w * chica, W + 4]);
  const h = interpolate(abre, [0, 1], [PILDORA_CHICA.h * chica, H + 4]);
  const r = interpolate(abre, [0, 0.7, 1], [h / 2, 160, 0]);
  const cy = interpolate(abre, [0, 1], [PILDORA_CENTRO_Y, H / 2]);
  const borde = PILDORA_BORDE * (1 - abre);
  if (w <= 1 || borde <= 0.3) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (W - w) / 2 - borde,
        top: cy - h / 2 - borde,
        width: w + 2 * borde,
        height: h + 2 * borde,
        borderRadius: r + borde,
        border: `${borde}px solid ${CIPAX_AZUL}`,
        boxShadow: `0 0 ${40 * (1 - abre)}px rgba(38,103,255,${0.55 * (1 - abre)})`,
      }}
    />
  );
};

const Circulo: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0) {
    const cae = p01(t, CIRCULO_REBOTE[0], CIRCULO_REBOTE[1], (x) => x); // caída con rebote: parábola + rebote corto
    const y = interpolate(cae, [0, 0.55, 0.78, 1], [H / 2 - 420, H / 2, H / 2 - 60, H / 2]);
    const crece = p01(t, CIRCULO_CUBRE[0], CIRCULO_CUBRE[1], (x) => x ** 3);
    const r = CIRCULO_PUNTO / 2 + (RADIO_TOTAL - CIRCULO_PUNTO / 2) * crece;
    const estira = interpolate(cae, [0.45, 0.55, 0.66], [1, 1.35, 1], clamp); // el punto se estira al caer
    return (
      <div
        style={{
          position: "absolute",
          left: W / 2 - r / estira,
          top: y - r * estira,
          width: (2 * r) / estira,
          height: 2 * r * estira,
          borderRadius: "50%",
          background: crece > 0.6 ? AZUL_PLANO : CIPAX_AZUL,
        }}
      />
    );
  }
  const abre = p01(t, CIRCULO_ABRE[0], CIRCULO_ABRE[1], CIPAX_SALIDA);
  const r = RADIO_TOTAL * abre;
  if (abre >= 1) return null;
  return (
    <>
      <AbsoluteFill
        style={{
          background: AZUL_PLANO,
          WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 1.5}px)`,
          maskImage: `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 1.5}px)`,
        }}
      />
      {/* aro fino menta que acompaña el borde */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - r - 8,
          top: H / 2 - r - 8,
          width: 2 * r + 16,
          height: 2 * r + 16,
          borderRadius: "50%",
          border: `4px solid ${CIPAX_MENTA}`,
          opacity: 0.85 * (1 - abre),
        }}
      />
    </>
  );
};

const Bandas: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    {Array.from({ length: BANDAS }, (_, j) => {
      const ini = -8 + j * BANDA_ESCALON;
      const sube = p01(t, ini, ini + BANDA_SUBE);
      const salIni = 1 + j * BANDA_ESCALON;
      const sale = p01(t, salIni, salIni + BANDA_SALE);
      const y = (1 - sube) * 100 - sale * 100;
      if (y >= 100 || y <= -100) return null;
      const ancho = W / BANDAS;
      return (
        <div
          key={j}
          style={{
            position: "absolute",
            left: j * ancho - 1,
            width: ancho + 2,
            top: 0,
            height: H,
            transform: `translateY(${y}%)`,
            background: `linear-gradient(180deg, ${j % 2 ? "#2B6BFF" : CIPAX_AZUL} 0%, #1D50D6 100%)`,
          }}
        >
          {/* filo menta en el borde que avanza */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 6, top: sube < 1 ? 0 : undefined, bottom: sube >= 1 ? 0 : undefined, background: CIPAX_MENTA, opacity: 0.9 }} />
        </div>
      );
    })}
  </AbsoluteFill>
);

// El logo entra sobre la cabeza al decir "Cipax"; el isotipo viaja al centro y se atraviesa por el trazo azul.
const Isotipo: React.FC<{ t: number; antes: number }> = ({ t, antes }) => {
  const local = t + antes; // cuadros desde que entra el logo
  const kLogo = LOGO_ANCHO / (CAJA_LOGO.x1 - CAJA_LOGO.x0);
  const izq = LOGO_CENTRO.x - LOGO_ANCHO / 2;
  const arriba = LOGO_CENTRO.y - ((CAJA_LOGO.y1 - CAJA_LOGO.y0) * kLogo) / 2;
  if (t >= 0) {
    const sube = p01(t, 0, AZUL_SUBE, (x) => CIPAX_EASE(x) * 0.6 + CIPAX_SALIDA(x) * 0.4);
    if (sube >= 1) return null;
    return (
      <AbsoluteFill
        style={{
          background: AZUL_PLANO,
          transform: `translateY(${-sube * 112}%)`,
          borderBottomLeftRadius: `50% ${260 * sube}px`,
          borderBottomRightRadius: `50% ${260 * sube}px`,
        }}
      />
    );
  }
  // letras y rombo: suben por máscara al entrar, bajan por máscara cuando el isotipo se va
  const salenLetras = p01(t, ISO_VIAJA[0], ISO_VIAJA[0] + 6);
  const letra = (i: number) => {
    const e = p01(local, 3 + i * 1.6, 3 + i * 1.6 + 9, CIPAX_SALIDA);
    const alto = CAJA_LETRAS.y1 - CAJA_LETRAS.y0 + 10;
    return { dy: (1 - e) * alto + salenLetras * alto };
  };
  const rombo = () => {
    const e = p01(local, 11, LOGO_ARMA + 4, CIPAX_SALIDA);
    return { escala: e * (1 - salenLetras), giro: 90 * (1 - e) };
  };
  const pop = (i: number) => {
    const e = interpolate(local, [i * 2, i * 2 + 5, i * 2 + 8], [0, 1.12, 1], clamp);
    return { escala: e };
  };
  // isotipo: posición del pivote (px de pantalla) y escala
  const viaja = p01(t, ISO_VIAJA[0], ISO_VIAJA[1]);
  const zoom = p01(t, ISO_ZOOM[0], ISO_ZOOM[1], (x) => x ** 2.2);
  const pivoteLogo = { x: izq + (PIVOTE_AZUL.x - CAJA_LOGO.x0) * kLogo, y: arriba + (PIVOTE_AZUL.y - CAJA_LOGO.y0) * kLogo };
  const px = interpolate(viaja, [0, 1], [pivoteLogo.x, W / 2]);
  const py = interpolate(viaja, [0, 1], [pivoteLogo.y, pivoteLogo.y + 40]);
  const escala = interpolate(viaja, [0, 1], [1, ISO_ESCALA_CENTRO]) * Math.exp(Math.log(ISO_ESCALA_FINAL / ISO_ESCALA_CENTRO) * zoom);
  const isoAncho = (CAJA_ISO.x1 - CAJA_ISO.x0) * kLogo;
  const oX = (PIVOTE_AZUL.x - CAJA_ISO.x0) * kLogo;
  const oY = (PIVOTE_AZUL.y - CAJA_ISO.y0) * kLogo;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: izq, top: arriba }}>
        <SvgLogo ancho={LOGO_ANCHO} colores={COLORES_SOBRE_OSCURO} idUnico="reel" mascaraLetras iso={() => null} letra={letra} rombo={rombo} style={{ filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.35))" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: px - oX,
          top: py - oY,
          transformOrigin: `${oX}px ${oY}px`,
          transform: `scale(${escala})`,
        }}
      >
        <SvgLogo ancho={isoAncho} caja={CAJA_ISO} colores={COLORES_SOBRE_OSCURO} idUnico="reel-iso" iso={pop} letra={() => null} rombo={() => null} style={{ filter: zoom > 0 ? undefined : "drop-shadow(0 4px 18px rgba(0,0,0,0.35))" }} />
      </div>
    </AbsoluteFill>
  );
};

const Camara: React.FC<{ t: number }> = ({ t }) => {
  // velo azul muy leve y dos líneas de luz que cruzan hacia abajo, siguiendo el movimiento real
  const v = campana(t, CAMARA_ANCHO, 1);
  if (v <= 0) return null;
  const y = interpolate(t, [-CAMARA_ANCHO, CAMARA_ANCHO], [-300, H + 300], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(38,103,255,0) 0%, rgba(38,103,255,${0.22 * v}) 50%, rgba(38,103,255,0) 100%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: y - 220, height: 6, background: CIPAX_MENTA, opacity: 0.55 * v, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 3, background: "#FFFFFF", opacity: 0.6 * v, filter: "blur(1px)" }} />
    </AbsoluteFill>
  );
};

const Placa: React.FC<{ t: number }> = ({ t }) => {
  const sube = p01(t, -PLACA_SUBE, 0);
  if (sube <= 0) return null;
  const curva = 380 * (1 - sube);
  return (
    <AbsoluteFill
      style={{
        background: FONDO_PLACA,
        transform: `translateY(${(1 - sube) * 100}%)`,
        borderTopLeftRadius: `50% ${curva}px`,
        borderTopRightRadius: `50% ${curva}px`,
      }}
    />
  );
};

export const CapaTransicion: React.FC<{ tipo: TipoTransicion; t: number; antes: number }> = ({ tipo, t, antes }) => {
  if (tipo === "pildora") return <Pildora t={t} />;
  if (tipo === "circulo") return <Circulo t={t} />;
  if (tipo === "bandas") return <Bandas t={t} />;
  if (tipo === "isotipo") return <Isotipo t={t} antes={antes} />;
  if (tipo === "camara") return <Camara t={t} />;
  if (tipo === "placa") return <Placa t={t} />;
  return null;
};
