// Pose del personaje y cómo se combinan las capas de animación.
// Cada animación devuelve una pose parcial; combinar() las suma: rotaciones y desplazamientos se suman,
// escalas se multiplican, parpadeo y guiño toman el máximo, y lo discreto (vista, expresión, boca) gana la última.
// Las claves de huesos aceptan comodines: "petalo_*", "mano_*", "*".
import type { AccesorioPose, Mov, VistaRig } from "./tipos";

export type Pose = {
  vista: string; // frente | perfil | espalda (las que tenga el personaje)
  espejo: boolean; // mirar hacia el otro lado (el perfil hacia la izquierda)
  huesos: Record<string, Mov>;
  expresion: string; // rostro de piezas.json (normal, feliz, bruja…)
  parpado: number; // 0 abiertos … 1 cerrados (los dos ojos)
  guino: number; // 0 … 1, solo el ojo de la derecha de la pantalla
  visema: string | null; // boca para hablar (A–F); null = la boca de la expresión
  accesorios: Record<string, AccesorioPose>;
  orden: Record<string, number>; // cambios de orden de capas (pieza → z)
  giro: number; // ancho del personaje (1 normal; < 1 mientras gira de vista)
  disfraz: string | null; // rostro del que se toman gorro/tocado, anteojos y extras, sobre la expresión actual
  disfrazY: number; // corrimiento vertical del disfraz (puntos; + = hacia abajo, p. ej. gorro que tapa los ojos)
  mirada: [number, number]; // hacia dónde miran las pupilas (-1…1 en x e y; 0, 0 = al frente)
  ojos: number; // tamaño de los ojos (1 normal; 1,3 = "ojos de cachorro")
  yaw: number; // giro 2,5D hacia un costado (-1 izquierda … 0 frente … 1 derecha): parallax por profundidad de pieza
};

export type PoseParcial = Partial<Omit<Pose, "huesos" | "accesorios" | "orden" | "mirada">> & {
  mirada?: [number, number]; // se suma a la de las otras capas
  huesos?: Record<string, Mov>;
  accesorios?: Record<string, AccesorioPose | null>; // null = quitarlo
  orden?: Record<string, number>;
};

export const poseInicial = (vista = "frente", expresion = "base"): Pose => ({
  vista,
  espejo: false,
  huesos: {},
  expresion,
  parpado: 0,
  guino: 0,
  visema: null,
  accesorios: {},
  orden: {},
  giro: 1,
  disfraz: null,
  disfrazY: 0,
  mirada: [0, 0],
  ojos: 1,
  yaw: 0,
});

export const sumarMov = (a: Mov | undefined, b: Mov): Mov => ({
  rot: (a?.rot ?? 0) + (b.rot ?? 0),
  x: (a?.x ?? 0) + (b.x ?? 0),
  y: (a?.y ?? 0) + (b.y ?? 0),
  sx: (a?.sx ?? 1) * (b.sx ?? 1),
  sy: (a?.sy ?? 1) * (b.sy ?? 1),
});

// Mezcla lineal de dos movimientos (t = 0 → a, 1 → b)
export const mezclarMov = (a: Mov | undefined, b: Mov | undefined, t: number): Mov => {
  const v = (k: keyof Mov, base: number) => (a?.[k] ?? base) + ((b?.[k] ?? base) - (a?.[k] ?? base)) * t;
  return { rot: v("rot", 0), x: v("x", 0), y: v("y", 0), sx: v("sx", 1), sy: v("sy", 1) };
};

export const combinar = (base: Pose, ...capas: (PoseParcial | null | undefined | false)[]): Pose => {
  const p: Pose = { ...base, huesos: { ...base.huesos }, accesorios: { ...base.accesorios }, orden: { ...base.orden } };
  for (const c of capas) {
    if (!c) continue;
    if (c.vista !== undefined) p.vista = c.vista;
    if (c.espejo !== undefined) p.espejo = c.espejo;
    if (c.expresion !== undefined) p.expresion = c.expresion;
    if (c.visema !== undefined) p.visema = c.visema;
    if (c.parpado !== undefined) p.parpado = Math.max(p.parpado, c.parpado);
    if (c.guino !== undefined) p.guino = Math.max(p.guino, c.guino);
    if (c.giro !== undefined) p.giro *= c.giro;
    if (c.disfraz !== undefined) p.disfraz = c.disfraz;
    if (c.disfrazY !== undefined) p.disfrazY += c.disfrazY;
    if (c.mirada) p.mirada = [p.mirada[0] + c.mirada[0], p.mirada[1] + c.mirada[1]];
    if (c.ojos !== undefined) p.ojos *= c.ojos;
    if (c.yaw !== undefined) p.yaw += c.yaw;
    for (const [k, m] of Object.entries(c.huesos ?? {})) p.huesos[k] = sumarMov(p.huesos[k], m);
    for (const [k, a] of Object.entries(c.accesorios ?? {})) {
      if (a === null) delete p.accesorios[k];
      else p.accesorios[k] = a;
    }
    Object.assign(p.orden, c.orden ?? {});
  }
  return p;
};

// Movimiento final de un hueso: suma de las claves que lo nombran (exacta o con comodín)
const cacheRegex = new Map<string, RegExp>();
const coincide = (patron: string, id: string) => {
  if (!patron.includes("*")) return patron === id;
  let r = cacheRegex.get(patron);
  if (!r) {
    r = new RegExp("^" + patron.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    cacheRegex.set(patron, r);
  }
  return r.test(id);
};

export const movDe = (pose: Pose, id: string): Mov => {
  let m: Mov = {};
  for (const [k, v] of Object.entries(pose.huesos)) {
    if (k === id || (k.includes("*") && coincide(k, id))) m = sumarMov(m, v);
  }
  return m;
};

// ---------- Matrices 2D [a, b, c, d, e, f] (como SVG matrix()) ----------
export type Matriz = [number, number, number, number, number, number];
export const IDENTIDAD: Matriz = [1, 0, 0, 1, 0, 0];

export const multiplicar = (m: Matriz, n: Matriz): Matriz => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

export const trasladar = (x: number, y: number): Matriz => [1, 0, 0, 1, x, y];
export const rotar = (grados: number): Matriz => {
  const r = (grados * Math.PI) / 180;
  return [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
};
export const escalar = (sx: number, sy: number): Matriz => [sx, 0, 0, sy, 0, 0];

export const aplicar = (m: Matriz, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export const matrizSvg = (m: Matriz) => `matrix(${m.map((v) => +v.toFixed(5)).join(" ")})`;

// Transformación local de un hueso: alrededor de su pivote (rota y escala), más su desplazamiento
export const matrizHueso = (pivote: number[], mov: Mov): Matriz => {
  const [px, py] = pivote;
  let m = trasladar(px + (mov.x ?? 0), py + (mov.y ?? 0));
  m = multiplicar(m, rotar(mov.rot ?? 0));
  m = multiplicar(m, escalar(mov.sx ?? 1, mov.sy ?? 1));
  return multiplicar(m, trasladar(-px, -py));
};

// ---------- Huesos ----------
// Matriz de mundo (coordenadas del personaje) de cada hueso de la vista, según la pose
export const matricesMundo = (rv: VistaRig, pose: Pose): Record<string, Matriz> => {
  const porId = new Map(rv.huesos.map((h) => [h.id, h]));
  const salida: Record<string, Matriz> = {};
  const calcular = (id: string, pila: string[] = []): Matriz => {
    if (salida[id]) return salida[id];
    const h = porId.get(id);
    if (!h || pila.includes(id)) return IDENTIDAD;
    const padre = h.padre && porId.has(h.padre) ? calcular(h.padre, [...pila, id]) : IDENTIDAD;
    const m = multiplicar(padre, matrizHueso(h.pivote, movDe(pose, id)));
    salida[id] = m;
    return m;
  };
  for (const h of rv.huesos) calcular(h.id);
  return salida;
};

// Pivotes en coordenadas del personaje (después de mover los padres): para el esqueleto del editor
export const pivotesMundo = (rv: VistaRig, mundo: Record<string, Matriz>) =>
  rv.huesos.map((h) => {
    const padre = h.padre ? mundo[h.padre] ?? IDENTIDAD : IDENTIDAD;
    return { id: h.id, padre: h.padre, p: aplicar(padre, h.pivote[0], h.pivote[1]) };
  });

