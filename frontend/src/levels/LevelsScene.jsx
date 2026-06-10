import { Float } from "@react-three/drei";

function Shard({ position, qualityTier = "medium" }) {
  const isLowQuality = qualityTier === "low";

  return (
    <Float
      speed={isLowQuality ? 1 : qualityTier === "medium" ? 1.3 : 1.5}
      floatIntensity={isLowQuality ? 0.85 : qualityTier === "medium" ? 1.35 : 2}
    >
      <mesh position={position}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshPhysicalMaterial
          color="#bfe9ff"
          transmission={isLowQuality ? 0.78 : 1}
          roughness={isLowQuality ? 0.28 : 0.15}
          thickness={1}
        />
      </mesh>
    </Float>
  );
}

export default function LevelsScene({ qualityTier = "medium" }) {
  const shardPositions =
    qualityTier === "low"
      ? [
          [2, 2, -3],
          [-3, -1, -4],
        ]
      : [
          [2, 2, -3],
          [-3, -1, -4],
          [1, -4, -5],
          [-2, 4, -6],
        ];

  return (
    <>
      <ambientLight intensity={qualityTier === "low" ? 1 : 1.2} />

      {shardPositions.map((position) => (
        <Shard
          key={position.join(":")}
          position={position}
          qualityTier={qualityTier}
        />
      ))}
    </>
  );
}
