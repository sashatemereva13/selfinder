import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./measure.css";
import { MEASURE_ARRIVAL_LINE } from "../content/journeyLines";
import { useChat } from "../guide/ChatContext";
import { sendMeasureExchange } from "../guide/chatApi";
import { apiUrl } from "../api/baseUrl";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import JourneyProgress from "../designElements/JourneyProgress";
import {
  MEASURE_RESULT_STORAGE_KEY,
  MEASURE_PREVIOUS_RESULT_STORAGE_KEY,
} from "./measureConfig";
import {
  MeasureTopBar,
  MeasureEntryPhase,
  MeasureInterviewPhase,
  MeasureScoringPhase,
  MeasureCompletionPhase,
} from "./MeasurePhaseViews";

const TOTAL_SPHERES = 4;

const Measure = () => {
  const location = useLocation();
  const { activePhilosopher } = useChat();

  const [phase, setPhase] = useState("entry");
  const [sphereIndex, setSphereIndex] = useState(0);
  const [interviewMessages, setInterviewMessages] = useState([]);
  // Exchanges on the *current* sphere that didn't advance it — the person asked
  // something back or deflected rather than answering. Cleared whenever the
  // sphere actually advances or the interview resets.
  const [asides, setAsides] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [result, setResult] = useState(null);
  const [showPortalArrival, setShowPortalArrival] = useState(
    Boolean(location.state?.fromPortalJump),
  );

  const hasArchivedPreviousRef = useRef(false);
  const isDepthsFacet = location.pathname.startsWith("/depths");

  const phaseProgress =
    phase === "entry"
      ? 0.05
      : phase === "interview"
        ? 0.1 + (interviewMessages.length / TOTAL_SPHERES) * 0.75
        : phase === "scoring"
          ? 0.88
          : 1;

  useEffect(() => {
    if (!showPortalArrival) return undefined;
    const timer = window.setTimeout(() => setShowPortalArrival(false), 1250);
    return () => window.clearTimeout(timer);
  }, [showPortalArrival]);

  useEffect(() => {
    if (!result || phase !== "completion") return;

    if (!hasArchivedPreviousRef.current) {
      hasArchivedPreviousRef.current = true;
      try {
        const prev = window.localStorage.getItem(MEASURE_RESULT_STORAGE_KEY);
        if (prev) {
          window.localStorage.setItem(MEASURE_PREVIOUS_RESULT_STORAGE_KEY, prev);
        }
      } catch {}
    }

    const payload = {
      version: 2,
      savedAt: new Date().toISOString(),
      vibrationScore: result.vibrationScore,
      rawVibrationScore: result.rawVibrationScore,
      band: result.band,
      dominantAxis: result.dominantAxis,
      vibrationLevel: result.vibrationLevel,
      lines: result.lines,
    };

    try {
      window.localStorage.setItem(MEASURE_RESULT_STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [result, phase]);

  const resetState = () => {
    setSphereIndex(0);
    setInterviewMessages([]);
    setAsides([]);
    setCurrentInput("");
    setIsAcknowledging(false);
    setResult(null);
    hasArchivedPreviousRef.current = false;
  };

  const handleBegin = () => {
    resetState();
    setPhase("interview");
  };

  const handleRestart = () => {
    resetState();
    setPhase("entry");
  };

  const handleSend = async () => {
    const answer = currentInput.trim();
    if (!answer || isAcknowledging || !activePhilosopher) return;

    const currentQ = activePhilosopher.measureQuestions?.[sphereIndex];
    if (!currentQ) return;

    setCurrentInput("");
    setIsAcknowledging(true);

    let advance = true;
    let reply = "";
    try {
      const exchange = await sendMeasureExchange(
        activePhilosopher,
        currentQ.sphere,
        currentQ.question,
        answer,
      );
      advance = exchange?.advance !== false;
      reply = exchange?.reply ?? "";
    } catch {
      // Fail open — treat as answered so the interview never gets stuck.
    }

    setIsAcknowledging(false);

    if (!advance) {
      setAsides((prev) => [...prev, { answer, reply }]);
      return;
    }

    const updated = [
      ...interviewMessages,
      {
        sphere: currentQ.sphere,
        question: currentQ.question,
        answer,
        acknowledgment: reply,
      },
    ];

    setInterviewMessages(updated);
    setAsides([]);

    if (sphereIndex < TOTAL_SPHERES - 1) {
      setSphereIndex((prev) => prev + 1);
      return;
    }

    setPhase("scoring");

    try {
      const res = await fetch(apiUrl("/measure/interview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qaPairs: updated.map(({ sphere, question, answer: a }) => ({
            sphere,
            question,
            answer: a,
          })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setPhase("completion");
    } catch (err) {
      console.error("Measure interview scoring failed:", err);
      setPhase("interview");
      setSphereIndex(TOTAL_SPHERES - 1);
      setInterviewMessages(updated);
    }
  };

  return (
    <div
      className={`measure-page phase-${phase} ${showPortalArrival ? "is-portal-arrival" : ""}`}
    >
      {showPortalArrival && (
        <div className="measure-portalArrival" aria-hidden="true">
          <div className="measure-portalArrivalRing" />
          <div className="measure-portalArrivalCaption">
            <PhilosopherVoiceTag philosopher={activePhilosopher} />
            <p>{MEASURE_ARRIVAL_LINE}</p>
          </div>
        </div>
      )}
      <div className="measure-bg-orb orb-a" aria-hidden="true" />
      <div className="measure-bg-orb orb-b" aria-hidden="true" />

      <div className="measure-shell">
        <JourneyProgress currentKey="measure" />
        <MeasureTopBar
          phaseProgress={phaseProgress}
          backTo={isDepthsFacet ? "/depths" : "/"}
          backLabel={isDepthsFacet ? "Back to the Depths" : "Back Home"}
        />

        <section className="measure-panel" aria-live="polite">
          {phase === "entry" && <MeasureEntryPhase onBegin={handleBegin} />}

          {phase === "interview" && (
            <MeasureInterviewPhase
              sphereIndex={sphereIndex}
              interviewMessages={interviewMessages}
              asides={asides}
              currentInput={currentInput}
              onInputChange={setCurrentInput}
              onSend={handleSend}
              isAcknowledging={isAcknowledging}
              philosopher={activePhilosopher}
              onRestart={handleRestart}
            />
          )}

          {phase === "scoring" && (
            <MeasureScoringPhase
              philosopher={activePhilosopher}
              interviewMessages={interviewMessages}
            />
          )}

          {phase === "completion" && result && (
            <MeasureCompletionPhase
              result={result}
              philosopher={activePhilosopher}
              onRestart={handleRestart}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default Measure;
