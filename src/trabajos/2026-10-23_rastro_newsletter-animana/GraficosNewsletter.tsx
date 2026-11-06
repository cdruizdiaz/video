// Gráficos del reel "¿Funcionó tu newsletter?" (RASTRO, caso animaná). Identidad de RASTRO (papel, tinta, bordó,
// turquesa de los trazos a mano; Inter): el video es para las redes de RASTRO, aunque cuente un trabajo para animaná.
// Lo de animaná aparece solo como material real: las grabaciones de pantalla (Figma y EmailOctopus, recortadas para
// que no se vea ningún dato de suscriptores) y su logo en la etiqueta "caso".
//   SobrePregunta     "¿Cómo saber si funcionó…?": un sobre y un "?" trazado a mano
//   Pasos             "un objetivo único… un CTA claro": dos pasos numerados, cada uno en su palabra
//   PlacaFigma        "y un diseño que se lee en menos de 10 segundos": placa a pantalla completa con el newsletter de
//                     animaná en Figma (pasado rápido) y una barra de 10 s
//   ReporteAperturas  "Aperturas dicen si te leyeron": el reporte real de EmailOctopus; se marca "Opened"
//   Formula           "el CTR, el clic sobre los enviados" / "sobre los que abrieron… CTOR": la cuenta con los
//                     números del reporte (13 ÷ 373 y 13 ÷ 163); en el CTOR se tacha "enviados" y entra "aperturas"
//   BotonClic         "si el botón funcionó": un botón que se toca
//   PlacaUtm          "el UTM": placa con el link real del reporte; se resaltan los parámetros utm_
//   Analytics         "en Google Analytics ves quién llegó desde ese mail… compró, tocó un botón o se fue"
//   Usuario           "¿Querés que te armemos el tuyo?": @somos_rastro
// Los de la persona van en el aire de arriba de la cabeza: `y` es el BORDE DE ABAJO del gráfico (ver composiciones.ts).
// Entran con un rebote corto (con `zoom`: se redibujan nítidos) y salen en seco con su toma (CRITERIOS_REEL →
// Gráficos). Los tiempos (`beats`) son cuadros desde que empieza el gráfico.
import React from "react";
import {
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { MARCAS } from "../../marcas";
import { paletaRastro } from "../../marcas/rastro/marca";

// ---------- Fuentes ----------
const INTER = MARCAS.rastro.fuente;

// ---------- Constantes ----------
const ID = "2026-10-23_rastro_newsletter-animana";
const img = (n: string) => staticFile(`trabajos/${ID}/img/${n}`);
const ENTRA = 9; // cuadros de la entrada
const REBOTE = 1.7;
const TRAZO = 12; // cuadros en que se dibuja un trazo a mano
const SOMBRA = "0 18px 44px rgba(0, 0, 0, 0.35)";
const RADIO = 26;

const R = paletaRastro;
const PLACA_FONDO = R.tinta; // placas a pantalla completa: los subtítulos blancos se leen
const LETRA = { fontFamily: INTER, color: R.tinta } as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 con un rebote corto desde el cuadro `desde`
const entra = (f: number, desde = 0) =>
  interpolate(f - desde, [0, ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(REBOTE)),
  });
// 0 → 1 de un trazo que se dibuja
const traza = (f: number, desde = 0, dura = TRAZO) =>
  interpolate(f - desde, [0, dura], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
// entrada sin rebote (placas): sube un poco y aparece
const sube = (f: number, desde = 0) => {
  const t = interpolate(f - desde, [0, 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: t, transform: `translateY(${(1 - t) * 30}px)` };
};

// Pone a sus hijos centrados en x, con el borde de abajo en y, al tamaño `s` (zoom: el navegador redibuja, no estira)
const Pop: React.FC<{
  x: number;
  y: number;
  s: number;
  giro?: number;
  children: React.ReactNode;
}> = ({ x, y, s, giro = 0, children }) =>
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
      }}
    >
      <div style={{ zoom: s, transform: `rotate(${giro}deg)`, flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );

// trazo de tinta que se dibuja (pathLength 1)
const Linea: React.FC<{
  d: string;
  t: number;
  color?: string;
  grosor?: number;
}> = ({ d, t, color = R.tinta, grosor = 5 }) =>
  t <= 0 ? null : (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={`${t} 2`}
    />
  );

const Tarjeta: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: R.papel,
      borderRadius: RADIO,
      boxShadow: SOMBRA,
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- Íconos de línea (viewBox 100×100) ----------
const SOBRE_D = "M12 26 H88 V78 H12 Z M12 26 L50 56 L88 26";
const SITIO_D =
  "M10 18 H90 V82 H10 Z M10 32 H90 M20 25 H22 M28 25 H30 M36 25 H38";
const BOLSA_D =
  "M22 36 H78 L74 86 H26 Z M38 36 V28 a12 12 0 0 1 24 0 V36 M38 60 L47 69 L64 52";
const CURSOR_D = "M30 14 L30 74 L45 60 L56 84 L66 79 L55 56 L74 54 Z";
const SALE_D = "M44 16 H18 V84 H44 M40 50 H86 M70 34 L86 50 L70 66";

const Icono: React.FC<{
  d: string;
  lado: number;
  t: number;
  color?: string;
}> = ({ d, lado, t, color }) => (
  <svg width={lado} height={lado} viewBox="0 0 100 100" overflow="visible">
    <Linea d={d} t={t} color={color} grosor={6} />
  </svg>
);

// ---------- Hook: sobre con "?" ----------
const SOBRE_LADO = 230;
export const SobrePregunta: React.FC<{ y: number; pregunta: number }> = ({
  y,
  pregunta,
}) => {
  const f = useCurrentFrame();
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-4}>
      <div style={{ position: "relative", width: SOBRE_LADO + 80 }}>
        <Tarjeta
          style={{
            width: SOBRE_LADO,
            height: SOBRE_LADO * 0.72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icono d={SOBRE_D} lado={SOBRE_LADO * 0.8} t={1} />
        </Tarjeta>
        {/* "?" trazado a mano, en turquesa, saliendo del sobre */}
        <svg
          width={120}
          height={160}
          viewBox="0 0 60 80"
          style={{ position: "absolute", right: -10, top: -90 }}
        >
          <Linea
            d="M14 22 C14 6 46 4 46 22 C46 34 30 34 30 50"
            t={traza(f, pregunta)}
            color={R.turquesa}
            grosor={8}
          />
          {f >= pregunta + TRAZO ? (
            <circle cx={30} cy={66} r={5.5} fill={R.turquesa} />
          ) : null}
        </svg>
      </div>
    </Pop>
  );
};

// ---------- Pasos 1 y 2 ----------
const PASO_ANCHO = 640;
const Paso: React.FC<{ n: number; texto: string }> = ({ n, texto }) => (
  <Tarjeta
    style={{
      width: PASO_ANCHO,
      padding: "18px 26px",
      display: "flex",
      alignItems: "center",
      gap: 22,
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        background: R.bordo,
        color: R.papel,
        fontFamily: INTER,
        fontWeight: 700,
        fontSize: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {n}
    </div>
    <div style={{ ...LETRA, fontSize: 44, fontWeight: 600 }}>{texto}</div>
  </Tarjeta>
);
export const Pasos: React.FC<{ y: number; beats: number[] }> = ({
  y,
  beats,
}) => {
  const f = useCurrentFrame();
  const textos = ["Un objetivo por envío", "Un CTA claro"];
  const alto = 100;
  const sep = 22;
  return (
    <>
      {textos.map((t, k) => (
        <Pop
          key={k}
          x={540}
          y={y - (textos.length - 1 - k) * (alto + sep)}
          s={entra(f, beats[k])}
          giro={k % 2 ? 1.5 : -1.5}
        >
          <Paso n={k + 1} texto={t} />
        </Pop>
      ))}
    </>
  );
};

// ---------- Etiqueta "caso animaná" de las placas ----------
const Caso: React.FC<{ f: number }> = ({ f }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 150,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 18,
      ...sube(f),
    }}
  >
    <div
      style={{
        fontFamily: INTER,
        fontSize: 34,
        fontWeight: 500,
        color: R.papel,
        opacity: 0.7,
      }}
    >
      caso
    </div>
    <Img
      src={staticFile("marcas/animana/logo-blanco.png")}
      style={{ height: 54, display: "block" }}
    />
  </div>
);

// ---------- Placa: el newsletter en Figma ----------
// crudos/pantalla/figma_skim.mp4: la columna del newsletter (750×890 de la grabación) de 14 a 36 s, 8 veces más
// rápido: se "lee" de arriba abajo en menos de 3 s
const FIGMA_ANCHO = 740;
const FIGMA_ALTO = (FIGMA_ANCHO * 890) / 750;
const DIEZ_ANCHO = 520;
export const PlacaFigma: React.FC<{ dura: number; menos: number }> = ({
  dura,
  menos,
}) => {
  const f = useCurrentFrame();
  const barra = interpolate(f, [menos, dura], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, background: PLACA_FONDO }}>
      <Caso f={f} />
      <div
        style={{
          position: "absolute",
          left: (1080 - FIGMA_ANCHO) / 2,
          top: 250,
          width: FIGMA_ANCHO,
          height: FIGMA_ALTO,
          borderRadius: RADIO,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
          ...sube(f, 2),
        }}
      >
        <OffthreadVideo
          src={staticFile(`trabajos/${ID}/crudos/pantalla/figma_skim.mp4`)}
          muted
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      {/* "menos de 10 segundos": barra que se llena */}
      <div
        style={{
          position: "absolute",
          left: (1080 - DIEZ_ANCHO) / 2,
          top: 250 + FIGMA_ALTO + 50,
          width: DIEZ_ANCHO,
          display: "flex",
          alignItems: "center",
          gap: 22,
          opacity: interpolate(f, [menos - 4, menos + 2], [0, 1], clamp),
        }}
      >
        <div
          style={{
            flex: 1,
            height: 16,
            borderRadius: 8,
            background: "rgba(247, 244, 234, 0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${barra * 100}%`,
              height: "100%",
              background: R.turquesa,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 44,
            color: R.papel,
            whiteSpace: "nowrap",
          }}
        >
          {"< 10 s"}
        </div>
      </div>
    </div>
  );
};

// ---------- Reporte real: aperturas ----------
// img/reporte_campana.png: 710×330 de la grabación de EmailOctopus (título, enviados, aperturas y clics); sin la
// columna de actividad (mails de suscriptores) ni las bajas y rebotes (con los cinco círculos se leía muy chico)
const REPORTE_ANCHO = 710;
const REPORTE_ESCALA = 900 / REPORTE_ANCHO;
const OPENED = { x: 373, y: 205, rx: 100, ry: 112 }; // círculo "Opened" en px de la imagen
export const ReporteAperturas: React.FC<{ y: number; marca: number }> = ({
  y,
  marca,
}) => {
  const f = useCurrentFrame();
  const w = REPORTE_ANCHO * REPORTE_ESCALA;
  const h = 330 * REPORTE_ESCALA;
  const o = {
    x: OPENED.x * REPORTE_ESCALA,
    y: OPENED.y * REPORTE_ESCALA,
    rx: OPENED.rx * REPORTE_ESCALA,
    ry: OPENED.ry * REPORTE_ESCALA,
  };
  // óvalo a mano: un poco más de una vuelta, como un círculo hecho con marcador
  const ovalo = `M ${o.x + o.rx} ${o.y - 10} A ${o.rx} ${o.ry} 0 1 1 ${o.x + o.rx - 30} ${o.y - o.ry + 18} L ${o.x + o.rx - 10} ${o.y - o.ry + 40}`;
  return (
    <Pop x={540} y={y} s={entra(f)}>
      <Tarjeta style={{ padding: 20, background: "#fffffc" }}>
        <div style={{ position: "relative", width: w, height: h }}>
          <Img
            src={img("reporte_campana.png")}
            style={{ width: w, height: h, display: "block" }}
          />
          <svg
            width={w}
            height={h}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          >
            <Linea
              d={ovalo}
              t={traza(f, marca, 14)}
              color={R.turquesa}
              grosor={7}
            />
          </svg>
        </div>
      </Tarjeta>
    </Pop>
  );
};

// ---------- La cuenta: CTR y CTOR ----------
// Con los números del reporte de arriba: 13 clics, 373 enviados, 163 aperturas.
const FORMULA_ANCHO = 720;
export const Formula: React.FC<{
  y: number;
  tipo: "ctr" | "ctor";
  cambia: number; // CTOR: cuadro en que se tacha "enviados" y entra "aperturas"
}> = ({ y, tipo, cambia }) => {
  const f = useCurrentFrame();
  const ctor = tipo === "ctor";
  const tacha = ctor ? traza(f, cambia, 8) : 0;
  const nueva = ctor ? entra(f, cambia + 6) : 0;
  const resultado = ctor ? (nueva > 0.5 ? "8 %" : "3,5 %") : "3,5 %";
  const divisor = ctor ? (nueva > 0.5 ? "163" : "373") : "373";
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-1.5}>
      <Tarjeta
        style={{
          width: FORMULA_ANCHO,
          padding: "26px 34px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <div style={{ ...LETRA, fontSize: 66, fontWeight: 700 }}>
            {ctor ? "CTOR" : "CTR"}
          </div>
          <div style={{ ...LETRA, fontSize: 42, fontWeight: 500 }}>
            = clics ÷{" "}
            <span style={{ position: "relative", display: "inline-block" }}>
              enviados
              {ctor ? (
                <svg
                  width="100%"
                  height={20}
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", left: 0, top: "38%" }}
                >
                  <Linea d="M2 12 L98 8" t={tacha} color={R.bordo} grosor={5} />
                </svg>
              ) : null}
              {ctor && nueva > 0.02 ? (
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -50,
                    zoom: nueva,
                    transform: "translateX(-50%) rotate(-4deg)",
                    color: R.turquesa,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  aperturas
                </span>
              ) : null}
            </span>
          </div>
        </div>
        <div style={{ ...LETRA, fontSize: 40, fontWeight: 500, opacity: 0.75 }}>
          13 ÷ {divisor} ={" "}
          <span style={{ color: R.bordo, fontWeight: 700, opacity: 1 }}>
            {resultado}
          </span>
        </div>
      </Tarjeta>
    </Pop>
  );
};

// ---------- El botón que se toca ----------
const BOTON = { ancho: 420, alto: 104 };
export const BotonClic: React.FC<{ y: number; toca: number }> = ({
  y,
  toca,
}) => {
  const f = useCurrentFrame();
  const llega = interpolate(f, [2, toca], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const aprieta = f >= toca && f < toca + 4 ? 0.94 : 1;
  const onda = interpolate(f, [toca, toca + 10], [0, 1], clamp);
  return (
    <Pop x={540} y={y} s={entra(f)}>
      <div
        style={{
          position: "relative",
          width: BOTON.ancho + 120,
          height: BOTON.alto + 90,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 0,
            width: BOTON.ancho,
            height: BOTON.alto,
            borderRadius: BOTON.alto / 2,
            background: R.bordo,
            color: R.papel,
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: SOMBRA,
            zoom: aprieta,
          }}
        >
          Ver la pieza
        </div>
        {onda > 0 && onda < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 60 + BOTON.ancho * 0.66 - 60 * onda,
              top: BOTON.alto * 0.6 - 60 * onda,
              width: 120 * onda,
              height: 120 * onda,
              borderRadius: "50%",
              border: `5px solid ${R.turquesa}`,
              opacity: 1 - onda,
            }}
          />
        ) : null}
        <svg
          width={96}
          height={96}
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            left: 60 + BOTON.ancho * 0.66 - 30 + (1 - llega) * 140,
            top: BOTON.alto * 0.6 - 14 + (1 - llega) * 70,
          }}
        >
          <path
            d={CURSOR_D}
            fill={R.papel}
            stroke={R.tinta}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Pop>
  );
};

// ---------- Placa: el link con UTM ----------
// img/link_utm.png: 930×345 de la grabación del reporte de la automatización (el link real de un clic), sin la tabla
// de quiénes hicieron clic. Renglones con parámetros utm_ (px de la imagen): [y, alto, ancho]
const LINK_ANCHO = 900;
const LINK_ESCALA = LINK_ANCHO / 930;
const UTM_RENGLONES: [number, number, number][] = [
  [214, 42, 860],
  [257, 42, 850],
  [300, 42, 570],
];
const UTM_PASO = 4; // cuadros entre renglón y renglón
const DERIVA = 0.0016; // escala que crece por cuadro
export const PlacaUtm: React.FC<{ resalta: number }> = ({ resalta }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: PLACA_FONDO }}>
      <Caso f={f} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 340,
          textAlign: "center",
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: 150,
          color: R.papel,
          ...sube(f),
        }}
      >
        UTM
      </div>
      <div
        style={{
          position: "absolute",
          left: (1080 - LINK_ANCHO - 48) / 2,
          top: 600,
          ...sube(f, 2),
        }}
      >
        {/* se acerca apenas mientras está: una placa quieta se ve trabada */}
        <div style={{ transform: `scale(${1 + f * DERIVA})` }}>
          <Tarjeta style={{ padding: 24, background: "#fffffc" }}>
            <div
              style={{
                position: "relative",
                width: LINK_ANCHO,
                height: 345 * LINK_ESCALA,
              }}
            >
              <Img
                src={img("link_utm.png")}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
              {UTM_RENGLONES.map(([ry, alto, ancho], k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 34 * LINK_ESCALA,
                    top: ry * LINK_ESCALA,
                    height: alto * LINK_ESCALA,
                    width:
                      ancho * LINK_ESCALA * traza(f, resalta + k * UTM_PASO, 8),
                    background: R.turquesa,
                    opacity: 0.45,
                    mixBlendMode: "multiply",
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
};

// ---------- Google Analytics: de dónde llegó y qué hizo ----------
const CHIP_ALTO = 96;
const ANALYTICS_ANCHO = 860;
const ACCIONES: { texto: string; d: string; color: string }[] = [
  { texto: "Compró", d: BOLSA_D, color: R.petroleo },
  { texto: "Tocó un botón", d: CURSOR_D, color: R.tinta },
  { texto: "Se fue", d: SALE_D, color: R.bordo },
];
export const Analytics: React.FC<{
  y: number;
  llega: number; // "llegó desde ese mail"
  acciones: number[]; // "compró", "tocó", "se fue"
}> = ({ y, llega, acciones }) => {
  const f = useCurrentFrame();
  const flecha = traza(f, llega + 4, 10);
  return (
    <>
      <Pop x={540} y={y - CHIP_ALTO - 40} s={entra(f)} giro={-1}>
        <Tarjeta
          style={{
            width: ANALYTICS_ANCHO,
            padding: "22px 30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ ...LETRA, fontSize: 44, fontWeight: 700 }}>
            Google Analytics
          </div>
          {/* el mail → el sitio */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              opacity: f >= llega ? 1 : 0,
            }}
          >
            <Icono d={SOBRE_D} lado={110} t={traza(f, llega, 8)} />
            <svg width={200} height={40} viewBox="0 0 200 40">
              <Linea
                d="M6 22 C60 4 130 36 186 18 M170 8 L188 18 L174 32"
                t={flecha}
                color={R.turquesa}
                grosor={6}
              />
            </svg>
            <Icono d={SITIO_D} lado={110} t={traza(f, llega + 10, 8)} />
          </div>
        </Tarjeta>
      </Pop>
      {ACCIONES.map((a, k) => {
        const s = entra(f, acciones[k]);
        const ancho = [250, 360, 230][k];
        const x = [540 - 330, 540, 540 + 330][k];
        return (
          <Pop key={k} x={x} y={y} s={s} giro={[-3, 2, -2][k]}>
            <Tarjeta
              style={{
                width: ancho,
                height: CHIP_ALTO,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Icono d={a.d} lado={52} t={1} color={a.color} />
              <div style={{ ...LETRA, fontSize: 36, fontWeight: 600 }}>
                {a.texto}
              </div>
            </Tarjeta>
          </Pop>
        );
      })}
    </>
  );
};

// ---------- Cierre: @somos_rastro ----------
export const Usuario: React.FC<{ y: number }> = ({ y }) => {
  const f = useCurrentFrame();
  return (
    <Pop x={540} y={y} s={entra(f)} giro={-2}>
      <Tarjeta
        style={{
          padding: "20px 40px",
          ...LETRA,
          fontSize: 50,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ color: R.turquesa }}>@</span>somos_rastro
      </Tarjeta>
    </Pop>
  );
};
