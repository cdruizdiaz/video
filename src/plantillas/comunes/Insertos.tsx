// Insertos gráficos para videos de entrevista (estética de marca): logo (en tarjeta o suelto con sombra),
// ícono de app, reloj 24/7 (agujas corriendo, anillo que se llena y los días de la semana que se encienden),
// señal de robot tachado, red de canales (Volto al centro conectado a los íconos) y enumeraciones en
// burbujas (✕ o ✓) que aparecen con lo dicho, ventanas de navegador apiladas ("abre 3 o 4 páginas") y una
// cifra que cuenta hasta su valor ("un millón y medio de seguidores").
// Cada uno vive en un <Sequence> (frame 0 = entra) y recibe su duración en frames para salir; con `seco`
// desaparece de golpe al final (p. ej. justo en un cambio de plano).
// Las entradas usan `zoom` (el navegador vuelve a dibujar a ese tamaño: nítido), nunca escalas de imagen.
// Ícono del robot: "bot" de Lucide (https://lucide.dev, licencia ISC).
import React from "react";
import {
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { Marca } from "../../marcas";
import type { IconoRed } from "./iconosRedes";

// ---------- Constantes de animación ----------
const ENTRA = 10; // frames de entrada (con rebote)
const SALE = 8; // frames de salida
const REBOTE = 1.7; // cuánto se pasa al entrar (Easing.back)
const GIRO_ENTRADA = -8; // grados
const RELOJ_VUELTA = 15; // frames por vuelta del minutero (el tiempo "corre")
const RELOJ_HORARIO = 12; // el horario va estas veces más lento
export const RELOJ_DIA_PASO = 4; // frames entre día y día de la semana que se enciende (cada uno con un pop)
const ROBOT_OJOS = 30; // frames entre parpadeos del robot
const ROBOT_BARRIDO = 24; // frames por pasada del barrido de escaneo
const ROBOT_GIRO = 3; // grados por frame de los anillos
const TACHA_DURA = 9; // frames en que se dibuja el signo de prohibido
const RED_LINEA = 8; // frames en que se dibuja cada línea de la red
const RED_VIAJE = 18; // frames que tarda el puntito en ir del nodo al ícono
// Estilo
const TARJETA_RADIO = 32;
const TARJETA_RELLENO = 30;
const SOMBRA = "0 18px 40px rgba(0, 0, 0, 0.32)";
const BLANCO = "#ffffff";
const ERROR = "#f97d55"; // naranja de la marca
const ACIERTO = "#406162"; // verde petróleo de la marca
const TEXTO_BURBUJA = 54;
const APP = 170; // lado de la baldosa de app
const APP_RADIO = 38;
const VIDRIO = "rgba(30, 30, 30, 0.78)"; // disco oscuro translúcido (reloj y robot)
const CELESTE = "#a0c9cb"; // celeste de la paleta del cliente (robot)
const SOMBRA_LOGO = "drop-shadow(5px 8px 9px rgba(0, 0, 0, 0.85))"; // sombra paralela negra difuminada (logo suelto)
const TEXTO_GRANDE = 104; // "24 hs": sin borde, con la sombra paralela de los subtítulos
const TEXTO_GRANDE_SOMBRA = "3px 7px 0 #000, 0 6px 16px rgba(0,0,0,0.5)";
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const DIA = 66;
const RED_NODO = 130; // diámetro del nodo con el asterisco
const RED_COLOR = "#a0c9cb"; // celeste de la paleta del cliente
// Ventanas de navegador ("abre 3 o 4 páginas"): sutiles (pedido 2026-10-09): chicas, translúcidas, sin
// rebote, entran subiendo apenas con un fundido
const VENTANA_ESCALA = 1.4; // más grandes (pedido 2026-10-09): todo el contenido se dibuja a esta escala
const VENTANA_ANCHO = 300;
const VENTANA_ALTO = 200;
const VENTANA_PASO = { x: 44 * VENTANA_ESCALA, y: 28 * VENTANA_ESCALA }; // corrimiento entre ventana y ventana (en cascada)
const VENTANA_BARRA = 30;
const VENTANA_OPACIDAD = 0.9;
const VENTANA_SUBE = 14; // px que sube al entrar
const VENTANA_ENTRA = 7; // frames
const VENTANA_SOMBRA = "0 8px 22px rgba(0, 0, 0, 0.18)";
const VENTANA_COLORES = ["#ebdbb7", "#a0c9cb", "#95a8a0", "#f5f5ed"]; // foto de producto de cada página (paleta)
const CIFRA_CUENTA = 24; // frames que tarda la cifra en llegar a su valor
// Preguntas arriba de la cabeza: globos de chat planos con "?" (sin sombra; pedido 2026-10-09)
const PREGUNTA_GLOBO = 230; // lado del globo grande
const PREGUNTA_CHICO = 0.62; // los dos globos chicos de los costados
const PREGUNTA_DEMORA = 5; // frames entre globo y globo
const PREGUNTA_FLOTA = 9; // px de flotación
const PREGUNTA_PERIODO = 40; // frames por flotación
const PREGUNTA_RADIO = 0.32; // radio de las esquinas (proporción del lado)
// Marca con texto: "En [logo]" y "resolvemos" sobre un trazo de resaltador amarillo que se dibuja
const MARCA_TEXTO = 112; // "En"
const MARCA_LOGO_ALTO = 122;
const MARCA_PALABRA = 150; // "resolvemos"
const MARCA_RESALTA = 8; // frames que tarda el resaltador en cruzar la palabra
// "resolvemos" sobre un trazo de resaltador (como la versión que gustó) con los colores de Volto: naranja del
// degradé de la marca y la tinta oscura de la paleta
const MARCA_RESALTADOR = "#f97d55";
const MARCA_TINTA = "#262626";
const MARCA_ENTRE = -6; // px entre "En [logo]" y "resolvemos" (interlineado más chico)
// Tienda online (ilustración: celular del que sale un brazo con bolsas de compras)
const TIENDA_ANCHO = 440;
const TIENDA_BRAZO = 10; // frames que tarda el brazo en salir del celular
const TIENDA_BRAZO_DEMORA = 5;
const TIENDA_BOLSAS_DEMORA = 12;
const TIENDA_VAIVEN = 7; // grados del balanceo de las bolsas (se amortigua)
const TIENDA_PERIODO = 22;
// Conexión: líneas lisas que se dibujan desde el centro hasta cada ícono (sin puntitos ni nodos "de IA")
const CONEXION_LINEA = 9; // frames en que se dibuja cada línea
const CONEXION_DEMORA = 3; // frames después de que entra el ícono central
const CONEXION_GROSOR = 6;
const CONEXION_SOMBRA = "drop-shadow(2px 4px 4px rgba(0, 0, 0, 0.35))";
// asterisco de public/marcas/volto/estrella.svg (viewBox 27×27)
const ESTRELLA =
  "M17.0621 11.4931H26.2481V14.7551H17.0591L23.5576 21.2531L21.2536 23.5571L14.7556 17.0591V26.2481H11.4931V17.0621L4.99752 23.5576L2.69051 21.2536L9.18904 14.7556H0V11.4931H9.18604L2.69051 4.99752L4.99752 2.69101L11.4931 9.18604V0H14.7556V9.18904L21.2536 2.69101L23.5576 4.99752L17.0621 11.4931Z";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 (con rebote) al entrar y → 0 al salir (seco: entero hasta el último cuadro)
const aparece = (f: number, duracion: number, seco = false) =>
  interpolate(f, [0, ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(REBOTE)),
  }) *
  (seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], {
        ...clamp,
        easing: Easing.in(Easing.cubic),
      }));

const entraDesde = (f: number, desde: number) =>
  interpolate(f - desde, [0, ENTRA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(REBOTE)),
  });

// Centra a sus hijos en (x, y) y los muestra al tamaño `s` (zoom: se redibuja, no se estira)
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ zoom: s, transform: `rotate(${giro}deg)`, flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );

const tarjeta: React.CSSProperties = {
  background: BLANCO,
  borderRadius: TARJETA_RADIO,
  padding: TARJETA_RELLENO,
  boxShadow: SOMBRA,
};

// ---------- Logo ----------
// sinTarjeta: el logo suelto (PNG transparente) con una sombra paralela negra difuminada para que se lea
export const InsertoLogo: React.FC<{
  src: string;
  ancho: number;
  x: number;
  y: number;
  duracion: number;
  sinTarjeta?: boolean;
  sinSombra?: boolean; // logo suelto sin la sombra paralela (p. ej. uno que ya trae su fondo)
  seco?: boolean;
}> = ({ src, ancho, x, y, duracion, sinTarjeta, sinSombra, seco }) => {
  const f = useCurrentFrame();
  const s = aparece(f, duracion, seco);
  const img = (
    <Img
      src={staticFile(src)}
      style={{
        width: ancho,
        display: "block",
        filter: sinTarjeta && !sinSombra ? SOMBRA_LOGO : undefined,
      }}
    />
  );
  return (
    <Pop x={x} y={y} s={s} giro={GIRO_ENTRADA * (1 - Math.min(1, s))}>
      {sinTarjeta ? img : <div style={tarjeta}>{img}</div>}
    </Pop>
  );
};

// ---------- Ícono de app (red social) ----------
export const InsertoApp: React.FC<{
  icono: IconoRed;
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({ icono, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const s = aparece(f, duracion, seco);
  return (
    <Pop x={x} y={y} s={s} giro={GIRO_ENTRADA * (1 - Math.min(1, s))}>
      <div
        style={{
          width: APP,
          height: APP,
          borderRadius: APP_RADIO,
          background: icono.fondo,
          boxShadow: SOMBRA,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={APP * 0.62} height={APP * 0.62} viewBox="0 0 24 24">
          <path d={icono.d} fill={BLANCO} />
        </svg>
      </div>
    </Pop>
  );
};

// ---------- Reloj 24/7 ----------
// Disco oscuro translúcido con las agujas corriendo y un anillo naranja que se llena; en `textoFrame` entra
// el texto ("24 hs", con el estilo de los subtítulos) y desde `diasFrame` se encienden los 7 días, uno por uno.
export const InsertoReloj: React.FC<{
  m: Marca;
  texto: string;
  textoFrame: number;
  diasFrame: number;
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({ m, texto, textoFrame, diasFrame, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const s = aparece(f, duracion, seco);
  const minutero = (f / RELOJ_VUELTA) * 360;
  const horario = minutero / RELOJ_HORARIO;
  const anillo = Math.min(1, f / duracion);
  const R = 96;
  const C = 2 * Math.PI * (R + 14);
  const t = entraDesde(f, textoFrame);
  const caja = 2 * R + 40;
  return (
    <Pop x={x} y={y} s={s}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <svg
            width={caja}
            height={caja}
            viewBox={`${-caja / 2} ${-caja / 2} ${caja} ${caja}`}
          >
            <circle
              r={R}
              fill={VIDRIO}
              stroke={m.colores.claro}
              strokeWidth={6}
            />
            <circle
              r={R + 14}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={8}
            />
            <circle
              r={R + 14}
              fill="none"
              stroke={ERROR}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${anillo * C} ${C}`}
              transform="rotate(-90)"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                x1={0}
                y1={-R + 14}
                x2={0}
                y2={-R + (i % 3 === 0 ? 32 : 24)}
                stroke={m.colores.claro}
                strokeWidth={i % 3 === 0 ? 6 : 3}
                strokeLinecap="round"
                transform={`rotate(${i * 30})`}
              />
            ))}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-R * 0.5}
              stroke={m.colores.claro}
              strokeWidth={10}
              strokeLinecap="round"
              transform={`rotate(${horario})`}
            />
            <line
              x1={0}
              y1={12}
              x2={0}
              y2={-R * 0.76}
              stroke={ERROR}
              strokeWidth={6}
              strokeLinecap="round"
              transform={`rotate(${minutero})`}
            />
            <circle r={8} fill={ERROR} />
          </svg>
          <div
            style={{
              width: 330,
              fontFamily: m.fuenteTitulos ?? m.fuente,
              fontWeight: 800,
              fontSize: TEXTO_GRANDE,
              color: BLANCO,
              textShadow: TEXTO_GRANDE_SOMBRA,
              whiteSpace: "nowrap",
            }}
          >
            {t > 0.02 ? <span style={{ zoom: t }}>{texto}</span> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {DIAS.map((d, i) => {
            const on = f >= diasFrame + i * RELOJ_DIA_PASO;
            return (
              <div
                key={i}
                style={{
                  width: DIA,
                  height: DIA,
                  borderRadius: DIA / 2,
                  background: on ? ERROR : VIDRIO,
                  border: `3px solid ${on ? ERROR : "rgba(255,255,255,0.35)"}`,
                  color: BLANCO,
                  fontFamily: m.fuenteTitulos ?? m.fuente,
                  fontWeight: 800,
                  fontSize: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </Pop>
  );
};

// ---------- Señal: robot tachado ----------
// Estilo de interfaz (celeste de la paleta, sin el naranja): disco oscuro translúcido, dos anillos
// segmentados que giran en sentidos opuestos, el ícono de línea del robot (Lucide "bot") con un barrido de
// escaneo, y en `tachaFrame` una diagonal blanca que lo tacha mientras el robot se apaga.
export const InsertoRobot: React.FC<{
  tachaFrame: number;
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({ tachaFrame, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const s = aparece(f, duracion, seco);
  const tacha = interpolate(f - tachaFrame, [0, TACHA_DURA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const ojos = f % ROBOT_OJOS < 3 ? 0.4 : 2; // parpadeo: los ojos se achatan
  const barrido = ((f % ROBOT_BARRIDO) / ROBOT_BARRIDO) * 2 - 1; // -1 → 1 (de arriba a abajo)
  const apagado = 1 - 0.55 * tacha; // al tacharlo, el robot pierde brillo
  const R = 130;
  const caja = 2 * R + 60;
  const anillo = (
    r: number,
    giro: number,
    guion: string,
    ancho: number,
    alfa: number,
  ) => (
    <circle
      r={r}
      fill="none"
      stroke={CELESTE}
      strokeOpacity={alfa}
      strokeWidth={ancho}
      strokeDasharray={guion}
      transform={`rotate(${giro})`}
    />
  );
  return (
    <Pop x={x} y={y} s={s}>
      <svg
        width={caja}
        height={caja}
        viewBox={`${-caja / 2} ${-caja / 2} ${caja} ${caja}`}
      >
        <defs>
          <clipPath id="robot-disco">
            <circle r={R - 10} />
          </clipPath>
          <linearGradient id="robot-barrido" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={CELESTE} stopOpacity={0} />
            <stop offset="1" stopColor={CELESTE} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <circle r={R} fill={VIDRIO} />
        {anillo(R + 18, f * ROBOT_GIRO, "46 14", 6, 0.9)}
        {anillo(R + 6, -f * ROBOT_GIRO * 1.6, "4 10", 3, 0.6)}
        {anillo(R - 10, 0, "none", 2, 0.35)}
        <g clipPath="url(#robot-disco)" opacity={apagado}>
          {/* barrido de escaneo */}
          <rect
            x={-R}
            y={barrido * R - 46}
            width={2 * R}
            height={46}
            fill="url(#robot-barrido)"
          />
          <line
            x1={-R}
            y1={barrido * R}
            x2={R}
            y2={barrido * R}
            stroke={CELESTE}
            strokeOpacity={0.8}
            strokeWidth={2}
          />
          {/* Lucide "bot" (24×24) centrado y agrandado */}
          <g
            transform="scale(7.2) translate(-12 -13)"
            fill="none"
            stroke={CELESTE}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d={`M15 ${14 - ojos / 2}v${ojos}`} />
            <path d={`M9 ${14 - ojos / 2}v${ojos}`} />
          </g>
        </g>
        {tacha > 0 ? (
          <line
            x1={-R * 0.72}
            y1={-R * 0.72}
            x2={-R * 0.72 + 1.44 * R * tacha}
            y2={-R * 0.72 + 1.44 * R * tacha}
            stroke={BLANCO}
            strokeWidth={14}
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    </Pop>
  );
};

// ---------- Enumeración en burbujas ----------
// Cada ítem aparece en su frame; todos salen juntos. signo: "error" (✕ naranja) o "acierto" (✓ verde petróleo)
export const InsertoLista: React.FC<{
  m: Marca;
  items: { texto: string; frame: number }[];
  signo: "error" | "acierto";
  x: number;
  y: number;
  ancho: number;
  duracion: number;
  seco?: boolean;
}> = ({ m, items, signo, x, y, ancho, duracion, seco }) => {
  const f = useCurrentFrame();
  const salida = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], {
        ...clamp,
        easing: Easing.in(Easing.cubic),
      });
  const color = signo === "error" ? ERROR : ACIERTO;
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y,
        width: ancho,
        transform: "translateY(-50%)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "22px 20px",
      }}
    >
      {items.map((it, i) => {
        const t = entraDesde(f, it.frame) * salida;
        return (
          // el lugar se reserva desde el principio (no se reacomodan al entrar cada una)
          <div key={i} style={{ position: "relative" }}>
            <div style={{ visibility: "hidden" }}>
              <Burbuja m={m} texto={it.texto} color={color} signo={signo} />
            </div>
            {t > 0.02 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ zoom: t, flexShrink: 0 }}>
                  <Burbuja m={m} texto={it.texto} color={color} signo={signo} />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const Burbuja: React.FC<{
  m: Marca;
  texto: string;
  color: string;
  signo: "error" | "acierto";
}> = ({ m, texto, color, signo }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "16px 30px 16px 18px",
      borderRadius: 44,
      background: BLANCO,
      boxShadow: SOMBRA,
      whiteSpace: "nowrap",
    }}
  >
    <svg width={56} height={56} viewBox="-28 -28 56 56">
      <circle r={28} fill={color} />
      {signo === "error" ? (
        <path
          d="M-10 -10 L10 10 M10 -10 L-10 10"
          stroke={BLANCO}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M-12 1 L-3 10 L13 -9"
          stroke={BLANCO}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
    <span
      style={{
        fontFamily: m.fuenteTitulos ?? m.fuente,
        fontWeight: 700,
        fontSize: TEXTO_BURBUJA,
        color: m.colores.tinta,
      }}
    >
      {texto}
    </span>
  </div>
);

// ---------- Red: Volto conectado a los canales ----------
// El asterisco de la marca como nodo (entra en `nodo.frame`) y líneas punteadas que se dibujan desde el
// nodo hasta cada ícono de app (cada uno entra en su frame), con un puntito que viaja por cada línea como si
// pasaran datos. Coordenadas absolutas del cuadro.
export const InsertoRed: React.FC<{
  m: Marca;
  nodo: { x: number; y: number; frame: number };
  apps: { icono: IconoRed; x: number; y: number; frame: number }[];
  duracion: number;
  seco?: boolean;
}> = ({ m, nodo, apps, duracion, seco }) => {
  const f = useCurrentFrame();
  const salida = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);
  const sNodo = entraDesde(f, nodo.frame) * salida;
  return (
    <>
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {apps.map((a, i) => {
          const desde = Math.max(nodo.frame, a.frame);
          const t =
            interpolate(f - desde, [0, RED_LINEA], [0, 1], {
              ...clamp,
              easing: Easing.out(Easing.cubic),
            }) * salida;
          if (t <= 0) return null;
          const x2 = nodo.x + (a.x - nodo.x) * t;
          const y2 = nodo.y + (a.y - nodo.y) * t;
          const viaje =
            ((((f - desde) % RED_VIAJE) + RED_VIAJE) % RED_VIAJE) / RED_VIAJE;
          return (
            <g key={i}>
              <line
                x1={nodo.x}
                y1={nodo.y}
                x2={x2}
                y2={y2}
                stroke="rgba(0, 0, 0, 0.45)"
                strokeWidth={14}
                strokeLinecap="round"
              />
              <line
                x1={nodo.x}
                y1={nodo.y}
                x2={x2}
                y2={y2}
                stroke={RED_COLOR}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray="4 14"
                strokeDashoffset={-f * 2}
              />
              {t >= 1 ? (
                <circle
                  cx={nodo.x + (a.x - nodo.x) * viaje}
                  cy={nodo.y + (a.y - nodo.y) * viaje}
                  r={9}
                  fill={BLANCO}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      {apps.map((a, i) => {
        const s = entraDesde(f, a.frame) * salida;
        return (
          <Pop
            key={i}
            x={a.x}
            y={a.y}
            s={s}
            giro={GIRO_ENTRADA * (1 - Math.min(1, s))}
          >
            <div
              style={{
                width: APP,
                height: APP,
                borderRadius: APP_RADIO,
                background: a.icono.fondo,
                boxShadow: SOMBRA,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={APP * 0.62} height={APP * 0.62} viewBox="0 0 24 24">
                <path d={a.icono.d} fill={BLANCO} />
              </svg>
            </div>
          </Pop>
        );
      })}
      <Pop x={nodo.x} y={nodo.y} s={sNodo}>
        <div
          style={{
            width: RED_NODO,
            height: RED_NODO,
            borderRadius: RED_NODO / 2,
            background: m.colores.claro,
            boxShadow: SOMBRA,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={RED_NODO * 0.56}
            height={RED_NODO * 0.56}
            viewBox="0 0 27 27"
          >
            <path d={ESTRELLA} fill={m.colores.acento ?? m.colores.tinta} />
          </svg>
        </div>
      </Pop>
    </>
  );
};

// ---------- Ventanas de navegador ----------
// Páginas de tiendas que se abren una encima de otra, en cascada (cada una en su frame): chicas, translúcidas,
// entran subiendo un poco con un fundido. x, y = centro del grupo.
export const InsertoVentanas: React.FC<{
  frames: number[];
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({ frames, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const salida = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);
  const n = frames.length;
  return (
    <>
      {frames.map((fr, i) => {
        const t = interpolate(f - fr, [0, VENTANA_ENTRA], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        if (t <= 0) return null;
        const dx = (i - (n - 1) / 2) * VENTANA_PASO.x;
        const dy = (i - (n - 1) / 2) * VENTANA_PASO.y + (1 - t) * VENTANA_SUBE;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + dx - (VENTANA_ANCHO * VENTANA_ESCALA) / 2,
              top: y + dy - (VENTANA_ALTO * VENTANA_ESCALA) / 2,
              width: VENTANA_ANCHO * VENTANA_ESCALA,
              height: VENTANA_ALTO * VENTANA_ESCALA,
              opacity: t * salida * VENTANA_OPACIDAD,
              background: BLANCO,
              borderRadius: 18 * VENTANA_ESCALA,
              boxShadow: VENTANA_SOMBRA,
              overflow: "hidden",
            }}
          >
            <div style={{ zoom: VENTANA_ESCALA }}>
              <div
                style={{
                  height: VENTANA_BARRA,
                  background: "#f5f5ed",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0 12px",
                }}
              >
                {[0, 1, 2].map((k) => (
                  <div
                    key={k}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      background: "#d6d6cc",
                    }}
                  />
                ))}
                <div
                  style={{
                    flex: 1,
                    height: 12,
                    marginLeft: 8,
                    borderRadius: 6,
                    background: BLANCO,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 14, padding: 16 }}>
                <div
                  style={{
                    width: 96,
                    height: 124,
                    borderRadius: 10,
                    background: VENTANA_COLORES[i % VENTANA_COLORES.length],
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                  }}
                >
                  {[0.9, 0.6, 0.75].map((w, k) => (
                    <div
                      key={k}
                      style={{
                        width: `${w * 100}%`,
                        height: 12,
                        borderRadius: 6,
                        background: "#ececE4",
                      }}
                    />
                  ))}
                  <div
                    style={{
                      marginTop: "auto",
                      width: 78,
                      height: 28,
                      borderRadius: 14,
                      background: "#406162",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- Cifra que cuenta ----------
// Número grande (estilo de los subtítulos, como "24 hs") que sube de 0 a `valor` y una etiqueta debajo.
export const InsertoCifra: React.FC<{
  m: Marca;
  valor: number;
  prefijo?: string;
  etiqueta: string;
  tamano?: number;
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({
  m,
  valor,
  prefijo = "",
  etiqueta,
  tamano = TEXTO_GRANDE,
  x,
  y,
  duracion,
  seco,
}) => {
  const f = useCurrentFrame();
  const s = aparece(f, duracion, seco);
  const v = interpolate(f, [0, CIFRA_CUENTA], [0, valor], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const texto = prefijo + Math.round(v).toLocaleString("es-AR");
  const letra: React.CSSProperties = {
    fontFamily: m.fuenteTitulos ?? m.fuente,
    fontWeight: 800,
    color: BLANCO,
    textShadow: TEXTO_GRANDE_SOMBRA,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.05,
    textAlign: "center",
  };
  return (
    <Pop x={x} y={y} s={s}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ ...letra, fontSize: tamano }}>{texto}</div>
        <div style={{ ...letra, fontSize: tamano * 0.5 }}>{etiqueta}</div>
      </div>
    </Pop>
  );
};

// ---------- Preguntas ----------
// Globos de chat planos con un "?" (como una consulta que llega): uno grande blanco al centro y dos chicos
// celestes a los costados, que entran uno tras otro y flotan despacio. Sin sombras.
const PREGUNTA_GLOBOS = [
  {
    dx: 0,
    dy: 0,
    s: 1,
    demora: 0,
    fase: 0,
    fondo: BLANCO,
    tinta: "#406162",
    cola: "izq" as const,
  },
  {
    dx: -265,
    dy: 95,
    s: PREGUNTA_CHICO,
    demora: PREGUNTA_DEMORA,
    fase: 2,
    fondo: CELESTE,
    tinta: BLANCO,
    cola: "der" as const,
  },
  {
    dx: 265,
    dy: 70,
    s: PREGUNTA_CHICO,
    demora: 2 * PREGUNTA_DEMORA,
    fase: 4,
    fondo: CELESTE,
    tinta: BLANCO,
    cola: "izq" as const,
  },
];
export const InsertoPregunta: React.FC<{
  m: Marca;
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({ m, x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const salida = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);
  return (
    <>
      {PREGUNTA_GLOBOS.map((g, i) => {
        const t = entraDesde(f, g.demora) * salida;
        const flota =
          PREGUNTA_FLOTA *
          Math.sin((f / PREGUNTA_PERIODO) * 2 * Math.PI + g.fase);
        const lado = PREGUNTA_GLOBO * g.s;
        const r = lado * PREGUNTA_RADIO;
        const cola = lado * 0.22;
        // globo con la colita abajo, de un lado
        const cx = g.cola === "izq" ? r * 0.9 : lado - r * 0.9 - cola;
        const d = `M${r} 0 H${lado - r} A${r} ${r} 0 0 1 ${lado} ${r} V${lado - r} A${r} ${r} 0 0 1 ${lado - r} ${lado}
          H${cx + cola} L${g.cola === "izq" ? cx - cola * 0.25 : cx + cola * 1.25} ${lado + cola} L${cx} ${lado}
          H${r} A${r} ${r} 0 0 1 0 ${lado - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
        return (
          <Pop key={i} x={x + g.dx} y={y + g.dy + flota} s={t}>
            <div
              style={{ position: "relative", width: lado, height: lado + cola }}
            >
              <svg
                width={lado}
                height={lado + cola}
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
              >
                <path d={d} fill={g.fondo} />
              </svg>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: lado,
                  height: lado,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: m.fuenteTitulos ?? m.fuente,
                  fontWeight: 800,
                  fontSize: lado * 0.62,
                  lineHeight: 1,
                  color: g.tinta,
                  paddingTop: lado * 0.04,
                }}
              >
                ?
              </div>
            </div>
          </Pop>
        );
      })}
    </>
  );
};

// Reserva el lugar de su contenido a tamaño final (el renglón no se reacomoda) y lo muestra al tamaño `t`
const Reservado: React.FC<{
  t: number;
  giro?: number;
  children: React.ReactNode;
}> = ({ t, giro = 0, children }) => (
  <div style={{ position: "relative" }}>
    <div style={{ visibility: "hidden" }}>{children}</div>
    {t > 0.02 ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ zoom: t, flexShrink: 0, transform: `rotate(${giro}deg)` }}
        >
          {children}
        </div>
      </div>
    ) : null}
  </div>
);

// ---------- Marca con texto ----------
// "En [logo de la marca]" en un renglón y, pegada debajo, una palabra que llama la atención ("resolvemos") sobre
// un trazo de resaltador naranja de la marca que la cruza de izquierda a derecha. Cada parte entra con lo dicho.
export const InsertoMarcaTexto: React.FC<{
  m: Marca;
  previo: string; // "En"
  palabra: string; // "resolvemos"
  logo: string;
  logoFrame: number;
  palabraFrame: number;
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({
  m,
  previo,
  palabra,
  logo,
  logoFrame,
  palabraFrame,
  x,
  y,
  duracion,
  seco,
}) => {
  const f = useCurrentFrame();
  const salida = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);
  const tPrevio = entraDesde(f, 0) * salida;
  const tLogo = entraDesde(f, logoFrame) * salida;
  const resalta = interpolate(f - palabraFrame, [0, MARCA_RESALTA], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const tPalabra = interpolate(
    f - palabraFrame - 2,
    [0, MARCA_RESALTA],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const letra: React.CSSProperties = {
    fontFamily: m.fuenteTitulos ?? m.fuente,
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: MARCA_ENTRE,
        opacity: salida,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          height: MARCA_LOGO_ALTO * 1.1,
        }}
      >
        <Reservado t={tPrevio}>
          <span
            style={{
              ...letra,
              fontSize: MARCA_TEXTO,
              color: BLANCO,
              textShadow: TEXTO_GRANDE_SOMBRA,
            }}
          >
            {previo}
          </span>
        </Reservado>
        <Reservado t={tLogo} giro={GIRO_ENTRADA * (1 - Math.min(1, tLogo))}>
          <Img
            src={staticFile(logo)}
            style={{
              height: MARCA_LOGO_ALTO,
              display: "block",
              filter: SOMBRA_LOGO,
            }}
          />
        </Reservado>
      </div>
      <div style={{ position: "relative", padding: "6px 30px 14px" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "8%",
            height: "84%",
            width: `${resalta * 100}%`,
            background: MARCA_RESALTADOR,
            borderRadius: 14,
            transform: "rotate(-1.5deg)",
          }}
        />
        <span
          style={{
            ...letra,
            position: "relative",
            fontSize: MARCA_PALABRA,
            color: MARCA_TINTA,
            clipPath: `inset(0 ${(1 - tPalabra) * 100}% 0 0)`,
            display: "inline-block",
          }}
        >
          {palabra}
        </span>
      </div>
    </div>
  );
};

// ---------- Tienda online ----------
// Ilustración plana (recreada de una referencia del cliente, con la paleta de Volto): un celular del que sale
// un brazo que sostiene bolsas de compras. Entra el celular, sale el brazo y las bolsas se balancean.
const TIENDA_TINTA = "#262626";
const TIENDA_BRAZO_COLOR = "#406162";
const TIENDA_MANO = { x: 452, y: 284 }; // de dónde cuelgan las bolsas (viewBox de la referencia, 735 × 605)
const TIENDA_BOLSAS = [
  { color: "#ebdbb7", giro: 12, dx: -22, alto: 112 },
  { color: "#95a8a0", giro: 2, dx: -4, alto: 124 },
  { color: "#f5f5ed", giro: -10, dx: 14, alto: 104 },
  { color: "#f97d55", giro: -34, dx: 34, alto: 128 },
];
export const InsertoTiendaOnline: React.FC<{
  x: number;
  y: number;
  duracion: number;
  seco?: boolean;
}> = ({ x, y, duracion, seco }) => {
  const f = useCurrentFrame();
  const s = aparece(f, duracion, seco);
  const brazo = interpolate(
    f - TIENDA_BRAZO_DEMORA,
    [0, TIENDA_BRAZO],
    [0, 1],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );
  const fb = f - TIENDA_BOLSAS_DEMORA;
  const bolsas = interpolate(fb, [0, 6], [0, 1], clamp);
  const vaiven = (k: number) =>
    fb < 0
      ? 0
      : TIENDA_VAIVEN *
        Math.exp(-fb / 30) *
        Math.sin(((fb + k * 3) / TIENDA_PERIODO) * 2 * Math.PI);
  const { x: mx, y: my } = TIENDA_MANO;
  return (
    <Pop x={x} y={y} s={s}>
      <svg
        width={TIENDA_ANCHO}
        height={(TIENDA_ANCHO * 380) / 520}
        viewBox="150 130 520 380"
        style={{ overflow: "visible" }}
      >
        <defs>
          <clipPath id="tienda-brazo">
            <rect x={150} y={130} width={40 + 330 * brazo} height={380} />
          </clipPath>
          <filter
            id="tienda-sombra"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx={4}
              dy={8}
              stdDeviation={8}
              floodColor="#000"
              floodOpacity={0.3}
            />
          </filter>
        </defs>
        <g filter="url(#tienda-sombra)">
          {/* celular */}
          <rect
            x={190}
            y={158}
            width={146}
            height={300}
            rx={24}
            fill={CELESTE}
            stroke={TIENDA_TINTA}
            strokeWidth={7}
          />
          <rect
            x={237}
            y={174}
            width={52}
            height={13}
            rx={6.5}
            fill={TIENDA_TINTA}
          />
          {/* brazo que sale de la pantalla */}
          <g clipPath="url(#tienda-brazo)">
            <path
              d="M193 350 L396 246 L418 288 L193 442 Z"
              fill={TIENDA_BRAZO_COLOR}
            />
          </g>
          {brazo > 0.95 ? (
            <g>
              {/* bolsas, colgando de la mano */}
              {TIENDA_BOLSAS.map((b, k) => (
                <g
                  key={k}
                  opacity={bolsas}
                  transform={`rotate(${b.giro + vaiven(k)} ${mx} ${my})`}
                >
                  <path
                    d={`M${mx + b.dx - 16} ${my + 54} Q${mx + b.dx - 14} ${my} ${mx} ${my} Q${mx + b.dx + 14} ${my} ${mx + b.dx + 16} ${my + 54}`}
                    fill="none"
                    stroke={TIENDA_TINTA}
                    strokeWidth={2.5}
                  />
                  <rect
                    x={mx + b.dx - 34}
                    y={my + 50}
                    width={68}
                    height={b.alto}
                    rx={4}
                    fill={b.color}
                  />
                  <rect
                    x={mx + b.dx - 34}
                    y={my + 50}
                    width={68}
                    height={10}
                    fill="#000"
                    opacity={0.12}
                  />
                </g>
              ))}
              {/* mano (gesto de "ok") */}
              <ellipse
                cx={418}
                cy={244}
                rx={36}
                ry={28}
                transform="rotate(-32 418 244)"
                fill={TIENDA_BRAZO_COLOR}
              />
              <rect
                x={404}
                y={186}
                width={20}
                height={56}
                rx={10}
                transform="rotate(22 414 214)"
                fill={TIENDA_BRAZO_COLOR}
              />
              <rect
                x={424}
                y={192}
                width={20}
                height={56}
                rx={10}
                transform="rotate(38 434 220)"
                fill={TIENDA_BRAZO_COLOR}
              />
              <rect
                x={442}
                y={204}
                width={19}
                height={50}
                rx={9.5}
                transform="rotate(54 451 229)"
                fill={TIENDA_BRAZO_COLOR}
              />
              <circle
                cx={448}
                cy={270}
                r={14}
                fill="none"
                stroke={TIENDA_BRAZO_COLOR}
                strokeWidth={11}
              />
            </g>
          ) : null}
        </g>
      </svg>
    </Pop>
  );
};

// ---------- Conexión ----------
// Íconos de app que entran cada uno en su frame y, en `centro.frame`, un ícono central (p. ej. el catálogo)
// al que se conectan con líneas lisas que se dibujan una vez (sin puntitos que viajan ni nodos "de IA").
export const InsertoConexion: React.FC<{
  apps: { icono: IconoRed; x: number; y: number; frame: number }[];
  centro: { icono: IconoRed; x: number; y: number; frame: number };
  duracion: number;
  seco?: boolean;
}> = ({ apps, centro, duracion, seco }) => {
  const f = useCurrentFrame();
  const salida = seco
    ? 1
    : interpolate(f, [duracion - SALE, duracion], [1, 0], clamp);
  const linea = interpolate(
    f - centro.frame - CONEXION_DEMORA,
    [0, CONEXION_LINEA],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  return (
    <>
      {linea > 0 ? (
        <svg
          width={1080}
          height={1920}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: salida,
            filter: CONEXION_SOMBRA,
          }}
        >
          {apps.map((a, i) => (
            <line
              key={i}
              x1={centro.x}
              y1={centro.y}
              x2={centro.x + (a.x - centro.x) * linea}
              y2={centro.y + (a.y - centro.y) * linea}
              stroke={BLANCO}
              strokeWidth={CONEXION_GROSOR}
              strokeLinecap="round"
            />
          ))}
        </svg>
      ) : null}
      {[...apps, centro].map((a, i) => (
        <Pop key={i} x={a.x} y={a.y} s={entraDesde(f, a.frame) * salida}>
          <Baldosa icono={a.icono} />
        </Pop>
      ))}
    </>
  );
};

const Baldosa: React.FC<{ icono: IconoRed }> = ({ icono }) => (
  <div
    style={{
      width: APP,
      height: APP,
      borderRadius: APP_RADIO,
      background: icono.fondo,
      boxShadow: SOMBRA,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={APP * 0.62} height={APP * 0.62} viewBox="0 0 24 24">
      <path d={icono.d} fill={BLANCO} fillRule="evenodd" />
    </svg>
  </div>
);
