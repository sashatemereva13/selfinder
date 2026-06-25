import { CameraControls, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Message from "./Message";
import MagicBall from "../designElements/MagicBall";
import WizardMessage from "./WizardMessage";
import FeelingLuckyList from "../designElements/FeelingLuckyList.json";
import { THRESHOLD_PORTAL_LAYOUT } from "./portalConfig";
import { useChat } from "../guide/ChatContext";

const PORTAL_TILT = -Math.PI / 3.5;
const PORTAL_SUMMON_MS = 550;
const REFRAME_MS = 520;
const BALL_CONSUME_MS = 900;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function makeRadialGradientTexture(stops, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// A single ring-shaped rainbow texture replaces the old funnel ring + 3 prism
// rings + 5-12 tear planes — same "spectral accretion disk" look, but baked
// once into one texture instead of stacking a dozen extra meshes per frame.
function makeRainbowSwirlTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  const conic = ctx.createConicGradient(0, cx, cy);
  const hueStops = 12;
  for (let i = 0; i <= hueStops; i += 1) {
    const t = i / hueStops;
    conic.addColorStop(t, `hsl(${t * 360}, 92%, 58%)`);
  }
  ctx.fillStyle = conic;
  ctx.fillRect(0, 0, size, size);

  // Fade to transparent toward the void (inner edge) and toward space
  // (outer edge) so the hue wheel reads as a ring, not a filled disc.
  const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  radial.addColorStop(0, "rgba(255,255,255,0)");
  radial.addColorStop(0.4, "rgba(255,255,255,0)");
  radial.addColorStop(0.56, "rgba(255,255,255,1)");
  radial.addColorStop(0.9, "rgba(255,255,255,1)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// The void's two soft highlights are baked straight into its texture —
// a quiet, watching presence, at zero runtime cost.
function makeVoidTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  base.addColorStop(0, "rgba(0,0,0,1)");
  base.addColorStop(0.55, "rgba(10,4,18,1)");
  base.addColorStop(0.82, "rgba(28,12,42,0.96)");
  base.addColorStop(1, "rgba(42,18,58,0.55)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const eyeY = cy + size * 0.08;
  const eyeOffsetX = size * 0.15;
  const eyeRadius = size * 0.05;
  [-1, 1].forEach((side) => {
    const ex = cx + side * eyeOffsetX;
    const glow = ctx.createRadialGradient(
      ex,
      eyeY,
      0,
      ex,
      eyeY,
      eyeRadius * 2.2,
    );
    glow.addColorStop(0, "rgba(255,255,255,0.92)");
    glow.addColorStop(0.45, "rgba(255,255,255,0.45)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function BlackHolePortal({
  quality,
  mode = "summoned",
  position,
  visible,
  interactive,
  intensityState,
  onActivate,
}) {
  const groupRef = useRef();
  const accretionRef = useRef();
  const lensHaloRef = useRef();
  const innerGlowRef = useRef();
  const coreVoidRef = useRef();
  const summonStartRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const qualityTier = quality?.tier || "medium";
  const isLowQuality = qualityTier === "low";
  const isMediumQuality = qualityTier === "medium";
  const baseScale = mode === "summoned" ? 0.18 : 1;

  const voidTexture = useMemo(() => makeVoidTexture(), []);
  const glowTexture = useMemo(
    () =>
      makeRadialGradientTexture([
        [0, "rgba(214,182,255,0.95)"],
        [0.35, "rgba(185,140,255,0.55)"],
        [1, "rgba(185,140,255,0)"],
      ]),
    [],
  );
  const rainbowTexture = useMemo(() => makeRainbowSwirlTexture(), []);

  useEffect(() => {
    return () => {
      voidTexture.dispose();
      glowTexture.dispose();
      rainbowTexture.dispose();
      document.body.style.cursor = "default";
    };
  }, [glowTexture, rainbowTexture, voidTexture]);

  useEffect(() => {
    if (visible) {
      summonStartRef.current = performance.now();
    } else {
      summonStartRef.current = null;
      setHovered(false);
      document.body.style.cursor = "default";
    }
  }, [visible]);

  useEffect(() => {
    if (interactive) return;
    setHovered(false);
    document.body.style.cursor = "default";
  }, [interactive]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const t = clock.elapsedTime;
    const summonProgress =
      visible && summonStartRef.current
        ? Math.min(
            1,
            (performance.now() - summonStartRef.current) / PORTAL_SUMMON_MS,
          )
        : 0;
    const summonEase =
      summonProgress * summonProgress * (3 - 2 * summonProgress);
    const stateBoost =
      intensityState === "consuming"
        ? 1
        : intensityState === "ready"
          ? 0.4
          : intensityState === "summoning"
            ? 0.22
            : 0;
    const wobble =
      intensityState === "consuming"
        ? Math.sin(t * 9) * 0.022
        : Math.sin(t * 2.2) * 0.008;
    const hoveredBoost = interactive && hovered ? 0.18 : 0;
    const scale =
      baseScale *
      THREE.MathUtils.lerp(0.15, 1, summonEase) *
      (1 + wobble + hoveredBoost * 0.08);

    groupRef.current.position.set(...position);
    groupRef.current.scale.setScalar(scale);

    if (accretionRef.current) {
      accretionRef.current.rotation.z +=
        delta * (0.12 + stateBoost * 0.3 + hoveredBoost * 0.14);
      accretionRef.current.material.opacity =
        (0.55 + stateBoost * 0.25 + hoveredBoost * 0.1) * summonEase;
    }

    if (lensHaloRef.current) {
      const haloPulse =
        1 +
        Math.sin(t * (0.75 + stateBoost * 0.8)) * (0.018 + stateBoost * 0.022);
      lensHaloRef.current.scale.setScalar(haloPulse);
      lensHaloRef.current.material.opacity =
        (0.08 + stateBoost * 0.12 + hoveredBoost * 0.08) * summonEase;
    }

    if (innerGlowRef.current) {
      const breathe = 0.5 + Math.sin(t * (0.42 + stateBoost * 0.36)) * 0.5;
      innerGlowRef.current.material.opacity =
        (0.26 + breathe * 0.26 + stateBoost * 0.2 + hoveredBoost * 0.08) *
        summonEase;
      innerGlowRef.current.scale.setScalar(
        0.86 + breathe * 0.2 + stateBoost * 0.08,
      );
    }

    if (coreVoidRef.current) {
      coreVoidRef.current.material.opacity = 0.84 + stateBoost * 0.1;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <mesh
        ref={lensHaloRef}
        rotation={[PORTAL_TILT, 0, 0]}
        position={[0, 0, 0.46]}
      >
        <ringGeometry
          args={[15.2, 22.4, isLowQuality ? 36 : isMediumQuality ? 54 : 72]}
        />
        <meshBasicMaterial
          color="#cdb8ff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={coreVoidRef}
        rotation={[PORTAL_TILT, 0, 0]}
        position={[0, 0, 0.7]}
      >
        <circleGeometry
          args={[14.8, isLowQuality ? 40 : isMediumQuality ? 56 : 72]}
        />
        <meshBasicMaterial map={voidTexture} transparent />
      </mesh>
    </group>
  );
}

const Experience = ({
  quality,
  onJourneyTransferComplete,
  onDebugStateChange,
}) => {
  const controls = useRef();
  const htmlPortal = useRef(null);
  const isMountedRef = useRef(true);
  const portalSequenceRef = useRef(false);
  const unlockTriggeredRef = useRef(false);
  const debugPulseRef = useRef(0);
  const phaseStartedAtRef = useRef(performance.now());
  const { viewport } = useThree();
  const { setThresholdEngaged } = useChat();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [thresholdPhase, setThresholdPhase] = useState("idle");

  const isLowQuality = quality?.tier === "low";
  const isMobile = viewport.width < 8;
  const layout = isMobile
    ? THRESHOLD_PORTAL_LAYOUT.mobile
    : THRESHOLD_PORTAL_LAYOUT.desktop;

  // Reset on each mount of the threshold scene, so GuideAnchor's merged
  // "touch the sphere" line shows again on a fresh visit to "/".
  useEffect(() => {
    setThresholdEngaged(false);
  }, [setThresholdEngaged]);

  useEffect(() => {
    isMountedRef.current = true;
    htmlPortal.current = document.body;
    return () => {
      isMountedRef.current = false;
      document.body.style.cursor = "default";
    };
  }, []);

  useEffect(() => {
    if (!controls.current) return;

    controls.current.enabled = true;
    controls.current.smoothTime = 0.12;
    controls.current.mouseButtons.left = 0;
    controls.current.mouseButtons.middle = 0;
    controls.current.mouseButtons.right = 0;
    controls.current.touches.one = 0;
    controls.current.touches.two = 0;
    controls.current.touches.three = 0;
  }, []);

  useEffect(() => {
    phaseStartedAtRef.current = performance.now();
  }, [thresholdPhase]);

  const triggerJourneyUnlock = useCallback(() => {
    if (unlockTriggeredRef.current) return;
    unlockTriggeredRef.current = true;
    onJourneyTransferComplete?.();
  }, [onJourneyTransferComplete]);

  const reframeCameraToPortal = useCallback(async () => {
    if (!controls.current) return;

    const originalSmooth = controls.current.smoothTime;
    const [cameraX, cameraY, cameraZ] = layout.cameraPosition;
    const [lookX, lookY, lookZ] = layout.lookAt;

    controls.current.enabled = true;
    controls.current.smoothTime = 0.18;
    controls.current.setLookAt(
      cameraX,
      cameraY,
      cameraZ,
      lookX,
      lookY,
      lookZ,
      true,
    );

    await wait(REFRAME_MS);

    if (controls.current) {
      controls.current.smoothTime = originalSmooth;
    }
  }, [layout.cameraPosition, layout.lookAt]);

  useEffect(() => {
    if (thresholdPhase !== "portal_summon") return;

    void reframeCameraToPortal();
  }, [reframeCameraToPortal, thresholdPhase]);

  const beginPortalSequence = useCallback(() => {
    if (portalSequenceRef.current || thresholdPhase !== "message_open") return;
    portalSequenceRef.current = true;
    setThresholdPhase("portal_summon");
  }, [thresholdPhase]);

  const handleInitialActivate = useCallback(() => {
    if (thresholdPhase !== "idle") return;
    const messageIndex = Math.floor(Math.random() * FeelingLuckyList.length);
    setSelectedMessage(FeelingLuckyList[messageIndex]);
    setThresholdPhase("message_open");
    setThresholdEngaged(true);
  }, [thresholdPhase, setThresholdEngaged]);

  const handleSelectedMessageChange = useCallback(
    (nextMessage) => {
      if (
        nextMessage === null &&
        selectedMessage &&
        thresholdPhase === "message_open"
      ) {
        setSelectedMessage(null);
        beginPortalSequence();
        return;
      }

      setSelectedMessage(nextMessage);
    },
    [beginPortalSequence, selectedMessage, thresholdPhase],
  );

  const handlePortalActivate = useCallback(() => {
    if (thresholdPhase !== "portal_ready") return;
    setThresholdPhase("jumping");
  }, [thresholdPhase]);

  const handleJumpError = useCallback(() => {
    setThresholdPhase("portal_ready");
  }, []);

  const portalVisible =
    thresholdPhase !== "idle" && thresholdPhase !== "message_open";
  const portalIntensityState =
    thresholdPhase === "portal_summon"
      ? "summoning"
      : thresholdPhase === "ball_consuming"
        ? "consuming"
        : thresholdPhase === "portal_ready" || thresholdPhase === "jumping"
          ? "ready"
          : "hidden";

  useEffect(() => {
    if (!import.meta.env.DEV || !onDebugStateChange) return;

    onDebugStateChange({
      thresholdPhase,
      phaseAgeMs: Math.round(performance.now() - phaseStartedAtRef.current),
      hasSelectedMessage: Boolean(selectedMessage),
      portalSequenceLocked: portalSequenceRef.current,
      portalVisible,
      portalIntensityState,
    });
  }, [
    onDebugStateChange,
    portalIntensityState,
    portalVisible,
    selectedMessage,
    thresholdPhase,
  ]);

  useFrame(() => {
    if (!isMountedRef.current) return;

    const phaseAgeMs = performance.now() - phaseStartedAtRef.current;

    if (thresholdPhase === "portal_summon" && phaseAgeMs >= REFRAME_MS) {
      setThresholdPhase((currentPhase) =>
        currentPhase === "portal_summon" ? "ball_consuming" : currentPhase,
      );
      return;
    }

    if (thresholdPhase === "ball_consuming" && phaseAgeMs >= BALL_CONSUME_MS) {
      setThresholdPhase((currentPhase) =>
        currentPhase === "ball_consuming" ? "portal_ready" : currentPhase,
      );
      triggerJourneyUnlock();
      portalSequenceRef.current = false;
    }
  });

  useFrame(() => {
    if (!import.meta.env.DEV || !onDebugStateChange) return;

    const now = performance.now();
    if (now - debugPulseRef.current < 250) return;

    debugPulseRef.current = now;
    onDebugStateChange({
      lastFrameAt: now,
      phaseAgeMs: Math.round(now - phaseStartedAtRef.current),
    });
  });

  return (
    <>
      <CameraControls ref={controls} makeDefault enabled />

      <MagicBall
        quality={quality}
        thresholdPhase={thresholdPhase}
        selectedMessage={selectedMessage}
        portalTargetPosition={layout.portalPosition}
        onInitialActivate={handleInitialActivate}
      />

      {selectedMessage && (
        <Html
          fullscreen
          portal={htmlPortal}
          style={{ pointerEvents: "auto", zIndex: 1000 }}
        >
          <Message
            selectedMessage={selectedMessage}
            setSelectedMessage={handleSelectedMessageChange}
          />
        </Html>
      )}

      <directionalLight
        position={[-30, 0, 20]}
        intensity={isLowQuality ? 0.3 : 1}
      />
      <ambientLight intensity={isLowQuality ? 0.65 : 0.8} />

      <BlackHolePortal
        quality={quality}
        mode="summoned"
        position={layout.portalPosition}
        visible={portalVisible}
        interactive={thresholdPhase === "portal_ready"}
        intensityState={portalIntensityState}
        onActivate={handlePortalActivate}
      />

      <WizardMessage
        controls={controls}
        phase={thresholdPhase}
        portalPosition={layout.portalPosition}
        hintPosition={layout.hintPosition}
        onActivate={handlePortalActivate}
        onJumpError={handleJumpError}
      />
    </>
  );
};

export default Experience;
