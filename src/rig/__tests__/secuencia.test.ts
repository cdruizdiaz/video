import { describe, expect, it } from "vitest";
import { poseSecuencia, zSecuencia } from "../secuencia";

const sec = (interpolacion: "suave" | "lineal" | "paso", ciclo = true) =>
  zSecuencia.parse({
    nombre: "prueba",
    ciclo,
    interpolacion,
    poses: [
      { huesos: { brazo: { rot: 0 } }, parpado: 0 },
      { huesos: { brazo: { rot: 90 } }, parpado: 1, expresion: "feliz" },
      { huesos: { brazo: { rot: 0 } }, dura: 2 },
    ],
  });

describe("poseSecuencia", () => {
  it("en las claves devuelve exactamente la pose clave (suave y lineal)", () => {
    for (const i of ["suave", "lineal"] as const) {
      const s = sec(i);
      // tramos ciclo: 1 + 1 + 2 = 4 → la pose 1 empieza en t = 0,25
      expect(poseSecuencia(s, 0).huesos!.brazo.rot).toBeCloseTo(0);
      expect(poseSecuencia(s, 0.25).huesos!.brazo.rot).toBeCloseTo(90);
      expect(poseSecuencia(s, 0.5).huesos!.brazo.rot).toBeCloseTo(0);
    }
  });
  it("lineal: punto medio entre claves", () => {
    expect(poseSecuencia(sec("lineal"), 0.125).huesos!.brazo.rot).toBeCloseTo(45);
  });
  it("paso: mantiene la pose del tramo sin interpolar", () => {
    const p = poseSecuencia(sec("paso"), 0.3);
    expect(p.huesos!.brazo.rot).toBe(90);
    expect(p.expresion).toBe("feliz");
  });
  it("ciclo: t fuera de 0…1 da la vuelta (también negativo)", () => {
    const s = sec("lineal");
    expect(poseSecuencia(s, 1.125).huesos!.brazo.rot).toBeCloseTo(45);
    expect(poseSecuencia(s, -0.875).huesos!.brazo.rot).toBeCloseTo(45);
  });
  it("sin ciclo: se queda en la última pose después del final", () => {
    const s = sec("lineal", false);
    expect(poseSecuencia(s, 5).huesos!.brazo.rot).toBeCloseTo(0);
    expect(poseSecuencia(s, -1).huesos!.brazo.rot).toBeCloseTo(0);
  });
  it("interpola parpado entre claves", () => {
    expect(poseSecuencia(sec("lineal"), 0.125).parpado).toBeCloseTo(0.5);
  });
  it("una sola pose", () => {
    const s = zSecuencia.parse({ nombre: "x", poses: [{ huesos: { a: { rot: 7 } } }] });
    expect(poseSecuencia(s, 0.6).huesos!.a.rot).toBe(7);
  });
  it("suave es continua (sin saltos entre cuadros)", () => {
    const s = sec("suave");
    let prev = poseSecuencia(s, 0).huesos!.brazo.rot!;
    for (let k = 1; k <= 200; k++) {
      const v = poseSecuencia(s, k / 200).huesos!.brazo.rot!;
      expect(Math.abs(v - prev)).toBeLessThan(10);
      prev = v;
    }
  });
});
