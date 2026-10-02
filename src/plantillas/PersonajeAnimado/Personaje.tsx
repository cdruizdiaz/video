// Personaje extraído de un dibujo vectorial (Illustrator → PyMuPDF → JSON de trazos, ver
// src/marcas/bloomie/extraer_personaje.py). Coordenadas con origen en el centro
// de los pies: se ubica y escala con un <g transform> alrededor.
// Sabe: vista de frente o de perfil, cambiar de cara, parpadear, hablar (boca abierta superpuesta)
// y agrandar los ojos (sorpresa). Lo que va detrás o delante (mochila, brazo) se pasa como hijos.
import React from "react";

export type Trazo = {
  d: string;
  fill?: string | null;
  stroke?: string;
  sw?: number;
  evenodd?: boolean;
  rol?: "ojo" | "boca" | "cara";
};

export type CaraPersonaje = {
  trazos: Trazo[];
  ojos: number[][];
  boca: number[];
  parpados?: { x: number; y: number; r: number; color: string }[]; // lentes con hueco: se tapan al cerrar
};

export type DatosPersonaje = {
  frente: Trazo[];
  perfil: Trazo[];
  caras: Record<string, CaraPersonaje>;
  bocaAbierta: Trazo[];
  cajas: { frente: number[]; perfil: number[] };
  accesorios?: Record<string, { trazos: Trazo[]; caja: number[] }>; // p. ej. la escoba de la bruja
  perfilPartes?: Record<string, number[]>; // índices de "perfil" por parte (pie, cuerpo, mano, cabeza…) para articularlo
};


const TINTA = "#140a08";
const BOCA_ANCHO = 0.7; // escala horizontal de la boca abierta al hablar
const BOCA_MIN = 0.25; // apertura mínima (escala vertical) mientras habla
const CIERRE_OJO = 0.7; // desde este valor de parpadeo se dibuja el ojo cerrado

const Path: React.FC<{ t: Trazo }> = ({ t }) => (
  <path
    d={t.d}
    fill={t.fill ?? "none"}
    stroke={t.stroke}
    strokeWidth={t.sw}
    fillRule={t.evenodd ? "evenodd" : undefined}
  />
);

// Accesorio suelto del personaje (mismas coordenadas que el cuerpo de frente)
export const Accesorio: React.FC<{ datos: DatosPersonaje; nombre: string }> = ({ datos, nombre }) => (
  <g>
    {(datos.accesorios?.[nombre]?.trazos ?? []).map((t, i) => (
      <Path key={i} t={t} />
    ))}
  </g>
);

const primerX = (d: string) => Number(d.slice(1).split(" ")[0]);

const centroCaja = (c: number[]) => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];

export const Personaje: React.FC<{
  datos: DatosPersonaje;
  vista?: "frente" | "perfil";
  cara?: string;
  parpadeo?: number; // 0 abierto … 1 cerrado
  boca?: number; // 0 cerrada … 1 abierta (habla)
  ojos?: number; // escala de los ojos (1 = normal)
  guino?: number; // 0 abierto … 1 cerrado, solo el ojo derecho (para guiñar con cualquier cara)
  detras?: React.ReactNode;
  delante?: React.ReactNode;
}> = ({ datos, vista = "frente", cara = "normal", parpadeo = 0, boca = 0, ojos = 1, guino = 0, detras, delante }) => {
  if (vista === "perfil") {
    return (
      <g>
        {detras}
        {datos.perfil.map((t, i) => (
          <Path key={i} t={t} />
        ))}
        {delante}
      </g>
    );
  }
  const c = datos.caras[cara] ?? datos.caras.normal;
  // Cierre de cada ojo: el parpadeo cierra los dos; el guiño, solo el de más a la derecha
  const derecho = c.ojos.reduce((k, o, i) => (o[0] > c.ojos[k][0] ? i : k), 0);
  const cierre = c.ojos.map((_, i) => (i === derecho ? Math.max(parpadeo, guino) : parpadeo));
  const hablando = boca > 0.02;

  // Agrupa los trazos de ojos por el ojo más cercano (para escalar cada uno sobre su centro)
  const ojosTrazos = c.ojos.map(() => [] as Trazo[]);
  for (const t of c.trazos) {
    if (t.rol !== "ojo") continue;
    const x = primerX(t.d);
    let k = 0;
    c.ojos.forEach((o, i) => {
      if (Math.abs(o[0] - x) < Math.abs(c.ojos[k][0] - x)) k = i;
    });
    ojosTrazos[k].push(t);
  }

  const [bx, by] = centroCaja(c.boca);
  const fuente = datos.caras.feliz?.boca ?? c.boca;
  const [fx, fy] = centroCaja(fuente);
  const sy = BOCA_MIN + (1 - BOCA_MIN) * Math.min(1, boca);

  return (
    <g>
      {detras}
      {datos.frente.map((t, i) => (
        <Path key={i} t={t} />
      ))}
      {c.trazos.map((t, i) =>
        t.rol === "ojo" || (t.rol === "boca" && hablando) ? null : <Path key={i} t={t} />,
      )}
      {c.ojos.map((o, i) =>
        cierre[i] < CIERRE_OJO ? (
          <g key={i} transform={`translate(${o[0]} ${o[1]}) scale(${ojos} ${(1 - cierre[i] * 0.9) * ojos}) translate(${-o[0]} ${-o[1]})`}>
            {ojosTrazos[i].map((t, j) => (
              <Path key={j} t={t} />
            ))}
          </g>
        ) : c.parpados?.[i] ? (
          <g key={i}>
            <circle cx={c.parpados[i].x} cy={c.parpados[i].y} r={c.parpados[i].r} fill={c.parpados[i].color} />
            <path
              d={`M${c.parpados[i].x - 24} ${c.parpados[i].y - 2}Q${c.parpados[i].x} ${c.parpados[i].y + 14} ${c.parpados[i].x + 24} ${c.parpados[i].y - 2}`}
              fill="none"
              stroke={TINTA}
              strokeWidth={6}
              strokeLinecap="round"
            />
          </g>
        ) : (
          <path
            key={i}
            d={`M${o[0] - 22} ${o[1] - 2}Q${o[0]} ${o[1] + 12} ${o[0] + 22} ${o[1] - 2}`}
            fill="none"
            stroke={TINTA}
            strokeWidth={6}
            strokeLinecap="round"
          />
        ),
      )}
      {hablando && (
        <g transform={`translate(${bx} ${by}) scale(${BOCA_ANCHO} ${sy}) translate(${-fx} ${-fy})`}>
          {datos.bocaAbierta.map((t, i) => (
            <Path key={i} t={t} />
          ))}
        </g>
      )}
      {delante}
    </g>
  );
};
