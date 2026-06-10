import {
  CameraControls,
  Html,
} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Message from "./Message";
import MagicBall from "../designElements/MagicBall";
import WizardMessage from "./WizardMessage";
import { BLACK_HOLE_POSITION } from "./portalConfig";

const PORTAL_TILT = -Math.PI / 3.5;

function BlackHolePortal({ quality }) {
  const accretionRef = useRef();
  const lensHaloRef = useRef();
  const qualityTier = quality?.tier || "medium";
  const isLowQuality = qualityTier === "low";
  const isMediumQuality = qualityTier === "medium";

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (accretionRef.current) {
      accretionRef.current.rotation.z += delta * 0.2;
    }
    if (lensHaloRef.current) {
      lensHaloRef.current.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.02;
      const scale = 1 + Math.sin(t * 0.75) * 0.018;
      lensHaloRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={BLACK_HOLE_POSITION}>
      <mesh rotation={[PORTAL_TILT, 0, 0]} position={[0, 0, -1.2]} scale={[1.34, 0.88, 1]}>
        <ringGeometry args={[20, 31, isLowQuality ? 40 : isMediumQuality ? 56 : 72]} />
        <meshBasicMaterial
          color="#120c1f"
          transparent
          opacity={0.48}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={accretionRef}
        rotation={[PORTAL_TILT, 0, 0]}
        position={[0, 0, -0.04]}
        scale={[1.42, 0.5, 1]}
      >
        <torusGeometry
          args={[
            15.2,
            3.9,
            isLowQuality ? 12 : 18,
            isLowQuality ? 44 : isMediumQuality ? 64 : 88,
          ]}
        />
        <meshBasicMaterial
          color="#ffac78"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={lensHaloRef}
        rotation={[PORTAL_TILT, 0, 0]}
        position={[0, 0, 0.46]}
      >
        <ringGeometry args={[15.2, 22.4, isLowQuality ? 36 : isMediumQuality ? 54 : 72]} />
        <meshBasicMaterial
          color="#7d79ff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[PORTAL_TILT, 0, 0]} position={[0, 0, 0.7]}>
        <circleGeometry args={[14.8, isLowQuality ? 40 : isMediumQuality ? 56 : 72]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      <mesh rotation={[PORTAL_TILT, 0, 0]} position={[0, 0, 0.94]}>
        <circleGeometry args={[11.9, isLowQuality ? 32 : isMediumQuality ? 44 : 56]} />
        <meshBasicMaterial color="#020103" />
      </mesh>
    </group>
  );
}

const Experience = ({ quality, onJourneyTransferComplete }) => {
  const controls = useRef();
  const htmlPortal = useRef(null);
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const [wizardMessageReady, setWizardMessageReady] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const isLowQuality = quality?.tier === "low";

  useEffect(() => {
    htmlPortal.current = document.body;
  }, []);

  return (
    <>
      {/* Perf panel disabled due r3f-perf/three version mismatch warning during builds. */}

      <CameraControls ref={controls} makeDefault enabled={controlsEnabled} />
      <MagicBall
        quality={quality}
        controls={controls}
        setControlsEnabled={setControlsEnabled}
        setWizardMessageReady={setWizardMessageReady}
        onJourneyTransferComplete={onJourneyTransferComplete}
        selectedMessage={selectedMessage}
        setSelectedMessage={setSelectedMessage}
      />

      {selectedMessage && (
        <Html
          fullscreen
          portal={htmlPortal}
          style={{ pointerEvents: "auto", zIndex: 1000 }}
        >
          <Message
            controls={controls}
            selectedMessage={selectedMessage}
            setSelectedMessage={setSelectedMessage}
            setControlsEnabled={setControlsEnabled}
          />
        </Html>
      )}

      <directionalLight
        position={[-30, 0, 20]}
        intensity={isLowQuality ? 0.3 : 1}
      />
      <ambientLight intensity={isLowQuality ? 0.65 : 0.8} />

      {/* <Torch color="#685584" /> */}
      {/* <RoomSurfaceGrid position={[0, 0, 0]} /> */}

      <BlackHolePortal quality={quality} />
      <WizardMessage controls={controls} showMessage={wizardMessageReady} />
      {/* <group position={[0, -50, -150]}>
        <Wizard scale={20} />
      </group> */}
    </>
  );
};

export default Experience;
