// Carga (y valida con zod, una sola vez) los datos de un personaje de la biblioteca src/personajes/.
import { DATOS_PERSONAJES } from "../personajes";
import { type DatosPiezas, type Rig, zPiezas, zRig } from "./tipos";

export type Personaje = { nombre: string; piezas: DatosPiezas; rig: Rig };

const cache = new Map<string, Personaje>();

export const NOMBRES_PERSONAJES = Object.keys(DATOS_PERSONAJES);

export const cargarPersonaje = (nombre: string): Personaje => {
  const listo = cache.get(nombre);
  if (listo) return listo;
  const datos = DATOS_PERSONAJES[nombre];
  if (!datos) throw new Error(`Personaje «${nombre}» no está en src/personajes/index.ts (hay: ${NOMBRES_PERSONAJES.join(", ")})`);
  const piezas = zPiezas.safeParse(datos.piezas);
  if (!piezas.success) throw new Error(`public/personajes/${nombre}/piezas.json no es válido: ${piezas.error.message}`);
  const rig = zRig.safeParse(datos.rig);
  if (!rig.success) throw new Error(`public/personajes/${nombre}/rig.json no es válido: ${rig.error.message}`);
  const p = { nombre, piezas: piezas.data, rig: rig.data };
  cache.set(nombre, p);
  return p;
};

// Vistas que tiene el personaje (con rig y piezas)
export const vistasDe = (p: Personaje) => Object.keys(p.piezas.vistas).filter((v) => p.rig.vistas[v]);
