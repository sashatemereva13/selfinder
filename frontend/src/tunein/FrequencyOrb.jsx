import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Orb({
  color = "b19cd9",
  baseDistort = 0.3,
  speed = 3,
  qualityTier = "medium",
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const motionScale = qualityTier === "low" ? 0.5 : qualityTier === "medium" ? 0.8 : 1;
  const segments = qualityTier === "low" ? 28 : qualityTier === "medium" ? 44 : 64;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05 * motionScale);

    if (materialRef.current) {
      materialRef.current.distort = baseDistort + Math.sin(t * 1.5) * 0.3 * motionScale;
      materialRef.current.speed = speed + Math.sin(t * 0.8) * 0.5 * motionScale;
    }
  });

  return (
    <Sphere args={[1, segments, segments]} ref={meshRef}>
      <MeshDistortMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.85}
        roughness={0}
        metalness={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        distort={baseDistort}
        speed={Math.max(0.8, speed * motionScale)}
      />
    </Sphere>
  );
}

export default function FrequencyOrb({ color, qualityTier = "medium" }) {
  const isLowQuality = qualityTier === "low";
  const isMediumQuality = qualityTier === "medium";

  return (
    <Canvas
      className="frequencyOrbCanvas"
      dpr={isLowQuality ? [1, 1.2] : isMediumQuality ? [1, 1.4] : [1, 1.7]}
      gl={{ antialias: !isLowQuality, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 3] }}
    >
      <ambientLight intensity={isLowQuality ? 0.24 : 0.3} />
      <pointLight position={[5, 5, 5]} intensity={isLowQuality ? 1.1 : 1.5} />
      <Orb
        color={color}
        qualityTier={qualityTier}
        baseDistort={isLowQuality ? 0.18 : isMediumQuality ? 0.24 : 0.3}
        speed={isLowQuality ? 1.8 : isMediumQuality ? 2.4 : 3}
      />
      {!isLowQuality && (
        <EffectComposer>
          <Bloom
            intensity={isMediumQuality ? 1.5 : 2.2}
            luminanceThreshold={isMediumQuality ? 0.28 : 0.2}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
