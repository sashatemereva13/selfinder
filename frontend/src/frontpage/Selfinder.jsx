import { Text3D } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { useRef } from "react";

const Selfinder = ({ targetOpacity = 1, color = "#C3CCF5" }) => {
  const text = useRef();
  const materialRef = useRef();

  useEffect(() => {
    if (text.current) {
      // Centers the geometry in its bounding box
      text.current.geometry.center();
    }
  }, []);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      targetOpacity,
      1 - Math.exp(-delta * 7),
    );
  });

  return (
    <>
      <group position={[0, 1.2, 2]}>
        <Text3D
          className="selfinderText"
          ref={text}
          font="/fontsCSS/Canobis_Regular.json"
          bevelSize={0.05}
          bevelThickness={0.05}
          size={1}
        >
          selfinder
          <meshPhysicalMaterial
            ref={materialRef}
            color={color}
            roughness={0.3}
            metalness={0.1}
            clearcoat={0.1}
            clearcoatRoughness={1}
            iridescence={0.7}
            iridescenceIOR={1.4}
            transparent
            opacity={1}
          />
        </Text3D>
      </group>
    </>
  );
};

export default Selfinder;
