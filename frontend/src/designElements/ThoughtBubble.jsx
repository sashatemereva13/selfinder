import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useInRouterContext, useLocation } from "react-router-dom";
import "./ThoughtBubble.css";

const inspirations = [
  {
    name: "Carl Jung",
    work: "Analytical Psychology",
    tag: "Psyche",
    note: "A map of symbols, shadow, and the hidden architecture of the psyche.",
  },
  {
    name: "Carl Jung",
    work: "Archetypes and the Collective Unconscious",
    tag: "Archetypes",
    note: "Shared patterns beneath personal experience that shape how we dream, fear, and grow.",
  },
  {
    name: "David R. Hawkins",
    work: "Transcending the Levels of Consciousness",
    tag: "Awareness",
    note: "A framework for reading inner states as movements in awareness.",
  },
  {
    name: "Joseph Campbell",
    work: "The Hero with a Thousand Faces",
    tag: "Journey",
    note: "Transformation as a journey through trials, symbols, and return.",
  },
];

const concepts = [
  {
    term: "Shadow",
    description: "Hidden aspects of the psyche that remain unconscious.",
  },
  {
    term: "Persona",
    description: "The social mask we present to the world.",
  },
  {
    term: "Individuation",
    description: "The process of integrating all parts of the psyche.",
  },
];

function ThoughtIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id="sfThoughtGlow"
          x1="14"
          y1="12"
          x2="50"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#e2cfff" />
          <stop offset="100%" stopColor="#81e7df" />
        </linearGradient>
      </defs>
      <path
        d="M21 47c-7.3 0-13-5.5-13-12.3 0-6.1 4.7-11.1 10.8-12.1C20 14.2 27 8 35.7 8 45.7 8 54 16 54 26c0 9.7-7.9 17.4-17.8 17.4H31l-6.8 6.6c-.9.9-2.2.2-2.2-1.1V47h-1z"
        fill="url(#sfThoughtGlow)"
        fillOpacity="0.9"
      />
      <circle cx="25" cy="27" r="2.8" fill="rgba(8, 8, 12, 0.72)" />
      <circle cx="32" cy="27" r="2.8" fill="rgba(8, 8, 12, 0.72)" />
      <circle cx="39" cy="27" r="2.8" fill="rgba(8, 8, 12, 0.72)" />
      <circle cx="17" cy="53" r="4.3" fill="rgba(226, 207, 255, 0.78)" />
      <circle cx="10.5" cy="58.5" r="2.2" fill="rgba(129, 231, 223, 0.72)" />
    </svg>
  );
}

function ThoughtBubbleBase({ routeKey = "" }) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsOpen(false);
  }, [routeKey]);

  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: index,
        left: 12 + index * 11,
        size: 4 + (index % 3) * 3,
        delay: index * 0.12,
        duration: 2.4 + (index % 4) * 0.35,
      })),
    [],
  );

  return (
    <aside
      className={`sf-thoughtBubble ${isOpen ? "is-open" : ""}`}
      aria-label="Selfinder inspirations"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id={panelId}
            className="sf-thoughtPanel"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.95 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.98 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.16 : 0.34,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {!prefersReducedMotion && (
              <div className="sf-thoughtParticles" aria-hidden="true">
                {particles.map((particle) => (
                  <span
                    key={particle.id}
                    className="sf-thoughtParticle"
                    style={{
                      left: `${particle.left}%`,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      animationDelay: `${particle.delay}s`,
                      animationDuration: `${particle.duration}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="sf-thoughtPanelScroll">
              <div className="sf-thoughtHeader">
                <p className="sf-thoughtEyebrow">Memory Fragment</p>
                <span className="sf-thoughtSeal" aria-hidden="true">
                  inner map
                </span>
                <h2>What quietly shaped this world</h2>
                <p className="sf-thoughtIntro">
                  Selfinder is not built on footnotes. It draws from a few
                  psychological and philosophical ideas that help the rooms feel
                  like parts of an inner landscape.
                </p>
                <div className="sf-thoughtMoodRow" aria-hidden="true">
                  <span>symbol</span>
                  <span>self</span>
                  <span>transformation</span>
                </div>
              </div>

              <div className="sf-thoughtSection">
                <h3>Inspirations</h3>
                <p className="sf-thoughtSectionLead">
                  Short references behind the atmosphere, language, and
                  structure of the experience.
                </p>
                <div className="sf-thoughtList">
                  {inspirations.map((item, index) => (
                    <article
                      key={`${item.name}-${item.work}`}
                      className="sf-thoughtCard"
                    >
                      <div className="sf-thoughtCardTop">
                        <span className="sf-thoughtIndex">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="sf-thoughtTag">{item.tag}</span>
                      </div>
                      <p className="sf-thoughtAuthor">{item.name}</p>
                      <p className="sf-thoughtWork">{item.work}</p>
                      <p className="sf-thoughtNote">{item.note}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="sf-thoughtSection">
                <h3>Concepts</h3>
                <p className="sf-thoughtSectionLead">
                  These ideas help explain what the rooms are pointing toward.
                </p>
                <div className="sf-thoughtConcepts">
                  {concepts.map((item) => (
                    <article key={item.term} className="sf-thoughtConcept">
                      <h4>{item.term}</h4>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="sf-thoughtToggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={
          isOpen ? "Close inspirations panel" : "Open inspirations panel"
        }
        animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 4.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="sf-thoughtGlow" aria-hidden="true" />
        <span className="sf-thoughtIconWrap" aria-hidden="true">
          <ThoughtIcon />
        </span>
        <span className="sf-thoughtLabel">{isOpen ? "close" : "thoughts"}</span>
      </motion.button>
    </aside>
  );
}

function ThoughtBubbleWithRouter() {
  const location = useLocation();
  return <ThoughtBubbleBase routeKey={location.pathname} />;
}

export default function ThoughtBubble() {
  return useInRouterContext() ? (
    <ThoughtBubbleWithRouter />
  ) : (
    <ThoughtBubbleBase />
  );
}
