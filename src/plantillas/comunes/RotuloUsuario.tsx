// Rótulo animado de un usuario de redes ("@volto.ai") para el espacio libre del plano, con la estética de la
// marca (no de "IA"): píldora clara como el sitio, el asterisco en el acento que entra con un rebote, la
// píldora que se abre hacia los costados y el usuario que se escribe letra por letra (con cursor), con una
// línea del degradé de la marca debajo. Sale al revés: se borra, se cierra y el asterisco gira y se va.
// Todo depende del cuadro (seek-safe); solo usa la tipografía de títulos de la marca. Sin escalas CSS (se
// veía pixelado): el círculo y el asterisco cambian de tamaño real y la píldora, anclada, crece a la derecha.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Marca } from "../../marcas";

// ---------- Constantes de animación ----------
const CIRCULO_DURA = 10; // frames en que aparece el círculo con el asterisco
const ABRE_DESDE = 6; // la píldora se abre…
const ABRE_DURA = 12;
const TEXTO_DESDE = 12; // la 1ª letra aparece acá…
const TEXTO_PASO = 2; // …y cada letra siguiente, estos frames después
const LINEA_DESDE = 18;
const LINEA_DURA = 16;
const CURSOR_PARPADEO = 8;
const SALIDA = 14; // frames de salida
// Medidas
const ALTO = 128;
const ICONO = 70;
const TAMANO_TEXTO = 72;
const PESO = 700;
const ESPACIADO = 0.01; // em
const HUECO = 22;
const RELLENO_DER = 48;
const LINEA_ALTO = 6;
const SOMBRA = "0 14px 34px rgba(0, 0, 0, 0.28)";
const CURSOR_ANCHO = 5;
// asterisco de public/marcas/volto/estrella.svg (viewBox 27×27)
const ESTRELLA =
  "M17.0621 11.4931H26.2481V14.7551H17.0591L23.5576 21.2531L21.2536 23.5571L14.7556 17.0591V26.2481H11.4931V17.0621L4.99752 23.5576L2.69051 21.2536L9.18904 14.7556H0V11.4931H9.18604L2.69051 4.99752L4.99752 2.69101L11.4931 9.18604V0H14.7556V9.18904L21.2536 2.69101L23.5576 4.99752L17.0621 11.4931Z";
const DEGRADE = "linear-gradient(90deg, #f97d55, #95a8a0, #406162)"; // degradé del cliente

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ancho del texto con la tipografía real (las fuentes ya están cargadas al renderizar)
const anchoTexto = (texto: string, familia: string) => {
  const ctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (!ctx) return texto.length * TAMANO_TEXTO * 0.6;
  ctx.font = `${PESO} ${TAMANO_TEXTO}px ${familia}`;
  return ctx.measureText(texto).width + texto.length * ESPACIADO * TAMANO_TEXTO;
};

export const RotuloUsuario: React.FC<{
  m: Marca;
  texto: string;
  duracion: number; // frames
  y: number; // centro vertical (px, en 1920 de alto)
}> = ({ m, texto, duracion, y }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const familia = m.fuenteTitulos ?? m.fuente;
  const ancho = React.useMemo(
    () => ALTO + HUECO + anchoTexto(texto, familia) + RELLENO_DER,
    [texto, familia],
  );
  const sale = duracion - SALIDA;
  const curva = { ...clamp, easing: m.ease };
  const cierra = { ...clamp, easing: Easing.in(Easing.cubic) };

  // círculo con el asterisco: crece con un leve rebote (Easing.back) y al final gira y se achica
  const entra = interpolate(f, [0, CIRCULO_DURA], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const salidaIcono = interpolate(f, [sale + SALIDA / 2, duracion], [1, 0], cierra);
  const circulo = Math.max(0, entra * salidaIcono);
  const giro = (1 - Math.min(1, entra)) * -90 + (1 - salidaIcono) * 120;
  // píldora: de círculo al ancho completo, y vuelta
  const abre =
    interpolate(f, [ABRE_DESDE, ABRE_DESDE + ABRE_DURA], [0, 1], curva) *
    interpolate(f, [sale, sale + SALIDA / 2], [1, 0], cierra);
  // píldora anclada: el círculo queda en su lugar y crece hacia la derecha (el texto no se mueve)
  const izquierda = Math.round((width - ancho) / 2);
  const d = ALTO * circulo;
  const anchoActual = Math.round(d + (ancho - ALTO) * abre);
  const icono = Math.round(ICONO * circulo);
  // letras: se escriben de a una; al salir se borran de atrás para adelante
  const visibles = Math.max(
    0,
    Math.min(
      texto.length,
      Math.floor((f - TEXTO_DESDE) / TEXTO_PASO) + 1,
      Math.ceil(interpolate(f, [sale - 6, sale + 2], [texto.length, 0], clamp)),
    ),
  );
  const linea =
    interpolate(f, [LINEA_DESDE, LINEA_DESDE + LINEA_DURA], [0, 1], curva) *
    interpolate(f, [sale - 6, sale], [1, 0], cierra);
  const escribiendo = visibles > 0 && f < sale + 2;
  const cursor = escribiendo && (visibles < texto.length || Math.floor(f / CURSOR_PARPADEO) % 2 === 0);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: Math.round(izquierda + (ALTO - d) / 2),
          top: Math.round(y - d / 2),
          width: anchoActual,
          height: Math.round(d),
          borderRadius: d / 2,
          background: m.colores.claro,
          boxShadow: SOMBRA,
          overflow: "hidden",
        }}
      >
        <svg
          width={icono}
          height={icono}
          viewBox="0 0 27 27"
          style={{
            position: "absolute",
            left: Math.round((d - icono) / 2),
            top: Math.round((d - icono) / 2),
            transform: `rotate(${giro}deg)`,
          }}
        >
          <path d={ESTRELLA} fill={m.colores.acento ?? m.colores.tinta} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: ALTO + HUECO - 18,
            top: Math.round((d - ALTO) / 2),
            height: ALTO,
            display: "flex",
            alignItems: "center",
            whiteSpace: "pre",
            fontFamily: familia,
            fontWeight: PESO,
            fontSize: TAMANO_TEXTO,
            letterSpacing: `${ESPACIADO}em`,
            color: m.colores.tinta,
          }}
        >
          <span>{texto.slice(0, visibles)}</span>
          <span style={{ position: "relative", width: 0, height: TAMANO_TEXTO }}>
            <span
              style={{
                position: "absolute",
                left: 3,
                top: TAMANO_TEXTO * 0.12,
                width: CURSOR_ANCHO,
                height: TAMANO_TEXTO * 0.82,
                background: m.colores.acento ?? m.colores.tinta,
                opacity: cursor ? 1 : 0,
              }}
            />
          </span>
          <span style={{ visibility: "hidden" }}>{texto.slice(visibles)}</span>
        </div>
        {/* línea del degradé de la marca, abajo del usuario */}
        <div
          style={{
            position: "absolute",
            left: ALTO + HUECO - 18,
            top: Math.round((d - ALTO) / 2 + ALTO - 24 - LINEA_ALTO),
            height: LINEA_ALTO,
            width: (ancho - ALTO - HUECO - RELLENO_DER + 18) * linea,
            borderRadius: LINEA_ALTO / 2,
            background: DEGRADE,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
