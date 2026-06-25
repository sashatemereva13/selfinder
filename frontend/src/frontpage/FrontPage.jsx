import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Experience from "./Experience";
import CosmicNebula from "./CosmicNebula";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@react-three/drei";
import JourneyNav from "../designElements/JourneyNav";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import RouteLoader from "../designElements/RouteLoader";
import { useJourneyLine } from "../content/journeyLines";
import { useChat } from "../guide/ChatContext";

const UNLOCK_LINE = "You are ready to enter the house.";

const FrontPage = () => {
  const quality = useAdaptiveQuality();
  const [journeyUnlocked, setJourneyUnlocked] = useState(false);
  const [showUnlockHint, setShowUnlockHint] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [thresholdDebug, setThresholdDebug] = useState({});
  const [webglDebug, setWebglDebug] = useState({ contextStatus: "healthy" });
  const contextListenerRef = useRef(null);
  const { active } = useProgress();
  const { activePhilosopher } = useChat();
  const unlockLine = useJourneyLine("threshold-unlock", UNLOCK_LINE);

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
    setShowUnlockHint(true);
  };

  // The "ready to enter" line is a one-time milestone confirmation —
  // by the time the player is deep in dialogue further in, it reads as stale.
  useEffect(() => {
    if (!showUnlockHint) return;
    const hideTimer = window.setTimeout(() => setShowUnlockHint(false), 5200);
    return () => window.clearTimeout(hideTimer);
  }, [showUnlockHint]);

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

        {journeyUnlocked && unlockLine && (
          <div
            className={`frontPageHeroOverlay ${showUnlockHint ? "" : "is-hidden"}`}
          >
            <div className="frontPageUnlockHint is-unlocked">
              <PhilosopherVoiceTag philosopher={activePhilosopher} />
              {unlockLine}
            </div>
          </div>
        )}

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
          <p className="sf-kicker">Primary Journey</p>
          <h2>Cross inward, then step into what's hidden</h2>
          <p>
            The threshold opens the inward turn. From here, move into the
            Depths, or jump directly to the part of the system you need most
            right now.
          </p>
        </div>

        <div className="frontPageJourneyPanelInline">
          <JourneyNav
            variant="inline"
            currentKey="threshold"
            title="Recommended Journey"
            subtitle="Enter the psyche through the threshold, then continue into the Depths, lunar timing, regulation, and reflection."
            primaryAction={{ to: "/depths", label: "Enter the Depths" }}
          />
        </div>

        <div className="frontPageJourneyLinks">
          <Link to="/depths" className="sf-btn sf-btn-primary">
            Depths
          </Link>
          <Link to="/measure" className="sf-btn">
            Measure
          </Link>
          <Link to="/luna" className="sf-btn">
            Luna Context
          </Link>
          <Link to="/tunein" className="sf-btn">
            Tune In
          </Link>
          <Link to="/levels" className="sf-btn">
            Levels
          </Link>
        </div>

        <div className="frontPageJourneyCards">
          <div className="frontPageJourneyCard">
            <p className="sf-kicker">Persona Layer</p>
            <h3>Enter the mirror chamber</h3>
            <p>
              Step into the social identity layer and notice the roles and
              masks that organize your public self.
            </p>
          </div>
          <div className="frontPageJourneyCard">
            <p className="sf-kicker">Signal Mapping</p>
            <h3>Feel your current state</h3>
            <p>
              Use the questionnaire as a mirror — to notice your present
              signal, not to earn a verdict on it.
            </p>
          </div>
          <div className="frontPageJourneyCard">
            <p className="sf-kicker">Timing Layer</p>
            <h3>Read lunar context</h3>
            <p>
              Use moon phase timing to shape the type of action or reflection
              that fits now.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FrontPage;
