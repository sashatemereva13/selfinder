import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function SmoothTypewriter({ children, delay = 30 }) {
  const fullText = children.toString();
  const words = fullText.split(/(\s+)/); // includes spaces
  const [visibleLetters, setVisibleLetters] = useState(0);

  // Count total number of letters across all words
  const totalLetters = words.join("").length;

  useEffect(() => {
    setVisibleLetters(0);
    const interval = setInterval(() => {
      setVisibleLetters((prev) => {
        if (prev < totalLetters) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, delay);
    return () => clearInterval(interval);
  }, [totalLetters, delay]);

  // render each word as a group of letters inside a word-container
  let currentLetterCount = 0;

  return (
    <div className="smoothTypewriter">
      {words.map((word, wordIndex) => {
        const letters = word.split("");
        const renderedLetters = letters.map((char, i) => {
          const charIndex = currentLetterCount++;
          return (
            <motion.span
              key={charIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: charIndex < visibleLetters ? 1 : 0,
                y: charIndex < visibleLetters ? 0 : 6,
              }}
              transition={{ duration: 0.25 }}
              style={{ whiteSpace: "pre" }}
            >
              {char}
            </motion.span>
          );
        });

        return (
          <span key={`word-${wordIndex}`} style={{ display: "inline-block" }}>
            {renderedLetters}
          </span>
        );
      })}
    </div>
  );
}
