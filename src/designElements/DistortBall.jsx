import * as THREE from "three";
import { MeshDistortMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const DistortBall = ({
  position,
  baseDistort = 0.7,
  speed = 3,
  color = "#B8BEF3",
  qualityTier = "medium",
}) => {
  const materialRef = useRef();
  const motionScale = qualityTier === "low" ? 0.45 : qualityTier === "medium" ? 0.8 : 1;
  const geometrySegments = qualityTier === "low" ? 24 : 32;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Make the distortion value oscillate over time
    if (materialRef.current) {
      materialRef.current.distort = baseDistort + Math.sin(t * 1.5) * 0.3 * motionScale;
      materialRef.current.speed = speed + Math.sin(t * 0.8) * 0.5 * motionScale;
    }
  });

  return (
    <mesh position={position} visible>
      <sphereGeometry args={[0.9, geometrySegments, geometrySegments]} />
      <MeshDistortMaterial
        ref={materialRef}
        color={color}
        roughness={0}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        distort={baseDistort}
        speed={Math.max(0.5, speed * motionScale)}
      />
    </mesh>
  );
};

export default DistortBall;
