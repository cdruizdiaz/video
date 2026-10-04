// Modelos 3D en .glb (de un modelador, de Blender —scripts/blender/— o de una biblioteca libre) con sus animaciones,
// sincronizadas con el cuadro de Remotion (no con el reloj: cada cuadro sale igual en cualquier render).
// Sin dependencias extra: GLTFLoader + AnimationMixer de three. Render con --gl=angle.
//  - <Modelo3D>: el modelo dentro de un ThreeCanvas propio (escena lista: cámara en px, luces, sombra en el piso).
//  - clips: lista de { nombre, desde, hasta?, velocidad?, bucle? } (frames de la composición); entre clips seguidos
//    hay un fundido de `fundido` frames.
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as clonarEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";

const LUZ = { pos: [-500, 900, 900] as [number, number, number], intensidad: 2.2, ambiente: 0.9 };
const SOMBRA = { opacidad: 0.35, inclina: 0.35 };
const FUNDIDO = 8; // frames de cruce entre clips

export type ClipModelo = { nombre: string; desde: number; hasta?: number; velocidad?: number; bucle?: boolean };

// El mismo archivo se carga una sola vez por pestaña del render
const cache = new Map<string, Promise<GLTF>>();
const cargar = (src: string) => {
  if (!cache.has(src)) cache.set(src, new GLTFLoader().loadAsync(staticFile(src)));
  return cache.get(src)!;
};

const Malla: React.FC<{ gltf: GLTF; clips: ClipModelo[]; fundido: number }> = ({ gltf, clips, fundido }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Copia propia (con esqueleto) y un mezclador por instancia
  const { escena, mezclador } = useMemo(() => {
    const e = clonarEsqueleto(gltf.scene);
    e.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    return { escena: e, mezclador: new THREE.AnimationMixer(e) };
  }, [gltf]);
  // Pesos de cada clip en este cuadro (con fundidos) y tiempo local de cada uno
  mezclador.stopAllAction();
  const activos = clips
    .map((c) => {
      const clip = THREE.AnimationClip.findByName(gltf.animations, c.nombre);
      if (!clip || f < c.desde - fundido || (c.hasta !== undefined && f >= c.hasta + fundido)) return null;
      const entra = Math.min(1, (f - c.desde + fundido) / fundido);
      const sale = c.hasta === undefined ? 1 : Math.min(1, (c.hasta + fundido - f) / fundido);
      const peso = Math.max(0, Math.min(entra, sale));
      let t = (Math.max(0, f - c.desde) / fps) * (c.velocidad ?? 1);
      t = c.bucle === false ? Math.min(t, clip.duration) : t % clip.duration;
      return { clip, peso, t };
    })
    .filter((x): x is NonNullable<typeof x> => !!x && x.peso > 0);
  for (const a of activos) {
    const accion = mezclador.clipAction(a.clip);
    accion.reset();
    accion.setEffectiveWeight(a.peso);
    accion.play();
    accion.time = a.t;
  }
  mezclador.update(0);
  return <primitive object={escena} />;
};

export const Modelo3D: React.FC<{
  src: string; // .glb dentro de public/
  clips?: ClipModelo[];
  x: number; // pies en el cuadro (px)
  y: number;
  alto: number; // px que mide el modelo parado (se escala para que mida eso)
  rotY?: number; // radianes (0 = de frente a cámara)
  sombra?: number;
  fundido?: number;
}> = ({ src, clips = [], x, y, alto, rotY = 0, sombra = SOMBRA.opacidad, fundido = FUNDIDO }) => {
  const { width, height } = useVideoConfig();
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [espera] = useState(() => delayRender(`modelo ${src}`));
  useEffect(() => {
    cargar(src)
      .then((g) => {
        setGltf(g);
        continueRender(espera);
      })
      .catch((e) => cancelRender(e));
  }, [src, espera]);
  // Caja del modelo en sus unidades, con las escalas internas del archivo (FBX en cm, esqueletos…) y precisa para
  // mallas con huesos: se escala para que mida `alto` px y se corre para que el centro de la base quede en (x, y)
  const { escala, base } = useMemo(() => {
    if (!gltf) return { escala: 1, base: [0, 0, 0] as [number, number, number] };
    gltf.scene.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(gltf.scene, true);
    const c = new THREE.Vector3();
    caja.getCenter(c);
    return { escala: alto / Math.max(1e-6, caja.max.y - caja.min.y), base: [-c.x, -caja.min.y, -c.z] as [number, number, number] };
  }, [gltf, alto]);
  const objetivo = useMemo(() => new THREE.Object3D(), []);
  return (
    <ThreeCanvas
      width={width}
      height={height}
      orthographic
      shadows
      camera={{ position: [width / 2, -height / 2, 3000], rotation: [0, 0, 0], zoom: 1, near: 1, far: 8000 }} // rotation explícita: si no, R3F apunta la cámara al origen
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <ambientLight intensity={LUZ.ambiente} />
      <group position={[x, -y, 0]}>
        <primitive object={objetivo} />
        <directionalLight
          position={LUZ.pos}
          intensity={LUZ.intensidad}
          target={objetivo}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-800}
          shadow-camera-right={800}
          shadow-camera-top={800}
          shadow-camera-bottom={-800}
          shadow-camera-far={5000}
          shadow-bias={-0.0008}
        />
        <mesh rotation={[-Math.PI / 2 + SOMBRA.inclina, 0, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <shadowMaterial opacity={sombra} />
        </mesh>
        <group scale={escala} rotation={[0, rotY, 0]}>
          <group position={base}>{gltf && <Malla gltf={gltf} clips={clips} fundido={fundido} />}</group>
        </group>
      </group>
    </ThreeCanvas>
  );
};
