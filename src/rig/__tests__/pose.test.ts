import { describe, expect, it } from "vitest";
import { aplicar, combinar, matricesMundo, matrizHueso, mezclarMov, movDe, multiplicar, poseInicial, rotar, sumarMov } from "../pose";
import type { VistaRig } from "../tipos";

const cerca = (a: number[], b: number[], d = 1e-9) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9 - Math.round(Math.log10(1 / d))));

describe("sumarMov / mezclarMov", () => {
  it("suma rotaciones y desplazamientos, multiplica escalas", () => {
    expect(sumarMov({ rot: 10, x: 2, sx: 2 }, { rot: 5, y: 3, sx: 1.5, sy: 0.5 })).toEqual({ rot: 15, x: 2, y: 3, sx: 3, sy: 0.5 });
  });
  it("mezcla lineal con neutros por defecto", () => {
    expect(mezclarMov(undefined, { rot: 20, sx: 3 }, 0.5)).toEqual({ rot: 10, x: 0, y: 0, sx: 2, sy: 1 });
  });
});

describe("combinar", () => {
  it("suma huesos, toma el máximo de parpado y gana lo último en lo discreto", () => {
    const p = combinar(
      poseInicial(),
      { huesos: { cabeza: { rot: 5 } }, parpado: 0.8, expresion: "feliz" },
      { huesos: { cabeza: { rot: 3 } }, parpado: 0.2, expresion: "bruja", mirada: [0.5, 0] },
      false,
      { mirada: [0.25, -1], yaw: 0.3 },
    );
    expect(p.huesos.cabeza.rot).toBe(8);
    expect(p.parpado).toBe(0.8);
    expect(p.expresion).toBe("bruja");
    expect(p.mirada).toEqual([0.75, -1]);
    expect(p.yaw).toBeCloseTo(0.3);
  });
  it("null en accesorios los quita y no muta la base", () => {
    const base = combinar(poseInicial(), { accesorios: { gorro: { hueso: "cabeza", x: 0, y: 0, rot: 0, escala: 1 } as never } });
    const sin = combinar(base, { accesorios: { gorro: null } });
    expect(sin.accesorios.gorro).toBeUndefined();
    expect(base.accesorios.gorro).toBeDefined();
  });
});

describe("movDe con comodines", () => {
  it("suma la clave exacta y las que coinciden con *", () => {
    const p = combinar(poseInicial(), { huesos: { "petalo_*": { rot: 2 }, petalo_1: { rot: 1 }, "*": { y: 1 }, mano_d: { rot: 50 } } });
    expect(movDe(p, "petalo_1")).toMatchObject({ rot: 3, y: 1 });
    expect(movDe(p, "petalo_2")).toMatchObject({ rot: 2, y: 1 });
    expect(movDe(p, "cuerpo")).toMatchObject({ rot: 0, y: 1 });
  });
});

describe("matrices", () => {
  it("rotar 90° lleva (1,0) a (0,1)", () => {
    cerca(aplicar(rotar(90), 1, 0), [0, 1]);
  });
  it("matrizHueso deja fijo el pivote al rotar y escalar", () => {
    const m = matrizHueso([10, 20], { rot: 37, sx: 2, sy: 0.5 });
    cerca(aplicar(m, 10, 20), [10, 20]);
  });
  it("matrizHueso desplaza el pivote con x/y", () => {
    cerca(aplicar(matrizHueso([10, 20], { x: 3, y: -4 }), 10, 20), [13, 16]);
  });
  it("multiplicar es asociativa", () => {
    const a = rotar(30), b = matrizHueso([5, 5], { rot: 10, sx: 2 }), c = rotar(-75);
    cerca(multiplicar(multiplicar(a, b), c), multiplicar(a, multiplicar(b, c)));
  });
});

describe("matricesMundo", () => {
  const rv: VistaRig = {
    huesos: [
      { id: "cuerpo", padre: null, pivote: [0, 0] },
      { id: "brazo", padre: "cuerpo", pivote: [10, 0] },
      { id: "mano", padre: "brazo", pivote: [20, 0] },
      { id: "huerfano", padre: "noexiste", pivote: [0, 0] },
    ],
    piezas: {},
    rostro: { hueso: "cuerpo" },
  };
  it("propaga la rotación del padre a los hijos", () => {
    const m = matricesMundo(rv, combinar(poseInicial(), { huesos: { cuerpo: { rot: 90 } } }));
    // la punta de la mano (20,0) gira 90° alrededor del origen
    cerca(aplicar(m.mano, 20, 0), [0, 20]);
  });
  it("hijo con padre inexistente usa identidad", () => {
    const m = matricesMundo(rv, combinar(poseInicial(), { huesos: { huerfano: { x: 5 } } }));
    cerca(aplicar(m.huerfano, 0, 0), [5, 0]);
  });
  it("no se cuelga con ciclos", () => {
    const ciclo: VistaRig = { ...rv, huesos: [{ id: "a", padre: "b", pivote: [0, 0] }, { id: "b", padre: "a", pivote: [0, 0] }] };
    expect(() => matricesMundo(ciclo, poseInicial())).not.toThrow();
  });
});
