import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./levels.css";

export default function LevelModal({ name, slug, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="levelModalOverlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="levelModal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <h2>{name}</h2>

          <div className="modalButtons">
            <Link to={`/levels/${slug}`} className="modalBtn learn">
              Learn
            </Link>

            <Link to={`/play/${slug}`} className="modalBtn play">
              Play
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
