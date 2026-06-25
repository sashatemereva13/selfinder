import { Canvas } from "@react-three/fiber";
import LevelsScene from "./LevelsScene";
import LevelCard from "./LevelCard";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import { LEVELS } from "./levelsContent";
import "./levels.css";

const levels = LEVELS.map(({ name, slug, score }) => ({ name, slug, score }));

export default function LevelsText() {
  const quality = useAdaptiveQuality();

  return (
    <div className="levelsPage">
      <Canvas
        className="levelsCanvas"
        dpr={quality.dpr}
        gl={{ antialias: quality.tier !== "low", powerPreference: "default" }}
        camera={{ position: [0, 0, 8] }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); }, false);
        }}
      >
        <LevelsScene qualityTier={quality.tier} />
      </Canvas>

      <section className="levelsIntro">
        <p className="sf-kicker">Perspective Layer</p>
        <h1>vibration levels</h1>
        <p>
          This isn't a ladder to climb — every state here is complete and valid information about
          where you are, and a different one can be true for your body, mind, heart, and spirit
          at the same time. Open one to see what it's communicating. Choose <strong>Learn</strong>{" "}
          for context or <strong>Play</strong> to move into Tune In.
        </p>
      </section>

      <div className="levelsGrid" role="list">
        {levels.map((lvl, index) => (
          <LevelCard key={lvl.slug} index={index} {...lvl} />
        ))}
      </div>
    </div>
  );
}
