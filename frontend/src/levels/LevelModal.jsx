import { useEffect, useId } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import "./levels.css";

export default function LevelModal({ name, slug, onClose }) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("sf-modalOpen");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("sf-modalOpen");
    };
  }, [onClose]);

  const modal = (
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
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="levelModalClose"
            onClick={onClose}
            aria-label="Close level options"
          >
            ×
          </button>

          <h2 id={titleId}>{name}</h2>
          <p className="levelModalSubtitle">Choose your next step.</p>

          <div className="modalButtons">
            <Link to={`/levels/${slug}`} className="modalBtn learn">
              Learn
            </Link>

            <Link to="/tunein" className="modalBtn play">
              Play
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
