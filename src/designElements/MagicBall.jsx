import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Html, Sparkles, Float } from "@react-three/drei";
import { Text } from "@react-three/drei";

import * as THREE from "three";
import "../buttons3D/FeelingLuckyButton.css";

import DistortBall from "./DistortBall";
import FeelingLuckyList from "../list/FeelingLuckyList.json";
import Message from "../frontpage/Message";
import { SmoothTypewriter } from "./SmoothTypewriter";
import Selfinder from "../frontpage/Selfinder";

export const Phase = { INTRO: "intro", MESSAGE: "message", READY: "ready" };

export default function MagicBall({
  quality,
  controls,
  setControlsEnabled,
  setWizardMessageReady,
  onJourneyTransferComplete,
  selectedMessage,
  setSelectedMessage,
}) {
  /* ---------- refs & helpers ---------- */
  const { camera, viewport } = useThree();
  const sphere = useRef();
  const pointsRef = useRef();
  const coloredSphere = useRef();
  const groupRef = useRef();

  const isMobile = viewport.width < 8;
  const qualityTier = quality?.tier || "medium";
  const isLowQuality = qualityTier === "low";
  const isMediumQuality = qualityTier === "medium";

  /* ---------- state ---------- */
  const [isFlying, setIsFlying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [hovered, setHovered] = useState(false);
  const [phase, setPhase] = useState(Phase.INTRO);

  /* ---------- colour palette ---------- */
  const lightColor = hovered ? "#402289" : "#BB8FFF";
  const baseColor = hovered ? "#234f28" : "#BB8FFF";
  const emissiveColor = hovered ? "#402289" : "#9B5897";

  /* ---------- click handler ---------- */
  const handleClick = () => {
    if (phase === Phase.INTRO) {
      const idx = Math.floor(Math.random() * FeelingLuckyList.length);
      setSelectedMessage(FeelingLuckyList[idx]);
      setPhase(Phase.MESSAGE);
    } else if (phase === Phase.READY) {
      flyToSelfinder();
    }
  };

  useEffect(() => {
    // disable user interaction but allow programmatic movement
    if (controls.current) {
      controls.current.enabled = true; // required for `.setLookAt()` to work
      controls.current.enableDamping = true; // ≤ smooth interpolation
      controls.current.dampingFactor = 0.12;
      controls.current.mouseButtons.left = 0;
      controls.current.mouseButtons.middle = 0;
      controls.current.mouseButtons.right = 0;
      controls.current.touches.one = 0;
      controls.current.touches.two = 0;
      controls.current.touches.three = 0;
    }
  }, []);

  useEffect(() => {
    if (phase === Phase.MESSAGE && !selectedMessage) {
      setPhase(Phase.READY);
    }
  }, [phase, selectedMessage]);

  const flyToSelfinder = () => {
    if (!controls?.current || isFlying) return;

    controls.current.enabled = true;
    setIsFlying(true);
    setIsLoading(true);

    // where the camera should end up relative to Selfinder
    const destPos = new THREE.Vector3(-30, -96, -30); // 4 m in front of Selfinder
    const destLook = new THREE.Vector3(-30, -95, -70); // look at its centre

    controls.current.setLookAt(
      destPos.x,
      destPos.y,
      destPos.z,
      destLook.x,
      destLook.y,
      destLook.z,
      true, // enable smooth interpolation
    );

    setTimeout(() => {
      setIsFlying(false);
      setIsLoading(false); // Hide loading after flight ends
      setWizardMessageReady(true); // camera arrived
      onJourneyTransferComplete?.();
    }, 1200);
  };

  /* ---------- UI overlay ---------- */
  const Overlay = () => (
    <Html
      className="htmlText"
      position={[0, -7, -30]}
      style={{ textAlign: "center", whiteSpace: "pre-line" }}
      transform
      distanceFactor={isMobile ? 70 : 25}
      zIndexRange={[90, 90]}
    >
      {phase === Phase.INTRO && (
        <SmoothTypewriter className="smooth-typewriter-text">
          {`Welcome traveller. 
Neural scan ready. 
Touch the core to initiate signal mapping.`}
        </SmoothTypewriter>
      )}

      {phase === Phase.MESSAGE && (
        <SmoothTypewriter className="smooth-typewriter-text">
          {`Signal recognized. 
Message received. 
Close the message window to continue.`}
        </SmoothTypewriter>
      )}

      {phase === Phase.READY && (
        <SmoothTypewriter className="smooth-typewriter-text">
          {`Press the core again to start the journey.`}
        </SmoothTypewriter>
      )}
    </Html>
  );

  /* ------------------------------------------------------------ */

  return (
    <>
      <Float
        speed={isLowQuality ? 3.2 : 5}
        rotationIntensity={isLowQuality ? 0.18 : 0.3}
        floatIntensity={isLowQuality ? 0.9 : 1.5}
        floatingRange={[0.5, 0.2, 0.2]}
      >
        <group
          ref={groupRef}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "default";
          }}
          scale={2}
          position={isMobile ? [0, 0, 0] : [0, 1, 0]}
          onClick={handleClick}
        >
          <DistortBall
            qualityTier={qualityTier}
            baseDistort={isLowQuality ? 0.5 : 0.7}
            speed={isLowQuality ? 2.2 : 3}
          />

          {/* main glow */}
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

          {/* sparkle-halo */}
          <points ref={pointsRef} scale={1.5}>
            <sphereGeometry args={[1, isLowQuality ? 12 : 16, isLowQuality ? 80 : 120]} />
            <pointsMaterial size={0.01} color="#DF94FF" />
          </points>

          {/* internal light */}
          <pointLight
            color={lightColor}
            intensity={2}
            distance={20}
            decay={0.3}
            castShadow
          />

          <Selfinder />
        </group>
      </Float>
      {/* overlay text/buttons */}
      <Overlay />
      {isLoading && (
        <Html position={[0, 0, 0]} center distanceFactor={30}>
          <div className="loading-glow"> getting ready...</div>
        </Html>
      )}
      {/* ambient sparkles */}
      <Sparkles
        count={isLowQuality ? 26 : isMediumQuality ? 42 : 56}
        speed={isLowQuality ? 0.5 : 0.9}
        size={isLowQuality ? 2 : 3}
        color={"#BC40B8"}
        opacity={isLowQuality ? 0.45 : 0.65}
        scale={20}
      />
    </>
  );
}
