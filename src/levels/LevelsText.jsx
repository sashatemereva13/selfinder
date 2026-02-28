import { Canvas } from "@react-three/fiber";
import LevelsScene from "./LevelsScene";
import LevelCard from "./LevelCard";
import "./levels.css";
import { motion } from "framer-motion";

const levels = [
  { name: "enlightenment", slug: "enlightenment" },
  { name: "peace", slug: "peace" },
  { name: "unconditional love", slug: "unconditionallove" },
  { name: "love", slug: "love" },
  { name: "reason", slug: "reason" },
  { name: "acceptance", slug: "acceptance" },
  { name: "willingness", slug: "willingness" },
  { name: "neutrality", slug: "neutrality" },
  { name: "courage", slug: "courage" },
  { name: "pride", slug: "pride" },
  { name: "anger", slug: "anger" },
  { name: "desire", slug: "desire" },
  { name: "fear", slug: "fear" },
  { name: "grief", slug: "grief" },
  { name: "apathy", slug: "apathy" },
  { name: "guilt", slug: "guilt" },
  { name: "shame", slug: "shame" },
];

export default function LevelsText() {
  return (
    <div className="levelsPage">
      <Canvas className="levelsCanvas" camera={{ position: [0, 0, 8] }}>
        <LevelsScene />
      </Canvas>

      <h1>vibration levels</h1>

      <div className="levelsGrid">
        {levels.map((lvl) => (
          <LevelCard key={lvl.slug} {...lvl} />
        ))}
      </div>
    </div>
  );
}
