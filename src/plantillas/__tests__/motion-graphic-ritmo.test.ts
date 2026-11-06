import { describe, expect, it } from "vitest";
import {
  alPulso,
  BRAZOS,
  buscarPalabra,
  palabrasDeTokens,
  pistasBrazos,
  PUNCH,
  punchEn,
  SALIDA_ANTES,
  tamanioBloque,
  tiemposBloques,
  zMotionGraphicRitmo,
} from "../MotionGraphicRitmo/calculos";

const tok = (text: string, ms: number) => ({ text, fromMs: ms, toMs: ms + 100, dtwMs: ms + 20 });

describe("palabras de Whisper", () => {
  const tokens = [tok(" Enc", 0), tok("ont", 100), tok("rá", 200), tok(" el", 300), tok(" Hip", 400), tok("er", 500), tok(".", 600)];
  it("une los pedazos y usa el tiempo de DTW", () => {
    expect(palabrasDeTokens(tokens)).toEqual([
      { texto: "Encontrá", ms: 20 },
      { texto: "el", ms: 320 },
      { texto: "Hiper", ms: 420 },
    ]);
  });
  it("busca por prefijo sin tildes ni mayúsculas", () => {
    expect(buscarPalabra(palabrasDeTokens(tokens), "encontra")?.ms).toBe(20);
    expect(buscarPalabra(palabrasDeTokens(tokens), "hiper")?.texto).toBe("Hiper");
    expect(buscarPalabra(palabrasDeTokens(tokens), "nada")).toBeUndefined();
  });
});

describe("alPulso", () => {
  const pulsos = [1, 1.5, 2];
  it("corre al pulso más cercano dentro de la tolerancia", () => {
    expect(alPulso(1.4, pulsos)).toBe(1.5);
    expect(alPulso(1.24, pulsos)).toBe(1);
  });
  it("deja el tiempo si no hay pulso cerca", () => {
    expect(alPulso(3, pulsos)).toBe(3);
  });
});

describe("punchEn", () => {
  it("sube a la escala máxima y vuelve a 1", () => {
    expect(punchEn(9, [10])).toBe(1);
    expect(punchEn(10 + PUNCH.ataque, [10])).toBeCloseTo(PUNCH.escala);
    expect(punchEn(10 + PUNCH.ataque + PUNCH.caida, [10])).toBe(1);
    expect(punchEn(10 + PUNCH.ataque + 3, [10])).toBeLessThan(PUNCH.escala);
  });
});

describe("pistasBrazos", () => {
  const poses = [{ mano_izq: { y: -100 }, mano_der: { y: 0 } }, { mano_izq: { y: 0 }, mano_der: { y: -100 } }];
  const pistas = pistasBrazos([30, 90], poses);
  it("una pista por mano y compás, la derecha desfasada", () => {
    expect(pistas).toHaveLength(4);
    const izq = pistas.filter((p) => p.tipo === "secuencia" && p.secuencia.nombre.startsWith("mano_izq"));
    const der = pistas.filter((p) => p.tipo === "secuencia" && p.secuencia.nombre.startsWith("mano_der"));
    expect(izq.map((p) => p.inicio)).toEqual([30, 90]);
    expect(der.map((p) => p.inicio)).toEqual([30 + BRAZOS.desfase, 90 + BRAZOS.desfase]);
    expect(izq[0].fin).toBe(90);
    expect(izq[1].fin).toBeUndefined();
  });
  it("cada cambio parte de la pose anterior", () => {
    const p = pistas[1];
    if (p.tipo !== "secuencia") throw new Error();
    expect(p.secuencia.poses[0].huesos.mano_izq.y).toBe(-100);
    expect(p.secuencia.poses[1].huesos.mano_izq.y).toBe(0);
  });
});

describe("tiemposBloques", () => {
  const props = zMotionGraphicRitmo.parse({
    musica: { archivo: "m.wav" },
    pulsos: { pulsos: [1, 1.5, 2, 2.5, 3], compases: [1, 3] },
    voces: [
      { archivo: "a.wav", desde: 1, duracion: 1, tokens: [tok(" Hola", 0), tok(" che", 480)], rhubarb: { mouthCues: [] } },
      { archivo: "b.wav", desde: 2.5, duracion: 1, tokens: [tok(" Chau", 0)], rhubarb: { mouthCues: [] } },
    ],
    bloques: [
      { lineas: [{ texto: "Hola", palabra: "hola", voz: 0 }, { texto: "che", palabra: "che", voz: 0 }] },
      { lineas: [{ texto: "Chau", palabra: "chau", voz: 1 }] },
    ],
    personaje: { nombre: "x", x: 0, y: 0, escala: 1, poses: [{}] },
  });
  const b = tiemposBloques(props, 30);
  it("las líneas entran en el pulso y el bloque sale antes del siguiente", () => {
    expect(b[0].lineas.map((l) => l.entra)).toEqual([30, 45]);
    expect(b[1].entra).toBe(75);
    expect(b[0].sale).toBe(75 - SALIDA_ANTES);
    expect(b[1].sale).toBeNull();
  });
});

describe("tamanioBloque", () => {
  it("elige la letra más grande que entra en un renglón y en el alto", () => {
    expect(tamanioBloque(["Hola"], 960, 1000, [150, 100])).toBe(150);
    expect(tamanioBloque(["Un texto bastante largo"], 960, 1000, [150, 60])).toBe(60);
    expect(tamanioBloque(["A", "B", "C"], 960, 200, [150, 60])).toBe(60);
  });
});
