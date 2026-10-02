// "Bloomie se va a la escuela" (guion_bus-40s.md): mini historia de 40 s con el personaje de Bloomie.ai
// (plantilla PersonajeAnimado). Siete escenas; cada una recibe su frame local.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import bloomie from "../../../public/marcas/bloomie/personaje.json";
import vozBloomie from "../../../public/trabajos/2026-10-01_claudio_bloomie/datos/voz_bloomie_en.json";
import { Personaje, type DatosPersonaje } from "../../plantillas/PersonajeAnimado/Personaje";
import {
  Arbol,
  Arbusto,
  AUTOBUS,
  Autobus,
  Brazo,
  Casa,
  CasaLejana,
  CartelParada,
  Cerca,
  COLORES,
  Corazon,
  Flor,
  Globo,
  Humo,
  LineasSonido,
  Mama,
  Mariposa,
  Mochila,
  Nube,
  Pajaro,
  Sol,
} from "../../plantillas/PersonajeAnimado/escenario";
import { arco, camara, entrada, hablar, parpadeo, rebotes, salida, suave, tramo } from "../../plantillas/PersonajeAnimado/util";

const B = bloomie as unknown as DatosPersonaje;
const ID = "2026-10-01_claudio_bloomie";

// Escenas (frames de inicio, 30 fps): suman 1200 = 40 s
export const ESCENAS = { barrio: 0, sale: 150, mama: 330, camino: 540, llega: 750, chau: 900, seVa: 1110, fin: 1200 };
export const DURACION_BLOOMIE = ESCENAS.fin;

// Mundo de la casa (escenas 1-3)
const PISO_CASA = 1480;
const CASA_X = 540;
const BLOOMIE_ESCALA = 0.62;
const BLOOMIE_AFUERA = { x: 650, y: 1600 };
const MAMA_ESCALA = 0.6;
// Mundo de la vereda (escenas 4-5)
const PISO_VEREDA = 1640;
const RECORRIDO = 1250; // px que camina Bloomie en la escena 4
const PASO = 70; // px por paso
// Texto final: lo dice Bloomie (voz Piper, preparar_voz.sh) y aparece palabra por palabra en el globo
const FRASE = ["Bye, Mom! Don't forget", "to bake my favorite cake", "for when I get back", "from school!"];
const PALABRAS = FRASE.join(" ").split(" ").length;
const GLOBO = { x: 540, y: 690 };
const VOZ_DESDE = 30; // frame de la escena 6 en que empieza a hablar
const VOZ_ARCHIVO = "voz_bloomie_en.wav";
const MUSICA_BAJO_VOZ = 0.35; // ~-9 dB de la música mientras habla
// Palabras de la voz en frames (de los tokens de Whisper; la puntuación se pega a la palabra anterior)
const PALABRAS_VOZ = vozBloomie.tokens.reduce<{ desde: number; hasta: number }[]>((acc, t) => {
  const desde = (t.fromMs / 1000) * 30;
  const hasta = (t.toMs / 1000) * 30;
  if (t.text.startsWith(" ") || acc.length === 0) acc.push({ desde, hasta });
  else if (/\w/.test(t.text)) acc[acc.length - 1].hasta = hasta;
  return acc;
}, []);
const VOZ_FIN = VOZ_DESDE + PALABRAS_VOZ[PALABRAS_VOZ.length - 1].hasta;
// Cuántas palabras ya dijo (con 3 frames de aparición cada una)
const palabrasDichas = (f: number) =>
  PALABRAS_VOZ.reduce((n, p) => n + tramo(f - VOZ_DESDE, [p.desde, p.desde + 3], [0, 1]), 0);
// Boca: se mueve solo mientras suena una palabra
const bocaVoz = (f: number) => {
  const t = f - VOZ_DESDE;
  const p = PALABRAS_VOZ.find((w) => t >= w.desde - 1 && t <= w.hasta + 1);
  return p ? hablar(f, VOZ_DESDE + p.desde - 1, VOZ_DESDE + p.hasta + 1) : 0;
};

const BLOOMIE_BRAZO = { color: "#ee913b", borde: "#bb7107" };

// ---------- Piezas comunes ----------
const Cielo: React.FC<{ arriba?: number }> = ({ arriba = -1500 }) => (
  <>
    <defs>
      <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={COLORES.cielo} />
        <stop offset="1" stopColor={COLORES.cieloBajo} />
      </linearGradient>
    </defs>
    <rect x={-3000} y={arriba} width={8000} height={4000} fill="url(#cielo)" />
  </>
);

type PoseBloomie = {
  x: number;
  y: number;
  s: number;
  sx?: number;
  sy?: number;
  rot?: number;
  opacidad?: number;
} & React.ComponentProps<typeof Personaje>;

const Bloomie: React.FC<Omit<PoseBloomie, "datos">> = ({ x, y, s, sx = 1, sy = 1, rot = 0, opacidad = 1, ...resto }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sx} ${s * sy})`} opacity={opacidad}>
    <Personaje datos={B} {...resto} />
  </g>
);

// Tiras de la mochila (vista de frente) y mochila en la espalda (perfil)
const Tiras = () => (
  <g>
    <rect x={-62} y={-128} width={20} height={74} rx={10} fill="#2f7f96" />
    <rect x={42} y={-128} width={20} height={74} rx={10} fill="#2f7f96" />
  </g>
);
const MochilaEspalda = () => (
  <g transform="translate(-82 -120) rotate(-6)">
    <Mochila escala={0.62} />
  </g>
);

// ---------- Escena 1 — Amanece en el barrio ----------
const Barrio: React.FC<{ f: number; children?: React.ReactNode; puerta?: number; adentro?: React.ReactNode; sol?: number }> = ({
  f,
  children,
  puerta = 0,
  adentro,
  sol = 1,
}) => (
  <g>
    <Cielo />
    <g transform={`translate(860 ${tramo(sol, [0, 1], [820, 470])})`}>
      <Sol giro={f * 0.4} />
    </g>
    <g transform={`translate(${180 + f * 0.35} 330) scale(0.9)`}>
      <Nube />
    </g>
    <g transform={`translate(${760 - f * 0.25} 220) scale(0.7)`}>
      <Nube />
    </g>
    <ellipse cx={200} cy={PISO_CASA + 40} rx={700} ry={260} fill="#a9df86" />
    <ellipse cx={980} cy={PISO_CASA + 60} rx={600} ry={230} fill="#9bd877" />
    <g transform={`translate(80 ${PISO_CASA + 10}) scale(0.95)`}>
      <Arbol />
    </g>
    <g transform={`translate(1010 ${PISO_CASA + 10}) scale(0.85)`}>
      <Arbol tono={1} />
    </g>
    <rect x={-2000} y={PISO_CASA} width={5000} height={1200} fill={COLORES.pasto} />
    <path d={`M${CASA_X - 140} ${PISO_CASA}L${CASA_X + 140} ${PISO_CASA}L${CASA_X + 300} 2400L${CASA_X - 300} 2400Z`} fill={COLORES.vereda} stroke={COLORES.veredaBorde} strokeWidth={5} />
    <g transform={`translate(${CASA_X} ${PISO_CASA})`}>
      <Casa puerta={puerta} adentro={adentro} />
    </g>
    <g transform={`translate(-260 ${PISO_CASA + 40})`}>
      <Cerca largo={620} />
    </g>
    <g transform={`translate(${CASA_X + 330} ${PISO_CASA + 40})`}>
      <Cerca largo={900} />
    </g>
    <g transform={`translate(${CASA_X - 420} ${PISO_CASA + 70})`}>
      <Arbusto />
    </g>
    <g transform={`translate(${CASA_X + 440} ${PISO_CASA + 70})`}>
      <Arbusto />
    </g>
    {[-480, -400, 380, 470, 560].map((dx, i) => (
      <g key={dx} transform={`translate(${CASA_X + dx} ${PISO_CASA + 150 + (i % 2) * 30})`}>
        <Flor color={["#ff6b8b", "#b07cff", "#ffd54a", "#ff6b8b", "#7ad0ff"][i]} />
      </g>
    ))}
    {children}
  </g>
);

const Escena1: React.FC<{ f: number }> = ({ f }) => {
  const z = tramo(f, [0, 150], [1, 1.14], suave);
  const cy = tramo(f, [0, 150], [1220, 1290], suave);
  return (
    <g transform={camara(540, cy, z)}>
      <Barrio f={f} sol={tramo(f, [0, 140], [0, 1], salida)}>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${tramo(f, [10 + i * 12, 150], [-80, 1180])} ${430 + i * 60 - Math.sin(f * 0.05 + i) * 30})`}>
            <Pajaro aleteo={f * 0.6 + i * 2} />
          </g>
        ))}
      </Barrio>
    </g>
  );
};

// ---------- Escena 2 — Bloomie sale de casa ----------
const Escena2: React.FC<{ f: number }> = ({ f }) => {
  const puerta = tramo(f, [0, 18], [0, 1], salida);
  // salto desde el hueco de la puerta hasta la vereda
  const x = tramo(f, [22, 42], [CASA_X, BLOOMIE_AFUERA.x]);
  const yBase = tramo(f, [22, 42], [PISO_CASA - 4, BLOOMIE_AFUERA.y]);
  const salto = arco(f, 22, 42) * 130 + rebotes(f, 50, 95, 2) * 70;
  const s = tramo(f, [22, 42], [0.5, BLOOMIE_ESCALA]);
  const golpe = tramo(f, [42, 45, 50], [0, 1, 0]) + tramo(f, [70, 72, 76], [0, 0.7, 0]) + tramo(f, [94, 96, 100], [0, 0.5, 0]);
  const estira = arco(f, 112, 140);
  const enElPiso = salto < 1;
  const sx = enElPiso ? 1 + golpe * 0.12 - estira * 0.05 : 0.96;
  const sy = enElPiso ? 1 - golpe * 0.12 + estira * 0.1 : 1.06;
  const visible = f >= 10;
  const pose = { x, y: yBase - salto, s, sx, sy, cara: f >= 135 ? "feliz" : "normal", parpadeo: parpadeo(f, 100, 160) };
  const dentro = f < 30;
  return (
    <g transform={camara(590, 1350, 1.75)}>
      <Barrio f={f + 150} puerta={puerta} adentro={visible && dentro ? <Bloomie {...pose} x={pose.x - CASA_X} y={pose.y - PISO_CASA} /> : null}>
        {visible && !dentro && <Bloomie {...pose} />}
      </Barrio>
    </g>
  );
};

// ---------- Escena 3 — Mamá ----------
const Escena3: React.FC<{ f: number }> = ({ f }) => {
  const mamaY = tramo(f, [0, 14, 20], [40, -10, 0], salida);
  const mamaOp = tramo(f, [0, 8], [0, 1]);
  const brazoDer = tramo(f, [18, 50, 72, 92], [-15, -95, -95, -20], suave);
  const conMochila = f >= 70;
  const inclina = tramo(f, [92, 104, 124, 136], [0, 11, 11, 0], suave);
  const beso = f >= 100 && f <= 124;
  const enamorado = f >= 112 && f < 168;
  const salto = rebotes(f, 168, 188, 1) * 60;
  const gira = f >= 190;
  const golpe = tramo(f, [188, 191, 196], [0, 1, 0]);
  const corazones = [0, 1].map((i) => {
    const t = tramo(f, [114 + i * 8, 170 + i * 8], [0, 1]);
    return { t, x: BLOOMIE_AFUERA.x - 40 + i * 90 + Math.sin(f * 0.15 + i) * 18, y: BLOOMIE_AFUERA.y - 260 - t * 220 };
  });
  return (
    <g transform={camara(600, 1340, 1.45)}>
      <Barrio
        f={f + 330}
        puerta={1}
        adentro={
          <g transform={`translate(0 ${mamaY}) rotate(${inclina}) scale(${MAMA_ESCALA})`} opacity={mamaOp}>
            <Mama
              brazoDer={brazoDer}
              beso={beso}
              parpadeo={parpadeo(f, 40, 150)}
              enLaMano={conMochila ? null : <Mochila escala={0.7} />}
            />
          </g>
        }
      >
        <Bloomie
          x={BLOOMIE_AFUERA.x}
          y={BLOOMIE_AFUERA.y - salto}
          s={BLOOMIE_ESCALA}
          sx={(gira ? 1 : 1) + golpe * 0.12 + tramo(f, [70, 73, 78], [0, 0.08, 0])}
          sy={1 - golpe * 0.12 - tramo(f, [70, 73, 78], [0, 0.08, 0])}
          vista={gira ? "perfil" : "frente"}
          cara={enamorado ? "enamorado" : f < 20 ? "feliz" : "normal"}
          parpadeo={parpadeo(f, 60)}
          delante={conMochila ? gira ? <MochilaEspalda /> : <Tiras /> : null}
        />
        {f >= 104 && f <= 120 && (
          <g transform={`translate(${BLOOMIE_AFUERA.x - 40} ${BLOOMIE_AFUERA.y - 250}) scale(${tramo(f, [104, 110, 120], [0.3, 0.9, 0.5])})`} opacity={tramo(f, [112, 120], [1, 0])}>
            <Corazon />
          </g>
        )}
        {corazones.map((c, i) =>
          c.t > 0 && c.t < 1 ? (
            <g key={i} transform={`translate(${c.x} ${c.y}) scale(${0.7 + c.t * 0.3})`} opacity={tramo(c.t, [0, 0.15, 0.75, 1], [0, 1, 1, 0])}>
              <Corazon color={i ? "#ff9fd6" : "#ff6b8b"} />
            </g>
          ) : null,
        )}
      </Barrio>
    </g>
  );
};

// ---------- Vereda (escenas 4 y 5) ----------
const CASAS_LEJANAS = [
  ["#ffd7a8", "#e87a5f"],
  ["#c9e7ff", "#5f8fe8"],
  ["#ffe1f0", "#d96a9a"],
  ["#e3f5c8", "#7ab05a"],
];
const Vereda: React.FC<{ s: number; f: number; children?: React.ReactNode }> = ({ s, f, children }) => (
  <g>
    <Cielo />
    <g transform="translate(900 360)">
      <Sol giro={f * 0.4} />
    </g>
    <g transform={`translate(${300 - s * 0.08 + f * 0.2} 300) scale(0.8)`}>
      <Nube />
    </g>
    <g transform={`translate(${900 - s * 0.08} 520) scale(0.6)`}>
      <Nube />
    </g>
    <rect x={-2000} y={1290} width={8000} height={800} fill="#a9df86" />
    {Array.from({ length: 12 }, (_, i) => (
      <g key={i} transform={`translate(${i * 330 - 200 - s * 0.25} 1300) scale(0.8)`}>
        <CasaLejana pared={CASAS_LEJANAS[i % 4][0]} techo={CASAS_LEJANAS[i % 4][1]} />
      </g>
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <g key={i} transform={`translate(${i * 420 + 60 - s * 0.55} 1480) scale(0.8)`}>
        <Arbol tono={i % 2} />
      </g>
    ))}
    <rect x={-2000} y={1500} width={8000} height={200} fill={COLORES.vereda} />
    <rect x={-2000} y={1500} width={8000} height={8} fill={COLORES.veredaBorde} />
    <g transform={`translate(${-100 - s} 1510)`}>
      <Cerca largo={4200} />
    </g>
    {Array.from({ length: 40 }, (_, i) => (
      <g key={i} transform={`translate(${i * 110 - 60 - s} 1530)`}>
        <Flor color={["#ff6b8b", "#ffd54a", "#b07cff", "#7ad0ff"][i % 4]} alto={36} />
      </g>
    ))}
    <rect x={-2000} y={1700} width={8000} height={400} fill={COLORES.calle} />
    <rect x={-2000} y={1700} width={8000} height={14} fill={COLORES.calleBorde} />
    {Array.from({ length: 30 }, (_, i) => (
      <rect key={i} x={i * 240 - (s * 1.1) % 240 - 240} y={1838} width={130} height={16} rx={8} fill="#f4f4f4" />
    ))}
    {children}
  </g>
);

// Posición del recorrido de la escena 4 (arranca, camina y frena en la parada)
const recorrido = (f: number) => tramo(f, [0, 186], [0, RECORRIDO], suave);
const CARTEL_X = 780 + RECORRIDO; // queda en x = 780 cuando Bloomie se detiene

const Escena4: React.FC<{ f: number }> = ({ f }) => {
  const s = recorrido(f);
  const velocidad = recorrido(f + 1) - s;
  const amp = Math.min(1, velocidad / 6);
  const fase = (s / PASO) * Math.PI;
  const mira = tramo(f, [70, 90, 130, 150], [0, 1, 1, 0], suave);
  const barrido = tramo(f, [196, 210], [0, -560], entrada);
  return (
    <g transform={`translate(${barrido} 0)`}>
      <Vereda s={s} f={f + 540}>
        <g transform={`translate(${CARTEL_X - s} ${PISO_VEREDA - 15})`}>
          <CartelParada />
        </g>
        <Bloomie
          x={420}
          y={PISO_VEREDA - Math.abs(Math.sin(fase)) * 34 * amp}
          s={0.85}
          rot={Math.sin(fase) * 5 * amp - mira * 9}
          vista="perfil"
          delante={<MochilaEspalda />}
        />
        <g transform={`translate(${tramo(f, [40, 150], [1160, 260])} ${1130 + Math.sin(f * 0.16) * 70}) rotate(${Math.sin(f * 0.2) * 12})`}>
          <Mariposa aleteo={f * 0.7} />
        </g>
      </Vereda>
    </g>
  );
};

// ---------- Escena 5 — Llega el autobús ----------
const BUS5 = { finalX: 400, top: 1760 - AUTOBUS.piso };
const BLOOMIE_PARADA = { x: 250, s: 0.75 };

const Escena5: React.FC<{ f: number }> = ({ f }) => {
  const barrido = tramo(f, [0, 12], [560, 0], salida);
  const busX = tramo(f, [0, 55], [1180, BUS5.finalX], salida);
  const bamboleo = f < 55 ? Math.sin(f * 0.8) * 3 : Math.sin((f - 55) * 0.55) * 10 * tramo(f, [55, 90], [1, 0]);
  const ruedas = ((busX - BUS5.finalX) / 62) * 57.3;
  const sorpresa = tramo(f, [60, 64, 92, 98], [0, 1, 1, 0]);
  const puertas = tramo(f, [85, 100, 138, 148], [0, 1, 1, 0], suave);
  // salto hacia la puerta
  const puertaX = BUS5.finalX + 185;
  const bx = tramo(f, [105, 132], [BLOOMIE_PARADA.x, puertaX]);
  const by = tramo(f, [105, 132], [PISO_VEREDA, BUS5.top + 420]) - arco(f, 105, 132) * 150 - arco(f, 60, 78) * 60;
  const bs = tramo(f, [105, 132], [BLOOMIE_PARADA.s, 0.55]);
  const op = tramo(f, [126, 134], [1, 0]);
  const fin = recorrido(186);
  return (
    <g transform={`translate(${barrido} 0)`}>
      <Vereda s={fin} f={f + 750}>
        <g transform={`translate(110 ${PISO_VEREDA - 15})`}>
          <CartelParada />
        </g>
        <Bloomie
          x={bx}
          y={by}
          s={bs}
          vista="frente"
          cara={sorpresa > 0.5 ? "preocupado" : "feliz"}
          ojos={1 + sorpresa * 0.3}
          parpadeo={parpadeo(f, 20)}
          opacidad={op}
          delante={<Tiras />}
        />
        <g transform={`translate(${busX} ${BUS5.top + bamboleo})`}>
          <Autobus puertas={puertas} ruedas={ruedas} />
          <g transform="translate(-6 300)">
            <LineasSonido t={tramo(f, [58, 76], [0, 1])} />
          </g>
        </g>
      </Vereda>
    </g>
  );
};

// ---------- Escena 6 — Chau, mamá ----------
const BUS6 = { escala: 2.2, top: 1150 };
const VENTANA_X = AUTOBUS.ventanas[1] + AUTOBUS.ventanaAncho / 2;
const BUS6_X = 620 - BUS6.escala * VENTANA_X;
const BLOOMIE_VENTANA = { y: 223, s: 0.45 };
const CASA_LEJOS = { x: 230, y: 1150, s: 0.32 };

const Escena6: React.FC<{ f: number }> = ({ f }) => {
  const saludo = -140 + Math.sin(f * 0.35) * 28;
  const palabras = palabrasDichas(f);
  const globo = tramo(f, [18, 26, 30], [0, 1.08, 1], salida);
  const vibra = Math.sin(f * 1.3) * 1.5;
  const mamaSaluda = -150 + Math.sin(f * 0.3) * 25;
  return (
    <g>
      <Cielo />
      <g transform="translate(900 300)">
        <Sol giro={f * 0.4} />
      </g>
      <g transform={`translate(${250 + f * 0.2} 360) scale(0.7)`}>
        <Nube />
      </g>
      <rect x={-100} y={CASA_LEJOS.y} width={1300} height={900} fill="#a9df86" />
      <g transform={`translate(560 ${CASA_LEJOS.y + 10}) scale(0.45)`}>
        <Arbol />
      </g>
      <g transform={`translate(${CASA_LEJOS.x} ${CASA_LEJOS.y}) scale(${CASA_LEJOS.s})`}>
        <Casa
          puerta={1}
          adentro={
            <g transform={`scale(${MAMA_ESCALA})`}>
              <Mama brazoDer={mamaSaluda} parpadeo={parpadeo(f, 70)} />
            </g>
          }
        />
      </g>
      <g transform={`translate(${BUS6_X} ${BUS6.top + vibra}) scale(${BUS6.escala})`}>
        <Autobus
          puertas={0}
          ruedas={0}
          idRecorte="ventana-bloomie"
          ventana={
            <Bloomie
              x={VENTANA_X}
              y={BLOOMIE_VENTANA.y}
              s={BLOOMIE_VENTANA.s}
              cara={f >= 15 ? "guino" : "feliz"}
              boca={bocaVoz(f)}
              parpadeo={parpadeo(f, 160)}
            />
          }
        />
        <Brazo
          x={VENTANA_X + 46}
          y={BLOOMIE_VENTANA.y - 36}
          angulo={saludo}
          largo={62}
          grosor={22}
          color={BLOOMIE_BRAZO.color}
          borde={BLOOMIE_BRAZO.borde}
        />
      </g>
      {globo > 0 && (
        <g transform={`translate(${GLOBO.x} ${GLOBO.y}) scale(${globo})`}>
          <Globo lineas={FRASE} palabras={palabras} colaX={80} colaY={1255 - GLOBO.y} />
        </g>
      )}
    </g>
  );
};

// ---------- Escena 7 — Se va a la escuela ----------
const CASA7 = { x: 280, s: 0.6 };
const BUS7 = { escala: 0.75, x: 380, piso: 1700 };

const Escena7: React.FC<{ f: number }> = ({ f }) => {
  const avance = tramo(f, [12, 75], [0, 950], entrada);
  const ruedas = (avance / 62) * 57.3;
  const busX = BUS7.x + avance;
  const largo = AUTOBUS.largo * BUS7.escala;
  const brazo = tramo(f, [36, 46, 56, 64], [-15, -165, -165, -110], suave);
  const humos = [12, 20, 28, 36];
  return (
    <g>
      <Cielo />
      <g transform="translate(880 420)">
        <Sol giro={f * 0.4 + 440} />
      </g>
      <g transform={`translate(${520 + f * 0.3} 300) scale(0.8)`}>
        <Nube />
      </g>
      <ellipse cx={700} cy={1480} rx={700} ry={220} fill="#a9df86" />
      <g transform={`translate(900 1480) scale(0.9)`}>
        <Arbol tono={1} />
      </g>
      <rect x={-100} y={1480} width={1300} height={900} fill={COLORES.pasto} />
      <g transform={`translate(${CASA7.x} 1480) scale(${CASA7.s})`}>
        <Casa
          puerta={1}
          adentro={
            <g transform={`scale(${MAMA_ESCALA})`}>
              <Mama brazoDer={brazo} beso={f >= 40 && f <= 58} parpadeo={parpadeo(f, 75)} />
            </g>
          }
        />
      </g>
      <rect x={-100} y={1560} width={1300} height={30} fill={COLORES.vereda} />
      <rect x={-100} y={1590} width={1300} height={400} fill={COLORES.calle} />
      <rect x={-100} y={1590} width={1300} height={12} fill={COLORES.calleBorde} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 260 - 40} y={1800} width={130} height={14} rx={7} fill="#f4f4f4" />
      ))}
      {humos.map((h) => (
        <g key={h} transform={`translate(${BUS7.x + tramo(h, [12, 75], [0, 950], entrada) - 20} ${BUS7.piso - 70})`}>
          <Humo t={tramo(f, [h, h + 30], [0, 1])} />
        </g>
      ))}
      {/* contraplano: el autobús mira a la derecha y se va */}
      <g transform={`translate(${busX + largo} ${BUS7.piso - AUTOBUS.piso * BUS7.escala + Math.sin(f * 0.9) * 2}) scale(${-BUS7.escala} ${BUS7.escala})`}>
        <Autobus puertas={0} ruedas={-ruedas} idRecorte="ventana-bus7" />
      </g>
      {f < 16 && (
        <g transform={`translate(${GLOBO.x} ${GLOBO.y})`} opacity={tramo(f, [0, 15], [1, 0])}>
          <Globo lineas={FRASE} palabras={PALABRAS} colaX={80} colaY={1255 - GLOBO.y} />
        </g>
      )}
      {(() => {
        const t = tramo(f, [56, 90], [0, 1]);
        const cabeza = { x: CASA7.x + 30, y: 1480 - 340 * CASA7.s * MAMA_ESCALA };
        return t > 0 ? (
          <g transform={`translate(${cabeza.x + t * 140} ${cabeza.y - t * 260}) scale(${0.5 + t * 0.6})`} opacity={tramo(t, [0, 0.1, 0.8, 1], [0, 1, 1, 0.9])}>
            <Corazon />
          </g>
        ) : null;
      })()}
    </g>
  );
};

// ---------- Sonido ----------
const sfx = (n: string) => staticFile(`biblioteca/sfx/mixkit/${n}`);
const EFECTOS: { desde: number; archivo: string; volumen: number; dura?: number; recorte?: number }[] = [
  { desde: ESCENAS.sale + 2, archivo: "mixkit-195-creaky-door-open.wav", volumen: 0.35, dura: 40 },
  { desde: ESCENAS.sale + 42, archivo: "mixkit-2894-boing-hit-sound.wav", volumen: 0.35 },
  { desde: ESCENAS.sale + 72, archivo: "mixkit-2894-boing-hit-sound.wav", volumen: 0.25 },
  { desde: ESCENAS.mama + 70, archivo: "mixkit-2894-boing-hit-sound.wav", volumen: 0.25 },
  { desde: ESCENAS.mama + 102, archivo: "mixkit-2192-little-cute-kiss.wav", volumen: 0.9 },
  { desde: ESCENAS.mama + 188, archivo: "mixkit-2894-boing-hit-sound.wav", volumen: 0.25 },
  { desde: ESCENAS.llega, archivo: "mixkit-3033-old-bus-arrival.wav", volumen: 0.55, dura: 150, recorte: 45 },
  { desde: ESCENAS.llega + 58, archivo: "mixkit-719-car-double-horn.wav", volumen: 0.6 },
  { desde: ESCENAS.llega + 62, archivo: "mixkit-2894-boing-hit-sound.wav", volumen: 0.25 },
  { desde: ESCENAS.llega + 85, archivo: "mixkit-2709-hydraulic-bus-door.wav", volumen: 0.45 },
  { desde: ESCENAS.llega + 105, archivo: "mixkit-2894-boing-hit-sound.wav", volumen: 0.3 },
  { desde: ESCENAS.seVa + 6, archivo: "mixkit-3034-city-bus-departure.wav", volumen: 0.5, dura: 94 },
  { desde: ESCENAS.seVa + 42, archivo: "mixkit-2192-little-cute-kiss.wav", volumen: 0.8 },
];

export type BloomieEscuelaProps = { musica: string };

export const BloomieEscuela: React.FC<BloomieEscuelaProps> = ({ musica }) => {
  const frame = useCurrentFrame();
  const E = ESCENAS;
  let escena: React.ReactNode;
  if (frame < E.sale) escena = <Escena1 f={frame} />;
  else if (frame < E.mama) escena = <Escena2 f={frame - E.sale} />;
  else if (frame < E.camino) escena = <Escena3 f={frame - E.mama} />;
  else if (frame < E.llega) escena = <Escena4 f={frame - E.camino} />;
  else if (frame < E.chau) escena = <Escena5 f={frame - E.llega} />;
  else if (frame < E.seVa) escena = <Escena6 f={frame - E.chau} />;
  else escena = <Escena7 f={frame - E.seVa} />;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORES.cielo }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        {escena}
      </svg>
      <Audio
        src={staticFile(musica)}
        volume={(f) => tramo(f, [E.chau + VOZ_DESDE - 8, E.chau + VOZ_DESDE, E.chau + VOZ_FIN, E.chau + VOZ_FIN + 15], [1, MUSICA_BAJO_VOZ, MUSICA_BAJO_VOZ, 1])}
      />
      <Sequence from={E.chau + VOZ_DESDE} durationInFrames={Math.ceil(VOZ_FIN - VOZ_DESDE) + 15} layout="none">
        <Audio src={staticFile(`trabajos/${ID}/audio/${VOZ_ARCHIVO}`)} />
      </Sequence>
      {EFECTOS.map((e, i) => (
        <Sequence key={i} from={e.desde} durationInFrames={e.dura ?? 60} layout="none">
          <Audio
            src={sfx(e.archivo)}
            trimBefore={e.recorte}
            volume={(f) => e.volumen * (e.dura ? tramo(f, [0, 6, e.dura - 15, e.dura], [0, 1, 1, 0]) : 1)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const PROPS_BLOOMIE: BloomieEscuelaProps = { musica: `trabajos/${ID}/audio/musica_40s.wav` };
