import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Orb({ color = "b19cd9", baseDistort = 0.3, speed = 3 }) {
  const meshRef = useRef();
  const materialRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);

    if (materialRef.current) {
      materialRef.current.distort = baseDistort + Math.sin(t * 1.5) * 0.3;
      materialRef.current.speed = speed + Math.sin(t * 0.8) * 0.5;
    }
  });

  return (
    <Sphere args={[1, 64, 64]} ref={meshRef}>
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
        speed={speed}
      />
    </Sphere>
  );
}

export default function FrequencyOrb({ color }) {
  return (
    <Canvas className="frequencyOrbCanvas" camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <Orb color={color} />
      <EffectComposer>
        <Bloom intensity={2.2} luminanceThreshold={0.2} />
      </EffectComposer>
    </Canvas>
  );
}
