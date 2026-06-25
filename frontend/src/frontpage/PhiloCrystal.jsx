import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { View, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// One-time canvas-painted radial gradient, reused as a cheap glow sprite
// instead of a postprocessing bloom pass — avoids running an EffectComposer
// per card (each card is its own scissored View sharing one GL context).
function makeGlowTexture(rgb) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, `rgba(${rgb}, 0.85)`);
  gradient.addColorStop(0.45, `rgba(${rgb}, 0.32)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function CrystalMesh({ color, accentRgb, selected }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const shellRef = useRef();
  const glowTexture = useMemo(() => makeGlowTexture(accentRgb), [accentRgb]);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.14;
      const targetScale = selected ? 1.16 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 4,
      );
    }

    const breathe = 0.5 + Math.sin(t * 1.6) * 0.5;
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = selected
        ? 1.5 + breathe * 0.5
        : 0.95 + breathe * 0.25;
    }
    if (shellRef.current) {
      shellRef.current.material.opacity = selected
        ? 0.42 + breathe * 0.12
        : 0.3 + breathe * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <sprite scale={selected ? [1.85, 1.85, 1] : [1.7, 1.7, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          roughness={0.25}
          metalness={0}
        />
      </mesh>

      <mesh ref={shellRef}>
        <dodecahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.15}
          metalness={0}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Each card renders into its own scissored region of ONE shared canvas/GL
// context (via drei's View) instead of mounting a <Canvas> per card — five
// independent WebGL contexts on the entry screen is exactly the kind of
// context pressure a previous fix had to undo.
export function PhiloCrystalCard({
  as,
  className,
  style,
  color,
  accentRgb,
  selected,
  ...rest
}) {
  return (
    <View
      as={as}
      className={className}
      style={{ ...style, animation: "none" }}
      {...rest}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={42} />
      <ambientLight intensity={0.5} />
      <pointLight position={[1.5, 1.5, 2.5]} intensity={1.1} color={color} />
      <CrystalMesh color={color} accentRgb={accentRgb} selected={selected} />
    </View>
  );
}

// Mounted once — the single shared canvas that all PhiloCrystalCard views
// render into via View.Port. No postprocessing here on purpose (see note
// above re: avoiding EffectComposer + scissored multi-view interplay).
export function PhiloCrystalStage() {
  return (
    <Canvas
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "default" }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
      }}
    >
      <View.Port />
    </Canvas>
  );
}
