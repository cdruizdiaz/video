// Gráficos de "Consumos del mes" (reel de RASTRO): uno por cosa que nombra Pau, cada uno con la estética de eso
// que nombra (pedido 2026-10-21: "que cada gráfico/imagen tenga la estética de eso que habla"):
//   IconosConsumo     RASTRO (papel, tinta, bordó, turquesa; Inter Black): libro, serie, podcast y música
//   StickerGuilty     Blackie Books (Música de mierda), como etiqueta de libro: "guilty pleasure"
//   PosterAHS         American Horror Story 13: blanco y negro, rojo sangre; entra parpadeando
//   EtiquetasAHS      ídem: vestuario / música / edición, una debajo de la otra, cada una parpadea en su palabra
//   FotoEvan          ídem: la cara en un círculo con aro rojo, en blanco y negro
//   Factoria          "La Fábrica" se tacha y aparece "*la Factoria" sobre resaltador rosa
//   NoTeCases         Factoria: tarjeta con degradé magenta-violeta, la etiqueta rosa "NO TE CASES" y las miniaturas
//                     del cliente pasando una tras otra
//   VentanaDiseno     programa de diseño oscuro genérico (sin logo de Adobe): se traza una curva con la pluma
//   DiscoLali         No vayas a atender…: cromo, strass y la estrella de la hebilla
//   TapaAudiolibro    la tarjeta de Spotify del audiolibro (captura del cliente)
//   FotoYolanda       la cara de Yolanda Reyes en un círculo (foto del cliente)
//   Comentario        RASTRO: comentario de Instagram con el pedido a la comunidad
// Todos los textos en Inter, con los colores de cada estética (pedido 2026-10-21), centrados. Todo va en el aire de
// arriba de la cabeza: `y` es el BORDE DE ABAJO del gráfico, a la misma distancia de la cabeza en todos (ver
// composiciones.ts). Entran con un rebote corto (con `zoom`: se redibujan nítidos) y salen en seco con su toma
// (CRITERIOS_REEL → Gráficos). Los tiempos (`en`, `beats`) son cuadros desde que empieza el gráfico.
import React from "react";
import {
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { MARCAS } from "../../marcas";
import { paletaRastro } from "../../marcas/rastro/marca";

// ---------- Fuentes ----------
const INTER = MARCAS.rastro.fuente;

// ---------- Constantes ----------
const ID = "2026-10-21_rastro_consumos-del-mes";
const img = (n: string) => staticFile(`trabajos/${ID}/img/${n}`);
const ENTRA = 9; // cuadros de la entrada
const REBOTE = 1.7;
const SOMBRA = "0 18px 44px rgba(0, 0, 0, 0.35)";

const R = paletaRastro;
const BLACKIE = { papel: "#f4eee2", azul: "#1d2a4a", rojo: "#b0302a" };
const AHS = { rojo: "#c8102e", negro: "#0b0b0b", blanco: "#f2f2f0" };
const FACTORIA = {
  rosa: "#ff2d8a",
  magenta: "#c3298f",
  violeta: "#5b3fc9",
  azul: "#2b2f6e",
};
const TACHA = 12; // cuadros: "La Fábrica" se tacha…
const CORRIGE = 17; // …y aparece "*la Factoria"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 con un rebote corto desde el cuadro `desde`
export const entra = (f: number, desde = 0) =>
  interpolate(f - desde, [0, ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(REBOTE)),
  });
// parpadeo de película de terror: se prende y se apaga dos veces antes de quedar
const parpadeo = (f: number, desde = 0) => {
  const t = f - desde;
  if (t < 0) return 0;
  return [1, 0, 1, 1, 0.2, 1][Math.min(5, t)] ?? 1;
};

// Pone a sus hijos centrados en x, con el borde de abajo en y, al tamaño `s` (zoom: el navegador redibuja, no estira)
const Pop: React.FC<{
  x: number;
  y: number;
  s: number;
  giro?: number;
  opacidad?: number;
  children: React.ReactNode;
}> = ({ x, y, s, giro = 0, opacidad = 1, children }) =>
  s < 0.02 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        opacity: opacidad,
      }}
    >
      <div style={{ zoom: s, transform: `rotate(${giro}deg)`, flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );

// ---------- RASTRO: íconos de lo que consume ----------
const ICONOS: { nombre: string; d: string }[] = [
  // libro abierto
  {
    nombre: "libros",
    d: "M8 14 C20 10 32 10 40 16 C48 10 60 10 72 14 V62 C60 58 48 58 40 64 C32 58 20 58 8 62 Z M40 16 V64",
  },
  // pantalla con play
  {
    nombre: "series",
    d: "M8 16 H72 V56 H8 Z M30 66 H50 M34 28 L50 36 L34 44 Z",
  },
  // micrófono de podcast
  {
    nombre: "podcasts",
    d: "M30 14 a10 10 0 0 1 20 0 V38 a10 10 0 0 1 -20 0 Z M20 36 a20 20 0 0 0 40 0 M40 56 V68 M30 68 H50",
  },
  // nota musical
  {
    nombre: "música",
    d: "M30 58 a8 7 0 1 1 -1 -1 V18 L62 12 V52 a8 7 0 1 1 -1 -1 V24 L30 30",
  },
];
const ICONO_COLORES = [R.bordo, R.petroleo, R.turquesa, R.tinta];
export const IconosConsumo: React.FC<{
  y: number;
  paso: number;
  escala: number;
}> = ({ y, paso, escala }) => {
  const f = useCurrentFrame();
  const lado = 190;
  const sep = 230 * escala;
  return (
    <>
      {ICONOS.map((ic, k) => (
        <Pop
          key={k}
          x={540 + (k - 1.5) * sep}
          y={y}
          s={entra(f, k * paso) * escala}
          giro={[-6, 4, -3, 5][k]}
        >
          <div
            style={{
              width: lado,
              height: lado + 50,
              borderRadius: 28,
              background: R.papel,
              boxShadow: SOMBRA,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg width={110} height={110} viewBox="0 0 80 80">
              <path
                d={ic.d}
                fill="none"
                stroke={ICONO_COLORES[k]}
                strokeWidth={5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                fontFamily: INTER,
                fontWeight: 700,
                fontSize: 30,
                color: R.tinta,
              }}
            >
              {ic.nombre}
            </div>
          </div>
        </Pop>
      ))}
    </>
  );
};

// ---------- Blackie Books ----------
export const StickerGuilty: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-4}>
      <div
        style={{
          background: BLACKIE.papel,
          border: `3px solid ${BLACKIE.azul}`,
          borderRadius: 8,
          padding: "16px 44px 20px",
          boxShadow: SOMBRA,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 74,
            lineHeight: 1,
            letterSpacing: -1,
            color: BLACKIE.azul,
            whiteSpace: "nowrap",
          }}
        >
          guilty pleasure
        </div>
        <div
          style={{
            height: 3,
            width: 260,
            background: BLACKIE.rojo,
            margin: "14px auto 0",
          }}
        />
      </div>
    </Pop>
  );
};

// ---------- American Horror Story 13 ----------
export const PosterAHS: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  return (
    <Pop x={540} y={y} s={1} opacidad={parpadeo(f)}>
      <div
        style={{
          background: AHS.blanco,
          padding: 12,
          boxShadow: SOMBRA,
          borderBottom: `8px solid ${AHS.rojo}`,
        }}
      >
        <Img src={img("ahs13.png")} style={{ height: 420, display: "block" }} />
      </div>
    </Pop>
  );
};

// una debajo de la otra, centradas (la de abajo en `y`)
const ETIQUETA_ALTO = 92;
export const EtiquetasAHS: React.FC<{ y: number; beats: number[] }> = ({
  y,
  beats,
}) => {
  const f = useCurrentFrame();
  const textos = ["VESTUARIO", "MÚSICA", "EDICIÓN"];
  return (
    <>
      {textos.map((t, k) => (
        <Pop
          key={t}
          x={540}
          y={y - (textos.length - 1 - k) * ETIQUETA_ALTO}
          s={1}
          opacidad={parpadeo(f, beats[k])}
          giro={[-2, 1.5, -1][k]}
        >
          <div
            style={{
              background: AHS.negro,
              color: AHS.blanco,
              fontFamily: INTER,
              fontWeight: 700,
              fontSize: 54,
              letterSpacing: 8,
              padding: "4px 30px 6px 38px",
              borderLeft: `10px solid ${AHS.rojo}`,
              boxShadow: SOMBRA,
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </div>
        </Pop>
      ))}
    </>
  );
};

// foto redonda con aro
const Circulo: React.FC<{
  src: string;
  lado: number;
  aro: string;
  posicion?: string;
  filtro?: string;
}> = ({ src, lado, aro, posicion = "50% 50%", filtro }) => (
  <div
    style={{
      width: lado,
      height: lado,
      borderRadius: "50%",
      padding: 8,
      background: aro,
      boxShadow: SOMBRA,
    }}
  >
    <Img
      src={src}
      style={{
        width: lado,
        height: lado,
        borderRadius: "50%",
        objectFit: "cover",
        objectPosition: posicion,
        filter: filtro,
        display: "block",
      }}
    />
  </div>
);

export const FotoEvan: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  return (
    <Pop x={540} y={y} s={entra(f)}>
      <Circulo
        src={img("evan_peters.jpg")}
        lado={350}
        aro={AHS.rojo}
        posicion="45% 25%"
        filtro="grayscale(1) contrast(1.15)"
      />
    </Pop>
  );
};

// ---------- Factoria ----------
// "La Fábrica" (como lo dice Pau) se tacha y debajo aparece el nombre bien escrito (la de abajo en `y`)
export const Factoria: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  const tacha = interpolate(f, [TACHA, TACHA + 4], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const raya = interpolate(f, [CORRIGE + 2, CORRIGE + 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const letra = {
    fontFamily: INTER,
    fontWeight: 700,
    whiteSpace: "nowrap",
    color: "#ffffff",
    textShadow: `0 3px 0 ${FACTORIA.azul}`,
  } as const;
  return (
    <>
      <Pop x={540} y={y - 96} s={entra(f)} giro={-3}>
        <div style={{ position: "relative", padding: "0 10px" }}>
          <div
            style={{ ...letra, fontSize: 60, opacity: f >= TACHA ? 0.75 : 1 }}
          >
            La Fábrica
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "52%",
              height: 8,
              width: `${tacha * 100}%`,
              background: FACTORIA.azul,
              borderRadius: 4,
              transform: "rotate(-3deg)",
            }}
          />
        </div>
      </Pop>
      <Pop x={540} y={y} s={entra(f, CORRIGE)} giro={-4}>
        <div style={{ position: "relative", padding: "4px 18px" }}>
          {/* resaltador */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 16,
              height: 64,
              width: `${raya * 100}%`,
              background: FACTORIA.rosa,
              opacity: 0.9,
              borderRadius: 6,
              transform: "skewX(-8deg)",
            }}
          />
          <div style={{ ...letra, position: "relative", fontSize: 68 }}>
            <span style={{ color: FACTORIA.azul, textShadow: "none" }}>*</span>
            la Factoria
          </div>
        </div>
      </Pop>
    </>
  );
};

export const NoTeCases: React.FC<{ y: number; cada: number }> = ({
  y,
  cada,
}) => {
  const f = useCurrentFrame();
  const n = Math.min(3, Math.floor(Math.max(0, f - ENTRA) / cada));
  const ancho = 600;
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-2}>
      <div
        style={{
          background: `linear-gradient(135deg, ${FACTORIA.magenta}, ${FACTORIA.violeta})`,
          padding: 16,
          borderRadius: 22,
          boxShadow: SOMBRA,
          position: "relative",
        }}
      >
        <Img
          src={img(`notecases_${n + 1}.jpg`)}
          style={{
            width: ancho,
            height: (ancho * 9) / 16,
            display: "block",
            borderRadius: 12,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -18,
            top: -26,
            background: FACTORIA.rosa,
            color: "#fff",
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 38,
            padding: "6px 20px",
            transform: "rotate(-4deg)",
          }}
        >
          NO TE CASES
        </div>
      </div>
    </Pop>
  );
};

// ---------- Programa de diseño (genérico) ----------
export const VentanaDiseno: React.FC<{ y: number; escala: number }> = ({
  y,
  escala,
}) => {
  const f = useCurrentFrame();
  const trazo = interpolate(f, [6, 30], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const azul = "#31a8ff";
  return (
    <Pop x={540} y={y} s={entra(f) * escala} giro={1.5}>
      <div
        style={{
          width: 620,
          height: 400,
          background: "#323232",
          borderRadius: 14,
          boxShadow: SOMBRA,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: INTER,
        }}
      >
        <div
          style={{
            height: 40,
            background: "#262626",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{ width: 13, height: 13, borderRadius: 7, background: c }}
            />
          ))}
          <div style={{ color: "#bbb", fontSize: 18, marginLeft: 14 }}>
            consumos_del_mes.psd @ 100%
          </div>
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          <div
            style={{
              width: 46,
              background: "#2a2a2a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              paddingTop: 14,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <div
                key={k}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: `2px solid ${k === 3 ? azul : "#8a8a8a"}`,
                }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              background: "#4a4a4a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={380} height={270} style={{ background: R.papel }}>
              <path
                d="M30 210 C 90 40, 170 40, 190 135 S 300 240, 350 60"
                fill="none"
                stroke={R.tinta}
                strokeWidth={6}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - trazo}
              />
              <circle cx={350} cy={60} r={7} fill={azul} opacity={trazo} />
              <circle cx={30} cy={210} r={7} fill={azul} />
            </svg>
          </div>
          <div style={{ width: 110, background: "#2a2a2a", padding: 10 }}>
            <div style={{ color: "#ddd", fontSize: 15, marginBottom: 8 }}>
              Capas
            </div>
            {["Pau", "Ideas", "Fondo"].map((c, k) => (
              <div
                key={c}
                style={{
                  color: "#ccc",
                  fontSize: 14,
                  padding: "6px 6px",
                  marginBottom: 4,
                  borderRadius: 4,
                  background: k === 0 ? azul + "55" : "#3a3a3a",
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Pop>
  );
};

// ---------- Lali ----------
const Estrella: React.FC<{ lado: number; giro: number }> = ({ lado, giro }) => (
  <svg
    width={lado}
    height={lado}
    viewBox="-50 -50 100 100"
    style={{ transform: `rotate(${giro}deg)` }}
  >
    <defs>
      <linearGradient id="cromo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.45" stopColor="#b8bcc4" />
        <stop offset="0.55" stopColor="#6f747d" />
        <stop offset="1" stopColor="#e3e5e9" />
      </linearGradient>
    </defs>
    <circle r={46} fill="url(#cromo)" stroke="#3b3e44" strokeWidth={3} />
    <path
      d={Array.from({ length: 5 }, (_, k) => {
        const a = (-90 + k * 144) * (Math.PI / 180);
        return `${k ? "L" : "M"}${Math.cos(a) * 36} ${Math.sin(a) * 36}`;
      }).join(" ")}
      fill="none"
      stroke="#2c2f35"
      strokeWidth={5}
      strokeLinejoin="round"
    />
  </svg>
);
// cadena de strass alrededor de un rectángulo
const Strass: React.FC<{ ancho: number; alto: number; t: number }> = ({
  ancho,
  alto,
  t,
}) => {
  const paso = 26;
  const puntos: [number, number][] = [];
  for (let x = 0; x <= ancho; x += paso) puntos.push([x, 0], [x, alto]);
  for (let y = paso; y < alto; y += paso) puntos.push([0, y], [ancho, y]);
  return (
    <svg
      width={ancho + 20}
      height={alto + 20}
      style={{ position: "absolute", left: -10, top: -10 }}
    >
      {puntos.map(([x, y], k) => (
        <circle
          key={k}
          cx={x + 10}
          cy={y + 10}
          r={5.5}
          fill="#f4f6fa"
          stroke="#9aa0aa"
          strokeWidth={1.5}
          opacity={0.75 + 0.25 * Math.sin(t * 0.5 + k)}
        />
      ))}
    </svg>
  );
};
export const DiscoLali: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  const lado = 400;
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-3}>
      <div style={{ position: "relative", width: lado, height: lado }}>
        <Strass ancho={lado} alto={lado} t={f} />
        <Img
          src={img("lali_nvaacedl.jpg")}
          style={{
            width: lado,
            height: lado,
            display: "block",
            boxShadow: SOMBRA,
            position: "relative",
          }}
        />
        <div style={{ position: "absolute", right: -50, bottom: -50 }}>
          <Estrella lado={130} giro={f * 3} />
        </div>
      </div>
    </Pop>
  );
};

// ---------- Audiolibros Por qué leer ----------
// la tarjeta de Spotify (captura del cliente, 922×440)
export const TapaAudiolibro: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  const ancho = 760;
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-2}>
      <Img
        src={img("dar_de_leer_spotify.jpg")}
        style={{
          width: ancho,
          height: (ancho * 440) / 922,
          display: "block",
          borderRadius: 34,
          boxShadow: SOMBRA,
        }}
      />
    </Pop>
  );
};

export const FotoYolanda: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  return (
    <Pop x={x} y={y} s={entra(f)}>
      <Circulo src={img("yolanda_reyes.jpg")} lado={210} aro="#ffffff" />
    </Pop>
  );
};

const Corazon: React.FC<{ lado: number; color: string; trazo?: boolean }> = ({
  lado,
  color,
  trazo,
}) => (
  <svg width={lado} height={lado} viewBox="0 0 100 100">
    <path
      d="M50 86 C20 64 8 46 8 30 C8 16 19 8 31 8 C40 8 46 13 50 20 C54 13 60 8 69 8 C81 8 92 16 92 30 C92 46 80 64 50 86 Z"
      fill={trazo ? "none" : color}
      stroke={color}
      strokeWidth={trazo ? 7 : 0}
      strokeLinejoin="round"
    />
  </svg>
);

// ---------- RASTRO: comentario ----------
export const Comentario: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  const texto = "¿Qué estás consumiendo?";
  const letras = Math.round(
    interpolate(f, [6, 6 + texto.length * 0.9], [0, texto.length], clamp),
  );
  return (
    <Pop x={540} y={y} s={entra(f)}>
      <div
        style={{
          width: 760,
          background: R.papel,
          borderRadius: 26,
          boxShadow: SOMBRA,
          padding: "22px 26px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontFamily: INTER,
        }}
      >
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: 37,
            background: R.bordo,
            color: R.papel,
            fontWeight: 700,
            fontSize: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          R
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: R.tinta }}>
            Comentarios
          </div>
          <div style={{ fontSize: 40, color: R.tinta, marginTop: 4 }}>
            {texto.slice(0, letras)}
            <span style={{ color: R.turquesa, opacity: f % 16 < 8 ? 1 : 0 }}>
              |
            </span>
          </div>
        </div>
        <Corazon lado={46} color={R.bordo} trazo />
      </div>
    </Pop>
  );
};
