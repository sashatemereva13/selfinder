import React, {
  useRef,
  useState,
  useEffect,
  useRef as useRefAlias,
} from "react";
import { useGLTF, Html, Float, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import ConversationMap from "../list/ConversationMap";
import { SmoothTypewriter } from "../designElements/SmoothTypewriter";

const MIN_ACTION_DELAY_MS = 0;
const MIN_FOV_TWEEN_MS = 60;
const MIN_FOV_RESET_MS = 1;

export default function WizardMessage({ showMessage, controls }) {
  const group = useRef();
  const dodecahedron = useRef();

  const { camera, viewport } = useThree();
  const navigate = useNavigate();

  const [conversationPhase, setConversationPhase] = useState("start");
  const [isFlying, setIsFlying] = useState(false);
  const [portalFxStage, setPortalFxStage] = useState("idle");

  // Optional: prep OrbitControls for smooth flights
  useEffect(() => {
    if (!controls?.current) return;
    controls.current.enabled = true;
    controls.current.enableDamping = true;
    controls.current.dampingFactor = 0.12;

    // prevent manual drag during flights (keeps setLookAt buttery)
    controls.current.mouseButtons.left = 0;
    controls.current.mouseButtons.middle = 0;
    controls.current.mouseButtons.right = 0;
    controls.current.touches.one = 0;
    controls.current.touches.two = 0;
    controls.current.touches.three = 0;
  }, [controls]);

  // ------- camera flight helpers -------

  const flyDirect = async (endPos, lookAt, duration = 1.2) => {
    setIsFlying(true);
    const start = camera.position.clone();
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / (duration * 1000));
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
      camera.position.lerpVectors(start, endPos, e);
      camera.lookAt(lookAt);
      if (t < 1) requestAnimationFrame(step);
      else setIsFlying(false);
    };
    requestAnimationFrame(step);
  };

  // utility
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const tweenFov = async (targetFov, duration = MIN_FOV_TWEEN_MS) => {
    const startFov = camera.fov;
    const t0 = performance.now();

    await new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - (1 - t) ** 3;
        camera.fov = startFov + (targetFov - startFov) * eased;
        camera.updateProjectionMatrix();

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  };

  const flyTo = async (endPos, lookAt) => {
    if (controls?.current) {
      await Promise.resolve(
        controls.current.setLookAt(
          endPos.x,
          endPos.y,
          endPos.z,
          lookAt.x,
          lookAt.y,
          lookAt.z,
          true,
        ),
      );
      return;
    }
    // fallback: direct
    await flyDirect(endPos, lookAt, 1.2);
  };

  // pass through the black hole center along the current approach vector
  const flyThroughBlackHole = async (
    center,
    entryDist = 40,
    exitDist = 30,
    lookDownOffset = 0,
  ) => {
    const cam = controls?.current?.object || camera;

    // direction from camera → hole
    const dir = new THREE.Vector3()
      .subVectors(center, cam.position)
      .normalize();

    const entryPos = center.clone().addScaledVector(dir, -entryDist); // before the hole
    const exitPos = center.clone().addScaledVector(dir, exitDist); // past the hole
    const lookTarget = center
      .clone()
      .add(new THREE.Vector3(0, lookDownOffset, 0));
    const lookPast = center
      .clone()
      .addScaledVector(dir, exitDist + 50)
      .add(new THREE.Vector3(0, lookDownOffset, 0));

    // optional: make the pass a bit snappier
    const originalSmooth = controls?.current?.smoothTime;
    if (controls?.current) controls.current.smoothTime = 0.6;

    // 1) approach to entry (look at center)
    await flyTo(entryPos, lookTarget);
    // 2) go through to the far side (keep looking slightly beyond)
    await flyTo(exitPos, lookPast);

    // restore smoothness
    if (controls?.current && originalSmooth != null) {
      controls.current.smoothTime = originalSmooth;
    }
  };

  const flyToExploration = async () => {
    if (isFlying) return;
    setIsFlying(true);

    const mobile = viewport.width < 8;

    // 1) your first move (the “go up” shot)
    const destPos = mobile
      ? new THREE.Vector3(6, -4, 10)
      : new THREE.Vector3(8, -1, 10);

    // keep looking toward the portal area so the next move feels continuous
    const destLook = new THREE.Vector3(-35, -180, -150);

    await flyTo(destPos, destLook);

    // 2) remove pause between actions
    await delay(MIN_ACTION_DELAY_MS);

    // 3) fly through the black hole
    const holeCenter = new THREE.Vector3(-35, -120, -150);
    await flyThroughBlackHole(
      holeCenter,
      /*entry*/ 42,
      /*exit*/ 36,
      /*lookDown*/ -8,
    );

    setIsFlying(false);
  };

  const flyIntoMeasurePortal = async () => {
    if (isFlying) return;
    setIsFlying(true);

    const holeCenter = new THREE.Vector3(-35, -120, -150);
    const originalSmooth = controls?.current?.smoothTime;
    const originalFov = camera.fov;

    try {
      if (controls?.current) {
        controls.current.smoothTime = 0.1;
      }
      setPortalFxStage("tunnel");

      await Promise.all([
        flyThroughBlackHole(
          holeCenter,
          /*entry*/ 70,
          /*exit*/ 105,
          /*lookDown*/ -18,
        ),
        tweenFov(Math.min(originalFov + 26, 95), MIN_FOV_TWEEN_MS),
      ]);

      setPortalFxStage("blackout");
      await delay(MIN_ACTION_DELAY_MS);
    } finally {
      await tweenFov(originalFov, MIN_FOV_RESET_MS);
      if (controls?.current && originalSmooth != null) {
        controls.current.smoothTime = originalSmooth;
      }
      setIsFlying(false);
      setPortalFxStage("idle");
    }
  };

  // -------------------------------------

  const currentPhase = ConversationMap[conversationPhase];

  return (
    <>
      {showMessage && currentPhase && (
        <Html
          position={[-30, -104, -60]}
          distanceFactor={12}
          transform
          style={{ pointerEvents: "auto" }}
        >
          <SmoothTypewriter>{currentPhase.message}</SmoothTypewriter>

          <div className="choiceButtons">
            {currentPhase.options?.map(({ label, next }) => (
              <button
                key={label}
                className="downloadButtons"
                onClick={async () => {
                  if (next === "goToMeasure") {
                    await flyIntoMeasurePortal();
                    navigate("/measure", { state: { fromPortalJump: true } });
                    return;
                  }

                  // Trigger when leaving explorationStart → askFirstQuestion
                  const leavingExplorationStart =
                    currentPhase === ConversationMap.explorationStart &&
                    next === "askFirstQuestion";

                  if (leavingExplorationStart) {
                    await flyToExploration();
                  }

                  setConversationPhase(next);
                }}
                disabled={isFlying}
              >
                {label}
              </button>
            ))}
          </div>
        </Html>
      )}
      {portalFxStage !== "idle" && (
        <Html
          fullscreen
          style={{ pointerEvents: "none", zIndex: 2500 }}
          className={`portalJumpOverlay is-${portalFxStage}`}
        >
          <div className="portalJumpOverlayInner" />
        </Html>
      )}
    </>
  );
}
