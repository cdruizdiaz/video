// Cálculos puros de la plantilla PersonajeRig (sin React): esquema de props, pose en cada frame, posición en el
// cuadro y caja que ocupa el personaje en toda la animación (para recortar el lienzo al exportar con transparencia).
import { z } from "zod";
import * as A from "../../rig/animaciones";
import { hablar, type TramoVisema, visemas, visemasRhubarb } from "../../rig/lipsync";
import { aplicar, combinar, matricesMundo, poseInicial, type Pose, type PoseParcial } from "../../rig/pose";
import { cargarPersonaje } from "../../rig/personajes";
import { poseSecuencia, zPoseClave, zSecuencia } from "../../rig/secuencia";
import { escalar, multiplicar, rotar, trasladar } from "../../rig/pose";
import { type Punto, type Tramo, tramosRapidos, zDesenfoque } from "../comunes/tramosDesenfoque";

// ---------- Esquema de props (zod: lo valida Remotion y se edita en el Studio) ----------
const tiempo = { inicio: z.number().default(0), fin: z.number().optional(), pasos: z.number().int().min(1).optional() };
const zToken = z.object({ text: z.string(), fromMs: z.number(), toMs: z.number() });

export const zPista = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("respirar"), ...tiempo, velocidad: z.number().optional(), intensidad: z.number().optional() }),
  z.object({ tipo: z.literal("parpadear"), ...tiempo, cada: z.number().optional(), semilla: z.number().optional() }),
  z.object({ tipo: z.literal("expresion"), ...tiempo, nombre: z.string() }),
  z.object({ tipo: z.literal("saludar"), ...tiempo, duracion: z.number(), mano: z.string().optional(), veces: z.number().optional(), intensidad: z.number().optional() }),
  z.object({ tipo: z.literal("saltar"), ...tiempo, duracion: z.number().optional(), altura: z.number().optional(), intensidad: z.number().optional() }),
  z.object({ tipo: z.literal("caminar"), ...tiempo, velocidad: z.number().optional(), intensidad: z.number().optional() }),
  z.object({ tipo: z.literal("correr"), ...tiempo, velocidad: z.number().optional(), intensidad: z.number().optional() }),
  z.object({
    tipo: z.literal("girar"),
    ...tiempo,
    de: z.string(),
    a: z.string(),
    duracion: z.number().optional(),
    espejoDe: z.boolean().optional(),
    espejoA: z.boolean().optional(),
  }),
  z.object({ tipo: z.literal("temblor"), ...tiempo, intensidad: z.number().optional(), cada: z.number().optional(), semilla: z.number().optional() }),
  z.object({ tipo: z.literal("vaiven"), ...tiempo, amplitud: z.number().optional(), periodo: z.number().optional(), inclina: z.number().optional() }),
  z.object({ tipo: z.literal("mirar"), ...tiempo, angulo: z.number(), duracion: z.number(), entrada: z.number().optional() }),
  z.object({ tipo: z.literal("pose"), ...tiempo, pose: zPoseClave }),
  z.object({ tipo: z.literal("disfraz"), ...tiempo, nombre: z.string().nullable(), y: z.number().default(0) }),
  z.object({
    tipo: z.literal("yaw"),
    ...tiempo,
    valor: z.number(), // giro 2,5D: -1 (hacia la izquierda de la pantalla) … 1 (derecha)
    duracion: z.number().optional(), // si se da, vuelve al frente al final
    entrada: z.number().default(8),
  }),
  z.object({
    tipo: z.literal("ojos"),
    ...tiempo,
    escala: z.number(), // 1,3 = ojos de cachorro
    duracion: z.number().optional(), // si se da, vuelven a su tamaño al final
    entrada: z.number().default(5),
  }),
  z.object({
    tipo: z.literal("mirada"),
    ...tiempo,
    x: z.number(), // -1…1: izquierda…derecha de la pantalla
    y: z.number(), // -1…1: arriba…abajo
    duracion: z.number().optional(), // si se da, vuelve al frente al final
    entrada: z.number().default(5),
  }),
  z.object({
    tipo: z.literal("secuencia"),
    ...tiempo,
    secuencia: zSecuencia,
    duracion: z.number().positive(), // frames de una pasada
    veces: z.number().optional(), // pasadas (por defecto: se repite hasta el fin de la pista)
  }),
  z.object({
    tipo: z.literal("hablar"),
    ...tiempo,
    // Una de las dos: transcripción de Whisper (reglas por letras) o bocas de Rhubarb (desde el sonido, preferida)
    transcripcion: z.object({ tokens: z.array(zToken) }).optional(),
    rhubarb: z.object({ mouthCues: z.array(z.object({ start: z.number(), end: z.number(), value: z.string() })) }).optional(),
    idioma: z.enum(["es", "en"]).default("es"),
    intensidad: z.number().optional(),
  }),
  z.object({
    tipo: z.literal("trayecto"),
    ...tiempo,
    de: z.array(z.number()).length(2), // px del cuadro (pies del personaje)
    a: z.array(z.number()).length(2),
    duracion: z.number().positive(),
    suave: z.boolean().default(true),
    arco: z.number().default(0), // px hacia arriba en la mitad del recorrido
  }),
]);
export type Pista = z.infer<typeof zPista>;

export const zPersonajeRig = z.object({
  personaje: z.string(),
  vista: z.string().default("frente"),
  expresion: z.string().default("base"),
  espejo: z.boolean().default(false),
  x: z.number(), // pies del personaje en el cuadro (px)
  y: z.number(),
  escala: z.number().default(1), // 1 = un punto del .ai por px
  rot: z.number().default(0),
  pasos: z.number().int().min(1).default(1), // 2 = cambia de pose cada 2 frames (look de recorte)
  fondo: z.string().nullable().default(null), // null = transparente
  sombra: z.boolean().default(false), // sombra en el piso
  luz: z.object({ angulo: z.number(), intensidad: z.number(), sombra: z.string().optional() }).nullable().default(null), // volumen 2,5D
  audio: z.object({ archivo: z.string(), desde: z.number().default(0), volumen: z.number().default(1) }).nullable().default(null),
  // Efectos de sonido automáticos (src/rig/sonidos.ts): saltos, cambios de cara/disfraz, giros. Número = volumen.
  sonidos: z.union([z.boolean(), z.number()]).default(false),
  // Anclado a la escena con cámara en mano (scripts/seguimiento.py): el personaje sigue al punto seguido.
  // factor = px de la composición por px del video; desde = frame de la composición donde empieza el tramo seguido.
  seguimiento: z
    .object({
      puntos: z.array(z.array(z.number())),
      escala: z.array(z.number()).optional(),
      rot: z.array(z.number()).optional(),
      factor: z.number().default(1),
      desde: z.number().default(0),
    })
    .nullable()
    .default(null),
  // Desenfoque de movimiento (src/plantillas/comunes/Desenfoque.tsx) solo sobre el personaje: true = tramos
  // automáticos donde se mueve rápido (saltar, correr, trayecto, girar); o con modo, muestras, tramos, umbral
  desenfoque: zDesenfoque,
  pistas: z.array(zPista),
});
export type PersonajeRigProps = z.input<typeof zPersonajeRig>;
type Props = z.output<typeof zPersonajeRig>;

// zod y los visemas se calculan una sola vez por objeto de props / transcripción
const cacheProps = new WeakMap<object, Props>();
const parsear = (e: PersonajeRigProps): Props => {
  let p = cacheProps.get(e);
  if (!p) {
    p = zPersonajeRig.parse(e);
    cacheProps.set(e, p);
  }
  return p;
};
const cacheVisemas = new WeakMap<object, TramoVisema[]>();
const visemasDe = (p: Extract<Pista, { tipo: "hablar" }>, fps: number): TramoVisema[] => {
  const fuente = p.rhubarb ?? p.transcripcion;
  if (!fuente) return [];
  let v = cacheVisemas.get(fuente);
  if (!v) {
    v = p.rhubarb ? visemasRhubarb(p.rhubarb, { fps }) : visemas(p.transcripcion!, { fps, idioma: p.idioma });
    cacheVisemas.set(fuente, v);
  }
  return v;
};

const activa = (p: { inicio: number; fin?: number }, f: number) => f >= p.inicio && (p.fin === undefined || f < p.fin);

// ---------- Pose en un frame ----------
export const poseEn = (entrada: PersonajeRigProps, f0: number, fps: number): Pose => {
  const props = parsear(entrada);
  const per = cargarPersonaje(props.personaje);
  const base = { ...poseInicial(props.vista, props.expresion), espejo: props.espejo };
  // La vista puede cambiar con un giro o una pose: primero se resuelve la vista y después el resto
  const capas: PoseParcial[] = [];
  let pose = base;
  for (const p of props.pistas) {
    const pasos = p.pasos ?? props.pasos;
    // Con pasos 1 el cuadro puede traer decimales (muestras del desenfoque de movimiento): la pose se interpola
    const f = pasos === 1 ? f0 : Math.floor(f0 / pasos) * pasos;
    if (!activa(p, f)) continue;
    const local = f - p.inicio;
    const rv = per.rig.vistas[pose.vista] ?? Object.values(per.rig.vistas)[0];
    const ctx = { rv, fps };
    let c: PoseParcial | null = null;
    switch (p.tipo) {
      case "respirar":
        c = A.respirar(local, ctx, p);
        break;
      case "parpadear":
        c = A.parpadear(local, ctx, p);
        break;
      case "expresion":
        c = A.expresion(local, ctx, p);
        break;
      case "saludar":
        c = local < p.duracion ? A.saludar(local, ctx, p) : null;
        break;
      case "saltar":
        c = local < (p.duracion ?? 26) ? A.saltar(local, ctx, p) : null;
        break;
      case "caminar":
        c = A.caminar(local, ctx, p);
        break;
      case "correr":
        c = A.correr(local, ctx, p);
        break;
      case "girar":
        c = A.girar(local, ctx, { desde: p.de, hacia: p.a, duracion: p.duracion, espejoDesde: p.espejoDe, espejoHacia: p.espejoA });
        break;
      case "temblor":
        c = A.temblor(local, ctx, p);
        break;
      case "vaiven":
        c = A.vaiven(local, ctx, p);
        break;
      case "mirar":
        c = local < p.duracion ? A.mirar(local, ctx, p) : null;
        break;
      case "disfraz":
        c = { disfraz: p.nombre, disfrazY: p.y };
        break;
      case "yaw": {
        const e = Math.max(1, p.entrada);
        const lineal = p.duracion === undefined ? Math.min(1, local / e) : Math.max(0, Math.min(1, local / e, (p.duracion - local) / e));
        const t = lineal * lineal * (3 - 2 * lineal); // suave (ease in-out)
        c = local < (p.duracion ?? Infinity) ? { yaw: p.valor * t } : null;
        break;
      }
      case "ojos": {
        const e = Math.max(1, p.entrada);
        const t = p.duracion === undefined ? Math.min(1, local / e) : Math.max(0, Math.min(1, local / e, (p.duracion - local) / e));
        // Con un pequeño rebote al agrandarse (spring casero: se pasa un 12 % y vuelve)
        const reb = t < 1 ? t : 1;
        const sobre = p.duracion === undefined || local < p.duracion - e ? Math.sin(Math.min(1, local / (e * 2)) * Math.PI) * 0.12 : 0;
        c = local < (p.duracion ?? Infinity) ? { ojos: 1 + (p.escala - 1) * (reb + sobre) } : null;
        break;
      }
      case "mirada": {
        const e = Math.max(1, p.entrada);
        const t =
          p.duracion === undefined
            ? Math.min(1, local / e)
            : Math.max(0, Math.min(1, local / e, (p.duracion - local) / e));
        c = local < (p.duracion ?? Infinity) ? { mirada: [p.x * t, p.y * t] } : null;
        break;
      }
      case "pose":
        c = poseSecuencia({ nombre: "pose", ciclo: false, interpolacion: "paso", poses: [p.pose] }, 0);
        break;
      case "secuencia": {
        const pasada = local / p.duracion;
        c = p.veces !== undefined && pasada >= p.veces ? poseSecuencia(p.secuencia, p.secuencia.ciclo ? 0 : 1) : poseSecuencia(p.secuencia, pasada);
        break;
      }
      case "hablar":
        c = hablar(local, visemasDe(p, fps), p);
        break;
      default:
        c = null;
    }
    if (c) {
      capas.push(c);
      pose = combinar(pose, c);
    }
  }
  return pose;
};

// ---------- Lugar en el cuadro ----------
export const lugarEn = (entrada: PersonajeRigProps, f: number) => {
  const props = parsear(entrada);
  const tray = props.pistas.filter((p): p is Extract<Pista, { tipo: "trayecto" }> => p.tipo === "trayecto");
  let x = props.x;
  let y = props.y;
  if (tray.length) {
    const empezados = tray.filter((t) => f >= t.inicio);
    const t = empezados.length ? empezados[empezados.length - 1] : tray[0];
    const u = Math.min(1, Math.max(0, (f - t.inicio) / t.duracion));
    const s = t.suave ? u * u * (3 - 2 * u) : u;
    x = t.de[0] + (t.a[0] - t.de[0]) * s;
    y = t.de[1] + (t.a[1] - t.de[1]) * s - t.arco * 4 * s * (1 - s);
  }
  let escala = props.escala;
  let rot = props.rot;
  const seg = props.seguimiento;
  if (seg && seg.puntos.length) {
    // Lo que se movió el punto seguido desde el primer cuadro (la cámara se corrió, se acercó o giró)
    const k = Math.min(seg.puntos.length - 1, Math.max(0, Math.round(f - seg.desde)));
    x += (seg.puntos[k][0] - seg.puntos[0][0]) * seg.factor;
    y += (seg.puntos[k][1] - seg.puntos[0][1]) * seg.factor;
    if (seg.escala) escala *= seg.escala[k] / seg.escala[0];
    if (seg.rot) rot += seg.rot[k] - seg.rot[0];
  }
  return { x, y, escala, rot };
};

export const duracionPistas = (props: PersonajeRigProps, minimo = 30) =>
  Math.max(
    minimo,
    ...props.pistas.map((p) =>
      p.fin ?? (p.inicio ?? 0) + ("duracion" in p && typeof p.duracion === "number" ? p.duracion * ("veces" in p && p.veces ? p.veces : 1) : 0),
    ),
  );

// ---------- Caja ocupada (para recortar el lienzo) ----------
// Recorre los frames y transforma las cajas de las piezas y accesorios con las matrices de cada pose.
export const medirCaja = (props: PersonajeRigProps, duracion: number, fps: number, cada = 1) => {
  const per = cargarPersonaje(props.personaje);
  let caja = [Infinity, Infinity, -Infinity, -Infinity];
  const sumar = (m: number[], c: number[]) => {
    for (const [px, py] of [
      [c[0], c[1]],
      [c[2], c[1]],
      [c[0], c[3]],
      [c[2], c[3]],
    ]) {
      const [x, y] = aplicar(m as never, px, py);
      caja = [Math.min(caja[0], x), Math.min(caja[1], y), Math.max(caja[2], x), Math.max(caja[3], y)];
    }
  };
  for (let f = 0; f < duracion; f += cada) {
    const pose = poseEn(props, f, fps);
    const vista = per.rig.vistas[pose.vista] ? pose.vista : Object.keys(per.rig.vistas)[0];
    const rv = per.rig.vistas[vista];
    const dv = per.piezas.vistas[vista];
    const mundo = matricesMundo(rv, pose);
    const lugar = lugarEn(props, f);
    let escena = multiplicar(trasladar(lugar.x, lugar.y), rotar(lugar.rot));
    escena = multiplicar(escena, escalar(lugar.escala, lugar.escala));
    escena = multiplicar(escena, escalar((pose.espejo ? -1 : 1) * pose.giro, 1));
    for (const pz of dv.piezas) sumar(multiplicar(escena, mundo[rv.piezas[pz.id] ?? "raiz"] ?? mundo.raiz), pz.caja);
    for (const [n, a] of Object.entries(pose.accesorios)) {
      const dat = per.piezas.accesorios[n];
      if (!dat) continue;
      const ax = (dat.caja[0] + dat.caja[2]) / 2;
      const ay = (dat.caja[1] + dat.caja[3]) / 2;
      let m = multiplicar(escena, mundo[a.hueso] ?? mundo.raiz);
      m = multiplicar(m, trasladar(a.x, a.y));
      m = multiplicar(m, rotar(a.rot));
      m = multiplicar(m, escalar(a.escala, a.escala));
      m = multiplicar(m, trasladar(-ax, -ay));
      sumar(m, dat.caja);
    }
  }
  return caja;
};

// Lienzo recortado al personaje: ancho y alto (pares, para ProRes) y cuánto correr el personaje para que entre
// (dx, dy se suman a x, y de las props; con trayecto, se corre todo el recorrido)
export const encuadreRecortado = (props: PersonajeRigProps, duracion: number, fps: number, margen = 24) => {
  const c = medirCaja(props, duracion, fps, 2);
  const par = (v: number) => Math.ceil(v / 2) * 2;
  const width = par(c[2] - c[0] + 2 * margen);
  const height = par(c[3] - c[1] + 2 * margen);
  return { width, height, dx: Math.round(margen - c[0]), dy: Math.round(margen - c[1]) };
};

// ---------- Puntos del personaje (para enganchar globos, destellos…) ----------
// Posición de la boca, el centro de los ojos o la cabeza en coordenadas del personaje (puntos del .ai, origen en
// los pies), con la pose del frame. Para pasarla al cuadro: x = lugar.x + px · escala, y = lugar.y + py · escala.
export const puntoPersonaje = (entrada: PersonajeRigProps, f: number, fps: number, punto: "boca" | "ojos" | "cabeza"): [number, number] =>
  puntoEnPose(entrada.personaje, poseEn(entrada, f, fps), punto);

const puntoEnPose = (personaje: string, pose: Pose, punto: "boca" | "ojos" | "cabeza"): [number, number] => {
  const per = cargarPersonaje(personaje);
  const vista = per.rig.vistas[pose.vista] ? pose.vista : Object.keys(per.rig.vistas)[0];
  const rv = per.rig.vistas[vista];
  const dv = per.piezas.vistas[vista];
  const mundo = matricesMundo(rv, pose);
  const rostro = vista === "frente" ? per.piezas.rostros[pose.expresion] ?? per.piezas.rostros.base ?? dv.rostro : dv.rostro;
  let local: [number, number];
  let hueso = rv.rostro.hueso;
  if (punto === "boca" && rostro?.boca) local = [rostro.boca.c[0], rostro.boca.c[1]];
  else if (punto === "ojos" && rostro?.ojos.length)
    local = [rostro.ojos.reduce((a, o) => a + o.c[0], 0) / rostro.ojos.length, rostro.ojos.reduce((a, o) => a + o.c[1], 0) / rostro.ojos.length];
  else {
    const c = dv.cabeza?.caja ?? dv.caja;
    local = [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];
    hueso = dv.cabeza ? rv.piezas[dv.cabeza.id] ?? hueso : "raiz";
  }
  const [x, y] = aplicar(mundo[hueso] ?? mundo.raiz, local[0], local[1]);
  return [x * (pose.espejo ? -1 : 1) * pose.giro, y];
};

// ---------- Tramos del desenfoque de movimiento ----------
// Puntos que se siguen en cada cuadro (px del cuadro): pies, cabeza y un borde del cuerpo (que en un giro de vista
// se cierra y se vuelve a abrir aunque el personaje no se corra de lugar)
const cacheTramos = new WeakMap<object, Map<string, Tramo[]>>();
export const tramosDelRig = (entrada: PersonajeRigProps, duracion: number, fps: number, umbral?: number): Tramo[] => {
  const clave = `${duracion}|${fps}|${umbral ?? ""}`;
  let porClave = cacheTramos.get(entrada);
  const guardado = porClave?.get(clave);
  if (guardado) return guardado;
  const per = cargarPersonaje(entrada.personaje);
  const posiciones: Punto[][] = [];
  for (let f = 0; f < duracion; f++) {
    const pose = poseEn(entrada, f, fps);
    const l = lugarEn(entrada, f);
    const vista = per.rig.vistas[pose.vista] ? pose.vista : Object.keys(per.rig.vistas)[0];
    const caja = per.piezas.vistas[vista].caja;
    const raiz = { x: pose.huesos.raiz?.x ?? 0, y: pose.huesos.raiz?.y ?? 0 };
    const cab = puntoEnPose(entrada.personaje, pose, "cabeza");
    const borde = caja[2] * (pose.espejo ? -1 : 1) * pose.giro;
    posiciones.push([
      [l.x + raiz.x * l.escala, l.y + raiz.y * l.escala],
      [l.x + cab[0] * l.escala, l.y + cab[1] * l.escala],
      [l.x + (raiz.x + borde) * l.escala, l.y + raiz.y * l.escala],
    ]);
  }
  const tramos = tramosRapidos(posiciones, { umbral });
  if (!porClave) {
    porClave = new Map();
    cacheTramos.set(entrada, porClave);
  }
  porClave.set(clave, tramos);
  return tramos;
};
