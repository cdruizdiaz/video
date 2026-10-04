import { describe, expect, it } from "vitest";
import { duracionGlobo } from "../../plantillas/comunes/historieta";
import { bocasDePalabra, hablar, palabras, visemaEn, visemas } from "../lipsync";

const tr = {
  tokens: [
    { text: "[_BEG_]", fromMs: 0, toMs: 0 },
    { text: " Hola", fromMs: 0, toMs: 400 },
    { text: ",", fromMs: 400, toMs: 400 },
    { text: " ma", fromMs: 900, toMs: 1100 },
    { text: "má", fromMs: 1100, toMs: 1400 },
  ],
};

describe("palabras", () => {
  it("une tokens sin espacio y descarta marcas y puntuación", () => {
    expect(palabras(tr)).toEqual([
      { texto: "Hola", desdeMs: 0, hastaMs: 400 },
      { texto: "mamá", desdeMs: 900, hastaMs: 1400 },
    ]);
  });
});

describe("bocasDePalabra", () => {
  it("español: vocales, labiales y dígrafos", () => {
    expect(bocasDePalabra("mamá")).toEqual(["A", "D", "A", "D"]);
    expect(bocasDePalabra("queso")).toEqual(["B", "C", "B", "E"]); // la u de "qu" no suena
    expect(bocasDePalabra("hola")).toEqual(["E", "B", "D"]); // la h no suena
    expect(bocasDePalabra("calle")).toEqual(["B", "D", "B", "C"]);
  });
  it("inglés: e muda y dígrafos", () => {
    expect(bocasDePalabra("make", "en")).toEqual(["A", "D", "B"]);
    expect(bocasDePalabra("moon", "en")).toEqual(["A", "F", "B"]);
  });
  it("palabra vacía da una consonante", () => {
    expect(bocasDePalabra("!!")).toEqual(["B"]);
  });
});

describe("visemas", () => {
  const t = visemas(tr, { fps: 30 });
  it("tramos ordenados y sin solaparse", () => {
    for (let i = 1; i < t.length; i++) expect(t[i].desde).toBeGreaterThanOrEqual(t[i - 1].desde - 1e-9);
  });
  it("cierra la boca en la pausa entre palabras", () => {
    // pausa 400→900 ms: el frame 20 (≈667 ms) está en reposo
    expect(visemaEn(t, 20)).toBeNull();
    expect(visemaEn(t, 5)).not.toBeNull();
  });
  it("respeta el inicio del audio en la composición", () => {
    const corrido = visemas(tr, { fps: 30, desde: 100 });
    expect(corrido[0].desde - t[0].desde).toBeCloseTo(100);
  });
  it("hablar abre la boca y mueve la cabeza solo mientras habla", () => {
    expect(hablar(20, t)).toEqual({ visema: null });
    expect(hablar(5, t).visema).toBeTruthy();
  });
});

describe("duracionGlobo", () => {
  it("antes + última palabra + queda + salida", () => {
    expect(duracionGlobo([{ texto: "hola", desdeMs: 0, hastaMs: 1000 }], 30, 24)).toBe(4 + 30 + 24 + 6);
  });
});
