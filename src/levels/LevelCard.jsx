import { useState } from "react";
import { motion } from "framer-motion";
import LevelModal from "./LevelModal";

export default function LevelCard({ name, slug, className }) {
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
        duration: 1.1,
        delay: Math.random() * 0.15,
        ease: [0.22, 1, 0.36, 1], // cinematic easing
      },
    },
  };

  return (
    <>
      <motion.div
        className={`levelCard ${className}`}
        onClick={() => setOpen(true)}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: false,
          amount: 0.35,
        }}
      >
        <div className="levelShardFake" />
        <p>{name}</p>
      </motion.div>

      {open && (
        <LevelModal name={name} slug={slug} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
