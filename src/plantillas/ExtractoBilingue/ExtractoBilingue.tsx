// Extracto de una persona hablando (video cuadrado o de baja resolución) con subtítulos bilingües
// (español protagonista, idioma original secundario) y un cierre: texto de invitación + perfil de Instagram.
// Pensada para La Encina (2026-10-13_laencina_eros-filosofia); los textos y tiempos van por props.
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  interpolateColors,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MARCAS } from "../../marcas";
import { conAlfa, type Marca } from "../../marcas/tipos";

// ---- Valores de animación -------------------------------------------------------------------------
const LADO_VIDEO = 880; // px; el crudo es chico, no se agranda a pantalla completa
const TOPE_VIDEO = 340;
const ALTO_LOGO_EXTRACTO = 120;
const MARGEN_LOGO = 100; // px desde el borde izquierdo y desde el borde inferior (logo en la esquina)
const TOPE_SUBTITULOS = 1280;
const ANCHO_TEXTO = 900;
const MAX_CARACTERES_ES = 34; // por encima se parte en dos líneas (la de arriba más corta: piramidal)
const MAX_CARACTERES_EN = 48;
const FUNDIDO_FRASE = 6; // cuadros
const FUNDIDO_CIERRE = 15;
const DESPLAZAMIENTO_ENTRADA = 22; // px
const TAM_ES = 66;
const TAM_EN = 32;
const PALABRA_DESTACADA = /^(amor)([,.;:!?]*)$/i; // en español se resalta en rojo
const FUNDIDO_AUDIO = 7; // cuadros, justo antes de que termine la última palabra

// Emblema del cierre (círculo que se dibuja + hoja que crece + filetes)
const EMBLEMA_CX = 540;
const EMBLEMA_CY = 380;
const EMBLEMA_RADIO = 130;
const EMBLEMA_ALTO_HOJA = 176;
const FILETE_LARGO = 170;
const FILETE_SEPARACION = 28;

// Perfil de Instagram (coordenadas de la captura de 1350 × 777)
const CAPTURA_ANCHO = 1350;
const CARTA_ANCHO = 940;
const CARTA_ALTO = 430;
const RECORTE_CABECERA = { x: 365, y: 22, ancho: 600 }; // zona de la cabecera
const FOCO_ARROBA = { x: 592, y: 43, ancho: 300 };
const FOCO_LINK = { x: 602, y: 185, ancho: 340 };
const CAJA_ARROBA = { x: 521, y: 30, w: 140, h: 26 };
const CAJA_LINK = { x: 521, y: 178, w: 166, h: 17 };

export type Frase = { desde: number; hasta: number; es: string; en: string }; // segundos

export type ExtractoBilingueProps = {
  video: string; // ruta dentro de public/
  capturaPerfil: string; // ruta dentro de public/
  usuario: string; // "@laencina.taller"
  logoEsquina: string; // ruta dentro de public/: logo abajo a la izquierda durante el extracto
  frases: Frase[];
  audioHasta: number; // s: la voz se corta acá (fundido corto) aunque el video siga
  cierreDesde: number; // s: donde termina el extracto y empieza el cierre
  subtitulos: boolean; // false = versión sin subtítulos quemados
  marca: string; // id en src/marcas (las props viajan como JSON: no pueden llevar funciones)
  oro: string;
  textoCierre: {
    pregunta: string;
    invitacionAntes: string;
    invitacionDestacado: string;
    lugar: string; // "Santa Fe, 1 de mayo 1372"
    fecha: string; // "Inicio 3/11"
    inscripcion: string;
  };
};

const ease = (t: number, f: (x: number) => number) => f(Math.min(1, Math.max(0, t)));

const recorta = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Entrada con fundido + desplazamiento corto; salida con fundido.
const aparicion = (frame: number, desde: number, hasta: number, ef: (x: number) => number) => {
  const e = ease(recorta(frame, desde, desde + FUNDIDO_CIERRE), ef);
  const sale = 1 - recorta(frame, hasta, hasta + FUNDIDO_CIERRE);
  return { opacity: e * sale, y: (1 - e) * DESPLAZAMIENTO_ENTRADA };
};

// Parte un texto en dos líneas con la de arriba más corta (forma piramidal); una sola línea si entra.
export const lineasPiramidales = (texto: string, maxCaracteres: number): string[] => {
  if (texto.length <= maxCaracteres) return [texto];
  const palabras = texto.split(" ");
  let mejor = -1;
  let mejorDif = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const a = palabras.slice(0, i).join(" ").length;
    const b = palabras.slice(i).join(" ").length;
    if (a > b) break; // la de arriba nunca más larga que la de abajo
    if (b - a < mejorDif) {
      mejorDif = b - a;
      mejor = i;
    }
  }
  if (mejor < 0) mejor = Math.floor(palabras.length / 2);
  return [palabras.slice(0, mejor).join(" "), palabras.slice(mejor).join(" ")];
};

export const ExtractoBilingue: React.FC<ExtractoBilingueProps> = ({
  video,
  capturaPerfil,
  usuario,
  logoEsquina,
  frases,
  audioHasta,
  cierreDesde,
  subtitulos,
  marca: marcaId,
  oro,
  textoCierre,
}) => {
  const marca = MARCAS[marcaId];
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const C = Math.round(cierreDesde * fps); // cuadro donde arranca el cierre
  const c = (s: number) => C + Math.round(s * fps); // segundos relativos al cierre -> cuadro
  const ef = marca.ease;
  const titulos = marca.fuenteTitulos ?? marca.fuente;
  const rojo = marca.colores.acento ?? "#EF382D";

  // ---- Extracto ----
  const A = Math.round(audioHasta * fps);
  const volumen = 1 - recorta(frame, A - FUNDIDO_AUDIO, A);
  const extractoOpacidad = 1 - ease(recorta(frame, C, C + 14), ef);
  const extractoEscala = 1 - 0.04 * ease(recorta(frame, C, C + 14), ef);
  const fondo = interpolateColors(frame, [C, C + 14], [marca.colores.claro, marca.colores.oscuro]);
  const logoExtracto =
    interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    (1 - recorta(frame, C - 2, C + 10));

  // ---- Cierre: emblema ----
  const pCirculo = ease(recorta(frame, c(0.15), c(1.15)), ef);
  const pHoja = ease(recorta(frame, c(0.45), c(1.35)), ef);
  const pFilete = ease(recorta(frame, c(1.0), c(1.7)), ef);
  const circunferencia = 2 * Math.PI * EMBLEMA_RADIO;
  const anchoHoja = EMBLEMA_ALTO_HOJA * (544 / 946);

  // ---- Cierre: textos ----
  const textosSalen = c(6.6);
  const tPregunta = aparicion(frame, c(0.9), textosSalen, ef);
  const tFiletes = aparicion(frame, c(1.7), textosSalen, ef);
  const tInvita = aparicion(frame, c(2.2), textosSalen, ef);
  const tLugar = aparicion(frame, c(3.4), textosSalen, ef);
  const tInscribite = aparicion(frame, c(4.6), textosSalen, ef);

  // Carta del perfil: entra, zoom al @, desplazamiento al link, sale.
  const carta = aparicion(frame, c(6.9), c(10.4), ef);
  // pasos: cabecera -> @ -> @ (sostiene) -> link -> link (sostiene)
  const kf = [c(6.9), c(7.6), c(8.5), c(9.2), c(10.0)];
  const paso = (vals: number[]) =>
    interpolate(frame, kf, vals, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ef });
  const escalaCabecera = CARTA_ANCHO / RECORTE_CABECERA.ancho;
  const sArroba = CARTA_ANCHO / FOCO_ARROBA.ancho;
  const sLink = CARTA_ANCHO / FOCO_LINK.ancho;
  const cx0 = RECORTE_CABECERA.x + RECORTE_CABECERA.ancho / 2;
  const cy0 = RECORTE_CABECERA.y + CARTA_ALTO / escalaCabecera / 2;
  const s = paso([escalaCabecera, sArroba, sArroba, sLink, sLink]);
  const fx = paso([cx0, FOCO_ARROBA.x, FOCO_ARROBA.x, FOCO_LINK.x, FOCO_LINK.x]);
  const fy = paso([cy0, FOCO_ARROBA.y, FOCO_ARROBA.y, FOCO_LINK.y, FOCO_LINK.y]);
  const resaltaArroba = interpolate(frame, [c(7.6), c(8.0), c(9.0), c(9.3)], [0, 1, 1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const resaltaLink = recorta(frame, c(9.2), c(9.6));

  // Usuario final, sostenido
  const final = aparicion(frame, c(10.8), durationInFrames + 100, ef);
  const subrayado = ease(recorta(frame, c(11.2), c(12.0)), ef);

  return (
    <AbsoluteFill style={{ backgroundColor: fondo, fontFamily: marca.fuente }}>
      {/* Extracto */}
      <AbsoluteFill style={{ opacity: extractoOpacidad }}>
        <div
          style={{
            position: "absolute",
            left: (1080 - LADO_VIDEO) / 2,
            top: TOPE_VIDEO,
            width: LADO_VIDEO,
            height: LADO_VIDEO,
            outline: `1px solid ${conAlfa(oro, 0.8)}`,
            outlineOffset: 10,
            overflow: "hidden",
            transform: `scale(${extractoEscala})`,
          }}
        >
          <OffthreadVideo
            src={staticFile(video)}
            volume={volumen}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {subtitulos
          ? frases.map((f) => <Subtitulo key={f.desde} frase={f} marca={marca} titulos={titulos} />)
          : null}
      </AbsoluteFill>

      {/* Logo en la esquina inferior izquierda, con margen del borde */}
      {logoExtracto > 0 ? (
        <Img
          src={staticFile(logoEsquina)}
          style={{
            position: "absolute",
            left: MARGEN_LOGO,
            bottom: MARGEN_LOGO,
            height: ALTO_LOGO_EXTRACTO,
            opacity: logoExtracto,
          }}
        />
      ) : null}

      {/* Cierre: emblema. El círculo se dibuja, la hoja crece desde abajo y salen los filetes */}
      {frame >= C ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} viewBox="0 0 1080 1920">
            <circle
              cx={EMBLEMA_CX}
              cy={EMBLEMA_CY}
              r={EMBLEMA_RADIO}
              fill="none"
              stroke={oro}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={circunferencia * (1 - pCirculo)}
              transform={`rotate(-90 ${EMBLEMA_CX} ${EMBLEMA_CY})`}
            />
            <line
              x1={EMBLEMA_CX + EMBLEMA_RADIO + FILETE_SEPARACION}
              x2={EMBLEMA_CX + EMBLEMA_RADIO + FILETE_SEPARACION + FILETE_LARGO * pFilete}
              y1={EMBLEMA_CY}
              y2={EMBLEMA_CY}
              stroke={conAlfa(oro, 0.75)}
              strokeWidth={1.5}
            />
            <line
              x1={EMBLEMA_CX - EMBLEMA_RADIO - FILETE_SEPARACION}
              x2={EMBLEMA_CX - EMBLEMA_RADIO - FILETE_SEPARACION - FILETE_LARGO * pFilete}
              y1={EMBLEMA_CY}
              y2={EMBLEMA_CY}
              stroke={conAlfa(oro, 0.75)}
              strokeWidth={1.5}
            />
          </svg>
          <Img
            src={staticFile(marca.logo)}
            style={{
              position: "absolute",
              left: EMBLEMA_CX - anchoHoja / 2,
              top: EMBLEMA_CY - EMBLEMA_ALTO_HOJA / 2,
              height: EMBLEMA_ALTO_HOJA,
              opacity: Math.min(1, pHoja * 2),
              clipPath: `inset(${(1 - pHoja) * 100}% 0 0 0)`,
              transform: `scale(${0.88 + 0.12 * pHoja})`,
              transformOrigin: "50% 100%",
            }}
          />
        </>
      ) : null}

      {/* Cierre: invitación. Una sola columna centrada, con ritmo parejo entre bloques */}
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 640,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          color: marca.colores.claro,
        }}
      >
        <div
          style={{
            fontFamily: titulos,
            fontWeight: 600,
            fontSize: 94,
            lineHeight: 1.06,
            opacity: tPregunta.opacity,
            transform: `translateY(${tPregunta.y}px)`,
          }}
        >
          {textoCierre.pregunta}
        </div>
        <div
          style={{
            marginTop: 44,
            width: 110,
            height: 2,
            backgroundColor: oro,
            opacity: tFiletes.opacity,
          }}
        />
        <div
          style={{
            marginTop: 44,
            opacity: tInvita.opacity,
            transform: `translateY(${tInvita.y}px)`,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 400, letterSpacing: 1, color: conAlfa(marca.colores.claro, 0.85) }}>
            {textoCierre.invitacionAntes}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: titulos,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 82,
              lineHeight: 1.1,
              color: rojo,
              whiteSpace: "nowrap",
            }}
          >
            {textoCierre.invitacionDestacado}
          </div>
        </div>
        <div
          style={{
            marginTop: 52,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            opacity: tLugar.opacity,
            transform: `translateY(${tLugar.y}px)`,
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <IconoUbicacion color={oro} />
            <span>{textoCierre.lugar}</span>
          </div>
          <div style={{ fontWeight: 500, fontSize: 38, color: conAlfa(marca.colores.claro, 0.9) }}>
            {textoCierre.fecha}
          </div>
        </div>
        <div
          style={{
            marginTop: 64,
            fontSize: 34,
            fontWeight: 400,
            color: conAlfa(marca.colores.claro, 0.8),
            opacity: tInscribite.opacity,
            transform: `translateY(${tInscribite.y}px)`,
          }}
        >
          {textoCierre.inscripcion}
        </div>
      </div>

      {/* Cierre: perfil de Instagram */}
      <div
        style={{
          position: "absolute",
          left: (1080 - CARTA_ANCHO) / 2,
          top: 760,
          width: CARTA_ANCHO,
          height: CARTA_ALTO,
          overflow: "hidden",
          borderRadius: 18,
          outline: `1px solid ${conAlfa(oro, 0.8)}`,
          outlineOffset: 8,
          opacity: carta.opacity,
          transform: `translateY(${carta.y}px)`,
          backgroundColor: marca.colores.fondo,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CAPTURA_ANCHO,
            transformOrigin: "0 0",
            transform: `translate(${CARTA_ANCHO / 2 - fx * s}px, ${CARTA_ALTO / 2 - fy * s}px) scale(${s})`,
          }}
        >
          <Img src={staticFile(capturaPerfil)} style={{ width: CAPTURA_ANCHO, display: "block" }} />
          <Caja caja={CAJA_ARROBA} color={rojo} opacidad={resaltaArroba} />
          <Caja caja={CAJA_LINK} color={rojo} opacidad={resaltaLink} />
        </div>
      </div>

      {/* Cierre: @usuario sostenido */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 900,
          textAlign: "center",
          opacity: final.opacity,
          transform: `translateY(${final.y}px)`,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 84, color: marca.colores.claro, letterSpacing: 0.5 }}>{usuario}</div>
        <div
          style={{
            margin: "22px auto 0",
            height: 4,
            width: 640 * subrayado,
            backgroundColor: rojo,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const IconoUbicacion: React.FC<{ color: string }> = ({ color }) => (
  <svg width={34} height={44} viewBox="0 0 24 32" fill="none">
    <path
      d="M12 1.5C6.2 1.5 1.5 6 1.5 11.6c0 7.4 8.2 17 10.5 19 2.3-2 10.5-11.6 10.5-19C22.5 6 17.8 1.5 12 1.5Z"
      stroke={color}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
    <circle cx={12} cy={11.6} r={3.6} fill={color} />
  </svg>
);

const Caja: React.FC<{
  caja: { x: number; y: number; w: number; h: number };
  color: string;
  opacidad: number;
}> = ({ caja, color, opacidad }) => (
  <div
    style={{
      position: "absolute",
      left: caja.x - 6,
      top: caja.y - 4,
      width: caja.w + 12,
      height: caja.h + 8,
      border: `2px solid ${color}`,
      borderRadius: 6,
      opacity: opacidad,
    }}
  />
);

// Texto con la palabra "amor" en rojo (solo español)
const ConDestacado: React.FC<{ linea: string; rojo: string }> = ({ linea, rojo }) => (
  <>
    {linea.split(" ").map((w, i, arr) => (
      <React.Fragment key={i}>
        {PALABRA_DESTACADA.test(w) ? <span style={{ color: rojo }}>{w}</span> : w}
        {i < arr.length - 1 ? " " : ""}
      </React.Fragment>
    ))}
  </>
);

const Subtitulo: React.FC<{ frase: Frase; marca: Marca; titulos: string }> = ({ frase, marca, titulos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = Math.round(frase.desde * fps);
  const h = Math.round(frase.hasta * fps);
  const opacity = interpolate(frame, [d - FUNDIDO_FRASE, d, h, h + FUNDIDO_FRASE], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  const es = lineasPiramidales(frase.es, MAX_CARACTERES_ES);
  const en = lineasPiramidales(frase.en, MAX_CARACTERES_EN);
  const rojo = marca.colores.acento ?? "#EF382D";
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - ANCHO_TEXTO) / 2 - 20,
        width: ANCHO_TEXTO + 40,
        top: TOPE_SUBTITULOS,
        textAlign: "center",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: titulos,
          fontWeight: 600,
          fontSize: TAM_ES,
          lineHeight: 1.08,
          color: marca.colores.tinta,
        }}
      >
        {es.map((l) => (
          <div key={l}>
            <ConDestacado linea={l} rojo={rojo} />
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: marca.fuente,
          fontWeight: 500,
          fontSize: TAM_EN,
          lineHeight: 1.25,
          color: conAlfa(marca.colores.tinta, 0.72),
        }}
      >
        {en.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
};
