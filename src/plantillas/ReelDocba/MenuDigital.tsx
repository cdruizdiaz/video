// La carta digital de DOCBA (menu.fu.do/coofi/qr-menu) recreada a pantalla completa tal como se ve en la web: cabecera con
// el logo, buscador, fila de categorías con íconos y tarjetas en dos columnas. Corre la página para mostrar "todas las
// opciones": la barra queda fija arriba y la categoría activa va cambiando. Textos y precios de la carta real.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { LOGO_DOCBA } from "../../marcas/docba/logo";
import { DOCBA_AZUL, DOCBA_NARANJA } from "../../marcas/docba/marca";

// ---------- Constantes de animación ----------
const FONDO = "#f3f5f4";
const VERDE = "#1d5b49"; // íconos, precios y subrayado de la web
const TEXTO = "#3d3d3d";
const SECUNDARIO = "#757575";
const CABECERA_ALTO = 430; // px (foto + logo)
const BARRA_ALTO = 250; // buscador + categorías (queda fija arriba al correr la página)
const TARJETA_ALTO = 214;
const TITULO_ALTO = 104;
const COL_GAP = 22;
const MARGEN = 34;
const CATEG_ANCHO = 210;
const ENTRA = 14; // cuadros que tarda en subir la hoja de la carta (con un filo naranja de DOCBA, como el barrido de la placa)
const QUIETO = 9; // cuadros con la página quieta antes de correr (corre cuando la hoja ya casi llegó)
const ASIENTA = 1; // cuadros finales sin correr
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FUENTE = '"IBM Plex Sans Docba", sans-serif';

type Item = { n: string; d?: string; p: string };
const SECCIONES: { id: string; titulo: string; items: Item[] }[] = [
  { id: "especial", titulo: "Especial del día", items: [
    { n: "Menú del día", d: "Elige entre dos opciones pensadas para que tu almuerzo sea épico! Entrada, plato principal, limonada o pomelada fresca y u…", p: "$15.200,00" },
    { n: "Plus Cafe", p: "$2.500,00" },
    { n: "Toston Especial", d: "Estamos lanzando la carta nueva! Queremos que seas el primero en probarlo!", p: "$13.300,00" },
    { n: "Picada de fiambres", p: "$15.000,00" } ] },
  { id: "cafeteria", titulo: "Cafetería", items: [
    { n: "Espresso", d: "Shot de café intenso y cremoso", p: "$3.950,00" },
    { n: "Macchiato", d: "Shot de espresso con espuma de leche texturizada", p: "$4.200,00" },
    { n: "Macchiato doble", d: "Doble shot de espresso con espuma de leche texturizada", p: "$4.400,00" },
    { n: "Doble espresso", d: "Doble shot de espresso", p: "$4.200,00" },
    { n: "Cortadito", d: "Shot de café intenso y cremoso con leche", p: "$4.750,00" },
    { n: "Flat White", d: "Doble espresso con leche", p: "$4.900,00" },
    { n: "Floral Latte", d: "Especialidad de la casa. Shot de espresso, jarabe a base de miel de lavanda y leche texturizada", p: "$5.100,00" },
    { n: "Café con leche", d: "Shot de espresso, leche texturizada y espuma", p: "$5.000,00" } ] },
  { id: "frio", titulo: "Café Frío", items: [
    { n: "Iced Latte", d: "2 shot de café + leche espumada", p: "$5.300,00" },
    { n: "Iced Latte Especial", d: "2 shot de café + leche espumada + Syrup a elección", p: "$5.600,00" },
    { n: "Iced Americano", d: "2 shot de cafe + Agua", p: "$5.000,00" },
    { n: "Espresso Tonic", d: "2 shots de café + agua tónica + una rodaja de limón", p: "$5.800,00" },
    { n: "Frapuccino", d: "2 shot de espresso + leche + syrup a elección + crema batida", p: "$6.300,00" },
    { n: "Cold Brew - Deseado", d: "Elegí la variedad que mas te guste", p: "$5.000,00" } ] },
  { id: "panaderia", titulo: "Panadería", items: [
    { n: "Torta Individual", d: "Consultar disponibilidad", p: "$11.200,00" },
    { n: "Cookies", p: "$5.500,00" },
    { n: "Medialunas", p: "$2.100,00" },
    { n: "Mafalda", d: "2 medialunas rellenas con jamón y queso", p: "$6.500,00" },
    { n: "Criollo Comun x2", p: "$1.800,00" },
    { n: "Surtido de masas finas x4", d: "Degustación de 4 masas finas a elección: pepas, ojitos de buey y palmeritas", p: "$3.500,00" } ] },
  { id: "croissant", titulo: "Croissant", items: [
    { n: "Croissant Clasico", d: "Croissant relleno de jamón cocido y queso", p: "$8.100,00" },
    { n: "Croissant Dulce de Leche y Frutilla", d: "Relleno de dulce de leche y frutillas", p: "$7.600,00" },
    { n: "Croissant Fruta", d: "Fruta de estación y crema chantillí casera", p: "$7.100,00" },
    { n: "Croissant Palta y Huevo", d: "Relleno con guacamole y huevo revuelto", p: "$8.400,00" },
    { n: "Croissant Queso Azul", d: "Queso azul, queso crema, nueces y miel casera", p: "$8.100,00" },
    { n: "Croissant Tano", d: "Queso crema, pesto fresco y tomate cherry", p: "$7.600,00" } ] },
  { id: "desayunos", titulo: "Desayunos y Meriendas", items: [
    { n: "Tradicional", d: "Infusión clásica con dos medialunas, facturas o criollitos y juguito de naranja", p: "$8.200,00" },
    { n: "Tradicional Plus", d: "Infusión clásica con medialunas, facturas o tostadas, mermelada casera…", p: "$9.300,00" },
    { n: "Baires Completo", d: "Infusión clásica con tostadas de pan negro acompañado de palta, huevo revuelto…", p: "$13.800,00" },
    { n: "Frances", d: "Infusión clásica con Omelette de queso y tomate fresco", p: "$10.900,00" },
    { n: "Potente", d: "Infusión clásica con Yogur natural, granola, frutas frescas y miel.", p: "$11.800,00" },
    { n: "Pancake", d: "Pancakes esponjosos, servidos con crema, dulce de leche y frutas", p: "$11.700,00" } ] },
  { id: "tostones", titulo: "Tostones", items: [
    { n: "Tostón Champi & Tomates", d: "Masa madre con guacamole, champiñones dorados y tomates cherry", p: "$11.000,00" },
    { n: "Tostón Huevo Poche & Guacamole", d: "Masa madre con guacamole casero y dos huevos poché", p: "$11.500,00" },
    { n: "Tostón Albahaca & Cherry", d: "Masa madre, queso crema y pesto, tomates cherry asados", p: "$8.100,00" },
    { n: "Tostón Banana Forte", d: "Masa madre con queso crema, banana fresca y miel", p: "$10.100,00" } ] },
];
// categorías de la fila (las de la web, con su ícono); las que no tienen sección en la animación solo acompañan
const CATEGORIAS = [
  { n: "Especial del día", i: "estrella", s: "especial" }, { n: "Cafetería", i: "taza", s: "cafeteria" }, { n: "Café Frio", i: "vaso", s: "frio" },
  { n: "Sin café", i: "botella", s: "" }, { n: "Panadería", i: "pan", s: "panaderia" }, { n: "Croissant", i: "croissant", s: "croissant" },
  { n: "Desayunos y Meriendas", i: "taza", s: "desayunos" }, { n: "Sandwiches", i: "pan", s: "" }, { n: "Tostones", i: "toston", s: "tostones" },
  { n: "Principales", i: "plato", s: "" }, { n: "Promos", i: "plato", s: "" },
];
const filas = (n: number) => Math.ceil(n / 2);
const altoSeccion = (n: number) => TITULO_ALTO + filas(n) * TARJETA_ALTO;
const INICIOS = SECCIONES.map((_, i) => SECCIONES.slice(0, i).reduce((a, s) => a + altoSeccion(s.items.length), 0));
const ALTO_TOTAL = SECCIONES.reduce((a, s) => a + altoSeccion(s.items.length), 0);
// Se detiene cuando el final de la lista llega al borde inferior: nunca queda espacio en blanco debajo (y corre más lento)
const SCROLL_FINAL = CABECERA_ALTO + BARRA_ALTO - 10 + ALTO_TOTAL - 1920;

const Icono: React.FC<{ tipo: string }> = ({ tipo }) => {
  const d: Record<string, string> = {
    estrella: "M20 6l4 9 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1z",
    taza: "M9 16h18v8a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z M27 18h3a4 4 0 0 1 0 8h-3 M15 6c0 3 3 3 3 6 M21 6c0 3 3 3 3 6",
    vaso: "M11 12h18l-2 20H13z M17 5l4 7 M11 19h18",
    botella: "M17 4h6v6l3 5v17H14V15l3-5z M14 21h12",
    pan: "M7 17a6 6 0 0 1 6-6h14a6 6 0 0 1 6 6v14H7z M15 18v8 M25 18v8",
    croissant: "M5 27c4-13 26-13 30 0-7-4-23-4-30 0z M14 18l3 6 M20 16v8 M26 18l-3 6",
    toston: "M5 29l5-15h20l5 15z M12 22h16",
    plato: "M4 28h32 M9 28a11 11 0 0 1 22 0 M20 13v3",
  };
  return (
    <svg width={56} height={56} viewBox="0 0 40 40" fill="none" stroke={VERDE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d[tipo]} />
    </svg>
  );
};

const Tarjeta: React.FC<{ it: Item; ancho: number }> = ({ it, ancho }) => (
  <div
    style={{
      width: ancho,
      height: TARJETA_ALTO - 22,
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
      display: "flex",
      overflow: "hidden",
      fontFamily: FUENTE,
    }}
  >
    <div style={{ flex: 1, padding: "24px 20px 18px 26px", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: TEXTO, lineHeight: 1.15 }}>{it.n}</div>
      {it.d ? (
        <div style={{ fontSize: 22, color: SECUNDARIO, lineHeight: 1.25, marginTop: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {it.d}
        </div>
      ) : null}
      <div style={{ marginTop: "auto", fontSize: 28, fontWeight: 700, color: VERDE }}>{it.p}</div>
    </div>
    <div style={{ width: 150, background: "#f6f6f6", borderLeft: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={96} height={80} viewBox="0 0 96 80" fill="none" stroke="#9a9a9a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <rect x={14} y={38} width={68} height={32} rx={5} />
        <path d="M14 50h68 M14 58h68 M4 72h88" />
        <circle cx={34} cy={30} r={11} />
        <circle cx={52} cy={26} r={10} />
        <path d="M66 22c4-6 10-6 12 0" />
      </svg>
    </div>
  </div>
);

export const MenuDigital: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  // arranca quieta, corre rápido y se asienta sobre la última sección
  const p = Easing.inOut(Easing.cubic)(interpolate(frame, [QUIETO, dur - ASIENTA], [0, 1], clamp));
  const scroll = p * SCROLL_FINAL;
  const barraY = Math.max(0, CABECERA_ALTO - scroll);
  const pos = scroll - (CABECERA_ALTO - BARRA_ALTO) - 20; // posición dentro de las secciones, bajo la barra fija
  const activa = Math.max(0, INICIOS.filter((x) => x <= pos).length - 1);
  const catActiva = CATEGORIAS.findIndex((c) => c.s === SECCIONES[activa].id);
  const colAncho = (1080 - MARGEN * 2 - COL_GAP) / 2;
  const e = Easing.out(Easing.cubic)(interpolate(frame, [0, ENTRA], [0, 1], clamp));
  const sube = (1 - e) * 40; // px que sube mientras se descubre
  const desvioCat = -Math.max(0, catActiva - 1.5) * CATEG_ANCHO;
  return (
    <AbsoluteFill>
    <AbsoluteFill style={{ clipPath: `inset(${(1 - e) * 100}% 0 0 0 round 56px 56px 0 0)`, transform: `translateY(${sube}px)` }}>
    <AbsoluteFill style={{ background: FONDO, overflow: "hidden", fontFamily: FUENTE }}>
      {/* cabecera con "foto" y logo (se va al correr la página) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, height: CABECERA_ALTO + 120, background: `linear-gradient(160deg, #4a3a30 0%, #2c2420 55%, #5b4636 100%)` }}>
        <div style={{ position: "absolute", left: MARGEN, top: 80, display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ width: 190, height: 190, borderRadius: 30, background: DOCBA_AZUL, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
            <svg width={170} height={(170 * LOGO_DOCBA.alto) / LOGO_DOCBA.ancho} viewBox={`0 0 ${LOGO_DOCBA.ancho} ${LOGO_DOCBA.alto}`}>
              {LOGO_DOCBA.letras.map((d, i) => (
                <path key={i} d={d} fill={DOCBA_NARANJA} fillRule="evenodd" />
              ))}
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 76, fontWeight: 700, color: "#fff", lineHeight: 1 }}>DOCBA</div>
            <div style={{ marginTop: 14, fontSize: 30, color: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={26} height={34} viewBox="0 0 26 34" fill="#fff"><path d="M13 0C6 0 0 5.6 0 12.6 0 22 13 34 13 34s13-12 13-21.4C26 5.6 20 0 13 0zm0 17a4.6 4.6 0 110-9.2A4.6 4.6 0 0113 17z" /></svg>
              Buenos Aires 864
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", right: MARGEN, top: 100, display: "flex", gap: 18 }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ width: 84, height: 84, borderRadius: 42, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={44} height={44} viewBox="0 0 44 44" fill="none" stroke="#222" strokeWidth={3.4} strokeLinecap="round">
                {k === 0 ? <path d="M22 5a17 17 0 00-14.6 25.6L5 39l8.700-2.300A17 17 0 1022 5zm-5.500 10c1 3 3 6 6 8.500s5 3 7 1.500" /> : (<><rect x={6} y={6} width={32} height={32} rx={9} /><circle cx={22} cy={22} r={7.500} /><circle cx={31} cy={13} r={1.200} /></>)}
              </svg>
            </div>
          ))}
        </div>
      </div>
      {/* hoja blanca con esquinas redondeadas */}
      <div style={{ position: "absolute", left: 0, right: 0, top: barraY === 0 ? 0 : CABECERA_ALTO - scroll - 60, bottom: 0, background: FONDO, borderRadius: barraY === 0 ? 0 : "56px 56px 0 0" }} />
      {/* lista de secciones */}
      <div style={{ position: "absolute", left: 0, right: 0, top: CABECERA_ALTO + BARRA_ALTO - 10 - scroll }}>
        {SECCIONES.map((s) => (
          <div key={s.id} style={{ height: altoSeccion(s.items.length) }}>
            <div style={{ height: TITULO_ALTO, padding: `0 ${MARGEN + 8}px`, display: "flex", alignItems: "flex-end", paddingBottom: 18, fontSize: 40, fontWeight: 700, color: TEXTO }}>{s.titulo}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: COL_GAP, padding: `0 ${MARGEN}px` }}>
              {s.items.map((it) => (
                <Tarjeta key={it.n} it={it} ancho={colAncho} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: Math.max(0, 1920 - ALTO_TOTAL) }} />
      </div>
      {/* barra fija: buscador + categorías */}
      <div style={{ position: "absolute", left: 0, right: 0, top: barraY, height: BARRA_ALTO, background: FONDO, boxShadow: barraY === 0 ? "0 4px 14px rgba(0,0,0,0.10)" : "none" }}>
        <div style={{ margin: `${barraY === 0 ? 24 : 40}px ${MARGEN}px 0`, height: 84, background: "#fff", borderRadius: 14, border: "1px solid #e4e4e4", display: "flex", alignItems: "center", padding: "0 26px", gap: 20, fontSize: 30, color: SECUNDARIO }}>
          <svg width={34} height={34} viewBox="0 0 34 34" fill="none" stroke="#222" strokeWidth={4} strokeLinecap="round"><circle cx={14} cy={14} r={9} /><path d="M21 21l9 9" /></svg>
          Buscar por productos
        </div>
        <div style={{ position: "relative", overflow: "hidden", marginTop: 18, height: 130 }}>
          <div style={{ display: "flex", transform: `translateX(${MARGEN + desvioCat}px)` }}>
            {CATEGORIAS.map((c, i) => (
              <div key={c.n} style={{ width: CATEG_ANCHO, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: VERDE, fontWeight: 700, fontSize: 24, textAlign: "center", lineHeight: 1.1, paddingBottom: 10, borderBottom: i === catActiva ? `5px solid ${VERDE}` : "5px solid transparent" }}>
                <Icono tipo={c.i} />
                {c.n}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* velo oscuro abajo: los subtítulos blancos se leen sobre la hoja clara */}
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(20,26,24,0.88) 0%, rgba(20,26,24,0.6) 22%, rgba(20,26,24,0) 42%)" }} />
    </AbsoluteFill>
    </AbsoluteFill>
    <div style={{ position: "absolute", left: 0, right: 0, top: (1 - e) * 1920 + sube - 7, height: 14, background: DOCBA_NARANJA, opacity: 1 - e * e * e }} />
    </AbsoluteFill>
  );
};
