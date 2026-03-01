import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

const MAX_TRAIL = 80;
const SHADER_LIMIT = 30; // For shader performance

const fragmentShader = `
uniform float uTime;
uniform vec2 uTrail[${MAX_TRAIL}];
uniform float uFade;
uniform vec3 uColor;
varying vec2 vUv;

float star(vec2 uv, vec2 center, float radius, float strength, float timeOffset) {
  vec2 p = uv - center;
  float angle = atan(p.y, p.x);
  float rays = abs(sin(6.0 * angle)) * 0.5 + 0.5;
  float dist = length(p) * rays;
  float glow = smoothstep(radius, 0.0, dist);
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 + timeOffset);
  return glow * pulse * strength;
}

void main() {
  float sparkleSum = 0.0;

  for (int i = 0; i < ${SHADER_LIMIT}; i++) {
    float fade = pow(1.0 - float(i) / float(${MAX_TRAIL}), 0.6);
    float radius = 0.007 + float(i) * 0.0004;

    // subtle movement offset
    vec2 jitter = vec2(
      sin(uTime + float(i)) * 0.001,
      cos(uTime * 0.7 + float(i)) * 0.001
    );

    // parallax offset
    vec2 parallax = jitter * (1.0 - float(i) / float(${MAX_TRAIL}));

    sparkleSum += star(vUv, uTrail[i] + parallax, radius, fade, float(i));
  }

  vec3 sparkleColor = uColor;
  vec3 final = sparkleColor * sparkleSum * 0.3 * uFade;

  float alpha = smoothstep(0.0, 1.0, length(final));
  gl_FragColor = vec4(final, alpha);
}
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export default function BackgroundFX() {
  const materialRef = useRef();
  const { mouse } = useThree();

  const trail = useRef(
    Array.from({ length: MAX_TRAIL }, () => new THREE.Vector2(0.5, 0.5))
  );

  const lastMousePos = useRef(new THREE.Vector2(mouse.x, mouse.y));
  const lastMovementTime = useRef(0);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Detect movement
    const currentMouse = new THREE.Vector2(mouse.x, mouse.y);
    const moved = currentMouse.distanceTo(lastMousePos.current) > 0.0005;
    if (moved) {
      lastMovementTime.current = time;
      lastMousePos.current.copy(currentMouse);
    }

    // Compute idle fade
    const idleDuration = time - lastMovementTime.current;
    const fade = Math.max(0, 1 - idleDuration * 0.4);

    if (materialRef.current) {
      // Shift trail
      for (let i = MAX_TRAIL - 1; i > 0; i--) {
        trail.current[i].copy(trail.current[i - 1]);
      }
      trail.current[0].set((mouse.x + 1) / 2, (mouse.y + 1) / 2);

      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uFade.value = fade;

      for (let i = 0; i < MAX_TRAIL; i++) {
        materialRef.current.uniforms.uTrail.value[i].copy(trail.current[i]);
      }

      // Change color every 4 seconds
      if (Math.floor(time) % 4 === 0 && Math.floor(time * 10) % 10 === 0) {
        const color = new THREE.Color().setHSL(Math.random(), 0.6, 0.8);
        materialRef.current.uniforms.uColor.value.copy(color);
      }
    }
  });

  return (
    <mesh scale={[50, 50, 1]} position={[0, 0, -5]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uFade: { value: 1 },
          uColor: {
            value: new THREE.Color().setHSL(Math.random(), 0.6, 0.8),
          },
          uTrail: {
            value: Array.from(
              { length: MAX_TRAIL },
              () => new THREE.Vector2(0.5, 0.5)
            ),
          },
        }}
      />
    </mesh>
  );
}
