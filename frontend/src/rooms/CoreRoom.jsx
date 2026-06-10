import { Canvas } from "@react-three/fiber";
import {
  CameraControls,
  Float,
  MeshReflectorMaterial,
  RoundedBox,
  Sparkles,
  Text,
} from "@react-three/drei";
import { Link } from "react-router-dom";
import { Suspense, useMemo, useState } from "react";
import JourneyNav from "../designElements/JourneyNav";
import RoomSurfaceGrid from "../designElements/RoomSurfaceGrid";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import "./CoreRoom.css";

const ROLE_OPTIONS = [
  { key: "career", label: "Career", mask: "Achiever", color: "#d7e0eb" },
  { key: "caretaker", label: "Caretaker", mask: "Protector", color: "#bdd7e7" },
  { key: "artist", label: "Creative", mask: "Visionary", color: "#cfc7ff" },
];

const HIDDEN_OPTIONS = [
  { key: "fear", label: "Fear", note: "what if I am softer than I appear?" },
  { key: "anger", label: "Anger", note: "what if I hide what I resent?" },
  {
    key: "tenderness",
    label: "Tenderness",
    note: "what if my gentleness is the hidden truth?",
  },
];

function PersonaMask({ position, color, label, active }) {
  return (
    <Float speed={2.1} rotationIntensity={0.18} floatIntensity={0.6}>
      <group position={position}>
        <mesh castShadow>
          <capsuleGeometry args={[0.8, 1.7, 8, 14]} />
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={active ? 0.14 : 0.24}
            emissive={active ? color : "#000000"}
            emissiveIntensity={active ? 0.16 : 0}
          />
        </mesh>
        <mesh position={[-0.28, 0.12, 0.72]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial
            color="#0a0b0f"
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0.28, 0.12, 0.72]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial
            color="#0a0b0f"
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, -0.34, 0.72]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial
            color="#0a0b0f"
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>
        <Text
          position={[0, -1.65, 0]}
          fontSize={0.24}
          color="#f2eef8"
          anchorX="center"
        >
          {label}
        </Text>
      </group>
    </Float>
  );
}

function MirrorPlane({ position, rotation = [0, 0, 0], scale = [1, 1, 0.08] }) {
  return (
    <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.3}>
      <RoundedBox
        args={scale}
        position={position}
        rotation={rotation}
        radius={0.06}
        smoothness={4}
      >
        <meshPhysicalMaterial
          color="#c8d1dc"
          metalness={0.96}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.12}
          reflectivity={1}
          envMapIntensity={1.2}
        />
      </RoundedBox>
    </Float>
  );
}

function CoreRoomScene({ activeRole, hiddenPart, qualityTier }) {
  const isLowQuality = qualityTier === "low";
  const roleMeta =
    ROLE_OPTIONS.find((option) => option.key === activeRole) || ROLE_OPTIONS[0];
  const hiddenMeta =
    HIDDEN_OPTIONS.find((option) => option.key === hiddenPart) ||
    HIDDEN_OPTIONS[0];

  const mirrorPlanes = useMemo(
    () => [
      {
        position: [-4.8, 0.1, -4.4],
        rotation: [0.05, 0.42, 0],
        scale: [1.6, 3.4, 0.08],
      },
      {
        position: [4.6, 1.1, -6.8],
        rotation: [-0.03, -0.35, 0],
        scale: [1.5, 4.2, 0.08],
      },
      {
        position: [0, 2.2, -9.8],
        rotation: [0, 0, 0],
        scale: [5.6, 2.3, 0.08],
      },
      {
        position: [-6.6, 2.6, 0.5],
        rotation: [0, 0.65, 0],
        scale: [2.2, 3, 0.08],
      },
      {
        position: [6.8, 2.7, 1.1],
        rotation: [0, -0.72, 0],
        scale: [2, 3.2, 0.08],
      },
    ],
    [],
  );

  return (
    <>
      <color attach="background" args={["#06070b"]} />
      <fog attach="fog" args={["#06070b", 18, 38]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight
        args={["#dbe3ee", "#0a0d12", 0.8]}
        position={[0, 8, 0]}
      />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.4}
        color="#dce3ef"
        castShadow
      />
      <pointLight position={[0, 0, -12]} intensity={1.8} color="#cad3df" />
      <pointLight position={[0, 4, -12]} intensity={1.2} color="#90a3bb" />

      <group position={[0, 0, 0]}>
        <mesh
          position={[0, -4.6, -2]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[26, 26]} />
          <MeshReflectorMaterial
            color="#0d1015"
            blur={[80, 16]}
            resolution={512}
            mixBlur={0.8}
            mixStrength={16}
            roughness={0.16}
            metalness={0.82}
            mirror={0.55}
          />
        </mesh>

        <RoomSurfaceGrid
          position={[0, -4.54, -2]}
          rotation={[-Math.PI / 2, 0, 0]}
          tileSize={2}
          gridSize={14}
          palette={["#07090d", "#d4dce6"]}
          emissivePalette={["#06080d", "#253241"]}
          opacityRange={[0.28, 0.82]}
          emissiveIntensity={0.12}
          metalness={0.9}
          roughness={0.26}
        />

        <RoomSurfaceGrid
          position={[0, 7.2, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          tileSize={2}
          gridSize={14}
          palette={["#0f141b", "#aab7c8"]}
          emissivePalette={["#0a0d13", "#182533"]}
          opacityRange={[0.08, 0.18]}
          emissiveIntensity={0.05}
          metalness={0.88}
          roughness={0.34}
        />

        <mesh position={[0, 1.2, -14]}>
          <planeGeometry args={[20, 14]} />
          <meshPhysicalMaterial
            color="#0c1016"
            metalness={0.92}
            roughness={0.2}
            reflectivity={1}
            clearcoat={1}
            clearcoatRoughness={0.18}
          />
        </mesh>
        <mesh position={[-10, 1.2, -2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[24, 14]} />
          <meshPhysicalMaterial
            color="#0d1118"
            metalness={0.92}
            roughness={0.24}
            reflectivity={1}
            clearcoat={1}
            clearcoatRoughness={0.18}
          />
        </mesh>
        <mesh position={[10, 1.2, -2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[24, 14]} />
          <meshPhysicalMaterial
            color="#0d1118"
            metalness={0.92}
            roughness={0.24}
            reflectivity={1}
            clearcoat={1}
            clearcoatRoughness={0.18}
          />
        </mesh>

        {mirrorPlanes.map((plane) => (
          <MirrorPlane
            key={plane.position.join("-")}
            position={plane.position}
            rotation={plane.rotation}
            scale={plane.scale}
          />
        ))}

        <PersonaMask
          position={[-3.6, -1.3, -6]}
          color="#cfd8e3"
          label="Observer"
        />
        <PersonaMask
          position={[0.3, -1.1, -5.2]}
          color={roleMeta.color}
          label={roleMeta.mask}
          active
        />
        <PersonaMask
          position={[4.1, -1.35, -6.4]}
          color="#b8c6d5"
          label={hiddenMeta.label}
        />

        <Float speed={1.8} rotationIntensity={0.16} floatIntensity={0.4}>
          <group position={[0, 0.3, -13.6]}>
            <mesh>
              <torusGeometry args={[2.4, 0.1, 24, 100]} />
              <meshStandardMaterial
                color="#d9e0e7"
                emissive="#8594a8"
                emissiveIntensity={0.4}
                metalness={0.95}
                roughness={0.18}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[2.1, 64]} />
              <meshStandardMaterial
                color="#000000"
                emissive="#050608"
                emissiveIntensity={0.2}
              />
            </mesh>
            <Sparkles
              count={isLowQuality ? 20 : 40}
              scale={[4.2, 4.2, 0.8]}
              size={isLowQuality ? 2.2 : 3.8}
              speed={0.4}
              color="#e3e9f2"
              opacity={0.5}
            />
          </group>
        </Float>

        <Text
          position={[0, -2.8, -11.6]}
          fontSize={0.34}
          color="#edf1f7"
          anchorX="center"
        >
          door into the unknown
        </Text>
      </group>
    </>
  );
}

export default function CoreRoom() {
  const quality = useAdaptiveQuality();
  const [activeRole, setActiveRole] = useState("career");
  const [hiddenPart, setHiddenPart] = useState("fear");

  return (
    <div className="coreRoomPage">
      <div className="coreRoomCanvasWrap">
        <Canvas
          shadows
          dpr={quality.dpr}
          gl={{
            antialias: quality.tier !== "low",
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0.2, 10], fov: 52, near: 0.1, far: 120 }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); }, false);
          }}
        >
          <Suspense fallback={null}>
            <CameraControls
              makeDefault
              minPolarAngle={Math.PI / 2.6}
              maxPolarAngle={Math.PI / 1.8}
              minDistance={8}
              maxDistance={12}
              truckSpeed={0}
              dollySpeed={0.18}
              azimuthRotateSpeed={0.18}
              polarRotateSpeed={0.18}
            />
            <CoreRoomScene
              activeRole={activeRole}
              hiddenPart={hiddenPart}
              qualityTier={quality.tier}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* <div className="coreRoomOverlay">
        <section className="coreRoomPanel">
          <p className="sf-kicker">Persona Layer</p>
          <h1>Core</h1>
          <p className="coreRoomLead">
            A mirror chamber shaped by roles, expectations, and the identity
            presented to the world. The room stays coherent on the surface,
            while distortions reveal what is being managed underneath.
          </p>

          <div className="coreRoomQuestions">
            <div className="coreRoomQuestionBlock">
              <p className="coreRoomQuestion">Which roles define you most?</p>
              <div className="coreRoomChoiceRow">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`coreRoomChoice ${activeRole === option.key ? "is-active" : ""}`}
                    onClick={() => setActiveRole(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="coreRoomQuestionBlock">
              <p className="coreRoomQuestion">What parts stay hidden?</p>
              <div className="coreRoomChoiceRow">
                {HIDDEN_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`coreRoomChoice ${hiddenPart === option.key ? "is-active" : ""}`}
                    onClick={() => setHiddenPart(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="coreRoomResponse">
            <p className="coreRoomResponseLabel">Current reflection</p>
            <h2>
              {ROLE_OPTIONS.find((option) => option.key === activeRole)?.mask}
            </h2>
            <p>
              {HIDDEN_OPTIONS.find((option) => option.key === hiddenPart)?.note}
            </p>
          </div>

          <div className="coreRoomActions">
            <Link to="/measure" className="sf-btn sf-btn-primary">
              Continue to Measure
            </Link>
            <Link to="/threshold" className="sf-btn">
              Return to Threshold
            </Link>
          </div>
        </section>
      </div> */}
    </div>
  );
}
