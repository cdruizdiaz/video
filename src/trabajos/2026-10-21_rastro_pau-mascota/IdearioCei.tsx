// Motion graphic con la identidad del CEI para "Arrancamos con el ideario… ganó la flor." (pedido 2026-10-21: que se
// vea lo que dice, en vez de la tablet o de las grabaciones). Fondo Royal Blue con flores en relieve (manual, pág. 4),
// íconos de la construcción del logo (flor + Big Ben, pág. 9), Fraunces para el título y Filson para los rótulos.
//   "ideario"            título "Ideario" con subrayado a mano
//   "elementos icónicos" el título sube y aparecen dos tarjetas vacías
//   "una flor" / "Big Ben"  la flor gira y entra en la primera; el Big Ben sube en la segunda (un pop cada uno)
//   "por descarte"       las dos tarjetas dudan (vaivén)
//   "trillado"           copias del Big Ben se estampan alrededor (escalera de pops) y el Big Ben se apaga y se tacha
//   "patriotas"          entra la bandera: franjas iguales, la blanca centrada en la flor (queda como el sol); pasa
//                        detrás de la flor y POR ENCIMA de la tarjeta del Big Ben (la tapa con el tachado; borrador D:
//                        "que tape el rectángulo, el Big Ben y la línea naranja"); las copias se van
//   "ganó la flor"       se va el Big Ben, la flor va al centro, crece y tira papelitos
// Los tiempos (`beats`) son cuadros desde el inicio de la toma, de la transcripción (composiciones.ts).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MARCAS } from "../../marcas";
import { PALETA_CEI } from "../../marcas/cei/marca";

// ---------- Constantes ----------
const ID = "2026-10-21_rastro_pau-mascota";
const C = PALETA_CEI;
const FONDO = C.royal;
const PATRON_OPACIDAD = 0.07; // flores del fondo
const PATRON_LADO = 230;
const TITULO_Y = 600;
const TITULO_Y_ARRIBA = 300;
const TITULO_TAMANO = 190;
const TITULO_ESCALA_ARRIBA = 0.62;
const SUBRAYADO_DIBUJO = 12; // cuadros
const TARJETA = { ancho: 380, alto: 600, y: 930, x: [300, 780], radio: 40 };
const TARJETA_ENTRADA = 4; // cuadros entre una y otra
const FLOR_LADO = 300;
const BEN_ALTO = 420; // deja aire para el rótulo
const BEN_ASPECTO = 425 / 2010; // img/bigben.png
const ROTULO_TAMANO = 46;
const DUDA_GRADOS = 4;
const SELLOS = [
  // x, y, alto, giro: copias del Big Ben de "trillado", fuera de las tarjetas (x 110–970, y 630–1230) y de los subtítulos
  [130, 400, 230, -12],
  [950, 410, 220, 10],
  [130, 1370, 200, 8],
  [950, 1365, 200, -9],
] as const;
const SELLO_ENTRADA = 1.25; // escala de partida (sin llegar a las tarjetas)
const SELLO_PASO = 3; // cuadros entre sello y sello
const TACHE_DIBUJO = 7;
const FLOR_Y = TARJETA.y - TARJETA.alto / 2 + 110 + FLOR_LADO / 2; // centro de la flor en su tarjeta
const FRANJA = { y: FLOR_Y, alto: 370, entrada: 14 }; // alto de cada franja (tres iguales): la flor queda en la blanca
const GANA_ESCALA = 1.15; // la flor crece sin salirse de la franja blanca
const PAPELITOS = 28;
const PAPELITO_COLORES = [C.calabaza, C.agosto, C.cielo, C.hueso];
const EFECTOS_VOLUMEN = 0.35;
const SELLO_VOLUMEN = 0.28; // los sellos seguidos, un poco más bajos

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = MARCAS.cei.ease;

export type BeatsIdeario = {
  ideario: number;
  elementos: number;
  flor: number;
  bigben: number;
  descarte: number;
  bigben2: number;
  trillado: number;
  patriotas: number;
  gano: number;
};

// Ícono blanco del manual pintado con un color (máscara)
const Icono: React.FC<{
  src: string;
  ancho: number;
  alto: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ src, ancho, alto, color, style }) => (
  <div
    style={{
      width: ancho,
      height: alto,
      backgroundColor: color,
      WebkitMaskImage: `url(${staticFile(src)})`,
      WebkitMaskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      ...style,
    }}
  />
);

const pop = (f: number, fps: number, desde: number) =>
  spring({ frame: f - desde, fps, config: { damping: 11, stiffness: 180 } });

export const IdearioCei: React.FC<{ beats: BeatsIdeario }> = ({ beats: b }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fuenteTitulo = MARCAS.cei.fuenteTitulos ?? MARCAS.cei.fuente;
  const fuente = MARCAS.cei.fuente;

  // título
  const tituloEntra = interpolate(f, [0, 10], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const tituloSube = interpolate(
    f,
    [b.elementos - 4, b.elementos + 8],
    [0, 1],
    { ...clamp, easing: ease },
  );
  const tituloY = interpolate(tituloSube, [0, 1], [TITULO_Y, TITULO_Y_ARRIBA]);
  const tituloEscala = interpolate(
    tituloSube,
    [0, 1],
    [1, TITULO_ESCALA_ARRIBA],
  );
  const subrayado = interpolate(
    f,
    [b.ideario, b.ideario + SUBRAYADO_DIBUJO],
    [0, 1],
    { ...clamp, easing: ease },
  );

  // tarjetas, duda, salida del Big Ben y llegada de la flor al centro
  const duda = interpolate(
    f,
    [
      b.descarte,
      b.descarte + 6,
      b.descarte + 12,
      b.descarte + 18,
      b.descarte + 24,
    ],
    [0, 1, -1, 1, 0],
    clamp,
  );
  const gana = spring({
    frame: f - b.gano,
    fps,
    config: { damping: 13, stiffness: 120 },
  });
  const benSale = interpolate(f, [b.gano - 2, b.gano + 8], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const benApaga = interpolate(
    f,
    [b.trillado + 8, b.trillado + 14],
    [1, 0.35],
    clamp,
  );
  const tache = interpolate(
    f,
    [b.trillado + 10, b.trillado + 10 + TACHE_DIBUJO],
    [0, 1],
    { ...clamp, easing: ease },
  );

  const tarjeta = (i: number) => {
    const entra = pop(f, fps, b.elementos + 6 + i * TARJETA_ENTRADA);
    const esBen = i === 1;
    const x = esBen
      ? TARJETA.x[1]
      : interpolate(gana, [0, 1], [TARJETA.x[0], 540]);
    const escala =
      entra *
      (esBen ? 1 - benSale * 0.3 : interpolate(gana, [0, 1], [1, GANA_ESCALA]));
    const y = TARJETA.y + (esBen ? benSale * 900 : 0);
    const item = esBen ? pop(f, fps, b.bigben) : pop(f, fps, b.flor);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - TARJETA.ancho / 2,
          top: y - TARJETA.alto / 2,
          width: TARJETA.ancho,
          height: TARJETA.alto,
          transform: `scale(${escala}) rotate(${duda * DUDA_GRADOS * (i ? -1 : 1)}deg)`,
          opacity: esBen ? 1 - benSale : 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: TARJETA.radio,
            border: `4px dashed ${C.hueso}`,
            opacity: interpolate(item, [0, 1], [0.45, 0.15]),
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: TARJETA.radio,
            backgroundColor: "rgba(255, 237, 225, 0.08)", // las dos iguales, con la línea punteada (borrador D)
            opacity: item * (1 - franja),
          }}
        />
        {/* ícono */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: esBen ? 30 : 110,
            display: "flex",
            justifyContent: "center",
            opacity: esBen ? benApaga : 1,
            transform: esBen
              ? `translateY(${(1 - item) * 260}px)`
              : `scale(${item}) rotate(${(1 - item) * -160}deg)`,
          }}
        >
          {esBen ? (
            <Icono
              src={`trabajos/${ID}/img/bigben.png`}
              ancho={BEN_ALTO * BEN_ASPECTO}
              alto={BEN_ALTO}
              color={C.hueso}
              style={{ opacity: Math.min(1, item * 2) }}
            />
          ) : (
            <Icono
              src={`trabajos/${ID}/img/flor.png`}
              ancho={FLOR_LADO}
              alto={FLOR_LADO}
              color={C.calabaza}
            />
          )}
        </div>
        {/* tachado a mano sobre el Big Ben */}
        {esBen ? (
          <svg
            width={TARJETA.ancho}
            height={TARJETA.alto}
            style={{ position: "absolute", inset: 0 }}
          >
            <path
              d={`M 50 ${TARJETA.alto - 110} L ${TARJETA.ancho - 50} 70`}
              stroke={C.agosto}
              strokeWidth={16}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - tache}
            />
          </svg>
        ) : null}
        {/* rótulo */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 34,
            textAlign: "center",
            fontFamily: fuente,
            fontWeight: 500,
            fontSize: ROTULO_TAMANO,
            color: C.hueso,
            opacity:
              interpolate(item, [0.3, 1], [0, 1], clamp) *
              (esBen ? benApaga : 1),
          }}
        >
          {esBen ? "Big Ben" : "Flor"}
        </div>
      </div>
    );
  };

  // bandera ("somos patriotas")
  const franja = interpolate(
    f,
    [b.patriotas, b.patriotas + FRANJA.entrada],
    [0, 1],
    { ...clamp, easing: ease },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: FONDO, overflow: "hidden" }}>
      {/* flores en relieve del fondo, que se corren despacio */}
      <AbsoluteFill
        style={{
          opacity: PATRON_OPACIDAD,
          transform: `translateY(${-f * 0.6}px)`,
        }}
      >
        {Array.from({ length: 6 * 11 }, (_, k) => {
          const col = k % 6;
          const fila = Math.floor(k / 6);
          return (
            <Icono
              key={k}
              src={`trabajos/${ID}/img/flor.png`}
              ancho={PATRON_LADO * 0.5}
              alto={PATRON_LADO * 0.5}
              color={C.hueso}
              style={{
                position: "absolute",
                left: col * PATRON_LADO - (fila % 2) * (PATRON_LADO / 2) + 40,
                top: fila * PATRON_LADO * 0.9 - 60,
                transform: `rotate(${(k * 37) % 90}deg)`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* sellos del Big Ben ("trillado") */}
      {SELLOS.map(([x, y, alto, giro], k) => {
        const desde = b.trillado - 6 + k * SELLO_PASO;
        const e = pop(f, fps, desde);
        const sale = interpolate(
          f,
          [b.patriotas, b.patriotas + 6],
          [1, 0],
          clamp,
        ); // se van cuando entra la bandera
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x - (alto * BEN_ASPECTO) / 2,
              top: y - alto / 2,
              transform: `scale(${interpolate(e, [0, 1], [SELLO_ENTRADA, 1])}) rotate(${giro}deg)`,
              opacity: (f >= desde ? Math.min(1, e * 1.5) : 0) * 0.8 * sale,
            }}
          >
            <Icono
              src={`trabajos/${ID}/img/bigben.png`}
              ancho={alto * BEN_ASPECTO}
              alto={alto}
              color={C.cielo}
            />
          </div>
        );
      })}

      {tarjeta(1)}
      {/* bandera: tres franjas iguales, la blanca centrada en la flor; tapa la tarjeta del Big Ben */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: FRANJA.y - (FRANJA.alto * 3) / 2,
          width: `${franja * 100}%`,
          height: FRANJA.alto * 3,
          overflow: "hidden",
        }}
      >
        <div style={{ height: FRANJA.alto, backgroundColor: C.cielo }} />
        <div style={{ height: FRANJA.alto, backgroundColor: "#ffffff" }} />
        <div style={{ height: FRANJA.alto, backgroundColor: C.cielo }} />
      </div>

      {tarjeta(0)}

      {/* papelitos al ganar la flor */}
      {Array.from({ length: PAPELITOS }, (_, k) => {
        const t = f - b.gano - 3;
        if (t < 0) return null;
        const ang = (k / PAPELITOS) * Math.PI * 2 + (k % 3) * 0.2;
        const vel = 22 + (k % 5) * 6;
        const x = 540 + Math.cos(ang) * vel * t;
        const y = TARJETA.y + Math.sin(ang) * vel * t + 1.2 * t * t;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 18,
              height: 30,
              borderRadius: 4,
              backgroundColor: PAPELITO_COLORES[k % PAPELITO_COLORES.length],
              transform: `rotate(${k * 47 + t * 20}deg)`,
              opacity: interpolate(t, [0, 4, 16, 22], [0, 1, 1, 0], clamp),
            }}
          />
        );
      })}

      {/* título */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: tituloY,
          transform: `translateY(-50%) scale(${tituloEscala})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            display: "inline-block",
            paddingBottom: 30,
          }}
        >
          <div
            style={{
              fontFamily: fuenteTitulo,
              fontWeight: 600,
              fontSize: TITULO_TAMANO,
              lineHeight: 1,
              color: C.hueso,
              transform: `translateY(${(1 - tituloEntra) * 110}%)`,
            }}
          >
            Ideario
          </div>
        </div>
        <svg
          width={620}
          height={50}
          style={{ display: "block", margin: "-26px auto 0" }}
        >
          <path
            d="M 10 32 C 150 10, 330 44, 610 18"
            stroke={C.calabaza}
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - subrayado}
          />
        </svg>
      </div>

      {/* efectos */}
      <Sequence from={b.flor} name="pop flor">
        <Audio
          src={staticFile(`trabajos/${ID}/audio/pop_flor.wav`)}
          volume={EFECTOS_VOLUMEN}
        />
      </Sequence>
      <Sequence from={b.bigben} name="pop Big Ben">
        <Audio
          src={staticFile(`trabajos/${ID}/audio/pop_ben.wav`)}
          volume={EFECTOS_VOLUMEN}
        />
      </Sequence>
      {SELLOS.map((_, k) => (
        <Sequence
          key={k}
          from={b.trillado - 6 + k * SELLO_PASO}
          name={`sello ${k + 1}`}
        >
          <Audio
            src={staticFile(`trabajos/${ID}/audio/sello_${k + 1}.wav`)}
            volume={SELLO_VOLUMEN}
          />
        </Sequence>
      ))}
      <Sequence from={b.gano} name="pop ganó">
        <Audio
          src={staticFile(`trabajos/${ID}/audio/pop_gano.wav`)}
          volume={EFECTOS_VOLUMEN}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
