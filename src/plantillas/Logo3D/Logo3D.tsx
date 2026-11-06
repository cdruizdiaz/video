// Plantilla Logo3D: entrada de marca con el logo extruido en 3D (Three.js / @remotion/three, render con --gl=angle).
// El contorno sale de un SVG (scripts/vectorizar_logo.py desde el logo.png del kit de marca, o un SVG del cliente);
// la cara de adelante lleva el PNG original como textura (respeta sus colores) y los costados el color de marca.
// Animaciones: "giro" (entra girando), "caida" (cae y rebota), "armado" (cada pieza llega volando por separado).
// Después de la entrada pasa un brillo por el bisel y, si hay texto, aparece debajo con la fuente de la marca.
// `desenfoque`: motion blur durante la entrada (giro, caída o armado); después queda nítido. Cada muestra es otro
// lienzo WebGL: con --gl=angle, 5 muestras en borrador y 10 en la final.
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { z } from "zod";
import { ConDesenfoque } from "../comunes/Desenfoque";
import { zDesenfoque } from "../comunes/tramosDesenfoque";

// ---------- Constantes ----------
const ANCHO_LOGO = 0.72; // fracción del ancho del cuadro que ocupa el logo
const ALTO_MAX = 0.4; // y como mucho esta fracción del alto (logos altos, como un personaje)
const ENTRADA = 40; // frames de la animación de entrada
const ESCALONADO = 5; // frames entre piezas en "armado"
const BRILLO = { desde: ENTRADA + 6, dura: 26 }; // brillo que cruza el logo
const TEXTO = { desde: ENTRADA - 6, dura: 14, separacion: 70 };
const CAMARA = { fov: 28, distancia: 2600 };
const MATERIAL = { rugosidad: 0.38, metal: 0.25 };

export const zLogo3D = z.object({
  svg: z.string(), // contorno (dentro de public/)
  textura: z.string().nullable().default(null), // PNG del mismo tamaño para la cara de adelante (null = colorFrente)
  colorFrente: z.string().default("#ffffff"),
  colorCostado: z.string(), // costados y bisel (color de marca)
  fondo: z.string().nullable().default("#101014"), // null = transparente
  profundidad: z.number().default(0.12), // grosor relativo al alto del logo
  bisel: z.number().default(0.02), // relativo al alto del logo
  animacion: z.enum(["giro", "caida", "armado"]).default("giro"),
  texto: z.string().nullable().default(null),
  subtexto: z.string().nullable().default(null),
  colorTexto: z.string().default("#ffffff"),
  fuente: z.string().default("sans-serif"),
  desenfoque: zDesenfoque,
});
export type Logo3DProps = z.input<typeof zLogo3D>;

// ---------- Carga (SVG y textura) antes de dibujar ----------
const useRecurso = <T,>(cargar: () => Promise<T>, clave: string): T | null => {
  const [valor, setValor] = useState<T | null>(null);
  const [espera] = useState(() => delayRender(`Logo3D ${clave}`));
  useEffect(() => {
    cargar()
      .then((v) => {
        setValor(v);
        continueRender(espera);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return valor;
};

type Pieza = { geo: THREE.ExtrudeGeometry; centro: THREE.Vector3 };

const Escena: React.FC<{ p: z.output<typeof zLogo3D>; piezas: Pieza[]; tam: [number, number]; textura: THREE.Texture | null }> = ({ p, piezas, tam, textura }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Cámara en perspectiva: en el plano z = 0 entran 2·d·tan(fov/2) unidades de alto en `height` px
  const pxPorUnidad = height / (2 * CAMARA.distancia * Math.tan((CAMARA.fov * Math.PI) / 360));
  const escala = Math.min((width * ANCHO_LOGO) / tam[0], (height * ALTO_MAX) / tam[1]) / pxPorUnidad;
  const ent = spring({ frame: f, fps, durationInFrames: ENTRADA, config: { damping: 12, mass: 0.9 } });
  // Logo completo: giro o caída
  let rotY = 0;
  let y = 0;
  let rotX = 0;
  if (p.animacion === "giro") rotY = (1 - ent) * -Math.PI * 1.25;
  if (p.animacion === "caida") {
    y = (1 - ent) * tam[1] * escala * 4;
    rotX = (1 - ent) * 0.6;
  }
  // Balanceo leve después de entrar (que no quede muerto)
  const vivo = Math.sin((f - ENTRADA) / 22) * 0.06 * interpolate(f, [ENTRADA, ENTRADA + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Brillo: una luz puntual cruza de izquierda a derecha por delante del logo
  const b = interpolate(f, [BRILLO.desde, BRILLO.desde + BRILLO.dura], [-1.2, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lados = useMemo(
    () => new THREE.MeshStandardMaterial({ color: p.colorCostado, roughness: MATERIAL.rugosidad, metalness: MATERIAL.metal }),
    [p.colorCostado],
  );
  const frente = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: textura ? "#ffffff" : p.colorFrente,
        map: textura,
        transparent: !!textura,
        alphaTest: 0.5,
        roughness: MATERIAL.rugosidad,
        metalness: 0.05,
      }),
    [textura, p.colorFrente],
  );
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[-600, 800, 1500]} intensity={1.6} />
      <directionalLight position={[700, -300, 900]} intensity={0.5} />
      <pointLight position={[b * tam[0] * escala * 0.6, 200, 600]} intensity={f >= BRILLO.desde && f <= BRILLO.desde + BRILLO.dura ? 4.5e5 : 0} distance={2200} decay={2} />
      <group position={[0, y, 0]} rotation={[rotX, rotY + vivo, 0]} scale={[escala, -escala, escala]}>
        <group position={[-tam[0] / 2, -tam[1] / 2, 0]}>
          {piezas.map((pz, i) => {
            // "armado": cada pieza llega desde un lugar al azar, escalonadas
            let off = [0, 0, 0];
            let giro = 0;
            if (p.animacion === "armado") {
              const s = spring({ frame: f - i * ESCALONADO, fps, durationInFrames: ENTRADA, config: { damping: 13 } });
              const k = 1 - s;
              off = [(random(`x${i}`) - 0.5) * tam[0] * 2 * k, (random(`y${i}`) - 0.5) * tam[1] * 5 * k, (random(`z${i}`) * 900 + 300) * k];
              giro = (random(`r${i}`) - 0.5) * 3 * k;
            }
            return (
              <group key={i} position={[pz.centro.x + off[0], pz.centro.y + off[1], off[2]]} rotation={[0, giro, giro * 0.5]}>
                <mesh geometry={pz.geo} position={[-pz.centro.x, -pz.centro.y, 0]} material={[frente, lados]} />
              </group>
            );
          })}
        </group>
      </group>
    </>
  );
};

export const Logo3D: React.FC<Logo3DProps> = (entrada) => {
  const p = zLogo3D.parse(entrada);
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const svg = useRecurso(() => fetch(staticFile(p.svg)).then((r) => r.text()), p.svg);
  const textura = useRecurso<THREE.Texture | null>(
    () =>
      p.textura
        ? new THREE.TextureLoader().loadAsync(staticFile(p.textura)).then((t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            return t;
          })
        : Promise.resolve(null),
    p.textura ?? "sin-textura",
  );
  const datos = useMemo(() => {
    if (!svg) return null;
    const r = new SVGLoader().parse(svg);
    const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100").split(/\s+/).map(Number);
    const tam: [number, number] = [vb[2], vb[3]];
    const shapes = r.paths.flatMap((pa) => SVGLoader.createShapes(pa));
    const prof = tam[1] * p.profundidad;
    const bis = tam[1] * p.bisel;
    const piezas = shapes.map((s) => {
      const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: bis > 0, bevelThickness: bis, bevelSize: bis * 0.7, bevelSegments: 3, curveSegments: 6 });
      geo.translate(0, 0, -prof / 2);
      // UV de las tapas = coordenadas del SVG → textura: u = x/ancho, v = 1 − y/alto
      const uv = geo.getAttribute("uv");
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tam[0], 1 - uv.getY(i) / tam[1]);
      geo.computeBoundingBox();
      const centro = new THREE.Vector3();
      geo.boundingBox!.getCenter(centro);
      return { geo, centro };
    });
    return { piezas, tam };
  }, [svg, p.profundidad, p.bisel]);
  const t = interpolate(f, [TEXTO.desde, TEXTO.desde + TEXTO.dura], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const altoLogo = datos ? Math.min(width * ANCHO_LOGO * (datos.tam[1] / datos.tam[0]), height * ALTO_MAX) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: p.fondo ?? "transparent" }}>
      {datos && svg !== null && textura !== undefined && (
        <ConDesenfoque
          desenfoque={p.desenfoque}
          tramos={[{ desde: 0, hasta: ENTRADA + (p.animacion === "armado" ? datos.piezas.length * ESCALONADO : 0) }]}
        >
          <ThreeCanvas width={width} height={height} camera={{ fov: CAMARA.fov, position: [0, 0, CAMARA.distancia], near: 10, far: 20000 }} style={{ position: "absolute" }}>
            <Escena p={p} piezas={datos.piezas} tam={datos.tam} textura={textura} />
          </ThreeCanvas>
        </ConDesenfoque>
      )}
      {p.texto && (
        <div
          style={{
            position: "absolute",
            top: height / 2 + altoLogo / 2 + TEXTO.separacion,
            width: "100%",
            textAlign: "center",
            fontFamily: p.fuente,
            color: p.colorTexto,
            opacity: t,
            transform: `translateY(${(1 - t) * 30}px)`,
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: 2 }}>{p.texto}</div>
          {p.subtexto && <div style={{ fontSize: 38, opacity: 0.8, marginTop: 12 }}>{p.subtexto}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};
