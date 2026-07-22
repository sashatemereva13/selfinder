import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getLevelBySlug } from "./levelsContent";
import { useChat } from "../guide/ChatContext";
import { readMeasureResult } from "../hooks/useRoomProgress";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import JourneyProgress from "../designElements/JourneyProgress";
import "./levels.css";

// Minimal inline-bold support so content can use **text** without a markdown
// dependency — only `Neutrality` currently relies on it.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

export default function LevelDetail() {
  const { slug } = useParams();
  const level = getLevelBySlug(slug);
  const { activePhilosopher } = useChat();
  const measureResult = readMeasureResult();
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);

  if (!level) return <Navigate to="/levels" replace />;

  const isOverallReading = measureResult?.vibrationLevel?.slug === slug;
  const matchingLines = (measureResult?.lines ?? []).filter(
    (line) => line.vibrationLevel?.slug === slug,
  );
  const readingBadge = isOverallReading
    ? "Your overall reading"
    : matchingLines.length > 0
      ? `Where your ${matchingLines.map((line) => line.label).join(" & ")} ${
          matchingLines.length === 1 ? "sits" : "sit"
        } right now`
      : null;

  return (
    <div className="levelDetailPage">
      <Link to="/levels" className="backButton">
        ← Levels
      </Link>
      <JourneyProgress currentKey="levels" />

      <div className="levelDetailMain">
        <header className="levelDetailHeaderCard">
          {readingBadge && <p className="levelDetailReadingBadge">{readingBadge}</p>}
          <h1>{level.title}</h1>
          {level.frame && <p className="aLevelFrame">{level.frame}</p>}
        </header>

        {level.signals && (
          <div className="levelDetailCard">
            <dl className="aLevelSignals">
              {level.signals.map((signal) => (
                <div className="aLevelSignal" key={signal.label}>
                  <dt>{signal.label}</dt>
                  <dd>{renderInline(signal.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="levelDetailCard levelDetailContentCard">
          {level.sections
            ? level.sections.map((section) => (
                <section className="aLevelSection" key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index}>{renderInline(paragraph)}</p>
                  ))}
                </section>
              ))
            : level.paragraphs?.map((paragraph, index) => (
                <p key={index}>{renderInline(paragraph)}</p>
              ))}
        </div>

        {level.deepDive && (
          <div className="levelDetailCard levelDetailContentCard">
            <button
              type="button"
              className="levelDeepDiveToggle"
              onClick={() => setDeepDiveOpen((open) => !open)}
              aria-expanded={deepDiveOpen}
            >
              {deepDiveOpen ? "Hide the deeper read ↑" : "Go deeper ↓"}
            </button>
            <AnimatePresence>
              {deepDiveOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="levelDeepDiveBody">
                    {level.deepDive.map((section) => (
                      <section className="aLevelSection" key={section.heading}>
                        <h3>{section.heading}</h3>
                        {section.paragraphs.map((paragraph, index) => (
                          <p key={index}>{renderInline(paragraph)}</p>
                        ))}
                      </section>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activePhilosopher?.tuneInBridge && (
          <div className="levelDetailCard levelDetailBridgeCard">
            <PhilosopherVoiceTag philosopher={activePhilosopher} />
            <p>{activePhilosopher.tuneInBridge}</p>
            <Link to="/tunein" className="sf-btn sf-btn-primary levelDetailTuneInBtn">
              Tune in →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
