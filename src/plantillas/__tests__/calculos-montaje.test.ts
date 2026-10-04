import { describe, expect, it } from "vitest";
import { ajustarAlPulso, FPS, iniciosTomas, MIN_TOMA_MS, type TomaMusical } from "../MontajeMusical/calculos";

const toma = (desdeMs: number, hastaMs: number): TomaMusical => ({ clip: "x", desdeMs, hastaMs });

describe("ajustarAlPulso", () => {
  const tomas = [toma(0, 1900), toma(5000, 7100), toma(0, 3000)];
  const compases = [2, 4, 6, 8]; // s
  it("lleva cada corte al compás más cercano (salvo el final)", () => {
    const r = ajustarAlPulso(tomas, compases);
    const cortes = iniciosTomas(r).slice(1).map((f) => (f / FPS) * 1000);
    expect(cortes).toEqual([2000, 4000]);
    expect(r[2].hastaMs - r[2].desdeMs).toBe(3000); // la última no se toca
  });
  it("no mueve un corte si el pulso está fuera de la tolerancia", () => {
    const r = ajustarAlPulso([toma(0, 1000), toma(0, 1000)], [3], { toleranciaMs: 400 });
    expect(r[0].hastaMs).toBe(1000);
  });
  it("respeta la duración mínima de una toma", () => {
    const r = ajustarAlPulso([toma(0, 900), toma(0, 1000)], [0.5], { toleranciaMs: 500 });
    expect(r[0].hastaMs).toBeGreaterThanOrEqual(MIN_TOMA_MS);
  });
  it("tiene en cuenta dónde arranca la música", () => {
    const r = ajustarAlPulso([toma(0, 1900), toma(0, 1000)], [12], { musicaDesdeMs: 10000 });
    expect(r[0].hastaMs).toBe(2000);
  });
  it("las duraciones quedan en frames enteros", () => {
    const r = ajustarAlPulso(tomas, [2.013, 4.021]);
    for (const t of r) expect(((t.hastaMs - t.desdeMs) / 1000) * FPS).toBeCloseTo(Math.round(((t.hastaMs - t.desdeMs) / 1000) * FPS), 6);
  });
});
