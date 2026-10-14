// Regla de la suite: los carteles de texto (subtítulos, globos, bocadillos) nunca pisan a los personajes.
// Se calcula el lugar libre de cada cartel antes de dibujarlo: debajo de un techo (p. ej. la pizarra) y encima de
// las cajas prohibidas (cabezas con pelo y gorro, con un margen de seguridad), achicando la letra si no entra.
// Primero se intenta dejar libres también los cuerpos (brazos levantados); si no entra, solo las cabezas.
import type { Caja } from "../../rig/cajas";

export type Cartel = {
  texto: string;
  ancho: number; // px disponibles para el cartel (de lado a lado)
  x0: number; // borde izquierdo del cartel
  relleno: number; // px de relleno arriba y abajo (total por lado)
  interlinea: number; // alto de línea / tamaño de letra
  tamanios: number[]; // tamaños de letra a probar, de mayor a menor
  anchoLetra?: number; // ancho medio de un carácter / tamaño de letra (Fredoka ≈ 0,53)
};

export type Ubicacion = { top: number; alto: number; tam: number; lineas: number; libreDeCuerpos: boolean; entra: boolean };

export const MARGEN_CABEZA = 18; // px de aire entre el cartel y el gorro / pelo
const ANCHO_LETRA = 0.53;

// Líneas que ocupa un texto con ese tamaño de letra (estimación por palabras, como el navegador)
export const lineasDe = (texto: string, ancho: number, tam: number, anchoLetra = ANCHO_LETRA) => {
  const porLinea = Math.max(1, Math.floor(ancho / (tam * anchoLetra)));
  let lineas = 1;
  let largo = 0;
  for (const p of texto.split(/\s+/).filter(Boolean)) {
    const l = p.length + (largo ? 1 : 0);
    if (largo + l > porLinea && largo > 0) {
      lineas++;
      largo = p.length;
    } else largo += l;
  }
  return lineas;
};

const pisa = (c: Caja, x0: number, x1: number) => c.x1 > x0 && c.x0 < x1;

// Piso del cartel: lo más arriba de las cajas que se cruzan con su ancho (menos el margen), o el límite de abajo
export const pisoLibre = (cajas: Caja[], x0: number, x1: number, limite: number, margen = MARGEN_CABEZA) =>
  Math.min(limite, ...cajas.filter((c) => pisa(c, x0, x1)).map((c) => c.y0 - margen));

export const ubicarCartel = (
  cartel: Cartel,
  zona: { techo: number; piso: number }, // franja permitida (px del cuadro)
  prohibidas: { cabezas: Caja[]; cuerpos: Caja[] },
  margen = MARGEN_CABEZA,
): Ubicacion => {
  const x1 = cartel.x0 + cartel.ancho;
  const pisoCuerpos = pisoLibre([...prohibidas.cuerpos, ...prohibidas.cabezas], cartel.x0, x1, zona.piso, margen);
  const pisoCabezas = pisoLibre(prohibidas.cabezas, cartel.x0, x1, zona.piso, margen);
  const medir = (tam: number) => {
    const lineas = lineasDe(cartel.texto, cartel.ancho - 2 * cartel.relleno, tam, cartel.anchoLetra);
    return { lineas, alto: Math.ceil(lineas * tam * cartel.interlinea + 2 * cartel.relleno) };
  };
  for (const [piso, libreDeCuerpos] of [
    [pisoCuerpos, true],
    [pisoCabezas, false],
  ] as const) {
    for (const tam of cartel.tamanios) {
      const m = medir(tam);
      if (piso - zona.techo >= m.alto) {
        // Pegado abajo (cerca de quien habla) pero sin pasar el piso
        return { top: piso - m.alto, alto: m.alto, tam, lineas: m.lineas, libreDeCuerpos, entra: true };
      }
    }
  }
  // No entra ni con la letra más chica: se sube por encima del techo (invade la zona de arriba, nunca las cabezas)
  const tam = cartel.tamanios[cartel.tamanios.length - 1];
  const m = medir(tam);
  return { top: pisoCabezas - m.alto, alto: m.alto, tam, lineas: m.lineas, libreDeCuerpos: false, entra: false };
};

// Parte un texto en carteles de hasta `maxLineas` renglones con ese tamaño de letra (por palabras). Cada parte lleva
// la fracción del texto donde empieza (para mostrarla cuando se dice: el tiempo se reparte por caracteres).
export const partirEnCarteles = (texto: string, ancho: number, tam: number, maxLineas = 2, prefijo = "", anchoLetra = ANCHO_LETRA) => {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const partes: { texto: string; desde: number; hasta: number }[] = [];
  let actual: string[] = [];
  const total = texto.length;
  let usados = 0;
  const cerrar = () => {
    const t = actual.join(" ");
    partes.push({ texto: t, desde: usados / total, hasta: Math.min(1, (usados + t.length + 1) / total) });
    usados += t.length + 1;
    actual = [];
  };
  for (const w of palabras) {
    const prueba = [...actual, w].join(" ");
    const cabecera = partes.length === 0 ? prefijo : "";
    if (actual.length && lineasDe(cabecera + prueba, ancho, tam, anchoLetra) > maxLineas) cerrar();
    actual.push(w);
  }
  if (actual.length) cerrar();
  partes[partes.length - 1].hasta = 1;
  return partes;
};
