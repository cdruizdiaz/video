import { describe, expect, it } from "vitest";
import { enTramos, instantesMuestras, pesosMuestras, type Punto, tramoEn, tramosEntradaSalida, tramosRapidos, unirTramos } from "../comunes/tramosDesenfoque";

// Algo quieto en x0 que en `desde` arranca a moverse `v` px por cuadro durante `dura` cuadros
const recorrido = (n: number, desde: number, dura: number, v: number): Punto[] =>
  Array.from({ length: n }, (_, f) => [Math.min(Math.max(0, f - desde), dura) * v, 0]);

describe("tramosRapidos", () => {
  it("sin movimiento rápido no hay tramos", () => {
    expect(tramosRapidos([])).toEqual([]);
    expect(tramosRapidos([[0, 0]])).toEqual([]);
    expect(tramosRapidos(recorrido(60, 10, 40, 3))).toEqual([]); // 3 px/cuadro: lento
  });

  it("marca el tramo rápido con su margen", () => {
    // se mueve del cuadro 20 al 30 (transiciones 21…30) a 20 px/cuadro
    expect(tramosRapidos(recorrido(60, 20, 10, 20), { margen: 2 })).toEqual([{ desde: 18, hasta: 33 }]);
    expect(tramosRapidos(recorrido(60, 20, 10, 20), { margen: 0 })).toEqual([{ desde: 20, hasta: 31 }]);
  });

  it("toma el punto que más se mueve", () => {
    const pos = Array.from({ length: 20 }, (_, f): Punto[] => [
      [0, 0],
      [0, f >= 10 && f < 13 ? (f - 9) * 30 : f >= 13 ? 90 : 0],
    ]);
    expect(tramosRapidos(pos, { margen: 0 })).toEqual([{ desde: 9, hasta: 13 }]);
  });

  it("junta tramos cercanos y deja separados los lejanos", () => {
    const pos: Punto[] = Array.from({ length: 80 }, (_, f) => [f === 10 || f === 14 || f === 50 ? 100 : 0, 0]);
    // saltos en 9→10, 10→11, 13→14, 14→15 (hueco de 2 cuadros) y 49→50, 50→51
    expect(tramosRapidos(pos, { margen: 0, unir: 3 })).toEqual([
      { desde: 9, hasta: 16 },
      { desde: 49, hasta: 52 },
    ]);
    expect(tramosRapidos(pos, { margen: 0, unir: 0 })).toEqual([
      { desde: 9, hasta: 12 },
      { desde: 13, hasta: 16 },
      { desde: 49, hasta: 52 },
    ]);
  });

  it("nunca cruza un corte", () => {
    // corte en 30: la toma nueva empieza en otro lugar (salto que no es movimiento)
    const pos: Punto[] = Array.from({ length: 60 }, (_, f) => [f < 30 ? 0 : 500, 0]);
    expect(tramosRapidos(pos, { cortes: [30] })).toEqual([]);
    // movimiento rápido justo antes y justo después del corte: dos tramos, uno en cada toma
    const mov: Punto[] = Array.from({ length: 60 }, (_, f) => [f < 30 ? f * 20 : 2000 + (f - 30) * 20, 0]);
    const t = tramosRapidos(mov, { cortes: [30], margen: 3, unir: 10 }).map((x) => [x.desde, x.hasta]);
    expect(t).toEqual([
      [0, 30],
      [30, 60],
    ]);
  });

  it("no se sale de los bordes del video", () => {
    const pos: Punto[] = Array.from({ length: 10 }, (_, f) => [f * 50, 0]);
    expect(tramosRapidos(pos, { margen: 5 })).toEqual([{ desde: 0, hasta: 10 }]);
    const fin: Punto[] = Array.from({ length: 10 }, (_, f) => [f === 9 ? 100 : 0, 0]);
    expect(tramosRapidos(fin, { margen: 4 })).toEqual([{ desde: 4, hasta: 10 }]);
  });
});

describe("tramos de carteles", () => {
  it("entrada y salida, juntos si el cartel es corto", () => {
    expect(tramosEntradaSalida(60, 12, 8)).toEqual([
      { desde: 0, hasta: 12 },
      { desde: 52, hasta: 60 },
    ]);
    expect(tramosEntradaSalida(15, 10, 8)).toEqual([{ desde: 0, hasta: 15 }]);
    expect(tramosEntradaSalida(60, 12, 8, 4)).toEqual([
      { desde: 4, hasta: 16 },
      { desde: 52, hasta: 60 },
    ]);
  });

  it("unirTramos ordena y junta", () => {
    expect(unirTramos([{ desde: 20, hasta: 30 }, { desde: 0, hasta: 5 }, { desde: 5, hasta: 8 }, { desde: 9, hasta: 9 }])).toEqual([
      { desde: 0, hasta: 8 },
      { desde: 20, hasta: 30 },
    ]);
  });

  it("enTramos: sin tramos es siempre", () => {
    expect(enTramos(undefined, 99)).toBe(true);
    expect(enTramos([{ desde: 3, hasta: 5 }], 4)).toBe(true);
    expect(enTramos([{ desde: 3, hasta: 5 }], 5)).toBe(false);
  });
});

describe("muestras del modo cámara", () => {
  it("los pesos suman 1, son positivos y no son todos iguales", () => {
    for (const n of [2, 5, 10]) {
      const w = pesosMuestras(n);
      expect(w).toHaveLength(n);
      expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
      expect(Math.min(...w)).toBeGreaterThan(0);
      expect(new Set(w.map((x) => x.toFixed(6))).size).toBe(n);
    }
    expect(pesosMuestras(1)).toEqual([1]);
  });

  it("el obturador abre en el cuadro y no llega al siguiente (lo discreto queda en f)", () => {
    const c = instantesMuestras(40, 10, 180).map((m) => m.cuadro);
    expect(Math.min(...c)).toBeCloseTo(40.025, 6);
    expect(Math.max(...c)).toBeCloseTo(40.475, 6);
    for (const g of [90, 180, 360]) expect(instantesMuestras(40, 10, g).every((m) => Math.floor(m.cuadro) === 40)).toBe(true);
  });

  it("no sale del tramo (no mira del otro lado de un corte)", () => {
    const t = { desde: 30, hasta: 50 };
    expect(Math.min(...instantesMuestras(30, 10, 360, t).map((m) => m.cuadro))).toBeGreaterThanOrEqual(30);
    expect(Math.max(...instantesMuestras(49, 10, 360, t).map((m) => m.cuadro))).toBeLessThan(50);
    expect(tramoEn([t], 49)).toBe(t);
    expect(tramoEn([t], 50)).toBeUndefined();
  });
});
