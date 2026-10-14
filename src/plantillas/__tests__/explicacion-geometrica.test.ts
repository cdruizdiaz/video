import { describe, expect, it } from "vitest";
import { armarTiempos, ENTRADA_GESTO, lineaDePoses, lineaEn, palabraEn, pistasDe, poseEnCuadro, resaltadoDe, RESTO_POSE } from "../ExplicacionGeometrica/calculos";

const linea = (id: string, escena: number, quien: string, duracionMs: number, extra = {}) => ({
  id,
  escena,
  quien,
  texto: id,
  audio: `a/${id}.wav`,
  duracionMs,
  ...extra,
});

const dialogo = [
  linea("l1", 1, "benja", 1000, { pausaAntes: 0.5 }),
  linea("l2", 1, "sofi", 2000, { pausaAntes: 1, cara: "feliz", gesto: "senala" }),
  linea("l3", 2, "benja", 1500, { pausaAntes: 2 }),
];

describe("armarTiempos", () => {
  const t = armarTiempos(dialogo, 30, { inicio: 10, cola: 60 });
  it("encadena las líneas con su pausa antes y la duración real de la voz", () => {
    expect(t.linea("l1")).toMatchObject({ desde: 25, hasta: 55 });
    expect(t.linea("l2")).toMatchObject({ desde: 85, hasta: 145 });
    expect(t.linea("l3")).toMatchObject({ desde: 205, hasta: 250 });
    expect(t.total).toBe(310);
  });
  it("cada escena va desde el inicio de su primera pausa hasta que empieza la siguiente (la primera desde 0)", () => {
    expect(t.escenas[1]).toEqual({ desde: 0, hasta: 145 });
    expect(t.escenas[2]).toEqual({ desde: 145, hasta: 310 });
  });
  it("linea() avisa si el id no existe", () => {
    expect(() => t.linea("nada")).toThrow();
  });
  it("lineaEn: la línea que se dice (y un rato después), o null en las pausas", () => {
    expect(lineaEn(t, 30)?.id).toBe("l1");
    expect(lineaEn(t, 58)?.id).toBe("l1");
    expect(lineaEn(t, 70)).toBeNull();
  });
});

describe("pistasDe", () => {
  const t = armarTiempos(dialogo, 30);
  const gestos = { senala: { huesos: { brazo_der: { rot: -120 } }, variantes: { mano_der: "senala" }, dura: 1 } };
  it("solo las líneas del personaje: hablar (con sus bocas) y, si tiene, cara y gesto", () => {
    const p = pistasDe({ nombre: "sofi", gestos }, t);
    const l2 = t.linea("l2");
    expect(p.filter((x) => x.tipo === "hablar")).toHaveLength(1);
    expect(p.find((x) => x.tipo === "hablar")).toMatchObject({ inicio: l2.desde, fin: l2.hasta });
    expect(p.find((x) => x.tipo === "expresion")).toMatchObject({ nombre: "feliz", inicio: l2.desde });
    const g = p.find((x) => x.tipo === "secuencia");
    expect(g).toBeDefined();
    if (g?.tipo !== "secuencia") return;
    expect(g.duracion).toBe(l2.hasta - l2.desde + ENTRADA_GESTO);
    expect(g.secuencia.poses[1].variantes).toEqual({ mano_der: "senala" });
    expect(g.secuencia.poses[g.secuencia.poses.length - 1].variantes).toEqual({ mano_der: null });
  });
  it("respira y parpadea siempre; sin gestos definidos no inventa secuencias", () => {
    const p = pistasDe({ nombre: "benja" }, t);
    expect(p.map((x) => x.tipo)).toEqual(expect.arrayContaining(["respirar", "parpadear", "hablar"]));
    expect(p.some((x) => x.tipo === "secuencia")).toBe(false);
  });
});

describe("personajes por poses", () => {
  const t = armarTiempos(dialogo, 30);
  const tabla = { senala: "senalando" };
  it("lineaDePoses: la línea con gesto pone su pose (un poco antes y hasta un rato después); las sueltas se suman", () => {
    const segs = lineaDePoses("sofi", t, tabla, [{ desde: 500, hasta: 600, pose: "saludando" }]);
    const l2 = t.linea("l2");
    expect(segs[0]).toEqual({ desde: l2.desde - 2, hasta: l2.hasta + RESTO_POSE, pose: "senalando" });
    expect(segs).toHaveLength(2);
    expect(lineaDePoses("benja", t, tabla)).toHaveLength(0);
  });
  it("poseEnCuadro: pose activa y cuadros desde el cambio (para el pop); fuera de los tramos, la base", () => {
    const segs = [
      { desde: 10, hasta: 20, pose: "a" },
      { desde: 15, hasta: 30, pose: "b" },
    ];
    expect(poseEnCuadro(segs, 5)).toEqual({ pose: "neutra", desdeCambio: 99 });
    expect(poseEnCuadro(segs, 12)).toEqual({ pose: "a", desdeCambio: 2 });
    expect(poseEnCuadro(segs, 16)).toEqual({ pose: "b", desdeCambio: 1 });
    expect(poseEnCuadro(segs, 33)).toEqual({ pose: "neutra", desdeCambio: 3 });
  });
});

describe("poses intermedias y temblor", () => {
  const mov = { paso: 3, caminos: { festejo: ["p1", "p2"] }, espera: ["neutra", "neutra_b"], esperaCada: 6 };
  const segs = [{ desde: 100, hasta: 160, pose: "festejo" }];
  it("entra por el camino (3 cuadros por imagen), se queda en la pose y vuelve por el camino al revés", () => {
    const p = (f: number) => poseEnCuadro(segs, f, "neutra", mov).pose;
    expect([100, 102, 103, 105, 106, 130].map(p)).toEqual(["p1", "p1", "p2", "p2", "festejo", "festejo"]);
    expect([153, 154, 156, 157, 159].map(p)).toEqual(["festejo", "p2", "p2", "p1", "p1"]);
  });
  it("en espera alterna las variantes de la base", () => {
    expect(poseEnCuadro(segs, 0, "neutra", mov).pose).toBe("neutra");
    expect(poseEnCuadro(segs, 7, "neutra", mov).pose).toBe("neutra_b");
  });
  it("dos líneas seguidas con la misma pose se unen; con otra pose, no", () => {
    const dl = [
      { id: "a", escena: 1, quien: "sofi", texto: "a", audio: "a", duracionMs: 1000, pausaAntes: 0.3, gesto: "senala" },
      { id: "b", escena: 1, quien: "sofi", texto: "b", audio: "b", duracionMs: 1000, pausaAntes: 0.3, gesto: "senala" },
      { id: "c", escena: 1, quien: "sofi", texto: "c", audio: "c", duracionMs: 1000, pausaAntes: 0.3, gesto: "indice" },
    ];
    const tt = armarTiempos(dl, 30);
    const s = lineaDePoses("sofi", tt, { senala: "senalando", indice: "explicando" });
    expect(s.map((x) => x.pose)).toEqual(["senalando", "explicando"]);
    expect(s[0].hasta).toBe(tt.linea("b").hasta + RESTO_POSE);
  });
});

describe("subtítulos resaltados", () => {
  const lista = [
    { patron: "hipotenusa", color: "#e3197c" },
    { patron: "catetos?", color: ["#2fa7e8", "#ff8a1f"] },
  ];
  it("reconoce la palabra clave con tildes, mayúsculas y puntuación", () => {
    expect(resaltadoDe("Hipotenusa.", lista)?.color).toBe("#e3197c");
    expect(resaltadoDe("catetos,", lista)?.color).toEqual(["#2fa7e8", "#ff8a1f"]);
    expect(resaltadoDe("cateto", lista)).toBeDefined();
    expect(resaltadoDe("catetazo", lista)).toBeUndefined();
    expect(resaltadoDe("¿", lista)).toBeUndefined();
  });
  it("marca la última palabra que empezó (y la mantiene en la pausa)", () => {
    const p = [{ fromMs: 0 }, { fromMs: 300 }, { fromMs: 900 }];
    expect(palabraEn(p, -10)).toBe(-1);
    expect(palabraEn(p, 0)).toBe(0);
    expect(palabraEn(p, 600)).toBe(1);
    expect(palabraEn(p, 5000)).toBe(2);
  });
});
