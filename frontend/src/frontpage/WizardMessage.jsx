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
import ConversationMap from "./ConversationMap";
import { BLACK_HOLE_POSITION } from "./portalConfig";
import { SmoothTypewriter } from "../designElements/SmoothTypewriter";
import {
  useJourneyLine,
  MEASURE_ARRIVAL_SCENE_ID,
  MEASURE_ARRIVAL_LINE,
} from "../content/journeyLines";

const MIN_ACTION_DELAY_MS = 0;
const PORTAL_FOV_TWEEN_MS = 420;
const PORTAL_FOV_RESET_MS = 180;
const PORTAL_BLACKOUT_HOLD_MS = 320;

function getBlackHoleCenter() {
  return new THREE.Vector3(...BLACK_HOLE_POSITION);
}

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
    controls.current.smoothTime = 0.12;

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

  const tweenFov = async (targetFov, duration = PORTAL_FOV_TWEEN_MS) => {
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
  const flyThroughBlackHole = async (center, options = {}) => {
    const {
      entryDist = 40,
      exitDist = 30,
      lookDownOffset = 0,
      lookPastDistance = 50,
      passSmoothTime = 0.42,
    } = options;
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
      .addScaledVector(dir, exitDist + lookPastDistance)
      .add(new THREE.Vector3(0, lookDownOffset, 0));

    const originalSmooth = controls?.current?.smoothTime;
    if (controls?.current) controls.current.smoothTime = passSmoothTime;

    await flyTo(entryPos, lookTarget);
    await flyTo(exitPos, lookPast);

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
    await flyThroughBlackHole(getBlackHoleCenter(), {
      entryDist: 42,
      exitDist: 36,
      lookDownOffset: -8,
      lookPastDistance: 42,
      passSmoothTime: 0.42,
    });

    setIsFlying(false);
  };

  const flyIntoMeasurePortal = async () => {
    if (isFlying) return;
    setIsFlying(true);

    const originalFov = camera.fov;

    // Warm the Measure route's code while the portal animation plays, so the
    // lazy-loaded chamber never shows a generic loading screen mid-jump.
    import("../measure/Measure").catch(() => {});

    try {
      setPortalFxStage("tunnel");

      await Promise.all([
        flyThroughBlackHole(getBlackHoleCenter(), {
          entryDist: 58,
          exitDist: 86,
          lookDownOffset: -10,
          lookPastDistance: 56,
          passSmoothTime: 0.24,
        }),
        tweenFov(Math.min(originalFov + 16, 82), PORTAL_FOV_TWEEN_MS),
      ]);

      setPortalFxStage("blackout");
      await delay(PORTAL_BLACKOUT_HOLD_MS);

      // Cross over while the screen is still fully black — this is what
      // keeps the fall feeling continuous instead of flashing back to the
      // scene (with its FOV reset) right before the page swaps.
      navigate("/measure", { state: { fromPortalJump: true } });
    } catch (err) {
      tweenFov(originalFov, PORTAL_FOV_RESET_MS);
      setIsFlying(false);
      setPortalFxStage("idle");
      throw err;
    }
  };

  // -------------------------------------

  const currentPhase = ConversationMap[conversationPhase];
  const currentMessage = currentPhase?.message?.trim() ?? "";
  const guideMessage = useJourneyLine(conversationPhase, currentMessage);
  const isPortalPrompt = conversationPhase === "start";

  // Pre-warm the Measure arrival caption while the player is still reading
  // the jump prompt — by the time they land, useJourneyLine's shared cache
  // already holds the resolved line, so it appears instantly with no pop-in.
  useJourneyLine(MEASURE_ARRIVAL_SCENE_ID, MEASURE_ARRIVAL_LINE);

  const htmlPosition = isPortalPrompt ? [-35, -103, -74] : [-30, -104, -60];
  const htmlDistanceFactor = isPortalPrompt ? 10.6 : 12;

  return (
    <>
      {showMessage && currentPhase && (
        <Html
          position={htmlPosition}
          distanceFactor={htmlDistanceFactor}
          transform
          style={{ pointerEvents: "auto" }}
        >
          <div className={isPortalPrompt ? "portalPromptShell" : undefined}>
            {currentMessage && guideMessage ? (
              <SmoothTypewriter>{guideMessage}</SmoothTypewriter>
            ) : null}

          <div className={isPortalPrompt ? "portalPromptActions" : "choiceButtons"}>
            {currentPhase.options?.map(({ label, next }) => (
              <button
                key={label}
                className={isPortalPrompt ? "portalJumpButton" : "downloadButtons"}
                onClick={async () => {
                  if (next === "goToMeasure") {
                    await flyIntoMeasurePortal();
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
          </div>
        </Html>
      )}
      {portalFxStage !== "idle" && (
        <Html
          fullscreen
          style={{ pointerEvents: "none", zIndex: 2500 }}
          className={`portalJumpOverlay is-${portalFxStage}`}
        >
          <div className="portalJumpOverlayTunnel" />
          <div className="portalJumpOverlayVoid" />
        </Html>
      )}
    </>
  );
}
