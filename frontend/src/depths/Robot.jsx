import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

export default function Robot(props) {
  const group = useRef();
  const { scene } = useGLTF("/models/robot.glb"); // ✅ path relative to /public
  useGLTF.preload("/models/robot.glb");
  const { camera } = useThree();
  console.log(camera.position.toArray());

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} scale={10} />
    </group>
  );
}
