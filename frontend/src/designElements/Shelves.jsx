import * as THREE from "three";
import { useMemo } from "react";

const TILE_SIZE = 10;
const GRID_SIZE = 50;

const Shelves = () => {
  const tiles = useMemo(() => {
    const result = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        result.push({
          position: [
            (x - GRID_SIZE / 2) * TILE_SIZE + TILE_SIZE / 2,
            0,
            (z - GRID_SIZE / 2) * TILE_SIZE + TILE_SIZE / 2,
          ],
          emissive: "#254D49",
          opacity: 0.1 + Math.random() * 0.2,
        });
      }
    }
    return result;
  }, []);

  return (
    <group position={[0, -121, -50]} rotation={[0, 0, 0]}>
      {tiles.map((tile, i) => (
        <mesh
          key={i}
          position={tile.position}
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
          <meshStandardMaterial
            color="black"
            emissive={tile.emissive}
            emissiveIntensity={1.3}
            transparent
            opacity={tile.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Shelves;
