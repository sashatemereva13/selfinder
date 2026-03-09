import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Torch = ({ color }) => {
  const torchCupRef = useRef();
  const flameOuterRef = useRef();
  const flameInnerRef = useRef();
  const emberRef = useRef();
  const flameLightRef = useRef();
  const haloRef = useRef();

  const flameColor = color || "#ffb15c";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker =
      0.88 + Math.sin(t * 11.2) * 0.09 + Math.sin(t * 25.4) * 0.06;

    if (flameLightRef.current) {
      flameLightRef.current.intensity = 10.5 * flicker;
      flameLightRef.current.distance = 52 + Math.sin(t * 5.5) * 3.5;
    }

    if (torchCupRef.current) {
      torchCupRef.current.emissiveIntensity = 0.1 + (flicker - 0.82) * 0.3;
    }

    if (flameOuterRef.current) {
      flameOuterRef.current.scale.y = 1 + (flicker - 0.86) * 0.35;
      flameOuterRef.current.scale.x = 1 - (flicker - 0.86) * 0.1;
      flameOuterRef.current.scale.z = 1 - (flicker - 0.86) * 0.1;
      flameOuterRef.current.rotation.z = Math.sin(t * 2.8) * 0.08;
    }

    if (flameInnerRef.current) {
      flameInnerRef.current.scale.y = 1 + (flicker - 0.86) * 0.42;
      flameInnerRef.current.rotation.z = -Math.sin(t * 3.4) * 0.07;
    }

    if (emberRef.current) {
      emberRef.current.opacity = 0.68 + Math.sin(t * 8.5) * 0.11;
    }

    if (haloRef.current) {
      haloRef.current.opacity = 0.16 + Math.sin(t * 6.2) * 0.05;
    }
  });

  return (
    <>
      <group
        scale={3}
        position={[-40, -60, -150]}
        rotation={[Math.PI / 2, Math.PI / 3, Math.PI / 3]}
      >
        <pointLight
          ref={flameLightRef}
          color={flameColor}
          intensity={10.5}
          distance={52}
          decay={1}
          position={[0, 1.25, 0]}
          castShadow={true}
        />

        <mesh ref={torchCupRef} position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.7, 1.35, 2.2, 28, 1, true]} />
          <meshStandardMaterial
            color="#34271f"
            metalness={0.35}
            roughness={0.75}
            emissive="#1b120d"
            emissiveIntensity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.36, 0.5, 18, 18]} />
          <meshPhysicalMaterial
            color="#2d2926"
            metalness={0.18}
            roughness={0.84}
          />
        </mesh>

        <mesh position={[0, -9.8, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.75, 2.4, 22]} />
          <meshPhysicalMaterial
            color="#1f1d1d"
            metalness={0.2}
            roughness={0.92}
          />
        </mesh>

        <mesh ref={flameOuterRef} position={[0, 1.35, 0.02]} renderOrder={5}>
          <coneGeometry args={[4.75, 2.7, 14]} />
          <meshBasicMaterial
            color="#ff8a3c"
            transparent
            opacity={0.78}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={flameInnerRef} position={[0, 1.48, 0.05]} renderOrder={6}>
          <coneGeometry args={[0.3, 1.75, 14]} />
          <meshBasicMaterial
            color="#ffd27a"
            transparent
            opacity={0.92}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0, 0.8, 0]} renderOrder={7}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshBasicMaterial
            ref={emberRef}
            color="#fff1bf"
            transparent
            opacity={0.72}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0, 1.18, 0]} renderOrder={4}>
          <sphereGeometry args={[1.1, 18, 18]} />
          <meshBasicMaterial
            ref={haloRef}
            color="#ff9b5f"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
};

export default Torch;
