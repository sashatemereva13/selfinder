import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Experience from "./Experience";
import CosmicNebula from "./CosmicNebula";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@react-three/drei";
import JourneyProgress from "../designElements/JourneyProgress";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import RouteLoader from "../designElements/RouteLoader";
import { useChat } from "../guide/ChatContext";

const FrontPage = () => {
  const quality = useAdaptiveQuality();
  const [sceneReady, setSceneReady] = useState(false);
  const [thresholdDebug, setThresholdDebug] = useState({});
  const [webglDebug, setWebglDebug] = useState({ contextStatus: "healthy" });
  const contextListenerRef = useRef(null);
  const { active } = useProgress();
  // The "you're ready to enter" milestone line itself is rendered by
  // GuideAnchor (one speech channel, instead of a second avatar+name+message
  // overlay duplicating it here) — this page only needs the flag for the
  // .frontPageJourneyStage lock/unlock styling below.
  const { journeyUnlocked, setJourneyUnlocked } = useChat();

  useEffect(() => {
    let readyTimer;

    if (active) {
      setSceneReady(false);
    } else {
      readyTimer = window.setTimeout(() => {
        setSceneReady(true);
      }, 120);
    }

    return () => {
      if (readyTimer) {
        window.clearTimeout(readyTimer);
      }
    };
  }, [active]);

  const handleJourneyTransferComplete = () => {
    setJourneyUnlocked(true);
  };

  useEffect(() => (
    () => {
      const listeners = contextListenerRef.current;
      if (!listeners) return;

      listeners.canvas.removeEventListener("webglcontextlost", listeners.onLost, false);
      listeners.canvas.removeEventListener("webglcontextrestored", listeners.onRestored, false);
      contextListenerRef.current = null;
    }
  ), []);

  const handleThresholdDebugStateChange = useCallback((nextDebugState) => {
    setThresholdDebug((current) => ({ ...current, ...nextDebugState }));
  }, []);

  const handleCanvasCreated = useCallback(({ camera, gl }) => {
    camera.layers.enable(1);

    if (contextListenerRef.current) {
      contextListenerRef.current.canvas.removeEventListener(
        "webglcontextlost",
        contextListenerRef.current.onLost,
        false,
      );
      contextListenerRef.current.canvas.removeEventListener(
        "webglcontextrestored",
        contextListenerRef.current.onRestored,
        false,
      );
    }

    const onLost = (event) => {
      event.preventDefault();
      setWebglDebug({
        contextStatus: "lost",
        lastContextLostAt: performance.now(),
      });
    };

    const onRestored = () => {
      setWebglDebug({
        contextStatus: "restored",
        lastContextRestoredAt: performance.now(),
      });
    };

    gl.domElement.addEventListener("webglcontextlost", onLost, false);
    gl.domElement.addEventListener("webglcontextrestored", onRestored, false);
    contextListenerRef.current = { canvas: gl.domElement, onLost, onRestored };
  }, []);

  const frameAgeMs = thresholdDebug.lastFrameAt != null
    ? Math.max(0, Math.round(performance.now() - thresholdDebug.lastFrameAt))
    : null;

  return (
    <div className="frontPageShell">
      <div className="pulsingBackground"></div>
      {!sceneReady && <RouteLoader />}

      <section className="frontPageHero">
        <CosmicNebula />

        <Canvas
          dpr={quality.dpr}
          gl={{
            antialias: quality.tier !== "low",
            powerPreference: "high-performance",
            alpha: true,
          }}
          performance={{ min: 0.5 }}
          camera={{ fov: 55, near: 0.1, far: 500, position: [0, 0, 20] }}
          onCreated={handleCanvasCreated}
        >
          <Suspense fallback={null}>
            <Experience
              quality={quality}
              onJourneyTransferComplete={handleJourneyTransferComplete}
              onDebugStateChange={handleThresholdDebugStateChange}
            />
          </Suspense>
        </Canvas>

        {import.meta.env.DEV && (
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              zIndex: 30,
              minWidth: 220,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(164, 147, 193, 0.34)",
              background: "rgba(7, 8, 16, 0.72)",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
              color: "#d8d0ea",
              fontSize: 12,
              lineHeight: 1.45,
              letterSpacing: "0.04em",
              pointerEvents: "none",
              backdropFilter: "blur(10px)",
            }}
          >
            <div>phase: {thresholdDebug.thresholdPhase || "n/a"}</div>
            <div>message: {thresholdDebug.hasSelectedMessage ? "open" : "closed"}</div>
            <div>portal visible: {thresholdDebug.portalVisible ? "yes" : "no"}</div>
            <div>portal lock: {thresholdDebug.portalSequenceLocked ? "yes" : "no"}</div>
            <div>portal energy: {thresholdDebug.portalIntensityState || "n/a"}</div>
            <div>phase age: {thresholdDebug.phaseAgeMs == null ? "n/a" : `${thresholdDebug.phaseAgeMs}ms`}</div>
            <div>webgl: {webglDebug.contextStatus}</div>
            <div>frame beat: {frameAgeMs == null ? "n/a" : `${frameAgeMs}ms ago`}</div>
          </div>
        )}
      </section>

      <section
        className={`frontPageJourneyStage ${journeyUnlocked ? "is-unlocked" : "is-locked"}`}
      >
        <div className="frontPageJourneyIntro">
          <JourneyProgress currentKey="threshold" />
          <p className="sf-kicker">Primary Journey</p>
          <h2>Now, measure where you stand</h2>
          <p>
            The threshold is crossed. Next: the Depths, where you measure
            your current vibration.
          </p>
        </div>

        <div className="frontPageJourneyLinks">
          <Link to="/depths" className="sf-btn sf-btn-primary">
            Enter the Depths
          </Link>
        </div>
      </section>
    </div>
  );
};

export default FrontPage;
