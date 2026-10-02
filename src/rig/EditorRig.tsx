// Editor del rig en el Studio de Remotion: muestra el personaje con su esqueleto (pivotes, huesos y nombres de
// las piezas) y permite ajustar, desde el panel de props (controles zod), el pivote y el padre de cada hueso,
// qué hueso mueve cada pieza y su orden de capas. "Probar hueso" lo hace oscilar para ver si el pivote está bien.
// El botón "Guardar en rig.json" (solo en el Studio) escribe public/personajes/<nombre>/rig.json.
import { writeStaticFile } from "@remotion/studio";
import React, { useState } from "react";
import { AbsoluteFill, getRemotionEnvironment, useCurrentFrame } from "remotion";
import { z } from "zod";
import { combinar, matrizSvg, poseInicial } from "./pose";
import { cargarPersonaje } from "./personajes";
import { matricesMundo, PersonajeRig, pivotesMundo } from "./Rig";
import type { Rig } from "./tipos";

const OSCILA = 40; // frames de una oscilación del hueso de prueba
const FONDO = "#f4efe6";
const TINTA = "#3b2418";
const ACENTO = "#d0402b";

export const zEditorRig = z.object({
  personaje: z.string(),
  vista: z.string(),
  expresion: z.string().default("base"),
  huesos: z.array(z.object({ id: z.string(), padre: z.string().nullable(), x: z.number(), y: z.number() })),
  piezas: z.array(z.object({ pieza: z.string(), hueso: z.string(), z: z.number().nullable() })),
  mostrar: z.object({ esqueleto: z.boolean(), nombres: z.boolean(), piezas: z.boolean() }),
  probar: z.object({ hueso: z.string(), angulo: z.number().min(-180).max(180), oscilar: z.boolean() }),
});
export type EditorRigProps = z.infer<typeof zEditorRig>;

// Props por defecto del editor a partir del rig.json guardado
export const propsEditor = (personaje: string, vista: string): EditorRigProps => {
  const p = cargarPersonaje(personaje);
  const rv = p.rig.vistas[vista];
  return {
    personaje,
    vista,
    expresion: "base",
    huesos: rv.huesos.map((h) => ({ id: h.id, padre: h.padre, x: h.pivote[0], y: h.pivote[1] })),
    piezas: p.piezas.vistas[vista].piezas.map((pz) => ({ pieza: pz.id, hueso: rv.piezas[pz.id] ?? "raiz", z: rv.orden?.[pz.id] ?? null })),
    mostrar: { esqueleto: true, nombres: true, piezas: false },
    probar: { hueso: rv.huesos.find((h) => h.id === "cabeza")?.id ?? rv.huesos[0].id, angulo: 20, oscilar: true },
  };
};

// Rig completo con la vista editada
const rigEditado = (props: EditorRigProps): Rig => {
  const p = cargarPersonaje(props.personaje);
  const rig: Rig = JSON.parse(JSON.stringify(p.rig));
  const anterior = rig.vistas[props.vista];
  const orden = Object.fromEntries(props.piezas.filter((x) => x.z !== null).map((x) => [x.pieza, x.z as number]));
  rig.vistas[props.vista] = {
    ...anterior,
    huesos: props.huesos.map((h) => ({ id: h.id, padre: h.padre, pivote: [+h.x.toFixed(1), +h.y.toFixed(1)] })),
    piezas: Object.fromEntries(props.piezas.map((x) => [x.pieza, x.hueso])),
    ...(Object.keys(orden).length ? { orden } : {}),
  };
  if (!Object.keys(orden).length) delete rig.vistas[props.vista].orden;
  return rig;
};

export const EditorRig: React.FC<EditorRigProps> = (props) => {
  const f = useCurrentFrame();
  const [estado, setEstado] = useState("");
  const p = cargarPersonaje(props.personaje);
  const rig = rigEditado(props);
  const rv = rig.vistas[props.vista];
  const dv = p.piezas.vistas[props.vista];
  const angulo = props.probar.oscilar ? props.probar.angulo * Math.sin((f / OSCILA) * 2 * Math.PI) : props.probar.angulo;
  const pose = combinar(poseInicial(props.vista, props.expresion), { huesos: { [props.probar.hueso]: { rot: angulo } } });
  const mundo = matricesMundo(rv, pose);
  const pivotes = pivotesMundo(rv, mundo);
  const porId = Object.fromEntries(pivotes.map((x) => [x.id, x.p]));
  // Encuadre: la caja de la vista con margen, centrada en un cuadro de 1080 × 1080 (arriba deja lugar al título)
  const c = dv.caja;
  const esc = Math.min(860 / (c[2] - c[0]), 860 / (c[3] - c[1]));
  const ox = 540 - ((c[0] + c[2]) / 2) * esc;
  const oy = 580 - ((c[1] + c[3]) / 2) * esc;
  const r = 5 / esc;
  const enStudio = getRemotionEnvironment().isStudio;

  const guardar = async () => {
    try {
      await writeStaticFile({ filePath: `personajes/${props.personaje}/rig.json`, contents: JSON.stringify(rig, null, 1) + "\n" });
      setEstado("Guardado en public/personajes/" + props.personaje + "/rig.json");
    } catch (e) {
      setEstado("No se pudo guardar: " + (e as Error).message);
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: FONDO, fontFamily: "Arial, sans-serif", color: TINTA }}>
      <div style={{ position: "absolute", left: 40, top: 28, fontSize: 30, fontWeight: 700 }}>
        Rig · {props.personaje} · {props.vista}
      </div>
      <div style={{ position: "absolute", left: 40, top: 70, fontSize: 20 }}>
        Probando «{props.probar.hueso}» ({angulo.toFixed(0)}°) · ajustá pivotes y piezas en el panel de props
      </div>
      <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`translate(${ox} ${oy}) scale(${esc})`}>
          {/* Piso y origen */}
          <line x1={c[0] - 20} y1={0} x2={c[2] + 20} y2={0} stroke="#bfb3a3" strokeWidth={1 / esc} strokeDasharray={`${6 / esc} ${4 / esc}`} />
          <PersonajeRig personaje={props.personaje} pose={pose} rig={rig} />
          {props.mostrar.piezas &&
            dv.piezas.map((pz) => {
              const m = mundo[rv.piezas[pz.id] ?? "raiz"];
              return (
                <g key={pz.id} transform={m ? matrizSvg(m) : undefined}>
                  <rect x={pz.caja[0]} y={pz.caja[1]} width={pz.caja[2] - pz.caja[0]} height={pz.caja[3] - pz.caja[1]} fill="none" stroke="#2a7ab0" strokeWidth={1 / esc} />
                  <text x={pz.caja[0] + 2 / esc} y={pz.caja[1] + 12 / esc} fontSize={11 / esc} fill="#2a7ab0">
                    {pz.id}
                  </text>
                </g>
              );
            })}
          {props.mostrar.esqueleto &&
            pivotes.map((h) => {
              const padre = h.padre ? porId[h.padre] : null;
              const activo = h.id === props.probar.hueso;
              return (
                <g key={h.id}>
                  {padre && <line x1={padre[0]} y1={padre[1]} x2={h.p[0]} y2={h.p[1]} stroke={TINTA} strokeWidth={2 / esc} opacity={0.6} />}
                  <circle cx={h.p[0]} cy={h.p[1]} r={(activo ? 1.6 : 1) * r} fill={activo ? ACENTO : "#ffffff"} stroke={TINTA} strokeWidth={1.5 / esc} />
                  {props.mostrar.nombres && (
                    <text x={h.p[0] + 7 / esc} y={h.p[1] - 6 / esc} fontSize={13 / esc} fill={activo ? ACENTO : TINTA} fontWeight={activo ? 700 : 400}>
                      {h.id}
                    </text>
                  )}
                </g>
              );
            })}
        </g>
      </svg>
      {enStudio && (
        <div style={{ position: "absolute", right: 40, top: 28, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={guardar}
            style={{ fontSize: 22, padding: "10px 18px", borderRadius: 10, border: "none", background: ACENTO, color: "#fff", cursor: "pointer" }}
          >
            Guardar en rig.json
          </button>
          <div style={{ fontSize: 16, maxWidth: 420, textAlign: "right" }}>{estado}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
