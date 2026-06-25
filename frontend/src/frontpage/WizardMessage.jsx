import { Html } from "@react-three/drei";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

const PORTAL_CHARGE_MS = 380;
const PORTAL_STRETCH_MS = 640;
const PORTAL_COLLAPSE_MS = 220;
const PORTAL_BLACKOUT_HOLD_MS = 280;
const SPAGHETTI_STREAK_COUNT = 26;
const SPAGHETTI_STREAK_ANGLES = Array.from(
  { length: SPAGHETTI_STREAK_COUNT },
  (_, i) => Math.round((360 / SPAGHETTI_STREAK_COUNT) * i),
);

function getPortalCenter(portalPosition) {
  return new THREE.Vector3(...portalPosition);
}

export default function WizardMessage({
  controls,
  phase,
  portalPosition,
  hintPosition,
  onActivate,
  onJumpError,
}) {
  const navigate = useNavigate();
  const [portalFxStage, setPortalFxStage] = useState("idle");

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const chargeCameraPush = useCallback(async (center, duration = PORTAL_CHARGE_MS) => {
    const cam = controls?.current?.object;
    if (!cam) return;

    const startPos = cam.position.clone();
    const dir = new THREE.Vector3().subVectors(center, startPos).normalize();
    const pushDistance = 2.9;
    const shakeAmplitude = 0.22;
    const originalSmooth = controls?.current?.smoothTime;

    if (controls?.current) {
      controls.current.enabled = true;
      controls.current.smoothTime = 0.05;
    }

    const t0 = performance.now();

    await new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = t * t * (3 - 2 * t);
        const falloff = 1 - t;
        const jitter = new THREE.Vector3(
          (Math.random() - 0.5) * shakeAmplitude * falloff,
          (Math.random() - 0.5) * shakeAmplitude * falloff,
          (Math.random() - 0.5) * shakeAmplitude * falloff,
        );
        const pos = startPos
          .clone()
          .addScaledVector(dir, pushDistance * eased)
          .add(jitter);

        if (controls?.current) {
          controls.current.setLookAt(
            pos.x,
            pos.y,
            pos.z,
            center.x,
            center.y,
            center.z,
            true,
          );
        }

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });

    if (controls?.current && originalSmooth != null) {
      controls.current.smoothTime = originalSmooth;
    }
  }, [controls]);

  useEffect(() => {
    if (phase !== "jumping") return undefined;

    let cancelled = false;

    const jump = async () => {
      const center = getPortalCenter(portalPosition);

      import("../depths/Depths").catch(() => {});

      try {
        setPortalFxStage("charge");
        await chargeCameraPush(center);
        if (cancelled) return;

        setPortalFxStage("stretch");
        await delay(PORTAL_STRETCH_MS);
        if (cancelled) return;

        setPortalFxStage("collapse");
        await delay(PORTAL_COLLAPSE_MS);
        if (cancelled) return;

        setPortalFxStage("blackout");
        await delay(PORTAL_BLACKOUT_HOLD_MS);
        if (cancelled) return;

        navigate("/depths", { state: { fromPortalJump: true } });
      } catch (error) {
        setPortalFxStage("idle");
        onJumpError?.(error);
      }
    };

    jump();

    return () => {
      cancelled = true;
      setPortalFxStage("idle");
    };
  }, [chargeCameraPush, navigate, onJumpError, phase, portalPosition]);

  return (
    <>
      {phase === "portal_ready" && (
        <Html
          position={hintPosition}
          distanceFactor={13}
          transform
          style={{ pointerEvents: "auto" }}
        >
          <button
            type="button"
            className="portalJumpHint"
            onClick={() => onActivate?.()}
          >
            enter the depths
          </button>
        </Html>
      )}

      {portalFxStage !== "idle" && (
        <Html
          fullscreen
          style={{ pointerEvents: "none", zIndex: 2500 }}
          className={`portalJumpOverlay is-${portalFxStage}`}
        >
          <div className="portalJumpOverlayScrim" aria-hidden="true" />
          <div className="portalJumpOverlayStreaks" aria-hidden="true">
            {SPAGHETTI_STREAK_ANGLES.map((angle, index) => (
              <span
                key={angle}
                className="portalJumpStreak"
                style={{
                  "--streak-angle": `${angle}deg`,
                  "--streak-delay": `${index * 13}ms`,
                }}
              />
            ))}
          </div>
          <div className="portalJumpOverlaySingularity" />
          <div className="portalJumpOverlayFlash" />
          <div className="portalJumpOverlayVoid" />
        </Html>
      )}
    </>
  );
}
