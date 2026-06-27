import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

import "./FeelingLuckyButton.css";
import DistortBall from "./DistortBall";
import Selfinder from "../frontpage/Selfinder";
import { useChat } from "../guide/ChatContext";

const CONSUME_DURATION_MS = 900;
const ROOT_SCALE = 2;
// Reused every frame in the idle lerp below — Vector3.lerp() only reads its
// target argument, so a shared constant avoids allocating two new Vector3s
// per frame for as long as the ball sits idle.
const ORIGIN_VEC3 = new THREE.Vector3(0, 0, 0);
const UNIT_VEC3 = new THREE.Vector3(1, 1, 1);

// Default palette used before a philosopher is chosen (e.g. on the entry
// gate itself, before activePhilosopher exists).
const BASE_PALETTE = {
  lightIdle: "#BB8FFF",
  lightHover: "#402289",
  baseIdle: "#BB8FFF",
  baseHover: "#234f28",
  emissiveIdle: "#4D3E99",
  emissiveHover: "#402289",
  distort: "#B8BEF3",
  points: "#A6B4FF",
  sparkles: "#5C6FD8",
  text: "#C3CCF5",
};

// Mixes toward white (amount > 0) or black (amount < 0) to derive hover/glow
// variants that stay in the same hue family as the philosopher's accent.
function shadeHex(hex, amount) {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(amount >= 0 ? "#ffffff" : "#000000"), Math.abs(amount));
  return `#${c.getHexString()}`;
}

function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0
    + 3 * mt * mt * t * p1
    + 3 * mt * t * t * p2
    + t * t * t * p3
  );
}

export default function MagicBall({
  quality,
  thresholdPhase,
  selectedMessage,
  portalTargetPosition,
  onInitialActivate,
}) {
  const { viewport } = useThree();
  const { activePhilosopher } = useChat();
  const consumableRef = useRef();
  const coloredSphere = useRef();
  const pointsRef = useRef();
  const orbitRingRef = useRef();
  const pointLightRef = useRef();
  const rootRef = useRef();
  const consumeStartedAt = useRef(null);
  const [hovered, setHovered] = useState(false);

  const accentHex = activePhilosopher?.color;
  const palette = useMemo(() => {
    if (!accentHex) return BASE_PALETTE;
    return {
      lightIdle: accentHex,
      lightHover: shadeHex(accentHex, -0.35),
      baseIdle: accentHex,
      baseHover: shadeHex(accentHex, -0.45),
      emissiveIdle: shadeHex(accentHex, -0.25),
      emissiveHover: shadeHex(accentHex, -0.35),
      distort: shadeHex(accentHex, 0.18),
      points: shadeHex(accentHex, 0.3),
      sparkles: accentHex,
      text: shadeHex(accentHex, 0.32),
    };
  }, [accentHex]);

  const isMobile = viewport.width < 8;
  const qualityTier = quality?.tier || "medium";
  const isLowQuality = qualityTier === "low";
  const isMediumQuality = qualityTier === "medium";
  const lightColor = hovered ? palette.lightHover : palette.lightIdle;
  const baseColor = hovered ? palette.baseHover : palette.baseIdle;
  const emissiveColor = hovered ? palette.emissiveHover : palette.emissiveIdle;
  const isConsumedOrGone = thresholdPhase === "ball_consuming"
    || thresholdPhase === "portal_ready"
    || thresholdPhase === "jumping";
  // Once fully consumed, the ball has shrunk and faded into the portal —
  // unmount its shader-heavy contents (distort material, iridescent
  // wordmark) entirely instead of leaving them rendering at ~0 opacity.
  const isGoneFromView = thresholdPhase === "portal_ready" || thresholdPhase === "jumping";
  const ballBasePosition = useMemo(
    () => new THREE.Vector3(...(isMobile ? [0, 0, 0] : [0, 1, 0])),
    [isMobile],
  );
  const portalTarget = useMemo(
    () => new THREE.Vector3(...portalTargetPosition),
    [portalTargetPosition],
  );
  const consumeCurvePoints = useMemo(() => {
    // The consumable subgroup sits inside a scaled parent, so the motion path
    // needs to be converted into that local coordinate space.
    const end = portalTarget.clone().sub(ballBasePosition).divideScalar(ROOT_SCALE);
    const forwardMidpoint = THREE.MathUtils.lerp(0.58, end.z * 0.45, 0.55);
    return {
      start: new THREE.Vector3(0, 0, 0),
      c1: new THREE.Vector3(0, -0.28, 0.46),
      c2: new THREE.Vector3(0, end.y * 0.58, forwardMidpoint),
      end,
    };
  }, [ballBasePosition, portalTarget]);

  useEffect(() => {
    if (thresholdPhase === "ball_consuming") {
      consumeStartedAt.current = performance.now();
      setHovered(false);
      document.body.style.cursor = "default";
    } else if (thresholdPhase === "idle" || thresholdPhase === "message_open") {
      consumeStartedAt.current = null;
    }
  }, [thresholdPhase]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const isBeingConsumed = thresholdPhase === "ball_consuming";
    const isGone = thresholdPhase === "portal_ready" || thresholdPhase === "jumping";
    const interactive = thresholdPhase === "idle" && !selectedMessage;

    let consumeProgress = 0;
    if (isBeingConsumed && consumeStartedAt.current) {
      consumeProgress = Math.min(
        1,
        (performance.now() - consumeStartedAt.current) / CONSUME_DURATION_MS,
      );
    } else if (isGone) {
      consumeProgress = 1;
    }

    const consumeEase = consumeProgress * consumeProgress * (3 - 2 * consumeProgress);
    const opacityFade = consumeProgress < 0.86
      ? 1
      : 1 - (consumeProgress - 0.86) / 0.14;
    const hoverBoost = interactive && hovered ? 0.14 : 0;
    const consumeBoost = Math.min(1, consumeProgress / 0.6);
    const { start, c1, c2, end } = consumeCurvePoints;

    if (consumableRef.current) {
      if (isBeingConsumed || isGone) {
        const curvePosition = new THREE.Vector3().set(
          cubicBezierPoint(start.x, c1.x, c2.x, end.x, consumeEase),
          cubicBezierPoint(start.y, c1.y, c2.y, end.y, consumeEase),
          cubicBezierPoint(start.z, c1.z, c2.z, end.z, consumeEase),
        );
        consumableRef.current.position.copy(curvePosition);
        const shrinkProgress = Math.max(0, (consumeProgress - 0.22) / 0.78);
        const scale = THREE.MathUtils.lerp(1, 0.12, shrinkProgress);
        consumableRef.current.scale.setScalar(scale);
      } else {
        consumableRef.current.position.lerp(ORIGIN_VEC3, 1 - Math.exp(-delta * 8));
        consumableRef.current.scale.lerp(UNIT_VEC3, 1 - Math.exp(-delta * 8));
      }
    }

    if (rootRef.current) {
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 1 - Math.exp(-delta * 8));
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, 0, 1 - Math.exp(-delta * 8));
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, 0, 1 - Math.exp(-delta * 8));
    }

    if (coloredSphere.current?.material) {
      const material = coloredSphere.current.material;
      material.opacity = (0.4 + hoverBoost + consumeBoost * 0.08) * opacityFade;
      material.color.set(baseColor);
      material.emissive.set(emissiveColor);
      material.emissiveIntensity = 0.4 + consumeBoost * 0.65;
    }

    if (pointsRef.current?.material) {
      pointsRef.current.material.opacity = (isLowQuality ? 0.48 : 0.92) * opacityFade;
      pointsRef.current.rotation.y += delta * (interactive ? 0.15 : 0.08);
      pointsRef.current.rotation.x += delta * 0.03;
    }

    // A deliberate orbit, distinct from the ambient Sparkles scattered
    // around the room — a single ring at a fixed tilt, slowly turning,
    // reads as something circling the ball on purpose rather than just
    // twinkling near it. Shares the same hover-reactive color as the point
    // light so the whole ball (core, halo, ring) brightens together.
    if (orbitRingRef.current?.material) {
      orbitRingRef.current.rotation.z += delta * (interactive ? 0.12 : 0.06);
      orbitRingRef.current.material.opacity = (isLowQuality ? 0.3 : 0.48) * opacityFade;
      orbitRingRef.current.material.color.set(lightColor);
    }

    if (pointLightRef.current) {
      pointLightRef.current.intensity = 2 + consumeBoost * 3;
      pointLightRef.current.distance = 20 + consumeBoost * 4;
      pointLightRef.current.color.set(lightColor);
    }
  });

  return (
    <>
      <Float
        speed={isConsumedOrGone ? 0 : isLowQuality ? 3.2 : 5}
        rotationIntensity={isConsumedOrGone ? 0 : isLowQuality ? 0.18 : 0.3}
        floatIntensity={isConsumedOrGone ? 0 : isLowQuality ? 0.9 : 1.5}
        floatingRange={[0.5, 0.2, 0.2]}
      >
        <group
          ref={rootRef}
          scale={ROOT_SCALE}
          position={isMobile ? [0, 0, 0] : [0, 1, 0]}
        >
          <group
            ref={consumableRef}
            onPointerOver={() => {
              if (thresholdPhase !== "idle" || selectedMessage) return;
              setHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = "default";
            }}
            onClick={() => {
              if (thresholdPhase !== "idle" || selectedMessage) return;
              onInitialActivate?.();
            }}
          >
            {!isGoneFromView && (
              <>
                <DistortBall
                  qualityTier={qualityTier}
                  baseDistort={isLowQuality ? 0.5 : 0.7}
                  speed={isLowQuality ? 2.2 : 3}
                  color={palette.distort}
                  opacity={0.6}
                  distortBoost={thresholdPhase === "ball_consuming" ? 0.38 : 0}
                  speedBoost={thresholdPhase === "ball_consuming" ? 1.2 : 0}
                />

                <mesh ref={coloredSphere}>
                  <sphereGeometry args={[1.5, 32, 32]} />
                  <meshStandardMaterial
                    color={baseColor}
                    transparent
                    opacity={0.4}
                    emissive={emissiveColor}
                    emissiveIntensity={0.4}
                  />
                </mesh>

                <points ref={pointsRef} scale={1.5}>
                  <sphereGeometry
                    args={[1, isLowQuality ? 12 : 16, isLowQuality ? 80 : 120]}
                  />
                  <pointsMaterial
                    size={0.01}
                    color={palette.points}
                    transparent
                    opacity={isLowQuality ? 0.48 : 0.92}
                  />
                </points>

                <mesh ref={orbitRingRef} rotation={[Math.PI / 2.3, 0.18, 0]}>
                  <torusGeometry
                    args={[2.3, 0.012, 12, isLowQuality ? 48 : 96]}
                  />
                  <meshBasicMaterial
                    color={lightColor}
                    transparent
                    opacity={isLowQuality ? 0.3 : 0.48}
                  />
                </mesh>

                <pointLight
                  ref={pointLightRef}
                  color={lightColor}
                  intensity={2}
                  distance={20}
                  decay={0.3}
                  castShadow
                />
              </>
            )}
          </group>

          {!isGoneFromView && (
            <Selfinder
              targetOpacity={thresholdPhase === "idle" || thresholdPhase === "message_open" ? 1 : 0}
              color={palette.text}
            />
          )}
        </group>
      </Float>

      <Sparkles
        count={isLowQuality ? 26 : isMediumQuality ? 42 : 56}
        speed={isLowQuality ? 0.5 : 0.9}
        size={isLowQuality ? 2 : 8}
        color={palette.sparkles}
        opacity={isLowQuality ? 0.45 : 0.95}
        scale={20}
      />
    </>
  );
}
