// Escenografía de la plantilla PersonajeAnimado, dibujada por código en el estilo de Bloomie:
// formas redondeadas, relleno plano y contorno del mismo tono más oscuro. Cada pieza se dibuja en sus
// propias coordenadas (origen indicado en cada una) y se ubica con un <g transform>.
import { loadFont } from "@remotion/google-fonts/Fredoka";
import React from "react";

const { fontFamily: FREDOKA } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

const TRAZO = 5;
const TINTA = "#3b2418";

export const COLORES = {
  cielo: "#bfe8ff",
  cieloBajo: "#eaf8ff",
  pasto: "#8fd16a",
  pastoOscuro: "#5fa844",
  vereda: "#efe2cf",
  veredaBorde: "#c9b398",
  calle: "#8a8f9a",
  calleBorde: "#5f646e",
  hoja: "#6cc04a",
  hojaOscura: "#3f8f2c",
  tronco: "#9a6440",
  troncoOscuro: "#6a4026",
  amarillo: "#ffcc33",
  amarilloOscuro: "#c9900e",
  vidrio: "#bfeaf7",
  vidrioOscuro: "#5fb7ce",
};

// ---------- Cielo ----------
export const Sol: React.FC<{ giro: number }> = ({ giro }) => (
  <g>
    <g transform={`rotate(${giro})`}>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-9} y={-150} width={18} height={40} rx={9} fill="#ffd54a" transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <circle r={95} fill="#ffe066" stroke="#f2b631" strokeWidth={TRAZO} />
    <circle cx={-30} cy={-10} r={8} fill="#c98a1c" />
    <circle cx={30} cy={-10} r={8} fill="#c98a1c" />
    <path d="M-28 22Q0 44 28 22" fill="none" stroke="#c98a1c" strokeWidth={7} strokeLinecap="round" />
  </g>
);

// Nube: origen en su centro inferior
export const Nube: React.FC = () => (
  <path
    d="M-150 0C-190 0-195-55-150-62C-150-110-90-125-60-95C-40-150 50-150 65-95C100-120 160-95 150-55C195-50 190 0 150 0Z"
    fill="#ffffff"
    stroke="#cfe6f2"
    strokeWidth={TRAZO}
  />
);

export const Pajaro: React.FC<{ aleteo: number }> = ({ aleteo }) => {
  const a = 18 * Math.sin(aleteo);
  return (
    <path
      d={`M-34 ${-a}Q-17 ${-14 - a} 0 0Q17 ${-14 - a} 34 ${-a}`}
      fill="none"
      stroke="#4a5a6a"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

// ---------- Vegetación ----------
// Árbol: origen en la base del tronco
export const Arbol: React.FC<{ tono?: number }> = ({ tono = 0 }) => {
  const hoja = tono ? "#7ccb57" : COLORES.hoja;
  return (
    <g>
      <rect x={-22} y={-170} width={44} height={170} rx={14} fill={COLORES.tronco} stroke={COLORES.troncoOscuro} strokeWidth={TRAZO} />
      <circle cx={-70} cy={-210} r={85} fill={hoja} stroke={COLORES.hojaOscura} strokeWidth={TRAZO} />
      <circle cx={70} cy={-215} r={85} fill={hoja} stroke={COLORES.hojaOscura} strokeWidth={TRAZO} />
      <circle cx={0} cy={-290} r={105} fill={hoja} stroke={COLORES.hojaOscura} strokeWidth={TRAZO} />
      <circle cx={-35} cy={-300} r={12} fill="#ff7a8a" />
      <circle cx={45} cy={-250} r={12} fill="#ff7a8a" />
      <circle cx={-80} cy={-200} r={12} fill="#ff7a8a" />
    </g>
  );
};

export const Arbusto: React.FC = () => (
  <g>
    <circle cx={-45} cy={-40} r={50} fill={COLORES.hoja} stroke={COLORES.hojaOscura} strokeWidth={TRAZO} />
    <circle cx={45} cy={-40} r={50} fill={COLORES.hoja} stroke={COLORES.hojaOscura} strokeWidth={TRAZO} />
    <circle cx={0} cy={-65} r={58} fill={COLORES.hoja} stroke={COLORES.hojaOscura} strokeWidth={TRAZO} />
  </g>
);

// Flor chiquita: origen en la base del tallo
export const Flor: React.FC<{ color: string; alto?: number }> = ({ color, alto = 50 }) => (
  <g>
    <path d={`M0 0V${-alto}`} stroke={COLORES.hojaOscura} strokeWidth={6} strokeLinecap="round" />
    {[0, 72, 144, 216, 288].map((r) => (
      <circle key={r} cx={0} cy={-15} r={12} fill={color} transform={`translate(0 ${-alto}) rotate(${r}) `} />
    ))}
    <circle cx={0} cy={-alto} r={10} fill="#ffd54a" />
  </g>
);

// Cerca de madera blanca: origen en la base izquierda
export const Cerca: React.FC<{ largo: number }> = ({ largo }) => {
  const n = Math.ceil(largo / 70);
  return (
    <g>
      <rect x={0} y={-95} width={largo} height={18} rx={6} fill="#fffaf0" stroke="#d9c7a8" strokeWidth={4} />
      <rect x={0} y={-45} width={largo} height={18} rx={6} fill="#fffaf0" stroke="#d9c7a8" strokeWidth={4} />
      {Array.from({ length: n }, (_, i) => (
        <path
          key={i}
          d={`M${i * 70 + 10} 0V-110L${i * 70 + 28} -130L${i * 70 + 46} -110V0Z`}
          fill="#fffaf0"
          stroke="#d9c7a8"
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
};

// ---------- Casas ----------
export const CASA = { ancho: 700, alto: 560, puertaAncho: 250, puertaAlto: 330 };

// Casa de Bloomie: origen en el centro de la base. `puerta`: 0 cerrada … 1 abierta (gira sobre la bisagra izquierda)
export const Casa: React.FC<{ puerta: number; adentro?: React.ReactNode }> = ({ puerta, adentro }) => {
  const { ancho: w, alto: h, puertaAncho: pw, puertaAlto: ph } = CASA;
  const hoja = Math.max(0.12, 1 - puerta * 0.88);
  return (
    <g>
      {/* chimenea */}
      <rect x={150} y={-h - 300} width={80} height={170} rx={10} fill="#d9735f" stroke="#a8372f" strokeWidth={TRAZO} />
      {/* paredes */}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={18} fill="#ffe3b8" stroke="#c9935a" strokeWidth={TRAZO} />
      {/* techo */}
      <path
        d={`M${-w / 2 - 60} ${-h + 20}Q${-w / 2 - 70} ${-h - 10} ${-w / 2 - 30} ${-h - 40}L-30 ${-h - 300}Q0 ${-h - 320} 30 ${-h - 300}L${w / 2 + 30} ${-h - 40}Q${w / 2 + 70} ${-h - 10} ${w / 2 + 60} ${-h + 20}Z`}
        fill="#e85a4f"
        stroke="#a8372f"
        strokeWidth={TRAZO}
        strokeLinejoin="round"
      />
      <circle cx={0} cy={-h - 150} r={55} fill="#fff3d6" stroke="#a8372f" strokeWidth={TRAZO} />
      <path d={`M0 ${-h - 205}V${-h - 95}M-55 ${-h - 150}H55`} stroke="#a8372f" strokeWidth={TRAZO} />
      {/* ventanas */}
      {[-220, 220].map((x) => (
        <g key={x} transform={`translate(${x} ${-h + 150})`}>
          <rect x={-85} y={-80} width={170} height={170} rx={16} fill={COLORES.vidrio} stroke="#c9935a" strokeWidth={TRAZO} />
          <path d="M0 -80V90M-85 5H85" stroke="#c9935a" strokeWidth={TRAZO} />
          <path d="M-80 -75Q-40 -20 -80 40Z M80 -75Q40 -20 80 40Z" fill="#ff9fb8" stroke="#d96a88" strokeWidth={3} />
          <rect x={-100} y={88} width={200} height={34} rx={10} fill="#b5734a" stroke="#7a4a2c" strokeWidth={TRAZO} />
          {[-70, -35, 0, 35, 70].map((fx, i) => (
            <circle key={fx} cx={fx} cy={84} r={15} fill={["#ff6b8b", "#ffd54a", "#b07cff", "#ff6b8b", "#ffd54a"][i]} />
          ))}
        </g>
      ))}
      {/* marco y hueco de la puerta */}
      <rect x={-pw / 2 - 18} y={-ph - 18} width={pw + 36} height={ph + 18} rx={20} fill="#fff3d6" stroke="#c9935a" strokeWidth={TRAZO} />
      <rect x={-pw / 2} y={-ph} width={pw} height={ph} rx={12} fill="#5a3b2a" />
      {adentro}
      {/* hoja de la puerta (se abre achicándose hacia la bisagra) */}
      <g transform={`translate(${-pw / 2} 0) scale(${hoja} 1)`}>
        <rect x={0} y={-ph} width={pw} height={ph} rx={12} fill="#4fb3a9" stroke="#2f7d75" strokeWidth={TRAZO} />
        <rect x={35} y={-ph + 35} width={pw - 70} height={110} rx={10} fill="none" stroke="#2f7d75" strokeWidth={4} />
        <rect x={35} y={-ph + 170} width={pw - 70} height={120} rx={10} fill="none" stroke="#2f7d75" strokeWidth={4} />
        <circle cx={pw - 32} cy={-ph / 2} r={13} fill="#ffd54a" stroke="#c9900e" strokeWidth={3} />
      </g>
      {/* escalón */}
      <rect x={-pw / 2 - 40} y={-6} width={pw + 80} height={30} rx={10} fill="#d8c3a5" stroke="#a88b66" strokeWidth={TRAZO} />
    </g>
  );
};

// Casa lejana simplificada: origen en el centro de la base
export const CasaLejana: React.FC<{ pared: string; techo: string }> = ({ pared, techo }) => (
  <g>
    <rect x={-120} y={-170} width={240} height={170} rx={12} fill={pared} stroke="#00000022" strokeWidth={4} />
    <path d="M-150 -160L0 -290L150 -160Z" fill={techo} stroke="#00000022" strokeWidth={4} strokeLinejoin="round" />
    <rect x={-25} y={-90} width={50} height={90} rx={8} fill="#00000030" />
    <rect x={-95} y={-130} width={50} height={45} rx={6} fill="#ffffffaa" />
    <rect x={45} y={-130} width={50} height={45} rx={6} fill="#ffffffaa" />
  </g>
);

// Cartel de parada de autobús (sin texto): origen en la base del poste
export const CartelParada: React.FC = () => (
  <g>
    <rect x={-10} y={-430} width={20} height={430} rx={8} fill="#9aa3ad" stroke="#5f646e" strokeWidth={4} />
    <circle cx={0} cy={-440} r={80} fill="#2f8fd8" stroke="#1d5f94" strokeWidth={TRAZO} />
    <circle cx={0} cy={-440} r={62} fill="#ffffff" />
    <g transform="translate(0 -440) scale(0.13)">
      <Autobus puertas={0} ruedas={0} sinDetalles />
    </g>
  </g>
);

// ---------- Autobús escolar (de costado, el frente mira a la izquierda) ----------
// Origen: esquina superior izquierda de la carrocería (860 × 440). Ruedas apoyan en y = 512.
export const AUTOBUS = { largo: 860, alto: 440, piso: 512, ventanas: [270, 405, 540, 675], ventanaAncho: 115, ventanaArriba: 60, ventanaAbajo: 200 };

export const Autobus: React.FC<{
  puertas: number; // 0 cerradas … 1 abiertas
  ruedas: number; // giro de las ruedas en grados
  ventana?: React.ReactNode; // contenido de la 2ª ventana (recortado al vidrio)
  sinDetalles?: boolean;
  idRecorte?: string;
}> = ({ puertas, ruedas, ventana, sinDetalles, idRecorte = "ventana-bus" }) => {
  const { largo: w, alto: h, ventanas, ventanaAncho: vw, ventanaArriba: va, ventanaAbajo: vb } = AUTOBUS;
  const abre = puertas * 50;
  return (
    <g>
      <defs>
        <clipPath id={idRecorte}>
          <rect x={ventanas[1]} y={va} width={vw} height={vb - va} rx={14} />
        </clipPath>
      </defs>
      {/* carrocería */}
      <path
        d={`M40 0H${w - 30}Q${w} 0 ${w} 30V${h - 30}Q${w} ${h} ${w - 30} ${h}H20Q0 ${h} 0 ${h - 20}V120Q0 0 40 0Z`}
        fill={COLORES.amarillo}
        stroke={COLORES.amarilloOscuro}
        strokeWidth={TRAZO + 1}
        strokeLinejoin="round"
      />
      <rect x={0} y={250} width={w} height={22} fill="#2b2b2b" />
      <rect x={0} y={330} width={w} height={14} fill="#2b2b2b" />
      {/* parabrisas */}
      <path d="M14 120Q14 50 60 50H105V230H14Z" fill={COLORES.vidrio} stroke={COLORES.amarilloOscuro} strokeWidth={TRAZO} />
      {/* puerta */}
      <rect x={122} y={62} width={126} height={h - 70} rx={10} fill="#3a3a3a" stroke={COLORES.amarilloOscuro} strokeWidth={TRAZO} />
      <rect x={128 - abre} y={68} width={57} height={h - 82} rx={8} fill={COLORES.vidrio} stroke="#8a8f9a" strokeWidth={4} />
      <rect x={185 + abre} y={68} width={57} height={h - 82} rx={8} fill={COLORES.vidrio} stroke="#8a8f9a" strokeWidth={4} />
      {/* ventanas */}
      {ventanas.map((x, i) => (
        <rect key={x} x={x} y={va} width={vw} height={vb - va} rx={14} fill={COLORES.vidrio} stroke={COLORES.amarilloOscuro} strokeWidth={TRAZO} />
      ))}
      {ventana && <g clipPath={`url(#${idRecorte})`}>{ventana}</g>}
      {ventanas.map((x) => (
        <rect key={`m${x}`} x={x} y={va} width={vw} height={vb - va} rx={14} fill="none" stroke={COLORES.amarilloOscuro} strokeWidth={TRAZO} />
      ))}
      {!sinDetalles && (
        <>
          <circle cx={-2} cy={300} r={16} fill="#fff6c2" stroke={COLORES.amarilloOscuro} strokeWidth={4} />
          <rect x={w - 14} y={290} width={16} height={34} rx={6} fill="#ff6b5b" />
          <rect x={-14} y={370} width={40} height={30} rx={8} fill="#9aa3ad" stroke="#5f646e" strokeWidth={4} />
          <rect x={w - 20} y={370} width={34} height={30} rx={8} fill="#9aa3ad" stroke="#5f646e" strokeWidth={4} />
        </>
      )}
      {/* ruedas */}
      {[190, 680].map((x) => (
        <g key={x} transform={`translate(${x} ${AUTOBUS.piso - 62}) rotate(${ruedas})`}>
          <circle r={62} fill="#2b2b2b" />
          <circle r={30} fill="#c9ced6" stroke="#8a8f9a" strokeWidth={4} />
          <rect x={-5} y={-28} width={10} height={56} fill="#8a8f9a" />
          <rect x={-28} y={-5} width={56} height={10} fill="#8a8f9a" />
        </g>
      ))}
    </g>
  );
};

// ---------- Mamá: flor rosada con delantal ----------
// Origen en el centro de los pies (mide ~540 de alto)
const PIEL = "#f6b07a";
const PIEL_OSCURA = "#c97a3f";

export const Brazo: React.FC<{ x: number; y: number; angulo: number; largo?: number; color?: string; borde?: string; grosor?: number }> = ({
  x,
  y,
  angulo,
  largo = 110,
  color = PIEL,
  borde = PIEL_OSCURA,
  grosor = 32,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${angulo})`}>
    <rect x={-grosor / 2} y={-6} width={grosor} height={largo} rx={grosor / 2} fill={color} stroke={borde} strokeWidth={TRAZO} />
    <circle cx={0} cy={largo - 4} r={grosor * 0.62} fill={color} stroke={borde} strokeWidth={TRAZO} />
  </g>
);

export const Mama: React.FC<{
  brazoIzq?: number; // grados; 0 = colgando
  brazoDer?: number;
  parpadeo?: number;
  beso?: boolean;
  enLaMano?: React.ReactNode; // algo en la mano derecha (coordenadas de la mano)
}> = ({ brazoIzq = 15, brazoDer = -15, parpadeo = 0, beso = false, enLaMano }) => {
  const cabeza = -330;
  const ojo = (x: number) =>
    parpadeo > 0.7 ? (
      <path d={`M${x - 24} ${cabeza - 15}Q${x} ${cabeza + 2} ${x + 24} ${cabeza - 15}`} fill="none" stroke={TINTA} strokeWidth={6} strokeLinecap="round" />
    ) : (
      <g transform={`translate(${x} ${cabeza - 15}) scale(1 ${1 - parpadeo * 0.9})`}>
        <ellipse rx={24} ry={30} fill="#fffaf5" />
        <circle cx={4} cy={4} r={16} fill={TINTA} />
        <circle cx={9} cy={-3} r={5} fill="#ffffff" />
        <path d={`M-22 -22L-34 -36M-10 -29L-16 -45M6 -30L6 -47`} stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
      </g>
    );
  const angDer = brazoDer;
  return (
    <g>
      {/* piernas */}
      <rect x={-50} y={-80} width={36} height={80} rx={16} fill={PIEL} stroke={PIEL_OSCURA} strokeWidth={TRAZO} />
      <rect x={14} y={-80} width={36} height={80} rx={16} fill={PIEL} stroke={PIEL_OSCURA} strokeWidth={TRAZO} />
      {/* brazos detrás del cuerpo */}
      <Brazo x={-88} y={-175} angulo={brazoIzq} />
      <g>
        <Brazo x={88} y={-175} angulo={angDer} />
        {enLaMano && (
          <g transform={`translate(88 -175) rotate(${angDer}) translate(0 106) rotate(${-angDer})`}>{enLaMano}</g>
        )}
      </g>
      {/* cuerpo y delantal */}
      <ellipse cx={0} cy={-150} rx={100} ry={95} fill={PIEL} stroke={PIEL_OSCURA} strokeWidth={TRAZO} />
      <path d="M-62 -205H62Q70 -205 72 -195L88 -95Q90 -62 60 -62H-60Q-90 -62 -88 -95L-72 -195Q-70 -205 -62 -205Z" fill="#fffaf2" stroke="#d9c7b5" strokeWidth={TRAZO} />
      <path d="M-62 -205L-40 -245M62 -205L40 -245" stroke="#d9c7b5" strokeWidth={8} strokeLinecap="round" />
      <path d="M0 -112C-12 -128-34 -118-24 -100L0 -80L24 -100C34 -118 12 -128 0 -112Z" fill="#ff6b8b" />
      {/* pétalos */}
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <ellipse key={r} cx={0} cy={-118} rx={78} ry={98} fill="#f07aa8" stroke="#c2497c" strokeWidth={TRAZO} transform={`translate(0 ${cabeza}) rotate(${r})`} />
      ))}
      {/* cabeza */}
      <circle cx={0} cy={cabeza} r={128} fill={PIEL} stroke={PIEL_OSCURA} strokeWidth={TRAZO} />
      <ellipse cx={-75} cy={cabeza + 35} rx={24} ry={15} fill="#ff8fa3" opacity={0.7} />
      <ellipse cx={75} cy={cabeza + 35} rx={24} ry={15} fill="#ff8fa3" opacity={0.7} />
      {ojo(-48)}
      {ojo(48)}
      {beso ? (
        <g transform={`translate(0 ${cabeza + 55})`}>
          <ellipse rx={16} ry={18} fill="#d94a6a" />
          <ellipse rx={7} ry={8} fill="#8a2240" />
        </g>
      ) : (
        <path d={`M-32 ${cabeza + 40}Q0 ${cabeza + 75} 32 ${cabeza + 40}`} fill="none" stroke={TINTA} strokeWidth={7} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------- Accesorios ----------
// Mochila celeste: origen en su centro
export const Mochila: React.FC<{ escala?: number }> = ({ escala = 1 }) => (
  <g transform={`scale(${escala})`}>
    <path d="M-30 -80Q0 -115 30 -80" fill="none" stroke="#2f7f96" strokeWidth={12} strokeLinecap="round" />
    <rect x={-70} y={-80} width={140} height={160} rx={36} fill="#5fb7ce" stroke="#2f7f96" strokeWidth={TRAZO} />
    <rect x={-48} y={5} width={96} height={55} rx={18} fill="#8fd3e3" stroke="#2f7f96" strokeWidth={4} />
    <circle cx={0} cy={-35} r={12} fill="#ffd54a" stroke="#c9900e" strokeWidth={3} />
  </g>
);

// Corazón: origen en su centro
export const Corazon: React.FC<{ color?: string }> = ({ color = "#ff6b8b" }) => (
  <path d="M0 -12C-14 -38-52 -26-44 2L0 40L44 2C52 -26 14 -38 0 -12Z" fill={color} stroke="#d9466a" strokeWidth={4} strokeLinejoin="round" />
);

export const Mariposa: React.FC<{ aleteo: number }> = ({ aleteo }) => {
  const s = 0.35 + 0.65 * Math.abs(Math.cos(aleteo));
  return (
    <g>
      <g transform={`scale(${s} 1)`}>
        <ellipse cx={-26} cy={-14} rx={26} ry={22} fill="#b07cff" stroke="#7a4fd0" strokeWidth={4} />
        <ellipse cx={26} cy={-14} rx={26} ry={22} fill="#b07cff" stroke="#7a4fd0" strokeWidth={4} />
        <ellipse cx={-18} cy={16} rx={16} ry={14} fill="#ff9fd6" stroke="#7a4fd0" strokeWidth={4} />
        <ellipse cx={18} cy={16} rx={16} ry={14} fill="#ff9fd6" stroke="#7a4fd0" strokeWidth={4} />
      </g>
      <rect x={-5} y={-24} width={10} height={48} rx={5} fill="#3b2418" />
    </g>
  );
};

// Bocanada de humo: origen en su centro; t de 0 a 1 (crece y se desvanece)
export const Humo: React.FC<{ t: number }> = ({ t }) =>
  t <= 0 || t >= 1 ? null : (
    <g opacity={1 - t} transform={`scale(${0.5 + t})`}>
      <circle cx={0} cy={0} r={30} fill="#e6e8ec" />
      <circle cx={25} cy={-12} r={22} fill="#e6e8ec" />
      <circle cx={-22} cy={-10} r={20} fill="#e6e8ec" />
    </g>
  );

// Globo de diálogo: origen en su centro. Las palabras aparecen de a una (`palabras` = cuántas se ven).
export const Globo: React.FC<{
  lineas: string[];
  palabras: number;
  colaX: number; // punta de la cola, relativa al centro del globo
  colaY: number;
  tamano?: number;
}> = ({ lineas, palabras, colaX, colaY, tamano = 62 }) => {
  const alto = lineas.length * tamano * 1.3 + 90;
  const ancho = 960;
  let cuenta = 0;
  return (
    <g>
      <path
        d={`M${-60} ${alto / 2 - 10}L${colaX} ${colaY}L${60} ${alto / 2 - 10}Z`}
        fill="#ffffff"
        stroke={TINTA}
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <rect x={-ancho / 2} y={-alto / 2} width={ancho} height={alto} rx={70} fill="#ffffff" stroke={TINTA} strokeWidth={7} />
      <path d={`M-62 ${alto / 2 - 4}L62 ${alto / 2 - 4}`} stroke="#ffffff" strokeWidth={9} />
      {lineas.map((l, i) => (
        <text
          key={i}
          x={0}
          y={-alto / 2 + 45 + tamano * 1.3 * (i + 0.78)}
          textAnchor="middle"
          fontFamily={FREDOKA}
          fontWeight={600}
          fontSize={tamano}
          fill={TINTA}
        >
          {l.split(" ").map((p, j) => {
            cuenta++;
            const visible = Math.max(0, Math.min(1, palabras - cuenta + 1));
            return (
              <tspan key={j} opacity={visible}>
                {j > 0 ? " " : ""}
                {p}
              </tspan>
            );
          })}
        </text>
      ))}
    </g>
  );
};

// Líneas de "sonido" (bocina): origen en el punto de emisión, hacia la izquierda
export const LineasSonido: React.FC<{ t: number }> = ({ t }) =>
  t <= 0 || t >= 1 ? null : (
    <g opacity={1 - t} stroke={TINTA} strokeWidth={8} strokeLinecap="round">
      {[-28, 0, 28].map((a) => (
        <path key={a} d={`M${-20 - t * 30} 0H${-60 - t * 40}`} transform={`rotate(${a})`} />
      ))}
    </g>
  );
