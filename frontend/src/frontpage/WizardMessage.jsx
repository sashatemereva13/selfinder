import { Html } from "@react-three/drei";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// The camera flight covers what used to be three separate CSS-keyed stages
// (charge/stretch/collapse) — they're combined into one duration now since
// nothing renders differently between them anymore. Blackout is the one
// remaining CSS stage: a plain fade to cover the cut to /depths.
const PORTAL_FLIGHT_MS = 1240;
const PORTAL_BLACKOUT_HOLD_MS = 280;

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

  // Flies the camera through the portal center and out the other side —
  // not just up to it — for the full charge+stretch+collapse window, instead
  // of stopping after the initial 380ms charge push and leaving the rest of
  // the "jump" to 2D CSS streaks alone. FOV widens alongside the push for a
  // speed-tunnel feel; the CSS overlay (streaks/flash/void) still layers on
  // top of this, it's no longer doing all the motion work by itself.
  // Returns a stop() function so an in-flight animation can be cancelled
  // (route change, unmount) without throwing once `controls.current` is gone.
  const flyThroughPortal = useCallback((center, totalDuration) => {
    // CameraControls (from the `camera-controls` package, not three's
    // OrbitControls) exposes the camera via `.camera`, not `.object` —
    // using `.object` here silently no-ops the whole flight.
    const cam = controls?.current?.camera;
    if (!cam || !controls?.current) return () => {};

    const startPos = cam.position.clone();
    const dir = new THREE.Vector3().subVectors(center, startPos).normalize();
    const flyDistance = 26; // well past the portal, not just to it
    const baseFov = cam.fov ?? 55;
    const maxFov = 122;
    const originalSmooth = controls.current.smoothTime;

    controls.current.enabled = true;
    controls.current.smoothTime = 0;

    let stopped = false;
    const t0 = performance.now();

    const step = (now) => {
      if (stopped || !controls?.current) return;

      const t = Math.min(1, (now - t0) / totalDuration);
      // Cubic ease-in — slow build during charge, violent acceleration by
      // collapse — matches the CSS overlay's own pacing (energy gathering,
      // then a sharp pull into the singularity).
      const eased = t * t * t;
      // Shake matters early (charge) and fades out — by the time we're
      // flying fast, a stable plunge reads better than continued jitter.
      const shakeFalloff = Math.max(0, 1 - t * 2.2);
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 0.22 * shakeFalloff,
        (Math.random() - 0.5) * 0.22 * shakeFalloff,
        (Math.random() - 0.5) * 0.22 * shakeFalloff,
      );
      const pos = startPos
        .clone()
        .addScaledVector(dir, flyDistance * eased)
        .add(jitter);

      cam.fov = baseFov + (maxFov - baseFov) * eased;
      cam.updateProjectionMatrix();
      controls.current.setLookAt(pos.x, pos.y, pos.z, center.x, center.y, center.z, false);

      if (t < 1) {
        requestAnimationFrame(step);
      } else if (controls?.current) {
        controls.current.smoothTime = originalSmooth;
      }
    };

    requestAnimationFrame(step);

    return () => {
      stopped = true;
      if (controls?.current) controls.current.smoothTime = originalSmooth;
      cam.fov = baseFov;
      cam.updateProjectionMatrix();
    };
  }, [controls]);

  useEffect(() => {
    if (phase !== "jumping") return undefined;

    let cancelled = false;
    let stopFlight = () => {};

    const jump = async () => {
      const center = getPortalCenter(portalPosition);

      import("../depths/Depths").catch(() => {});

      try {
        // The camera flight is the whole effect now — fire it and just wait
        // out its duration, no CSS stages to step through alongside it.
        stopFlight = flyThroughPortal(center, PORTAL_FLIGHT_MS);
        setPortalFxStage("flying");
        await delay(PORTAL_FLIGHT_MS);
        if (cancelled) return;

        // One plain fade to cover the cut from the 3D scene to /depths.
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
      stopFlight();
      setPortalFxStage("idle");
    };
  }, [flyThroughPortal, navigate, onJumpError, phase, portalPosition]);

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

      {portalFxStage === "blackout" && (
        <Html
          fullscreen
          style={{ pointerEvents: "none", zIndex: 2500 }}
          className="portalJumpOverlay is-blackout"
        >
          <div className="portalJumpOverlayVoid" />
        </Html>
      )}
    </>
  );
}
