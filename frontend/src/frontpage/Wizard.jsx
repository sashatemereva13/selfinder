import React, {
  useRef,
  useState,
  useEffect,
  useRef as useRefAlias,
} from "react";
import { useGLTF, Float, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

export default function Wizard({ ...props }) {
  const group = useRef();
  const pointsRef = useRef();
  const dodecahedron = useRef();
  const { scene } = useGLTF("/models/robot.glb");

  useFrame(() => {
    if (dodecahedron.current) {
      dodecahedron.current.rotation.y += 0.003;
      dodecahedron.current.rotation.x -= 0.005;
      dodecahedron.current.rotation.z += 0.003;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.003;
    }
  });

  return (
    <>
      <Sparkles
        position={[0, -13, 100]}
        count={100}
        speed={0.9}
        size={4}
        color={"#BC40B8"}
        opacity={0.8}
        scale={30}
      />
      {/* sparkle-halo */}
      <points ref={pointsRef} position={[-27.37, 10, 0]} scale={16.5}>
        <sphereGeometry args={[1.1, 20, 200]} />
        <pointsMaterial size={0.01} color="#e3affa" />
      </points>

      <group position={[-8, -7, 0]} ref={group} {...props} dispose={null}>
        <primitive object={scene} position={[0, -1, 0]} scale={0.8} />
        <mesh ref={dodecahedron} position={[-0.01, 0.45, 0]}>
          <dodecahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color="#bd9bc9"
            transparent
            opacity={0.2}
            metalness={0.7}
            roughness={0.6}
            emissive="#523d55"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </>
  );
}
