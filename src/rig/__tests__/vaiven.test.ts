import { describe, expect, it } from "vitest";
import { faseDe, vaivenEnCuadro } from "../vaiven";

describe("vaivenEnCuadro", () => {
  it("es acotado: menos de 2°, ~11 px y <2 % de respiración", () => {
    for (let f = 0; f < 3000; f++) {
      const v = vaivenEnCuadro(f, 1.3);
      expect(Math.abs(v.grados)).toBeLessThan(2);
      expect(Math.abs(v.dx)).toBeLessThanOrEqual(11);
      expect(Math.abs(v.sy - 1)).toBeLessThan(0.02);
    }
  });

  it("es continuo: nunca salta de un cuadro al siguiente (lo que falló en la v5)", () => {
    for (let f = 0; f < 3000; f++) {
      const a = vaivenEnCuadro(f, 2);
      const b = vaivenEnCuadro(f + 1, 2);
      expect(Math.abs(b.grados - a.grados)).toBeLessThan(0.15);
      expect(Math.abs(b.dx - a.dx)).toBeLessThan(0.5);
    }
  });

  it("cada personaje tiene su fase (no se mueven al unísono)", () => {
    expect(faseDe("benja")).not.toBe(faseDe("sofi"));
    expect(vaivenEnCuadro(40, faseDe("benja")).grados).not.toBeCloseTo(vaivenEnCuadro(40, faseDe("sofi")).grados, 2);
  });
});
