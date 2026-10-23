// Robot 3D por código (Three.js / @remotion/three), armadura roja y dorada con reactor en el pecho, que se arma
// directamente sobre el esqueleto de una persona filmada (scripts/rig/esqueleto.py: 33 puntos de MediaPipe en px
// del video). No usa el rig 2D: cada segmento del cuerpo va de un punto al otro, así el robot queda encima de la
// persona y la tapa aunque la cámara se mueva. Opcional: guitarra entre la mano que rasguea y la que pisa.
// Coordenadas: px del cuadro (x a la derecha, y hacia abajo, z hacia el fondo); el grupo raíz las pasa a Three.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// ---------- Aspecto ----------
const COLOR = {
  rojo: "#a50f19",
  oro: "#d6a43c",
  oscuro: "#26262b",
  brillo: "#c8f7ff",
  madera: "#b8642a",
  maderaOscura: "#4a2a14",
  cuerda: "#e8e2d0",
};
const METAL = { metal: 0.72, rugosidad: 0.3, entorno: 1.1 };
const BRILLO_OJOS = 4; // intensidad emisiva de ojos y reactor
// Grosores como fracción del ancho de hombros (S)
const R = {
  brazo: 0.17,
  antebrazo: 0.15,
  codo: 0.15,
  mano: 0.15,
  muslo: 0.23,
  pierna: 0.19,
  rodilla: 0.19,
  bota: 0.15,
  hombrera: 0.26,
};
const PECHO = { ancho: 0.78, fondo: 0.36 }; // × S (la remera es más ancha que los hombros)
const CABEZA = { rx: 0.27, ry: 0.33, rz: 0.28, sube: 0.14 }; // radios (× S) y cuánto se sube sobre las orejas
const MASCARA = { y: 0.1, z: -0.5, rx: 0.82, ry: 0.86, rz: 0.55 }; // máscara dorada (× radios del casco)
const MASTIL = 0.27; // rad que se levanta el mástil respecto de la línea entre las manos
const PROFUNDIDAD = 0.4; // cuánto de la z de MediaPipe se usa (es ruidosa)
const GIRO_MAX = { yaw: 0.6, pitch: 0.3 }; // rad
const GUITARRA = { atras: -0.05, abajo: 0.12, delante: 0.45, manos: 0.12 }; // × S (la guitarra real mide ~3 S)
const LUZ = {
  ambiente: 0.35,
  cielo: 0.9,
  clave: { pos: [-600, 800, 900] as const, intensidad: 1.5 },
  contra: { pos: [-900, 700, -900] as const, intensidad: 1.4 }, // sol de atrás a la izquierda
};

// Puntos de MediaPipe Pose
const P = {
  nariz: 0,
  orejaI: 7,
  orejaD: 8,
  hombroI: 11,
  hombroD: 12,
  codoI: 13,
  codoD: 14,
  munecaI: 15,
  munecaD: 16,
  indiceI: 19,
  indiceD: 20,
  caderaI: 23,
  caderaD: 24,
  rodillaI: 25,
  rodillaD: 26,
  tobilloI: 27,
  tobilloD: 28,
  puntaI: 31,
  puntaD: 32,
};

export type PuntoEsqueleto = [number, number, number, number]; // x, y, z (px), visibilidad
export type CabezaEsqueleto = { yaw: number; pitch: number; roll: number; boca: number } | null;
export type Robot3DProps = {
  puntos: PuntoEsqueleto[]; // 33 puntos de un cuadro
  cabeza?: CabezaEsqueleto;
  guitarra?: boolean;
  mano?: "derecha" | "izquierda"; // mano de la persona que rasguea (derecha = queda a la izquierda de la pantalla)
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------- Mallas ----------
const Metal: React.FC<{ color: string }> = ({ color }) => (
  <meshStandardMaterial color={color} metalness={METAL.metal} roughness={METAL.rugosidad} envMapIntensity={METAL.entorno} />
);
const Mate: React.FC<{ color: string; rugosidad?: number }> = ({ color, rugosidad = 0.6 }) => (
  <meshStandardMaterial color={color} metalness={0} roughness={rugosidad} />
);
const Luz: React.FC<{ intensidad?: number }> = ({ intensidad = BRILLO_OJOS }) => (
  <meshStandardMaterial color={COLOR.brillo} emissive={COLOR.brillo} emissiveIntensity={intensidad} toneMapped={false} />
);

const esfera = new THREE.SphereGeometry(1, 40, 28);

const Elipsoide: React.FC<{ c: THREE.Vector3 | [number, number, number]; r: [number, number, number]; children: React.ReactNode }> = ({ c, r, children }) => (
  <mesh geometry={esfera} position={c} scale={r}>
    {children}
  </mesh>
);

// Cápsula de a → b
const Segmento: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; color: string }> = ({ a, b, r, color }) => {
  const d = b.clone().sub(a);
  const largo = Math.max(1, d.length());
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
  const geo = useMemo(() => new THREE.CapsuleGeometry(r, largo, 8, 20), [r, largo]);
  return (
    <mesh geometry={geo} position={a.clone().lerp(b, 0.5)} quaternion={q}>
      <Metal color={color} />
    </mesh>
  );
};

// Grupo con una base (ejes x, y, z en coordenadas del cuadro) y origen
const Base: React.FC<{ o: THREE.Vector3; x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3; children: React.ReactNode }> = ({ o, x, y, z, children }) => {
  const m = new THREE.Matrix4().makeBasis(x, y, z).setPosition(o);
  return (
    <group matrixAutoUpdate={false} matrix={m}>
      {children}
    </group>
  );
};

// Reflejos del metal: entorno de estudio generado por código (sin archivos HDR)
const Entorno: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }, [gl, scene]);
  return null;
};

// ---------- Partes ----------
const Torso: React.FC<{ hI: THREE.Vector3; hD: THREE.Vector3; cI: THREE.Vector3; cD: THREE.Vector3; S: number }> = ({ hI, hD, cI, cD, S }) => {
  const mh = hI.clone().add(hD).multiplyScalar(0.5);
  const mc = cI.clone().add(cD).multiplyScalar(0.5);
  const T = mh.distanceTo(mc);
  const x = hI.clone().sub(hD).normalize(); // hacia la derecha de la pantalla
  const yb = mc.clone().sub(mh).normalize(); // hacia abajo (columna)
  const z = x.clone().cross(yb).normalize(); // hacia el fondo
  const y = z.clone().cross(x).normalize();
  return (
    <Base o={mh} x={x} y={y} z={z}>
      {/* pecho, abdomen y cinturón */}
      <Elipsoide c={[0, 0.3 * T, 0]} r={[PECHO.ancho * S, 0.45 * T, PECHO.fondo * S]}>
        <Metal color={COLOR.rojo} />
      </Elipsoide>
      <Elipsoide c={[0, 0.68 * T, 0.02 * S]} r={[0.62 * S, 0.32 * T, 0.31 * S]}>
        <Metal color={COLOR.oro} />
      </Elipsoide>
      <Elipsoide c={[0, 0.98 * T, 0.02 * S]} r={[0.66 * S, 0.2 * T, 0.32 * S]}>
        <Metal color={COLOR.rojo} />
      </Elipsoide>
      {/* reactor en el pecho */}
      <mesh position={[0, 0.2 * T, -0.35 * S]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13 * S, 0.13 * S, 0.05 * S, 40]} />
        <Metal color={COLOR.oscuro} />
      </mesh>
      <mesh position={[0, 0.2 * T, -0.38 * S]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09 * S, 0.09 * S, 0.03 * S, 40]} />
        <Luz />
      </mesh>
      {/* cuello */}
      <mesh position={[0, -0.12 * T, 0]}>
        <cylinderGeometry args={[0.13 * S, 0.16 * S, 0.3 * T, 24]} />
        <Metal color={COLOR.oscuro} />
      </mesh>
    </Base>
  );
};

// z (× rz) de la superficie de la máscara en (x, y) (× rx, ry), apenas por fuera
const sobreMascara = (x: number, y: number) =>
  MASCARA.z - MASCARA.rz * Math.sqrt(Math.max(0, 1 - (x / MASCARA.rx) ** 2 - ((y - MASCARA.y) / MASCARA.ry) ** 2)) - 0.02;

const Casco: React.FC<{ oI: THREE.Vector3; oD: THREE.Vector3; S: number; cabeza?: CabezaEsqueleto }> = ({ oI, oD, S, cabeza }) => {
  const c = oI.clone().add(oD).multiplyScalar(0.5);
  c.y -= CABEZA.sube * S;
  const roll = Math.atan2(oI.y - oD.y, oI.x - oD.x);
  const yaw = THREE.MathUtils.clamp(cabeza?.yaw ?? 0, -GIRO_MAX.yaw, GIRO_MAX.yaw);
  const pitch = THREE.MathUtils.clamp(cabeza?.pitch ?? 0, -GIRO_MAX.pitch, GIRO_MAX.pitch);
  const boca = THREE.MathUtils.clamp((cabeza?.boca ?? 0) * 2.5, 0, 1);
  const rx = CABEZA.rx * S;
  const ry = CABEZA.ry * S;
  const rz = CABEZA.rz * S;
  return (
    <group position={c} rotation={[pitch, yaw, roll, "ZYX"]}>
      <Elipsoide c={[0, 0, 0]} r={[rx, ry, rz]}>
        <Metal color={COLOR.rojo} />
      </Elipsoide>
      {/* máscara dorada */}
      <Elipsoide c={[0, MASCARA.y * ry, MASCARA.z * rz]} r={[MASCARA.rx * rx, MASCARA.ry * ry, MASCARA.rz * rz]}>
        <Metal color={COLOR.oro} />
      </Elipsoide>
      {/* ojos */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.34 * rx, -0.12 * ry, sobreMascara(0.34, -0.12) * rz]} rotation={[0, l * 0.45, l * -0.14]}>
          <boxGeometry args={[0.44 * rx, 0.15 * ry, 0.08 * rz]} />
          <Luz />
        </mesh>
      ))}
      {/* boca: se ilumina cuando canta */}
      <mesh position={[0, 0.55 * ry, sobreMascara(0, 0.55) * rz]}>
        <boxGeometry args={[0.42 * rx, 0.04 * ry + 0.08 * ry * boca, 0.08 * rz]} />
        <Luz intensidad={0.15 + 2 * boca} />
      </mesh>
    </group>
  );
};

const Guitarra: React.FC<{ rasguea: THREE.Vector3; pisa: THREE.Vector3; z: number; S: number }> = ({ rasguea, pisa, z, S }) => {
  const u = V(pisa.x - rasguea.x, pisa.y - rasguea.y, 0).normalize(); // hacia el clavijero
  u.applyAxisAngle(V(0, 0, 1), -Math.sign(u.x || 1) * MASTIL); // el mástil va más levantado que la línea entre las manos
  let v = V(-u.y, u.x, 0);
  if (v.y < 0) v = v.negate(); // el costado de la guitarra que mira hacia abajo
  const w = u.clone().cross(v).normalize();
  const o = V(rasguea.x, rasguea.y, z).addScaledVector(u, -GUITARRA.atras * S).addScaledVector(v, GUITARRA.abajo * S);
  const g = 0.12 * S; // medio grosor de la caja
  const frente = -Math.sign(w.z || 1) * (g + 0.005 * S); // tapa de la guitarra hacia la cámara
  return (
    <Base o={o} x={u} y={v} z={w}>
      <Elipsoide c={[-0.3 * S, 0, 0]} r={[0.56 * S, 0.48 * S, g]}>
        <Mate color={COLOR.madera} rugosidad={0.35} />
      </Elipsoide>
      <Elipsoide c={[0.32 * S, 0, 0]} r={[0.4 * S, 0.36 * S, g]}>
        <Mate color={COLOR.madera} rugosidad={0.35} />
      </Elipsoide>
      <mesh position={[0.22 * S, 0, frente]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13 * S, 0.13 * S, 0.01 * S, 32]} />
        <Mate color="#140b05" />
      </mesh>
      <mesh position={[-0.48 * S, 0, frente]}>
        <boxGeometry args={[0.07 * S, 0.3 * S, 0.02 * S]} />
        <Mate color={COLOR.maderaOscura} />
      </mesh>
      <mesh position={[1.45 * S, 0, frente * 0.5]}>
        <boxGeometry args={[1.6 * S, 0.11 * S, 0.07 * S]} />
        <Mate color={COLOR.maderaOscura} />
      </mesh>
      <mesh position={[2.4 * S, 0, frente * 0.5]}>
        <boxGeometry args={[0.34 * S, 0.15 * S, 0.06 * S]} />
        <Mate color={COLOR.maderaOscura} />
      </mesh>
      {[-0.03, -0.01, 0.01, 0.03].map((d) => (
        <mesh key={d} position={[0.95 * S, d * S, frente * 1.15]}>
          <boxGeometry args={[2.8 * S, 0.005 * S, 0.005 * S]} />
          <Mate color={COLOR.cuerda} rugosidad={0.2} />
        </mesh>
      ))}
    </Base>
  );
};

// ---------- Robot ----------
export const Robot3D: React.FC<Robot3DProps> = ({ puntos, cabeza, guitarra = false, mano = "derecha" }) => {
  const p = (i: number) => V(puntos[i][0], puntos[i][1], puntos[i][2] * PROFUNDIDAD);
  const hI = p(P.hombroI);
  const hD = p(P.hombroD);
  const S = Math.max(40, Math.hypot(hI.x - hD.x, hI.y - hD.y));
  const mc = p(P.caderaI).add(p(P.caderaD)).multiplyScalar(0.5);
  const zGuitarra = mc.z - GUITARRA.delante * S;
  const munD = p(P.munecaD);
  const munI = p(P.munecaI);
  if (guitarra) {
    // las manos siempre delante de la guitarra
    munD.z = Math.min(munD.z, zGuitarra - GUITARRA.manos * S);
    munI.z = Math.min(munI.z, zGuitarra - GUITARRA.manos * S);
  }
  const brazos = [
    { h: hD, c: p(P.codoD), m: munD, i: p(P.indiceD) },
    { h: hI, c: p(P.codoI), m: munI, i: p(P.indiceI) },
  ];
  const piernas = [
    { c: p(P.caderaD), r: p(P.rodillaD), t: p(P.tobilloD), pu: p(P.puntaD) },
    { c: p(P.caderaI), r: p(P.rodillaI), t: p(P.tobilloI), pu: p(P.puntaI) },
  ];
  const [rasguea, pisa] = mano === "derecha" ? [munD, munI] : [munI, munD];
  return (
    <group>
      {piernas.map((l, k) => (
        <group key={k}>
          <Segmento a={l.c} b={l.r} r={R.muslo * S} color={COLOR.rojo} />
          <Segmento a={l.r} b={l.t} r={R.pierna * S} color={COLOR.rojo} />
          <Elipsoide c={l.r} r={[R.rodilla * S, R.rodilla * S, R.rodilla * S]}>
            <Metal color={COLOR.oro} />
          </Elipsoide>
          <Segmento a={l.t} b={l.pu} r={R.bota * S} color={COLOR.rojo} />
        </group>
      ))}
      <Torso hI={hI} hD={hD} cI={p(P.caderaI)} cD={p(P.caderaD)} S={S} />
      <Casco oI={p(P.orejaI)} oD={p(P.orejaD)} S={S} cabeza={cabeza} />
      {guitarra && <Guitarra rasguea={rasguea} pisa={pisa} z={zGuitarra} S={S} />}
      {brazos.map((b, k) => (
        <group key={k}>
          <Elipsoide c={b.h} r={[R.hombrera * S, R.hombrera * S, R.hombrera * S]}>
            <Metal color={COLOR.rojo} />
          </Elipsoide>
          <Segmento a={b.h} b={b.c} r={R.brazo * S} color={COLOR.rojo} />
          <Segmento a={b.c} b={b.m} r={R.antebrazo * S} color={COLOR.rojo} />
          <Elipsoide c={b.c} r={[R.codo * S, R.codo * S, R.codo * S]}>
            <Metal color={COLOR.oro} />
          </Elipsoide>
          <Elipsoide c={b.m.clone().lerp(V(b.i.x, b.i.y, b.m.z), 0.45)} r={[R.mano * S, R.mano * S * 1.15, R.mano * S * 0.8]}>
            <Metal color={COLOR.oro} />
          </Elipsoide>
        </group>
      ))}
    </group>
  );
};

// ---------- Escena lista para usar ----------
// Lienzo transparente del tamaño del cuadro, cámara ortográfica en px. Render con --gl=angle.
export const EscenaRobot3D: React.FC<Robot3DProps & { ancho: number; alto: number }> = ({ ancho, alto, ...robot }) => (
  <ThreeCanvas
    width={ancho}
    height={alto}
    orthographic
    // rotation explícita: si no, react-three-fiber hace lookAt(0,0,0) y la escena se corre medio cuadro
    camera={{ position: [ancho / 2, -alto / 2, 3000], rotation: [0, 0, 0], zoom: 1, near: 1, far: 8000 }}
    style={{ position: "absolute", left: 0, top: 0 }}
  >
    <Entorno />
    <ambientLight intensity={LUZ.ambiente} />
    <hemisphereLight args={["#e6f4ff", "#5d7a3c", LUZ.cielo]} />
    {/* de px del cuadro (y abajo, z al fondo) a Three (y arriba, z hacia la cámara): giro de 180° en x */}
    <group scale={[1, -1, -1]}>
      <directionalLight position={[LUZ.clave.pos[0], -LUZ.clave.pos[1], -LUZ.clave.pos[2]]} intensity={LUZ.clave.intensidad} />
      <directionalLight position={[LUZ.contra.pos[0], -LUZ.contra.pos[1], -LUZ.contra.pos[2]]} intensity={LUZ.contra.intensidad} color="#fff1d6" />
      <Robot3D {...robot} />
    </group>
  </ThreeCanvas>
);
