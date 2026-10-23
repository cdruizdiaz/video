// Cajas que ocupa un personaje en una pose (coordenadas del personaje: origen en el piso entre los pies, y hacia
// abajo): todo el cuerpo y aparte la cabeza (con pelo, gorro y accesorios de la cara). Sirven para que los carteles,
// globos y subtítulos no pisen a los personajes (src/plantillas/comunes/zonaSegura.ts).
import { cargarPersonaje } from "./personajes";
import { aplicar, IDENTIDAD, matricesMundo, type Matriz, type Pose } from "./pose";
import type { Trazo } from "./tipos";

export type Caja = { x0: number; y0: number; x1: number; y1: number };

const VACIA: Caja = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };

const unir = (a: Caja, b: Caja): Caja => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });

// Caja [x0, y0, x1, y1] transformada por una matriz (las 4 esquinas)
const transformar = (m: Matriz, c: number[]): Caja =>
  [
    [c[0], c[1]],
    [c[2], c[1]],
    [c[0], c[3]],
    [c[2], c[3]],
  ]
    .map(([x, y]) => aplicar(m, x, y))
    .reduce((acc, [x, y]) => unir(acc, { x0: x, y0: y, x1: x, y1: y }), VACIA);

// Caja de los trazos de imagen (los vectoriales usan la caja de la pieza)
const cajaTrazos = (trazos: Trazo[]): number[] | null => {
  const imgs = trazos.filter((t) => t.img && t.w && t.h);
  if (!imgs.length) return null;
  return [Math.min(...imgs.map((t) => t.x!)), Math.min(...imgs.map((t) => t.y!)), Math.max(...imgs.map((t) => t.x! + t.w!)), Math.max(...imgs.map((t) => t.y! + t.h!))];
};

export const cajasEnPose = (personaje: string, pose: Pose): { cuerpo: Caja; cabeza: Caja } => {
  const p = cargarPersonaje(personaje);
  const vista = p.rig.vistas[pose.vista] && p.piezas.vistas[pose.vista] ? pose.vista : Object.keys(p.rig.vistas)[0];
  const rv = p.rig.vistas[vista];
  const dv = p.piezas.vistas[vista];
  const mundo = matricesMundo(rv, pose);
  const deHueso = (h: string | undefined) => mundo[h ?? "raiz"] ?? mundo.raiz ?? IDENTIDAD;
  let cuerpo = VACIA;
  for (const pz of dv.piezas) {
    const v = pose.variantes[pz.id];
    const caja = (v && dv.variantes?.[`${pz.id}:${v}`]?.caja) || pz.caja;
    cuerpo = unir(cuerpo, transformar(deHueso(rv.piezas[pz.id]), caja));
  }
  // Cabeza: su pieza y la imagen de la cara (cabeza con pelo y gorro, en los personajes de PNG)
  const rostro = p.piezas.rostros[pose.expresion] ?? p.piezas.rostros.base ?? dv.rostro;
  const mCab = deHueso(rv.rostro.hueso);
  let cabeza = dv.cabeza ? transformar(deHueso(rv.piezas[dv.cabeza.id]), dv.cabeza.caja) : VACIA;
  const cr = rostro?.extras ? cajaTrazos(rostro.extras.trazos) : null;
  if (cr) cabeza = unir(cabeza, transformar(mCab, cr));
  if (cr || dv.cabeza) cuerpo = unir(cuerpo, cabeza);
  // Espejo y giro de vista: escala en x alrededor del origen
  const sx = (pose.espejo ? -1 : 1) * pose.giro;
  const voltear = (c: Caja): Caja => (sx === 1 ? c : { x0: Math.min(c.x0 * sx, c.x1 * sx), x1: Math.max(c.x0 * sx, c.x1 * sx), y0: c.y0, y1: c.y1 });
  return { cuerpo: voltear(cuerpo), cabeza: voltear(cabeza) };
};

// En el cuadro: pies en (x, y), escala
export const cajaEnCuadro = (c: Caja, x: number, y: number, escala: number): Caja => ({
  x0: x + c.x0 * escala,
  y0: y + c.y0 * escala,
  x1: x + c.x1 * escala,
  y1: y + c.y1 * escala,
});
