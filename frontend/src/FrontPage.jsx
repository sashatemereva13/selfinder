import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Experience from "./Experience";
import { Suspense } from "react";
import { Link } from "react-router-dom";
import JourneyNav from "./designElements/JourneyNav";
import { useAdaptiveQuality } from "./utils/useAdaptiveQuality";
import { useState } from "react";

const FrontPage = () => {
  const quality = useAdaptiveQuality();
  const [journeyUnlocked, setJourneyUnlocked] = useState(false);

  const handleJourneyTransferComplete = () => {
    setJourneyUnlocked(true);
  };

  return (
    <div className="frontPageShell">
      <div className="pulsingBackground"></div>

      <section className="frontPageHero">
        <div className="frontPageHeroOverlay">
          <div className="frontPageHeroTag">Neural Core / Arrival</div>
          <div className={`frontPageUnlockHint ${journeyUnlocked ? "is-unlocked" : ""}`}>
            {journeyUnlocked
              ? "Journey unlocked. Scroll to continue."
              : "After the message, press the core again to start the journey."}
          </div>
        </div>

        <Canvas
          dpr={quality.dpr}
          gl={{ antialias: quality.tier !== "low", powerPreference: "high-performance" }}
          performance={{ min: 0.5 }}
          camera={{ fov: 55, near: 0.1, far: 500, position: [0, 0, 20] }}
          onCreated={({ camera }) => {
            camera.layers.enable(1);
          }}
        >
          <Suspense fallback={null}>
            <Experience quality={quality} onJourneyTransferComplete={handleJourneyTransferComplete} />
          </Suspense>
        </Canvas>
      </section>

      <section className={`frontPageJourneyStage ${journeyUnlocked ? "is-unlocked" : "is-locked"}`}>
        <div className="frontPageJourneyIntro">
          <p className="sf-kicker">Primary Journey</p>
          <h2>Choose how you want to continue the signal mapping</h2>
          <p>
            You reached the lower chamber. From here, follow the recommended path or jump directly
            to the part of the system you need most right now.
          </p>
        </div>

        <div className="frontPageJourneyPanelInline">
          <JourneyNav
            variant="inline"
            currentKey="core"
            title="Recommended Journey"
            subtitle="Continue from the core into measure, lunar timing, regulation, and reflection."
            primaryAction={{ to: "/measure", label: "Begin Signal Mapping" }}
          />
        </div>

        <div className="frontPageJourneyLinks">
          <Link to="/measure" className="sf-btn sf-btn-primary">
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
            <p className="sf-kicker">Vibration First</p>
            <h3>Measure your current state</h3>
            <p>Use the questionnaire to identify your present signal and estimated level.</p>
          </div>
          <div className="frontPageJourneyCard">
            <p className="sf-kicker">Timing Layer</p>
            <h3>Read lunar context</h3>
            <p>Use moon phase timing to shape the type of action or reflection that fits now.</p>
          </div>
          <div className="frontPageJourneyCard">
            <p className="sf-kicker">Regulation Layer</p>
            <h3>Tune the field</h3>
            <p>Use sound and focus tools to settle, sharpen, or regulate before the next step.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default FrontPage;
