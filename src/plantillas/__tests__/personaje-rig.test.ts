import { describe, expect, it } from "vitest";
import { lugarEn, type PersonajeRigProps } from "../PersonajeRig/calculos";

const base: PersonajeRigProps = { personaje: "bloomie", x: 100, y: 500, escala: 1, pistas: [] };

describe("lugarEn con seguimiento", () => {
  const seguimiento = { puntos: [[10, 20], [14, 18], [30, 25]], escala: [1, 1.1, 0.9], rot: [0, 2, -1], factor: 0.5, desde: 5 };
  it("antes del tramo usa el primer punto (sin corrimiento)", () => {
    expect(lugarEn({ ...base, seguimiento }, 0)).toEqual({ x: 100, y: 500, escala: 1, rot: 0 });
  });
  it("suma el corrimiento del punto por el factor, la escala y el giro", () => {
    const l = lugarEn({ ...base, seguimiento }, 6);
    expect(l.x).toBeCloseTo(102);
    expect(l.y).toBeCloseTo(499);
    expect(l.escala).toBeCloseTo(1.1);
    expect(l.rot).toBeCloseTo(2);
  });
  it("después del final se queda en el último punto", () => {
    expect(lugarEn({ ...base, seguimiento }, 99).x).toBeCloseTo(110);
  });
});
