import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function DataConsentSheet({ onDismiss }) {
  return (
    <motion.div
      className="dcs-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <motion.div
        className="dcs-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="dcs-kicker sf-kicker">Your data</p>
        <h2 className="dcs-title">This reflection is saving in your browser</h2>
        <p className="dcs-body">
          Everything from this room — your selections, your conversation, your statement —
          stays on this device. Nothing is sent to our servers unless you explicitly choose
          that in Your Space. You can review and delete any of it at any time.
        </p>
        <div className="dcs-actions">
          <button type="button" className="dcs-btn dcs-btn--primary" onClick={onDismiss}>
            Got it
          </button>
          <Link to="/space" className="dcs-btn dcs-btn--ghost" onClick={onDismiss}>
            Review in Your Space →
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
