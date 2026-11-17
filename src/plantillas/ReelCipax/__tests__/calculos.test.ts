import { describe, expect, it } from "vitest";
import { campana, enReel, faltanManijas, lineaDeTiempo } from "../calculos";

describe("lineaDeTiempo (ReelCipax)", () => {
  const tomas = [
    { desdeS: 1, hastaS: 3, transicion: "pildora" as const },
    { desdeS: 5, hastaS: 6, transicion: "camara" as const },
    { desdeS: 0.5, hastaS: 1.5 },
  ];
  it("encadena las tomas sin huecos", () => {
    const l = lineaDeTiempo(tomas);
    expect(l.inicios).toEqual([0, 60, 90]);
    expect(l.cortes).toEqual([60, 90, 120]);
    expect(l.fin).toBe(120);
  });
  it("suma las manijas de cada transición", () => {
    const { tramos } = lineaDeTiempo(tomas);
    expect(tramos[0]).toMatchObject({ desde: 0, hasta: 71 }); // la que sale sigue 11 cuadros bajo la píldora
    expect(tramos[1]).toMatchObject({ desde: 51, hasta: 92 }); // entra 9 antes (píldora) y sale 2 después (cámara)
    expect(tramos[2]).toMatchObject({ desde: 88, hasta: 120 });
  });
  it("pasa segundos del archivo a segundos del reel", () => {
    expect(enReel(tomas, 1, 5.5)).toBeCloseTo(2.5);
  });
  it("avisa si falta material para las manijas", () => {
    const conPildora = [
      { desdeS: 0, hastaS: 1, duracionS: 2, transicion: "pildora" as const },
      { desdeS: 0.1, hastaS: 1, duracionS: 1 },
    ];
    expect(faltanManijas(conPildora)).toEqual(["toma 1: falta material antes"]);
  });
  it("campana", () => {
    expect(campana(0, 6)).toBe(1);
    expect(campana(3, 6)).toBe(0.5);
    expect(campana(9, 6)).toBe(0);
  });
});
