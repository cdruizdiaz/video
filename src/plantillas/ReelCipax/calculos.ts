// Cálculos puros del reel de Cipax: línea de tiempo de las tomas y ventanas de cada transición (en cuadros, 30 fps).
export const FPS = 30;
export const aCuadros = (s: number) => Math.round(s * FPS);

export type TipoTransicion = "corte" | "pildora" | "circulo" | "bandas" | "isotipo" | "camara" | "placa";

// antes/despues: cuadros que dura la capa de la transición alrededor del corte.
// entranteAntes: cuadros que la toma siguiente se ve antes del corte (adentro de una máscara o en un fundido).
// salienteDespues: cuadros que la toma que sale sigue viéndose después del corte (debajo de la máscara).
export const VENTANAS: Record<TipoTransicion, { antes: number; despues: number; entranteAntes: number; salienteDespues: number }> = {
  corte: { antes: 0, despues: 0, entranteAntes: 0, salienteDespues: 0 },
  pildora: { antes: 9, despues: 11, entranteAntes: 9, salienteDespues: 11 },
  circulo: { antes: 13, despues: 11, entranteAntes: 0, salienteDespues: 0 },
  bandas: { antes: 8, despues: 11, entranteAntes: 0, salienteDespues: 0 },
  isotipo: { antes: 14, despues: 13, entranteAntes: 0, salienteDespues: 0 }, // "antes" real = desde que entra el logo (logoDesdeS)
  camara: { antes: 7, despues: 7, entranteAntes: 2, salienteDespues: 2 },
  placa: { antes: 11, despues: 0, entranteAntes: 0, salienteDespues: 0 },
};

export type TomaBase = { desdeS: number; hastaS: number; transicion?: TipoTransicion };

// Inicio de cada toma en el reel, cortes, y el tramo (cuadros del reel) donde se dibuja cada una con sus manijas.
export const lineaDeTiempo = (tomas: TomaBase[]) => {
  const inicios: number[] = [];
  const cortes: number[] = [];
  let t = 0;
  for (const c of tomas) {
    inicios.push(t);
    t += aCuadros(c.hastaS) - aCuadros(c.desdeS);
    cortes.push(t);
  }
  const tramos = tomas.map((c, i) => {
    const entra = i > 0 ? VENTANAS[tomas[i - 1].transicion ?? "corte"].entranteAntes : 0;
    const sale = i < tomas.length - 1 ? VENTANAS[c.transicion ?? "corte"].salienteDespues : 0;
    return { desde: inicios[i] - entra, hasta: cortes[i] + sale, manijaAntes: entra, manijaDespues: sale };
  });
  return { inicios, cortes, fin: t, tramos };
};

// Segundo de una toma (archivo) → segundo del reel
export const enReel = (tomas: TomaBase[], i: number, srcS: number) => {
  const { inicios } = lineaDeTiempo(tomas);
  return (inicios[i] + aCuadros(srcS) - aCuadros(tomas[i].desdeS)) / FPS;
};

// Problemas de manijas: la toma necesita material antes de desdeS o después de hastaS que el archivo no tiene.
export const faltanManijas = (tomas: (TomaBase & { duracionS: number })[]) => {
  const { tramos } = lineaDeTiempo(tomas);
  return tomas.flatMap((c, i) => {
    const errores: string[] = [];
    if (aCuadros(c.desdeS) - tramos[i].manijaAntes < 0) errores.push(`toma ${i}: falta material antes`);
    if (aCuadros(c.hastaS) + tramos[i].manijaDespues > aCuadros(c.duracionS)) errores.push(`toma ${i}: falta material después`);
    return errores;
  });
};

// Rampa 0→1→0 alrededor de t=0 (cuadros relativos al corte), con meseta de `meseta` cuadros
export const campana = (t: number, ancho: number, meseta = 0) => {
  const d = Math.max(0, Math.abs(t) - meseta / 2);
  return Math.max(0, 1 - d / ancho);
};
