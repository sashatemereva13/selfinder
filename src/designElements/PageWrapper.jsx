import { motion, useReducedMotion } from "framer-motion";
import "./PageWrapper.css";

export function PageWrapper({ children }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="sf-pageTransition"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{
        initial: {},
        enter: {},
        exit: {},
      }}
      style={{ height: "100%", width: "100%" }}
    >
      <motion.div
        className="sf-pageTransitionContent"
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: prefersReducedMotion ? "blur(0px)" : "blur(5px)" }}
        transition={{
          duration: prefersReducedMotion ? 0.22 : 0.65,
          ease: "easeOut",
        }}
      >
        {children}
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="sf-signalVeil"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0.55 }}
        transition={{ duration: prefersReducedMotion ? 0.18 : 0.6, ease: "easeInOut" }}
      />

      {!prefersReducedMotion && (
        <>
          <motion.div
            aria-hidden="true"
            className="sf-signalSweep"
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: "140%", opacity: [0, 0.75, 0] }}
            exit={{ x: "140%", opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            aria-hidden="true"
            className="sf-signalGridFlash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.22, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
        </>
      )}
    </motion.div>
  );
}
