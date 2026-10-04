import { describe, expect, it } from "vitest";
import { efectosDePistas } from "../sonidos";

describe("efectosDePistas", () => {
  it("un salto suena al despegar y al aterrizar", () => {
    const e = efectosDePistas([{ tipo: "saltar", inicio: 10, duracion: 40 }]);
    expect(e.map((x) => [x.tipo, x.desde])).toEqual([
      ["despegue", 17],
      ["aterrizaje", 41],
    ]);
  });
  it("cambio de cara y de disfraz hacen pop; quitar el disfraz no", () => {
    const e = efectosDePistas([
      { tipo: "expresion", inicio: 30, nombre: "feliz" },
      { tipo: "disfraz", inicio: 90, nombre: "bruja" },
      { tipo: "disfraz", inicio: 150, nombre: null },
    ]);
    expect(e.map((x) => x.desde)).toEqual([30, 90]);
  });
  it("no repite el mismo efecto muy seguido", () => {
    const e = efectosDePistas([
      { tipo: "expresion", inicio: 30, nombre: "a" },
      { tipo: "expresion", inicio: 33, nombre: "b" },
    ]);
    expect(e).toHaveLength(1);
  });
  it("lee caras y saltos de una secuencia (mocap)", () => {
    const secuencia = {
      ciclo: false,
      poses: [
        { dura: 10, expresion: "base", huesos: { raiz: { y: 0 } } },
        { dura: 10, expresion: "feliz", huesos: { raiz: { y: -40 } } },
        { dura: 10, expresion: "feliz", huesos: { raiz: { y: 0 } } },
        { dura: 1, expresion: "feliz" },
      ],
    };
    const e = efectosDePistas([{ tipo: "secuencia", inicio: 0, duracion: 30, secuencia }]);
    expect(e.map((x) => x.tipo)).toEqual(["cara", "despegue", "aterrizaje"]);
    expect(e[0].desde).toBe(10);
  });
  it("aplica el volumen general", () => {
    const [a] = efectosDePistas([{ tipo: "expresion", inicio: 0, nombre: "x" }], { volumen: 0.5 });
    expect(a.volumen).toBeCloseTo(0.25);
  });
});
