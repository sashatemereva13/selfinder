import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import Wizard from "../frontpage/Wizard";

const Torch = ({ color }) => {
  const planeRef = useRef();

  // Optional: animate something like slight shimmer
  useFrame(() => {
    if (planeRef.current) {
      planeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <>
      <group scale={3} position={[-10, -70, -150]}>
        <pointLight
          color="#C5ADEB"
          intensity={10}
          distance={60}
          decay={0.3}
          position={[0, -1, 0]}
          castShadow={true}
        />

        <mesh
          ref={planeRef}
          rotation={[0, 0, 0]}
          receiveShadow
          position={[0, 0, 0]}
        >
          <cylinderGeometry args={[2.3, 0.7, 2, 10]} />
          <meshPhysicalMaterial
            color="#222222"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, 3.5, 0]}>
          <sphereGeometry args={[3, 64, 32]} />
          <meshPhysicalMaterial
            color="#CFE8E7"
            metalness={0.3}
            roughness={0.9}
            transparent={true}
            opacity={0.4}
          />
        </mesh>
        <mesh
          rotation={[0, 0, Math.PI]}
          position={[0, -10, 0]}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[0.7, 20, 64]} />
          <meshPhysicalMaterial
            color="#222222"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
      </group>
    </>
  );
};

export default Torch;
