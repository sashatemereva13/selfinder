import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function SmoothTypewriter({ children, delay = 30 }) {
  const fullText = children.toString();
  const lines = fullText.split("\n");
  const [visibleLetters, setVisibleLetters] = useState(0);

  // Count total number of letters across all lines (line breaks aren't "typed")
  const totalLetters = lines.join("").length;

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

  // render each line as its own block, each word as a group of letters
  let currentLetterCount = 0;

  return (
    <div className="smoothTypewriter">
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`} style={{ display: "block" }}>
          {line.split(/(\s+)/).map((word, wordIndex) => {
            const renderedLetters = word.split("").map((char) => {
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
              <span
                key={`word-${lineIndex}-${wordIndex}`}
                style={{ display: "inline-block" }}
              >
                {renderedLetters}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}
