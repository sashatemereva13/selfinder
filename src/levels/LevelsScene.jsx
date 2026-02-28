import { Float } from "@react-three/drei";

function Shard({ position }) {
  return (
    <Float speed={1.5} floatIntensity={2}>
      <mesh position={position}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshPhysicalMaterial
          color="#bfe9ff"
          transmission={1}
          roughness={0.15}
          thickness={1}
        />
      </mesh>
    </Float>
  );
}

export default function LevelsScene() {
  return (
    <>
      <ambientLight intensity={1.2} />

      {/* background floating shards */}
      <Shard position={[2, 2, -3]} />
      <Shard position={[-3, -1, -4]} />
      <Shard position={[1, -4, -5]} />
      <Shard position={[-2, 4, -6]} />
    </>
  );
}
