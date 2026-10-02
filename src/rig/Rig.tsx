// Arma un personaje de la biblioteca a partir de su rig y lo dibuja en SVG según una pose.
// Coordenadas del personaje (puntos del .ai): origen en el piso entre los pies, y hacia abajo. Se ubica y escala
// con un <g transform> alrededor (ver <EnEscena>).
// Cada pieza se mueve con su hueso (rotación, traslación y escala alrededor del pivote, heredando las del padre);
// el orden de capas es el del dibujo original, salvo cambios en rig.orden o pose.orden. El rostro (ojos, cejas,
// boca, anteojos, tocado) va sobre la cabeza y se cambia entero con la expresión; los ojos parpadean y la boca se
// reemplaza por visemas al hablar.
import React, { useId } from "react";
import type { Pose } from "./pose";
import { IDENTIDAD, type Matriz, matricesMundo, matrizSvg, multiplicar, rotar, escalar, trasladar } from "./pose";
import { cargarPersonaje, type Personaje } from "./personajes";
import type { Ojo, Pieza, Rig, Rostro, Trazo } from "./tipos";

const CIERRE_OJO = 0.7; // desde este valor de parpadeo se dibuja el ojo cerrado
const ACHIQUE_OJO = 0.9; // cuánto se aplasta el ojo justo antes de cerrarse
const LINEA_OJO = 0.11; // grosor de la línea del ojo cerrado (fracción del ancho del ojo)
const CURVA_OJO = 0.2; // cuánto baja el centro de la línea del ojo cerrado (fracción del alto)
const BOCA_PERFIL = 1.3; // tamaño de los visemas de perfil respecto de la boca dibujada de perfil
const MIRADA = 0.18; // cuánto se corren las pupilas con mirada = 1 (fracción del ancho / alto del ojo)
const BRILLO_DESDE = 1.12; // con los ojos agrandados más que esto aparecen brillos de "ojos de cachorro"
const BRILLOS = [
  { x: -0.16, y: -0.2, r: 0.13 },
  { x: 0.1, y: 0.08, r: 0.06 },
]; // posición (fracción del ancho / alto del ojo, desde el centro de la pupila) y radio

// ---------- Utilidades ----------
const luminancia = (hex?: string | null) => {
  if (!hex || hex.length < 7) return 1;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const limpiarId = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

// Trazos con su recorte (si lo traen)
const Trazos: React.FC<{ trazos: Trazo[]; id: string }> = ({ trazos, id }) => (
  <>
    {trazos.map((t, i) => {
      const clip = t.clip ? `${id}-c${i}` : undefined;
      return (
        <React.Fragment key={i}>
          {clip && (
            <clipPath id={clip}>
              <path d={t.clip} />
            </clipPath>
          )}
          <path
            d={t.d}
            fill={t.fill ?? "none"}
            stroke={t.stroke}
            strokeWidth={t.sw}
            fillRule={t.evenodd ? "evenodd" : undefined}
            opacity={t.op}
            clipPath={clip ? `url(#${clip})` : undefined}
          />
        </React.Fragment>
      );
    })}
  </>
);

const PiezaSvg: React.FC<{ pieza: Pieza; id: string }> = ({ pieza, id }) => {
  if (!pieza.clip) return <Trazos trazos={pieza.trazos} id={id} />;
  return (
    <>
      <clipPath id={`${id}-p`}>
        <path d={pieza.clip} />
      </clipPath>
      <g clipPath={`url(#${id}-p)`}>
        <Trazos trazos={pieza.trazos} id={id} />
      </g>
    </>
  );
};

// ---------- Huesos ----------
export { matricesMundo, pivotesMundo } from "./pose";

// ---------- Rostro ----------
// Caja aproximada de un path (por sus números): para saber cuál es el blanco del ojo
const cajaD = (d: string) => {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
};

// Ojo con la mirada aplicada: el trazo más grande (el blanco) queda quieto y el resto (pupila, brillo) se corre
const OjoMirando: React.FC<{ o: Ojo; mirada: [number, number]; id: string }> = ({ o, mirada, id }) => {
  if (!mirada[0] && !mirada[1]) return <Trazos trazos={o.trazos} id={id} />;
  const areas = o.trazos.map((t) => cajaD(t.d));
  const blanco = areas.indexOf(Math.max(...areas));
  const dx = mirada[0] * o.w * MIRADA;
  const dy = mirada[1] * o.h * MIRADA;
  return (
    <>
      <Trazos trazos={[o.trazos[blanco]]} id={`${id}-b`} />
      <g transform={`translate(${dx} ${dy})`}>
        <Trazos trazos={o.trazos.filter((_, i) => i !== blanco)} id={`${id}-p`} />
      </g>
    </>
  );
};

const OjoSvg: React.FC<{ o: Ojo; cierre: number; id: string; colorCabeza: string; mirada: [number, number] }> = ({
  o,
  cierre,
  id,
  colorCabeza,
  mirada,
}) => {
  const [cx, cy] = o.c;
  if (!o.abierto || cierre <= 0.01) return o.abierto ? <OjoMirando o={o} mirada={mirada} id={id} /> : <Trazos trazos={o.trazos} id={id} />;
  if (cierre < CIERRE_OJO) {
    const sy = 1 - cierre * ACHIQUE_OJO;
    return (
      <g transform={`translate(${cx} ${cy}) scale(1 ${sy}) translate(${-cx} ${-cy})`}>
        <OjoMirando o={o} mirada={mirada} id={id} />
      </g>
    );
  }
  const tinta = o.trazos.reduce((m, t) => (luminancia(t.fill) < luminancia(m) ? t.fill ?? m : m), "#ffffff");
  // Ojos angostos (ranura de gato): la línea cerrada usa el mayor entre el ancho y el alto del ojo
  const ancho = Math.max(o.w, o.h * 0.8);
  const w = ancho * 0.46;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={o.w * 0.52} ry={o.h * 0.52} fill={o.tapa ?? colorCabeza} />
      <path
        d={`M${cx - w} ${cy - o.h * 0.02}Q${cx} ${cy + o.h * CURVA_OJO} ${cx + w} ${cy - o.h * 0.02}`}
        fill="none"
        stroke={luminancia(tinta) < 0.3 ? tinta : "#150b09"}
        strokeWidth={Math.max(2, ancho * LINEA_OJO)}
        strokeLinecap="round"
      />
    </g>
  );
};

const RostroSvg: React.FC<{
  r: Rostro;
  pose: Pose;
  visemas: Personaje["piezas"]["visemas"];
  escalaBoca: number;
  colorCabeza: string;
  id: string;
  disfraz?: Rostro; // gorro/tocado, anteojos y extras de otro rostro, sobre esta expresión
}> = ({ r, pose, visemas, escalaBoca, colorCabeza, id, disfraz }) => {
  // El guiño cierra el ojo de más a la derecha de la pantalla
  const derecho = r.ojos.reduce((k, o, i) => (o.c[0] > r.ojos[k].c[0] ? i : k), 0);
  const vis = pose.visema && pose.visema !== "X" ? visemas[pose.visema] : undefined;
  return (
    <g>
      {r.cejas && <Trazos trazos={r.cejas.trazos} id={`${id}-cj`} />}
      {r.ojos.map((o, i) => (
        <g key={i} transform={pose.ojos !== 1 ? `translate(${o.c[0]} ${o.c[1]}) scale(${pose.ojos}) translate(${-o.c[0]} ${-o.c[1]})` : undefined}>
        <OjoSvg
          o={o}
          id={`${id}-o${i}`}
          cierre={i === derecho ? Math.max(pose.parpado, pose.guino) : pose.parpado}
          colorCabeza={colorCabeza}
          mirada={pose.mirada}
        />
        {pose.ojos > BRILLO_DESDE && o.abierto && (i === derecho ? Math.max(pose.parpado, pose.guino) : pose.parpado) < 0.3 && (
          <g opacity={Math.min(1, (pose.ojos - BRILLO_DESDE) / 0.12)}>
            {BRILLOS.map((b, k) => (
              <circle
                key={k}
                cx={o.c[0] + pose.mirada[0] * o.w * MIRADA + b.x * o.w}
                cy={o.c[1] + pose.mirada[1] * o.h * MIRADA + b.y * o.h}
                r={b.r * o.w}
                fill="#ffffff"
              />
            ))}
          </g>
        )}
        </g>
      ))}
      {r.boca && !vis && <Trazos trazos={r.boca.trazos} id={`${id}-b`} />}
      {r.boca && vis && (
        <g transform={`translate(${r.boca.c[0]} ${r.boca.c[1]}) scale(${escalaBoca})`}>
          <Trazos trazos={vis.trazos} id={`${id}-v`} />
        </g>
      )}
      {r.extras && <Trazos trazos={r.extras.trazos} id={`${id}-x`} />}
      {disfraz ? (
        <g transform={`translate(0 ${pose.disfrazY})`}>
          {disfraz.extras && <Trazos trazos={disfraz.extras.trazos} id={`${id}-dx`} />}
          {(disfraz.anteojos ?? r.anteojos) && <Trazos trazos={(disfraz.anteojos ?? r.anteojos)!.trazos} id={`${id}-da`} />}
          {(disfraz.tocado ?? r.tocado) && <Trazos trazos={(disfraz.tocado ?? r.tocado)!.trazos} id={`${id}-dt`} />}
        </g>
      ) : (
        <>
          {r.anteojos && <Trazos trazos={r.anteojos.trazos} id={`${id}-a`} />}
          {r.tocado && <Trazos trazos={r.tocado.trazos} id={`${id}-t`} />}
        </>
      )}
    </g>
  );
};

// ---------- Personaje ----------
export type PersonajeRigProps = {
  personaje: string;
  pose: Pose;
  piezasOcultas?: string[]; // para el editor
  rig?: Rig; // rig en edición (el editor del Studio); por defecto, el de la biblioteca
};

export const PersonajeRig: React.FC<PersonajeRigProps> = ({ personaje, pose, piezasOcultas, rig }) => {
  const uid = limpiarId(useId());
  const cargado = cargarPersonaje(personaje);
  const p = rig ? { ...cargado, rig } : cargado;
  const vista = p.rig.vistas[pose.vista] && p.piezas.vistas[pose.vista] ? pose.vista : Object.keys(p.rig.vistas)[0];
  const rv = p.rig.vistas[vista];
  const dv = p.piezas.vistas[vista];
  const mundo = matricesMundo(rv, pose);
  const deHueso = (h: string | undefined) => mundo[h ?? "raiz"] ?? mundo.raiz ?? IDENTIDAD;

  // Rostro: de frente, el de la expresión; en las otras vistas, el propio de la vista
  const rostro: Rostro | undefined =
    vista === "frente" ? p.piezas.rostros[pose.expresion] ?? p.piezas.rostros.base ?? dv.rostro : dv.rostro;
  const cabezaId = dv.cabeza?.id;
  const cabeza = dv.piezas.find((x) => x.id === cabezaId);
  const colorCabeza = cabeza?.trazos.find((t) => t.fill && (t.op ?? 1) > 0.9)?.fill ?? "#000000";
  const bocaBase = p.piezas.rostros.base?.boca;
  const escalaBoca =
    vista === "frente" || !rostro?.boca || !bocaBase
      ? 1
      : Math.min(1, Math.max(0.3, (BOCA_PERFIL * (rostro.boca.caja[2] - rostro.boca.caja[0])) / (bocaBase.caja[2] - bocaBase.caja[0])));

  type Capa = { z: number; nodo: React.ReactNode };
  const capas: Capa[] = [];
  const ocultas = new Set(piezasOcultas ?? []);
  dv.piezas.forEach((pz, i) => {
    if (ocultas.has(pz.id)) return;
    const z = pose.orden[pz.id] ?? rv.orden?.[pz.id] ?? pz.z;
    const m = deHueso(rv.piezas[pz.id]);
    const id = `${uid}-${i}`;
    capas.push({
      z,
      nodo: (
        <g key={pz.id} transform={matrizSvg(m)}>
          <PiezaSvg pieza={pz} id={id} />
          {pz.id === cabezaId && rostro && (
            <g transform={matrizSvg(multiplicar(invertir(m), deHueso(rv.rostro.hueso)))}>
              <RostroSvg
                r={rostro}
                pose={pose}
                visemas={p.piezas.visemas}
                escalaBoca={escalaBoca}
                colorCabeza={colorCabeza}
                id={`${id}-r`}
                disfraz={vista === "frente" && pose.disfraz ? p.piezas.rostros[pose.disfraz] : undefined}
              />
            </g>
          )}
        </g>
      ),
    });
  });
  // Accesorios
  Object.entries(pose.accesorios).forEach(([nombre, a], i) => {
    const dat = p.piezas.accesorios[nombre];
    if (!dat) return;
    const ax = (dat.caja[0] + dat.caja[2]) / 2;
    const ay = (dat.caja[1] + dat.caja[3]) / 2;
    let m = multiplicar(deHueso(a.hueso), trasladar(a.x, a.y));
    m = multiplicar(m, rotar(a.rot));
    m = multiplicar(m, escalar(a.escala, a.escala));
    m = multiplicar(m, trasladar(-ax, -ay));
    capas.push({
      z: a.z ?? (a.detras ? -1e6 : 1e6),
      nodo: (
        <g key={`acc-${nombre}`} transform={matrizSvg(m)}>
          <Trazos trazos={dat.trazos} id={`${uid}-a${i}`} />
        </g>
      ),
    });
  });
  capas.sort((a, b) => a.z - b.z);
  const sx = (pose.espejo ? -1 : 1) * pose.giro;
  return <g transform={sx !== 1 ? `scale(${sx} 1)` : undefined}>{capas.map((c) => c.nodo)}</g>;
};

// Inversa de una matriz afín (para dibujar el rostro con su hueso dentro del grupo de la cabeza)
export const invertir = (m: Matriz): Matriz => {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c || 1e-9;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
};

// Coloca el personaje en el cuadro: pies en (x, y), con escala (1 = puntos del .ai a px)
export const EnEscena: React.FC<{ x: number; y: number; escala: number; rot?: number; children: React.ReactNode }> = ({
  x,
  y,
  escala,
  rot = 0,
  children,
}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${escala})`}>{children}</g>;

// Caja aproximada del personaje en reposo (para encuadrar): unión de las cajas de las piezas de la vista
export const cajaVista = (personaje: string, vista = "frente") => {
  const p = cargarPersonaje(personaje);
  const v = p.piezas.vistas[vista] ?? Object.values(p.piezas.vistas)[0];
  return v.caja;
};
