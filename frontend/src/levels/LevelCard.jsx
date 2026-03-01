import { useState } from "react";
import { motion } from "framer-motion";
import LevelModal from "./LevelModal";

export default function LevelCard({ name, slug, score, className, index = 0 }) {
  const [open, setOpen] = useState(false);

  const variants = {
    hidden: {
      opacity: 0,
      y: 120,
      scale: 0.95,
      filter: "blur(6px)",
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        delay: Math.min(index * 0.03, 0.42),
        ease: [0.22, 1, 0.36, 1], // cinematic easing
      },
    },
  };

  return (
    <>
      <motion.button
        type="button"
        role="listitem"
        className={`levelCard ${className}`}
        onClick={() => setOpen(true)}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          amount: 0.35,
        }}
        aria-label={`Open ${name} options`}
        aria-haspopup="dialog"
      >
        <div className="levelShardFake" />
        <p>{name}</p>
        <span className="levelCardMeta">{score}</span>
        <span className="levelCardHint">Open options</span>
      </motion.button>

      {open && (
        <LevelModal name={name} slug={slug} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
