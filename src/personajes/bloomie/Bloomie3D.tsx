// Bloomie en 3D (Three.js / @remotion/three), construido por código a partir de sus piezas vectoriales (no hay un
// modelo 3D hecho por un diseñador): cabeza y cuerpo como volúmenes elipsoidales con las medidas de piezas.json,
// pétalos extruidos desde sus contornos reales del .ai (con borde redondeado) e inclinados hacia atrás como una flor,
// manos y pies redondeados, y contorno de dibujo animado (casco invertido). Se anima con los mismos huesos y poses del
// rig 2D (matricesMundo): la pose de cada hueso se aplica como matriz 3D. La cara (ojos, boca, anteojos, expresiones,
// lip sync) se dibuja en 2D encima, siguiendo la cabeza: ver caraEnEscena().
// Coordenadas del modelo: las del .ai (puntos, origen en los pies, y hacia abajo); el grupo raíz invierte la y.
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { matricesMundo, type Matriz, type Pose } from "../../rig/pose";
import { cargarPersonaje } from "../../rig/personajes";

// ---------- Forma (puntos del .ai) ----------
const COLORES = { cabeza: "#ef913c", petalo: "#dc7b26", cuerpo: "#ef913c", pie: "#ea8021", mano: "#ef913c", contorno: "#a8650a" };
const PROF = { cabeza: 0.72, cuerpo: 0.78 }; // radio en z como fracción del radio en x
const PETALO = { grosor: 16, bisel: 9, atras: -42, inclina: 0.42 }; // pt · pt · z detrás del centro de la cabeza · rad
const CONTORNO = 3.2; // pt de contorno
const MATERIAL = { rugosidad: 0.62, metal: 0 };
export const CARA_Z = 0.86; // la cara va sobre la cabeza, a esta fracción del radio en z

type Elipsoide = { c: [number, number, number]; r: [number, number, number] };

const m4 = (m: Matriz) => new THREE.Matrix4().set(m[0], m[2], 0, m[4], m[1], m[3], 0, m[5], 0, 0, 1, 0, 0, 0, 0, 1);

const caja2 = (c: number[]) => ({ cx: (c[0] + c[2]) / 2, cy: (c[1] + c[3]) / 2, rx: (c[2] - c[0]) / 2, ry: (c[3] - c[1]) / 2 });

// Datos del modelo a partir de piezas.json y rig.json (una sola vez)
const modelo = (() => {
  const p = cargarPersonaje("bloomie");
  const v = p.piezas.vistas.frente;
  const pieza = (id: string) => v.piezas.find((x) => x.id === id);
  const cab = caja2(v.cabeza!.caja);
  const cue = caja2(pieza("cuerpo")!.caja);
  const cabeza: Elipsoide = { c: [cab.cx, cab.cy, 0], r: [cab.rx * 0.98, cab.ry * 0.98, cab.rx * PROF.cabeza] };
  const cuerpo: Elipsoide = { c: [cue.cx, cue.cy + 6, -8], r: [cue.rx * 0.82, cue.ry * 1.05, cue.rx * PROF.cuerpo] };
  // Pétalos: el contorno del relleno principal, extruido
  const loader = new SVGLoader();
  const petalos = v.piezas
    .filter((x) => x.rol === "corona")
    .map((x) => {
      const t = x.trazos.find((tr) => tr.fill && (tr.op ?? 1) > 0.9)!;
      const shapes = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${t.d}"/></svg>`).paths.flatMap((pa) => pa.toShapes());
      const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: PETALO.grosor,
        bevelEnabled: true,
        bevelThickness: PETALO.bisel,
        bevelSize: PETALO.bisel * 0.8,
        bevelSegments: 4,
        curveSegments: 10,
      });
      geo.translate(0, 0, -PETALO.grosor / 2);
      geo.computeVertexNormals();
      const c = caja2(x.caja);
      return { id: x.id, geo, centro: [c.cx, c.cy] as [number, number] };
    });
  const centroMano = (id: string, lado: number) => {
    const c = pieza(id)!.caja;
    // la "manito" es la punta de afuera de la pieza (la parte del medio queda detrás del cuerpo)
    const x = lado < 0 ? c[0] + 16 : c[2] - 16;
    return [x, c[3] - 26] as [number, number];
  };
  const centroPie = (id: string) => {
    const c = caja2(pieza(id)!.caja);
    return [c.cx + (c.cx < 0 ? 2 : -2), -15] as [number, number];
  };
  return {
    rig: p.rig.vistas.frente,
    cabeza,
    cuerpo,
    petalos,
    manos: [
      { id: "mano_izq", c: centroMano("mano_izq", -1) },
      { id: "mano_der", c: centroMano("mano_der", 1) },
    ],
    pies: [
      { id: "pie_izq", c: centroPie("pie_izq") },
      { id: "pie_der", c: centroPie("pie_der") },
    ],
  };
})();

export const CABEZA_3D = modelo.cabeza;

// ---------- Mallas ----------
const esfera = new THREE.SphereGeometry(1, 48, 32);

const Material: React.FC<{ color: string }> = ({ color }) => (
  <meshStandardMaterial color={color} roughness={MATERIAL.rugosidad} metalness={MATERIAL.metal} side={THREE.DoubleSide} />
);

// Elipsoide con contorno (casco invertido: la misma forma un poco más grande, de color oscuro y del lado de atrás)
const Volumen: React.FC<{ e: Elipsoide; color: string }> = ({ e, color }) => (
  <group position={e.c}>
    <mesh geometry={esfera} scale={e.r} castShadow>
      <Material color={color} />
    </mesh>
    <mesh geometry={esfera} scale={e.r.map((r) => r + CONTORNO) as [number, number, number]}>
      <meshBasicMaterial color={COLORES.contorno} side={THREE.BackSide} />
    </mesh>
  </group>
);

const Petalo: React.FC<{ geo: THREE.ExtrudeGeometry; centro: [number, number]; pivote: number[] }> = ({ geo, centro, pivote }) => {
  // Se inclina hacia atrás alrededor de su raíz (eje perpendicular a la dirección cabeza → pétalo)
  const q = useMemo(() => {
    const ux = centro[0] - modelo.cabeza.c[0];
    const uy = centro[1] - modelo.cabeza.c[1];
    const n = Math.hypot(ux, uy) || 1;
    const eje = new THREE.Vector3(-uy / n, ux / n, 0);
    return new THREE.Quaternion().setFromAxisAngle(eje, PETALO.inclina);
  }, [centro]);
  return (
    <group position={[pivote[0], pivote[1], PETALO.atras]} quaternion={q}>
      <group position={[-pivote[0], -pivote[1], 0]}>
        <mesh geometry={geo} castShadow>
          <Material color={COLORES.petalo} />
        </mesh>
        <mesh geometry={geo} scale={[1.02, 1.02, 1.25]}>
          <meshBasicMaterial color={COLORES.contorno} side={THREE.BackSide} />
        </mesh>
      </group>
    </group>
  );
};

// Un hueso del rig 2D como grupo 3D (matriz de mundo del hueso)
const Hueso: React.FC<{ m?: Matriz; children: React.ReactNode }> = ({ m, children }) => {
  const mat = useMemo(() => (m ? m4(m) : new THREE.Matrix4()), [m]);
  return (
    <group matrixAutoUpdate={false} matrix={mat}>
      {children}
    </group>
  );
};

// Bloomie 3D con la pose del rig (vista de frente) y girado `rotY` radianes alrededor del eje vertical
export const Bloomie3D: React.FC<{ pose: Pose; rotY: number; escala: number }> = ({ pose, rotY, escala }) => {
  const mundo = matricesMundo(modelo.rig, { ...pose, vista: "frente" });
  const huesoDe = (pieza: string) => mundo[modelo.rig.piezas[pieza] ?? "raiz"];
  return (
    <group rotation={[0, rotY, 0]} scale={[escala, -escala, escala]}>
      <Hueso m={huesoDe("cuerpo")}>
        <Volumen e={modelo.cuerpo} color={COLORES.cuerpo} />
      </Hueso>
      {modelo.pies.map((p) => (
        <Hueso key={p.id} m={huesoDe(p.id)}>
          <Volumen e={{ c: [p.c[0], p.c[1], 6], r: [20, 15, 25] }} color={COLORES.pie} />
        </Hueso>
      ))}
      {modelo.manos.map((m) => (
        <Hueso key={m.id} m={huesoDe(m.id)}>
          <Volumen e={{ c: [m.c[0], m.c[1], 14], r: [15, 22, 15] }} color={COLORES.mano} />
        </Hueso>
      ))}
      <Hueso m={huesoDe("cabeza")}>
        <Volumen e={modelo.cabeza} color={COLORES.cabeza} />
      </Hueso>
      {modelo.petalos.map((pt) => {
        const hueso = modelo.rig.huesos.find((h) => h.id === modelo.rig.piezas[pt.id]);
        return (
          <Hueso key={pt.id} m={mundo[modelo.rig.piezas[pt.id]]}>
            <Petalo geo={pt.geo} centro={pt.centro} pivote={hueso?.pivote ?? pt.centro} />
          </Hueso>
        );
      })}
    </group>
  );
};


// ---------- Escena 3D lista para usar ----------
// Canvas transparente del tamaño del cuadro, cámara ortográfica en píxeles (x a la derecha, y hacia abajo como en
// SVG), luz de arriba a la izquierda y un plano de piso invisible que solo recibe la sombra. Render con --gl=angle.
const LUZ_3D = { pos: [-650, 900, 1000] as [number, number, number], intensidad: 1.3, ambiente: 1.05, cielo: 0.35 };
const SOMBRA_3D = { opacidad: 0.4, inclina: 0.35 }; // el plano del piso se inclina hacia cámara (rad)

export const EscenaBloomie3D: React.FC<{
  pose: Pose;
  rotY: number; // radianes (π/2 = de perfil mirando a la derecha)
  x: number; // pies en el cuadro (px)
  yPies: number;
  escala: number; // pt del .ai → px
  ancho: number;
  alto: number;
  sombra?: number; // opacidad de la sombra en el piso
}> = ({ pose, rotY, x, yPies, escala, ancho, alto, sombra = SOMBRA_3D.opacidad }) => {
  const objetivo = useMemo(() => new THREE.Object3D(), []);
  return (
    <ThreeCanvas
      width={ancho}
      height={alto}
      orthographic
      flat // sin mapeo de tonos: respeta los colores de Bloomie
      shadows="soft"
      camera={{ position: [ancho / 2, -alto / 2, 2000], rotation: [0, 0, 0], zoom: 1, near: 1, far: 6000 }}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <ambientLight intensity={LUZ_3D.ambiente} />
      <hemisphereLight args={["#fff4e0", "#6b4a3a", LUZ_3D.cielo]} />
      <group position={[x, -yPies, 0]}>
        <primitive object={objetivo} />
        <directionalLight
          position={LUZ_3D.pos}
          intensity={LUZ_3D.intensidad}
          target={objetivo}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-700}
          shadow-camera-right={700}
          shadow-camera-top={700}
          shadow-camera-bottom={-700}
          shadow-camera-near={1}
          shadow-camera-far={4000}
          shadow-bias={-0.0008}
        />
        <mesh rotation={[-Math.PI / 2 + SOMBRA_3D.inclina, 0, 0]} receiveShadow>
          <planeGeometry args={[1600, 1600]} />
          <shadowMaterial opacity={sombra} />
        </mesh>
        <Bloomie3D pose={pose} rotY={rotY} escala={escala} />
      </group>
    </ThreeCanvas>
  );
};

// Transformación (SVG) para dibujar la cara 2D sobre la cabeza 3D: la cara es un plano a CARA_Z del centro de la
// cabeza que gira con el cuerpo (se angosta con el coseno y se corre con el seno). De perfil no queda de canto:
// se apoya sobre el costado de la cabeza (así se ve el ojo de ese lado).
export const caraEnEscena = (pose: Pose, rotY: number) => {
  const mundo = matricesMundo(modelo.rig, { ...pose, vista: "frente" });
  const mc = mundo[modelo.rig.rostro.hueso] ?? mundo.raiz;
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  const zf = modelo.cabeza.r[2] * CARA_Z;
  const lado = modelo.cabeza.r[2] * 0.62;
  const ancho = Math.max(c, 0.38);
  const corre = s * (lado + (zf - lado) * Math.max(0, c));
  const cx = modelo.cabeza.c[0];
  // x' = cx + ancho·(x − cx) + corre   (alrededor del centro de la cabeza)
  const giro: Matriz = [ancho, 0, 0, 1, cx - ancho * cx + corre, 0];
  return { matriz: multiplicar2(giro, mc), visible: true };
};

const multiplicar2 = (m: Matriz, n: Matriz): Matriz => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
