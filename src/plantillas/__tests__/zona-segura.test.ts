import { describe, expect, it } from "vitest";
import { cajaEnCuadro, cajasEnPose } from "../../rig/cajas";
import { cajasDePose } from "../../rig/poses";
import { combinar, poseInicial } from "../../rig/pose";
import { lineasDe, MARGEN_CABEZA, partirEnCarteles, pisoLibre, ubicarCartel } from "../comunes/zonaSegura";

const cartel = (texto: string) => ({ texto, ancho: 900, x0: 90, relleno: 14, interlinea: 1.2, tamanios: [40, 34, 28] });
const cabeza = (x0: number, y0: number) => ({ x0, y0, x1: x0 + 200, y1: y0 + 220 });

describe("lineasDe", () => {
  it("corta por palabras según el ancho", () => {
    expect(lineasDe("hola", 900, 40)).toBe(1);
    expect(lineasDe("palabra ".repeat(40).trim(), 900, 40)).toBeGreaterThan(5);
    expect(lineasDe("palabra ".repeat(40).trim(), 900, 28)).toBeLessThan(lineasDe("palabra ".repeat(40).trim(), 900, 40));
  });
});

describe("partirEnCarteles", () => {
  const largo = "Teorema de Pitágoras: en un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos.";
  it("cada parte entra en 2 renglones, no se pierde ninguna palabra y el tiempo va de 0 a 1 sin huecos", () => {
    const partes = partirEnCarteles(largo, 900, 34, 2, "Sofi: ");
    expect(partes.length).toBeGreaterThan(1);
    expect(partes.map((p) => p.texto).join(" ")).toBe(largo);
    partes.forEach((p, i) => {
      expect(lineasDe((i === 0 ? "Sofi: " : "") + p.texto, 900, 34)).toBeLessThanOrEqual(2);
      if (i > 0) expect(p.desde).toBeCloseTo(partes[i - 1].hasta, 5);
    });
    expect(partes[0].desde).toBe(0);
    expect(partes[partes.length - 1].hasta).toBe(1);
  });
  it("un texto corto queda en una sola parte", () => {
    expect(partirEnCarteles("Contá los cuadraditos.", 900, 34)).toHaveLength(1);
  });
});

describe("ubicarCartel", () => {
  const zona = { techo: 1140, piso: 1920 };
  it("queda pegado encima de la cabeza más alta que cruza, con el margen de seguridad", () => {
    const u = ubicarCartel(cartel("Hola"), zona, { cabezas: [cabeza(100, 1300), cabeza(700, 1320)], cuerpos: [] });
    expect(u.entra).toBe(true);
    expect(u.top + u.alto).toBe(1300 - MARGEN_CABEZA);
    expect(u.tam).toBe(40);
  });
  it("achica la letra si el texto largo no entra con la grande, y nunca pisa la cabeza", () => {
    const largo = "Teorema de Pitágoras: en un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos.";
    const u = ubicarCartel(cartel(largo), zona, { cabezas: [cabeza(100, 1290)], cuerpos: [] });
    expect(u.entra).toBe(true);
    expect(u.tam).toBeLessThan(40);
    expect(u.top).toBeGreaterThanOrEqual(zona.techo);
    expect(u.top + u.alto).toBeLessThanOrEqual(1290 - MARGEN_CABEZA);
  });
  it("con un brazo levantado intenta no pisarlo; si no entra, solo respeta las cabezas", () => {
    const brazo = { x0: 600, y0: 1150, x1: 700, y1: 1500 };
    const u = ubicarCartel(cartel("Hola"), zona, { cabezas: [cabeza(100, 1300)], cuerpos: [brazo] });
    expect(u.libreDeCuerpos).toBe(false);
    expect(u.top + u.alto).toBeLessThanOrEqual(1300 - MARGEN_CABEZA);
  });
  it("si no entra ni con la letra más chica, se sube por encima del techo (nunca baja sobre las cabezas)", () => {
    const u = ubicarCartel(cartel("x ".repeat(200)), zona, { cabezas: [cabeza(100, 1200)], cuerpos: [] });
    expect(u.entra).toBe(false);
    expect(u.top + u.alto).toBeLessThanOrEqual(1200);
  });
  it("las cajas que no cruzan el ancho del cartel no cuentan", () => {
    expect(pisoLibre([{ x0: 0, y0: 1200, x1: 50, y1: 1400 }], 90, 990, 1920)).toBe(1920);
  });
});

describe("cajasEnPose", () => {
  it("la cabeza de Benja es lo más alto del cuerpo; con el brazo extendido al costado la caja del cuerpo se ensancha", () => {
    const quieto = cajasEnPose("benja", poseInicial("frente", "normal"));
    expect(quieto.cabeza.y0).toBeLessThan(quieto.cuerpo.y1);
    expect(quieto.cuerpo.y0).toBe(quieto.cabeza.y0);
    const brazo = cajasEnPose("benja", combinar(poseInicial("frente", "normal"), { huesos: { brazo_der: { rot: -90 } } }));
    expect(brazo.cuerpo.x1).toBeGreaterThan(quieto.cuerpo.x1 + 50);
  });
  it("espejado, la caja se refleja en x", () => {
    const normal = cajasEnPose("sofi", poseInicial("frente", "normal"));
    const espejo = cajasEnPose("sofi", { ...poseInicial("frente", "normal"), espejo: true });
    expect(espejo.cabeza.x0).toBeCloseTo(-normal.cabeza.x1);
    expect(espejo.cabeza.y0).toBeCloseTo(normal.cabeza.y0);
  });
  it("cajaEnCuadro escala y ubica en los pies", () => {
    expect(cajaEnCuadro({ x0: -10, y0: -100, x1: 10, y1: 0 }, 500, 1800, 0.5)).toEqual({ x0: 495, y0: 1750, x1: 505, y1: 1800 });
  });
});

describe("cajasDePose", () => {
  it("la cabeza queda arriba, dentro del cuerpo, y el espejo la refleja en x", () => {
    const c = cajasDePose("benja", "neutra");
    expect(c.cabeza.y0).toBeGreaterThanOrEqual(c.cuerpo.y0);
    expect(c.cabeza.y1).toBeLessThan(c.cuerpo.y1);
    expect(c.cuerpo.y1).toBeCloseTo(0, 0);
    const e = cajasDePose("benja", "neutra", true);
    expect(e.cabeza.x0).toBeCloseTo(-c.cabeza.x1);
  });
  it("una pose que no existe usa la neutra", () => {
    expect(cajasDePose("sofi", "no-existe")).toEqual(cajasDePose("sofi", "neutra"));
  });
});
