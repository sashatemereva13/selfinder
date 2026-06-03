import * as THREE from "three";
import { useMemo } from "react";

export default function RoomSurfaceGrid({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  tileSize = 10,
  gridSize = 15,
  palette = ["#0a0a0f", "#d6dce8"],
  emissivePalette = ["#16232b", "#2c3842"],
  opacityRange = [0.18, 0.3],
  emissiveIntensity = 0.16,
  metalness = 0.72,
  roughness = 0.34,
}) {
  const tiles = useMemo(() => {
    const [minOpacity, maxOpacity] = opacityRange;
    const result = [];

    for (let x = 0; x < gridSize; x += 1) {
      for (let z = 0; z < gridSize; z += 1) {
        const paletteIndex = (x + z) % palette.length;
        result.push({
          key: `${x}-${z}`,
          position: [
            (x - gridSize / 2) * tileSize + tileSize / 2,
            0,
            (z - gridSize / 2) * tileSize + tileSize / 2,
          ],
          color: palette[paletteIndex],
          emissive: emissivePalette[paletteIndex % emissivePalette.length],
          opacity:
            minOpacity + Math.random() * Math.max(maxOpacity - minOpacity, 0),
        });
      }
    }

    return result;
  }, [emissivePalette, gridSize, opacityRange, palette, tileSize]);

  return (
    <group position={position} rotation={rotation}>
      {tiles.map((tile) => (
        <mesh
          key={tile.key}
          position={tile.position}
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <meshStandardMaterial
            color={tile.color}
            emissive={tile.emissive}
            emissiveIntensity={emissiveIntensity}
            metalness={metalness}
            roughness={roughness}
            transparent
            opacity={tile.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
