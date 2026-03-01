import { useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ClickablePotion = ({ bottle, position, to, scale, brighten = false }) => {
  const ref = useRef();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  // Brighten the potion's material
  useEffect(() => {
    if (brighten) {
      bottle.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.metalness = 0.8;
          child.material.roughness = 0.1;
          child.material.emissiveIntensity = 2;
          child.material.emissive =
            child.material.emissive || new THREE.Color("#594269");
        }
      });
    }
  }, [bottle, brighten]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;

      const targetTilt = hovered ? -0.2 : 0;
      ref.current.rotation.x += (targetTilt - ref.current.rotation.x) * 0.1;

      const targetScale = hovered ? scale * 1.2 : scale;
      ref.current.scale.setScalar(
        ref.current.scale.x + (targetScale - ref.current.scale.x) * 0.1
      );
    }
  });

  return (
    <group position={position}>
      {/* Potion */}
      <primitive
        ref={ref}
        object={bottle}
        scale={scale}
        onClick={() => navigate(to)}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      />
    </group>
  );
};

export default ClickablePotion;
