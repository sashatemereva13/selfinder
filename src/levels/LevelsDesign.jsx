import { OrbitControls, Line } from "@react-three/drei";

const LevelsDesign = () => {
  const vertices = [];
  for (let i = -200; i <= 200; i++) {
    const x = i / 20;
    const y = Math.sin(x * Math.PI);
    const z = 0;
    vertices.push(x, y, z);
  }

  return (
    <>
      <OrbitControls />

      <mesh scale={1} position={[2, 3, 0]}>
        <sphereGeometry />
        <meshBasicMaterial color="mediumpurple" wireframe />
      </mesh>
      <Line position={[0, 3, 0]} points={vertices} color="#08F899" />
    </>
  );
};

export default LevelsDesign;
