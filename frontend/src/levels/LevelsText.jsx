import { Canvas } from "@react-three/fiber";
import LevelsScene from "./LevelsScene";
import LevelCard from "./LevelCard";
import "./levels.css";

const levels = [
  { name: "enlightenment", slug: "enlightenment", score: 700 },
  { name: "peace", slug: "peace", score: 600 },
  { name: "unconditional love", slug: "unconditionallove", score: 540 },
  { name: "love", slug: "love", score: 500 },
  { name: "reason", slug: "reason", score: 400 },
  { name: "acceptance", slug: "acceptance", score: 350 },
  { name: "willingness", slug: "willingness", score: 310 },
  { name: "neutrality", slug: "neutrality", score: 250 },
  { name: "courage", slug: "courage", score: 200 },
  { name: "pride", slug: "pride", score: 175 },
  { name: "anger", slug: "anger", score: 150 },
  { name: "desire", slug: "desire", score: 125 },
  { name: "fear", slug: "fear", score: 100 },
  { name: "grief", slug: "grief", score: 75 },
  { name: "apathy", slug: "apathy", score: 50 },
  { name: "guilt", slug: "guilt", score: 30 },
  { name: "shame", slug: "shame", score: 20 },
];

export default function LevelsText() {
  return (
    <div className="levelsPage">
      <Canvas className="levelsCanvas" camera={{ position: [0, 0, 8] }}>
        <LevelsScene />
      </Canvas>

      <section className="levelsIntro">
        <p className="sf-kicker">Perspective Layer</p>
        <h1>vibration levels</h1>
        <p>
          Select a level to open options. Choose <strong>Learn</strong> for context or{" "}
          <strong>Play</strong> to move into Tune In.
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
