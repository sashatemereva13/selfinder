import { Text3D } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import Wizard from "./Wizard";

import { useRef } from "react";
import { Html } from "@react-three/drei";

const Selfinder = () => {
  const text = useRef();
  const { viewport } = useThree();

  const isMobile = viewport.width < 8;

  useEffect(() => {
    if (text.current) {
      // Centers the geometry in its bounding box
      text.current.geometry.center();
    }
  }, []);

  return (
    <>
      <group position={[0, 1.2, 0]}>
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
            color="#DEBFFF"
            roughness={0.3}
            metalness={0.1}
            clearcoat={0.1}
            clearcoatRoughness={1}
            iridescence={2}
            iridescenceIOR={0.1}
          />
        </Text3D>
      </group>
    </>
  );
};

export default Selfinder;
