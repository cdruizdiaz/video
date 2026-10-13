import { describe, expect, it } from "vitest";
import {
  cortePiramide,
  alargarCortos,
  centroSeguido,
  cxSuavizado,
  frameDeSalida,
  framesTomaSalida,
  gruposManuales,
  marcarClaves,
  normalizar,
  origenSeguimiento,
  posicionRecorte,
  partirFrase,
  tramosDePlanos,
} from "../HablaSubtitulada/calculos";

describe("normalizar / marcarClaves", () => {
  it("ignora mayúsculas, tildes y signos", () => {
    expect(normalizar("¿Querés")).toBe("queres");
    expect(normalizar("WhatsApp,")).toBe("whatsapp");
    expect(normalizar("80%")).toBe("80%");
  });

  it("marca claves de varias palabras solo si están seguidas", () => {
    const p = [
      "tengo",
      "el",
      "WhatsApp",
      "reventado",
      "y",
      "WhatsApp",
      "lleno",
    ];
    expect(marcarClaves(p, ["whatsapp reventado"])).toEqual([
      false,
      false,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it("marca todas las apariciones y varias claves", () => {
    const p = ["24", "horas", "y", "7", "días,", "24", "horas"];
    expect(marcarClaves(p, ["24 horas", "7 dias"])).toEqual([
      true,
      true,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it("una palabra con espacio adentro se compara por partes", () => {
    expect(
      marcarClaves(["abre", "3 o", "4", "páginas."], ["3 o 4 páginas"]),
    ).toEqual([false, true, true, true]);
  });

  it("una clave vacía no marca nada", () => {
    expect(marcarClaves(["hola"], [" "])).toEqual([false]);
  });
});

describe("encuadre", () => {
  const puntos = [
    [0, 0.4, 0.3, 0.2],
    [1, 0.4, 0.3, 0.2],
    [2, 0.9, 0.3, 0.2], // error suelto del detector
    [3, 0.4, 0.3, 0.2],
    [4, 0.4, 0.3, 0.2],
  ];

  it("la mediana descarta el error suelto", () => {
    expect(cxSuavizado(puntos, 2)).toBeCloseTo(0.4);
  });

  it("sin datos usa el valor por defecto", () => {
    expect(cxSuavizado(undefined, 3)).toBe(0.5);
    expect(cxSuavizado([], 3, 0.6)).toBe(0.6);
  });

  it("interpola entre segundos cuando la persona se mueve", () => {
    const camina = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((s) => [
      s,
      s < 4 ? 0.2 : 0.6,
      0.3,
      0.2,
    ]);
    const v = cxSuavizado(camina, 3.5);
    expect(v).toBeGreaterThanOrEqual(0.2);
    expect(v).toBeLessThanOrEqual(0.6);
  });

  it("recorte de un 16:9 en 9:16: centro, bordes y límites", () => {
    const a = 16 / 9;
    expect(posicionRecorte(0.5, a)).toBeCloseTo(0.5);
    expect(posicionRecorte(0, a)).toBe(0);
    expect(posicionRecorte(1, a)).toBe(1);
    // la cara en cx queda en el centro del lienzo
    const ancho = 1920 * a;
    const p = posicionRecorte(0.42, a);
    expect(0.42 * ancho - p * (ancho - 1080)).toBeCloseTo(540);
  });

  it("un video vertical no se desplaza", () => {
    expect(posicionRecorte(0.2, 9 / 16)).toBe(0.5);
  });
});

describe("tramosDePlanos", () => {
  const toma = { clip: "B", desdeMs: 1000, hastaMs: 9000 };

  it("sin planos: un solo tramo de la cámara de la toma", () => {
    expect(tramosDePlanos(toma, undefined)).toEqual([
      { clip: "B", desdeMs: 1000, hastaMs: 9000, inicioClipMs: 1000, zoom: 1 },
    ]);
  });

  it("alterna cámaras, aplica el desfase y cubre toda la toma", () => {
    const t = tramosDePlanos(toma, [
      { desdeMs: 0, clip: "A", desfaseMs: 500 },
      { desdeMs: 4000 },
      { desdeMs: 7000, clip: "A", desfaseMs: 500, zoom: 1.12 },
    ]);
    expect(t).toEqual([
      { clip: "A", desdeMs: 1000, hastaMs: 4000, inicioClipMs: 500, zoom: 1 },
      { clip: "B", desdeMs: 4000, hastaMs: 7000, inicioClipMs: 4000, zoom: 1 },
      {
        clip: "A",
        desdeMs: 7000,
        hastaMs: 9000,
        inicioClipMs: 6500,
        zoom: 1.12,
      },
    ]);
  });

  it("descarta planos fuera de la toma", () => {
    const t = tramosDePlanos(toma, [
      { desdeMs: 0 },
      { desdeMs: 500, clip: "A" },
      { desdeMs: 9500, clip: "A" },
    ]);
    expect(t.map((x) => x.clip)).toEqual(["A"]);
    expect(t[0].desdeMs).toBe(1000);
  });
});

describe("partirFrase", () => {
  const p = (s: string) => s.split(" ");

  it("si entra, va en un solo grupo", () => {
    expect(partirFrase(p("¿querés tener tu marca acá?"), 5, 28)).toEqual([5]);
  });

  it("reparte parejo (por caracteres) en vez de dejar una palabra sola", () => {
    expect(partirFrase(p("y eso es una tienda online"), 5, 22)).toEqual([4, 2]); // "y eso es una" / "tienda online"
    expect(partirFrase(p("porque si no se te van a ir"), 5, 22)).toEqual([
      3, 5,
    ]); // "porque si no" / "se te van a ir"
  });

  it("en frases largas no deja una palabra sola al principio", () => {
    const f = p(
      "los dueños de negocios de ropa nos dicen siempre lo mismo y estamos cansados de escucharlo",
    );
    const r = partirFrase(f, 5, 22);
    expect(r.reduce((a, b) => a + b, 0)).toBe(f.length);
    expect(Math.min(...r)).toBeGreaterThan(1);
  });

  it("respeta el máximo de palabras", () => {
    const r = partirFrase(p("a b c d e f g h i j k"), 5, 100);
    expect(r.every((x) => x <= 5)).toBe(true);
    expect(r.reduce((a, b) => a + b, 0)).toBe(11);
    expect(r.length).toBe(3);
  });

  it("una palabra más larga que el máximo va sola", () => {
    expect(partirFrase(["supercalifragilístico", "sí"], 5, 10)).toEqual([1, 1]);
  });

  it("frase vacía", () => {
    expect(partirFrase([], 5, 22)).toEqual([]);
  });
});

describe("gruposManuales", () => {
  const dichas = [
    "junto",
    "a",
    "Ignacio,",
    "él",
    "es",
    "el",
    "cofundador",
    "Exactamente.",
    "de",
    "Volto.",
  ];

  it("arma los grupos con el texto escrito y conserva la cantidad de palabras", () => {
    const g = gruposManuales(dichas, [
      "junto a Ignacio.",
      "Él es el cofundador",
      "-Exactamente.",
      "de *Volto.*",
    ]);
    expect(g.map((x) => x.cantidad)).toEqual([3, 4, 1, 2]);
    expect(g[0].textos).toEqual(["junto", "a", "Ignacio."]);
    expect(g[1].textos[0]).toBe("Él");
    expect(g[2].omitir).toBe(true);
    expect(g[3].textos).toEqual(["de", "Volto."]);
    expect(g[3].claves).toEqual([false, true]);
  });

  it("los asteriscos marcan varias palabras seguidas", () => {
    const g = gruposManuales(
      ["somos", "de", "Tienda", "Nube."],
      ["somos de *Tienda Nube.*"],
    );
    expect(g[0].claves).toEqual([false, false, true, true]);
  });

  it("= deja el subtítulo en un renglón", () => {
    const g = gruposManuales(
      ["probablemente", "abre"],
      ["=probablemente abre"],
    );
    expect(g[0].unRenglon).toBe(true);
    expect(g[0].textos).toEqual(["probablemente", "abre"]);
  });

  it("~ une dos palabras que Whisper dio como una y se ve como espacio", () => {
    const g = gruposManuales(["abre", "3 o", "4"], ["abre", "3~o 4"]);
    expect(g[1].textos).toEqual(["3 o", "4"]);
  });

  it("avisa si una palabra no coincide o si faltan subtítulos", () => {
    expect(() => gruposManuales(dichas, ["junto a Pedro."])).toThrow(/Pedro/);
    expect(() => gruposManuales(dichas, ["junto a Ignacio,"])).toThrow(
      /Faltan/,
    );
  });
});

describe("tramosDePlanos: plano fijo", () => {
  it("pasa `fijo` al tramo solo cuando el plano lo pide", () => {
    const t = tramosDePlanos({ clip: "A", desdeMs: 0, hastaMs: 3000 }, [
      { desdeMs: 0 },
      { desdeMs: 1000, zoom: 1.3, fijo: true },
    ]);
    expect(t[0].fijo).toBeUndefined();
    expect(t[1]).toMatchObject({
      zoom: 1.3,
      fijo: true,
      desdeMs: 1000,
      hastaMs: 3000,
    });
  });
});

describe("frameDeSalida", () => {
  const tomas = [
    { clip: "A", desdeMs: 0, hastaMs: 1000 },
    { clip: "A", desdeMs: 5000, hastaMs: 7000 },
  ];

  it("suma las tomas anteriores", () => {
    expect(frameDeSalida(tomas, "A", 500)).toBe(15);
    expect(frameDeSalida(tomas, "A", 6000)).toBe(30 + 30);
  });

  it("null si el momento quedó afuera del montaje", () => {
    expect(frameDeSalida(tomas, "A", 3000)).toBeNull();
    expect(frameDeSalida(tomas, "B", 500)).toBeNull();
  });
});

describe("alargarCortos", () => {
  it("entra antes usando el hueco previo", () => {
    const g = alargarCortos(
      [
        { desde: 0, hasta: 20 },
        { desde: 30, hasta: 34 },
      ],
      12,
      8,
      8,
    );
    expect(g[1]).toEqual({ desde: 22, hasta: 34 });
    expect(g[0].hasta).toBe(20);
  });

  it("toma prestado del anterior sin dejarlo por debajo del mínimo", () => {
    const g = alargarCortos(
      [
        { desde: 0, hasta: 15 },
        { desde: 15, hasta: 20 },
        { desde: 20, hasta: 50 },
      ],
      12,
      8,
      8,
    );
    expect(g[0]).toEqual({ desde: 0, hasta: 12 }); // le sobraban 3
    expect(g[1].desde).toBe(12);
    expect(g[1].hasta - g[1].desde).toBe(12); // el resto lo pone el siguiente
    expect(g[2].desde).toBe(g[1].hasta);
  });

  it("no pasa los máximos ni deja al siguiente corto", () => {
    const g = alargarCortos(
      [
        { desde: 10, hasta: 12 },
        { desde: 12, hasta: 24 },
      ],
      12,
      4,
      4,
      10,
    );
    expect(g[0]).toEqual({ desde: 10, hasta: 12 }); // no hay de dónde sacar
    expect(g[1]).toEqual({ desde: 12, hasta: 24 });
  });
});

describe("cortePiramide", () => {
  it("si entra, un renglón", () => {
    expect(cortePiramide([100, 100], 10, 300)).toBe(0);
  });

  it("arriba más corto que abajo, lo más parejo posible", () => {
    // "es un / vendedor físico" (arriba 170, abajo 420) antes que "es un vendedor / físico"
    expect(cortePiramide([60, 90, 220, 180], 20, 450)).toBe(2);
  });

  it("arriba apenas más largo solo si la pirámide quedaría muy despareja", () => {
    // "para marcas" (400) / "de retail." (360) antes que "para" (140) / "marcas de retail." (620)
    expect(cortePiramide([140, 240, 80, 260], 20, 680)).toBe(2);
    // "ponemos" (270) / "un vendedor," (320) antes que "ponemos un" (350) / "vendedor," (240)
    expect(cortePiramide([270, 60, 240], 20, 500)).toBe(1);
  });

  it("no deja una palabra corta sola en un renglón", () => {
    // "La diferencia" / "es que" y no "La" / "diferencia es que"
    expect(cortePiramide([60, 300, 70, 110], 20, 450)).toBe(2);
  });

  it("si no puede ser pirámide, el corte más parejo", () => {
    expect(cortePiramide([400, 100], 10, 450)).toBe(1);
  });
});

describe("seguimiento de la cara", () => {
  const puntos = [
    [0, 0.4, 0.5, 0.1],
    [0.1, 0.4, 0.5, 0.1],
    [0.2, 0.6, 0.5, 0.1], // salto suelto del detector
    [0.3, 0.4, 0.5, 0.1],
    [0.4, 0.4, 0.5, 0.1],
  ];

  it("suaviza los saltos sueltos y devuelve null sin puntos cerca", () => {
    const c = centroSeguido(puntos, 0.2);
    expect(c?.[0]).toBeGreaterThan(0.4);
    expect(c?.[0]).toBeLessThan(0.5);
    expect(centroSeguido(puntos, 10)).toBeNull();
    expect(centroSeguido(undefined, 0)).toBeNull();
  });

  it("el origen deja la cara en el objetivo y nunca se sale del cuadro", () => {
    const [ox, oy] = origenSeguimiento(0.6, 0.45, 1.5, [0.5, 0.4]);
    // punto de pantalla = o + escala·(cara − o)
    expect(ox + 1.5 * (0.6 - ox)).toBeCloseTo(0.5);
    expect(oy + 1.5 * (0.45 - oy)).toBeCloseTo(0.4);
    expect(origenSeguimiento(0.95, 0.4, 1.2)[0]).toBe(1); // muy al borde: recorte pegado al borde
    expect(origenSeguimiento(0.3, 0.3, 1)).toEqual([0.5, 0.5]);
  });
});

describe("tramosDePlanos: seguir y congelar", () => {
  it("pasa seguir, zoomDesde y el cuadro congelado en tiempo del clip de imagen", () => {
    const t = tramosDePlanos({ clip: "A", desdeMs: 0, hastaMs: 3000 }, [
      {
        desdeMs: 0,
        clip: "B",
        desfaseMs: 200,
        zoom: 1.5,
        zoomDesde: 1.2,
        rampaMs: 900,
        seguir: true,
        congelarMs: 1000,
      },
    ]);
    expect(t[0]).toMatchObject({
      clip: "B",
      zoomDesde: 1.2,
      seguir: true,
      congelarMs: 800,
      inicioClipMs: -200,
    });
  });
});

describe("framesTomaSalida / frameDeSalida con pausa", () => {
  it("la pausa del final suma cuadros y corre las tomas siguientes", () => {
    expect(framesTomaSalida({ desdeMs: 0, hastaMs: 1000, pausaMs: 500 })).toBe(
      45,
    );
    const tomas = [
      { clip: "A", desdeMs: 0, hastaMs: 1000, pausaMs: 500 },
      { clip: "A", desdeMs: 5000, hastaMs: 7000 },
    ];
    expect(frameDeSalida(tomas, "A", 6000)).toBe(45 + 30);
    expect(frameDeSalida(tomas, "A", 1200)).toBeNull(); // la pausa es imagen quieta, no voz
  });
});
