import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Solid, far-back planets for depth and scale — distinct from Starfield's
// pinpoints and the ball's own glow. The earlier version faded the gradient
// all the way to alpha 0, which read as a soft glow blob with no edge; this
// one clips to an actual circular path (ctx.arc + fill) so the disc has a
// crisp silhouette against the void, with the gradient only doing internal
// shading (a lit-sphere highlight/shadow), plus a separate, much fainter
// haze ring just outside it to soften the cutout rather than dissolve it.
//
// Colored from the room's existing nebula palette (frontpage/CosmicNebula.js
// — "no pink in the palette by design"), not the chosen philosopher's
// accent — these are the room's own scenery, not personalization, same
// reasoning as Starfield. Pushed out to the corners and well back in z so
// they read as distant bodies rather than crowding the ball+ring's own
// screen space.
function makePlanetTexture({ highlight, base, shadow, haze }, size = 160) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const sphereShading = ctx.createRadialGradient(
    size * 0.36,
    size * 0.32,
    size * 0.04,
    size * 0.5,
    size * 0.5,
    size * 0.52,
  );
  sphereShading.addColorStop(0, highlight);
  sphereShading.addColorStop(0.45, base);
  sphereShading.addColorStop(1, shadow);

  ctx.fillStyle = sphereShading;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.485, 0, Math.PI * 2);
  ctx.fill();

  const atmosphereHaze = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.485,
    size / 2,
    size / 2,
    size * 0.58,
  );
  atmosphereHaze.addColorStop(0, haze);
  atmosphereHaze.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = atmosphereHaze;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.58, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const PLANETS = [
  {
    position: [-34, 14, -150],
    radius: 9,
    spin: 0.01,
    highlight: "rgba(255, 224, 190, 0.95)",
    base: "rgba(214, 138, 70, 0.95)",
    shadow: "rgba(70, 32, 18, 0.95)",
    haze: "rgba(70, 32, 18, 0.4)",
  },
  {
    position: [38, -20, -190],
    radius: 12,
    spin: -0.007,
    highlight: "rgba(210, 230, 255, 0.95)",
    base: "rgba(70, 120, 200, 0.95)",
    shadow: "rgba(14, 26, 56, 0.95)",
    haze: "rgba(14, 26, 56, 0.4)",
  },
];

function Planet({ position, radius, spin, ...colors }) {
  const ref = useRef();
  const texture = useMemo(() => makePlanetTexture(colors), [colors]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * spin;
  });

  return (
    <mesh ref={ref} position={position}>
      <circleGeometry args={[radius, 48]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

export default function BackgroundPlanets({ quality }) {
  const tier = quality?.tier || "medium";
  // Pure background decoration — first thing to drop under load, same as
  // any other low-tier cut elsewhere in this scene.
  if (tier === "low") return null;

  return (
    <>
      {PLANETS.map((planet) => (
        <Planet key={planet.position.join(",")} {...planet} />
      ))}
    </>
  );
}
