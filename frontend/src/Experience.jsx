import {
  CameraControls,
  Html,
  MeshDistortMaterial,
  Sphere,
} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import Message from "./frontpage/Message";
import MagicBall from "./designElements/MagicBall";
import Shelves from "./designElements/Shelves";
import Torch from "./designElements/Torch";
import Wizard from "./frontpage/Wizard";
import WizardMessage from "./frontpage/WizardMessage";

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

      {!isLowQuality && (
        <Sphere args={[10, 64, 64]} position={[-65, -90, -150]}>
          <MeshDistortMaterial
            color="#a1eb90"
            roughness={0.7}
            metalness={0.8}
            speed={2}
            distort={0.4}
          />
        </Sphere>
      )}

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

      <Torch color="#685584" />
      <Shelves position={[0, 0, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-35, -120, -150]}>
        <circleGeometry args={[80, 64, 64]} />
        <meshStandardMaterial color="#000000" transparent opacity={1} />
      </mesh>
      <WizardMessage controls={controls} showMessage={wizardMessageReady} />
      <group position={[-30, -80, -150]}>
        <Wizard scale={20} />
      </group>
    </>
  );
};

export default Experience;
