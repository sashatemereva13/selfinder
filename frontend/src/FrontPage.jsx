import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Experience from "./Experience";
import { Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@react-three/drei";
import JourneyNav from "./designElements/JourneyNav";
import { useAdaptiveQuality } from "./utils/useAdaptiveQuality";
import { useState } from "react";
import RouteLoader from "./designElements/RouteLoader";

const FrontPage = () => {
  const quality = useAdaptiveQuality();
  const [journeyUnlocked, setJourneyUnlocked] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const { active } = useProgress();

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

  return (
    <div className="frontPageShell">
      <div className="pulsingBackground"></div>
      {!sceneReady && <RouteLoader />}

      <section className="frontPageHero">
        <div className="frontPageHeroOverlay">
          <div className="frontPageHeroTag">The Threshold / Arrival</div>
          <div
            className={`frontPageUnlockHint ${journeyUnlocked ? "is-unlocked" : ""}`}
          >
            {journeyUnlocked
              ? "You are ready to measure your vibe."
              : "After the message, touch the sphere again to cross the threshold."}
          </div>
        </div>

        <Canvas
          dpr={quality.dpr}
          gl={{
            antialias: quality.tier !== "low",
            powerPreference: "high-performance",
          }}
          performance={{ min: 0.5 }}
          camera={{ fov: 55, near: 0.1, far: 500, position: [0, 0, 20] }}
          onCreated={({ camera }) => {
            camera.layers.enable(1);
          }}
        >
          <Suspense fallback={null}>
            <Experience
              quality={quality}
              onJourneyTransferComplete={handleJourneyTransferComplete}
            />
          </Suspense>
        </Canvas>
      </section>

      <section
        className={`frontPageJourneyStage ${journeyUnlocked ? "is-unlocked" : "is-locked"}`}
      >
        <div className="frontPageJourneyIntro">
          <p className="sf-kicker">Primary Journey</p>
          <h2>Cross inward, then step into the social identity layer</h2>
          <p>
            The threshold opens the inward turn. From here, move into Core to
            meet the persona layer, or jump directly to the part of the system
            you need most right now.
          </p>
        </div>

        <div className="frontPageJourneyPanelInline">
          <JourneyNav
            variant="inline"
            currentKey="threshold"
            title="Recommended Journey"
            subtitle="Enter the psyche through the threshold, then continue into Core, Measure, lunar timing, regulation, and reflection."
            primaryAction={{ to: "/core", label: "Enter Core Room" }}
          />
        </div>

        <div className="frontPageJourneyLinks">
          <Link to="/core" className="sf-btn sf-btn-primary">
            Core
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
            <h3>Measure your current state</h3>
            <p>
              Use the questionnaire to identify your present signal and
              estimated level.
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
