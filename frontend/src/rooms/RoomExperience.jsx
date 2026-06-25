import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useChat } from "../guide/ChatContext";
import {
  useRoomProgress,
  readMeasureResult,
  LOCAL_CONSENT_KEY,
} from "../hooks/useRoomProgress";
import { ROOM_UNLOCK_PROMPTS } from "../content/roomContent";
import { getNextHouseRoom } from "../content/narrativeFlow";
import RoomChat from "./RoomChat";
import EchoReflection from "./mechanics/EchoReflection";
import DataConsentSheet from "./DataConsentSheet";
import "./RoomExperience.css";

// ─── Mechanic router ──────────────────────────────────────────────────────────
function RoomMechanic({ roomKey, onComplete }) {
  switch (roomKey) {
    case "self": return <EchoReflection onComplete={onComplete} />;
    default:     return null;
  }
}

// ─── State machine stages ─────────────────────────────────────────────────────
// intro → mechanic → chat → unlock → complete
// revisit_choice (when previous visit exists)

export default function RoomExperience({ roomKey }) {
  const { activePhilosopher } = useChat();
  const {
    visits,
    activeVisit,
    activeIndex,
    startNewVisit,
    continueVisit,
    setMechanic,
    addMessage,
    completeVisit,
  } = useRoomProgress(roomKey);

  const measureResult = readMeasureResult();

  const [stage, setStage] = useState(() => {
    // If there is already an active visit in progress, decide where to resume
    // Otherwise start at intro
    return "intro";
  });

  const [unlockInput, setUnlockInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingMechanic, setPendingMechanic] = useState(null);
  const [showConsentSheet, setShowConsentSheet] = useState(false);

  const nextRoom = getNextHouseRoom(roomKey);

  // ── Self-room locked guard — opens once the Depths have been worked through ──
  if (roomKey === "self" && !measureResult && stage === "intro") {
    return (
      <div className="re-root">
        <div className="re-locked">
          <div className="re-locked-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="10" y="18" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 18v-4a6 6 0 0 1 12 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="20" cy="26" r="2" fill="currentColor" />
            </svg>
          </div>
          <h3 className="re-locked-title">The Self opens once you've worked through the Depths.</h3>
          <p className="re-locked-desc">
            Feel into your Life Spheres in Measure first. The Self integrates what came before.
          </p>
        </div>
      </div>
    );
  }

  // ── Handlers ──

  function handleBegin() {
    if (visits.length > 0) {
      setStage("revisit_choice");
    } else {
      startNewVisit();
      setStage("mechanic");
    }
  }

  function handleContinuePrevious() {
    const lastIndex = visits.length - 1;
    continueVisit(lastIndex);
    const lastVisit = visits[lastIndex];
    if (lastVisit.completedAt) {
      setStage("complete");
    } else if (lastVisit.mechanic) {
      setStage("chat");
    } else {
      setStage("mechanic");
    }
  }

  function handleBeginAgain() {
    startNewVisit();
    setStage("mechanic");
  }

  function handleMechanicComplete(mechanicOutput) {
    const alreadySeen = localStorage.getItem(LOCAL_CONSENT_KEY);
    if (!alreadySeen) {
      setPendingMechanic(mechanicOutput);
      setShowConsentSheet(true);
    } else {
      setMechanic(mechanicOutput);
      setStage("chat");
    }
  }

  function handleConsentDismiss() {
    localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify({ timestamp: new Date().toISOString() }));
    setMechanic(pendingMechanic);
    setPendingMechanic(null);
    setShowConsentSheet(false);
    setStage("chat");
  }

  function handleRequestUnlock() {
    setStage("unlock");
  }

  function handleUnlockSubmit(e) {
    e && e.preventDefault();
    const text = unlockInput.trim();
    if (!text) return;
    completeVisit(text);
    setStage("complete");
  }

  function handleContinueExploring() {
    setStage("chat");
  }

  function handleRevisitMechanic() {
    startNewVisit();
    setStage("mechanic");
  }

  function handleDownloadToken() {
    const visit = activeVisit ?? lastCompletedVisit;
    const priorArtefacts = visit?.mechanic?.priorArtefacts ?? [];
    const selfStatement = visit?.unlock ?? "";
    const philosopherName = activePhilosopher?.name ?? "Your companion";

    const sections = priorArtefacts
      .map(
        ({ room, text }) =>
          `<section><h3>${room}</h3><blockquote>${text}</blockquote></section>`,
      )
      .join("");

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Selfinder — Your Reflection</title>
<style>
  body { font-family: Georgia, serif; max-width: 640px; margin: 3rem auto; color: #1a1a1a; line-height: 1.6; padding: 0 1.5rem; }
  h1 { font-size: 1.6rem; margin-bottom: 0.2rem; }
  .meta { color: #666; font-size: 0.85rem; margin-bottom: 2rem; }
  h3 { margin-bottom: 0.3rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
  section { margin-bottom: 1.4rem; }
  blockquote { margin: 0.3rem 0 0; font-style: italic; }
  .self-statement { margin-top: 2rem; padding-top: 1.4rem; border-top: 1px solid #ccc; font-size: 1.15rem; font-style: italic; }
</style>
</head>
<body>
  <h1>Selfinder — Your Reflection</h1>
  <p class="meta">Guided by ${philosopherName} · ${new Date().toLocaleDateString()}</p>
  ${sections}
  ${selfStatement ? `<div class="self-statement">"${selfStatement}"</div>` : ""}
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  // ── Render ──
  const philoColor = activePhilosopher?.color ?? "rgba(195,153,255,1)";
  const philoRgb = activePhilosopher?.accentRgb ?? "195,153,255";

  const lastCompletedVisit = visits.slice().reverse().find((v) => v.completedAt) ?? null;

  return (
    <div
      className="re-root"
      style={{ "--philo-color": philoColor, "--philo-rgb": philoRgb }}
    >
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            className="re-stage re-stage--intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="re-stage-kicker">Your work in this room</p>
            <p className="re-stage-desc">
              This room has a mechanic and a conversation. Together they help you
              go from surface to something truer.
            </p>
            {!activePhilosopher && (
              <p className="re-no-philosopher">
                Choose a thinking companion from the{" "}
                <Link to="/guide" className="re-link">Guide</Link>{" "}
                before entering.
              </p>
            )}
            <button
              className="re-btn re-btn--primary"
              onClick={handleBegin}
              disabled={!activePhilosopher}
            >
              Begin your work in this room →
            </button>
          </motion.div>
        )}

        {stage === "revisit_choice" && (
          <motion.div
            key="revisit"
            className="re-stage re-stage--revisit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="re-stage-kicker">You've been here before</p>
            <h3 className="re-revisit-title">How would you like to continue?</h3>

            {lastCompletedVisit && (
              <div className="re-revisit-artefact">
                <p className="re-revisit-artefact-label">Your last statement</p>
                <blockquote className="re-revisit-quote">"{lastCompletedVisit.unlock}"</blockquote>
              </div>
            )}

            <div className="re-revisit-choices">
              <button className="re-btn re-btn--primary" onClick={handleContinuePrevious}>
                Continue where you left off
              </button>
              <button className="re-btn re-btn--ghost" onClick={handleBeginAgain}>
                Begin again
              </button>
            </div>
          </motion.div>
        )}

        {stage === "mechanic" && (
          <motion.div
            key="mechanic"
            className="re-stage re-stage--mechanic"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <RoomMechanic roomKey={roomKey} onComplete={handleMechanicComplete} />
          </motion.div>
        )}

        {stage === "chat" && activeVisit && (
          <motion.div
            key="chat"
            className="re-stage re-stage--chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RoomChat
              roomKey={roomKey}
              mechanicOutput={activeVisit.mechanic}
              philosopher={activePhilosopher}
              messages={activeVisit.messages}
              onAddMessage={addMessage}
              onRequestUnlock={handleRequestUnlock}
              isLoading={chatLoading}
              setIsLoading={setChatLoading}
            />
          </motion.div>
        )}

        {stage === "unlock" && (
          <motion.div
            key="unlock"
            className="re-stage re-stage--unlock"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="re-stage-kicker">Unlock statement</p>
            <p className="re-unlock-prompt">{ROOM_UNLOCK_PROMPTS[roomKey]}</p>
            <form className="re-unlock-form" onSubmit={handleUnlockSubmit}>
              <textarea
                className="re-unlock-input"
                value={unlockInput}
                onChange={(e) => setUnlockInput(e.target.value)}
                placeholder="Write what feels true…"
                rows={3}
                autoFocus
              />
              <div className="re-unlock-actions">
                <button
                  type="button"
                  className="re-btn re-btn--ghost"
                  onClick={() => setStage("chat")}
                >
                  ← Back to conversation
                </button>
                <button
                  type="submit"
                  className="re-btn re-btn--primary"
                  disabled={!unlockInput.trim()}
                >
                  Name it →
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {stage === "complete" && (
          <motion.div
            key="complete"
            className="re-stage re-stage--complete"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="re-stage-kicker">Room complete</p>
            <div className="re-complete-artefact">
              <p className="re-complete-artefact-label">Your artefact</p>
              <blockquote className="re-complete-quote">
                "{activeVisit?.unlock ?? lastCompletedVisit?.unlock}"
              </blockquote>
            </div>
            <p className="re-complete-message">
              {roomKey === "self"
                ? "This stays with you. Take it with you as you go."
                : "This stays with you as you move through the house."}
            </p>
            <div className="re-complete-actions">
              {roomKey === "self" && (
                <button
                  type="button"
                  className="re-btn re-btn--primary"
                  onClick={handleDownloadToken}
                >
                  Download your reflection
                </button>
              )}
              <button
                type="button"
                className="re-btn re-btn--ghost"
                onClick={handleContinueExploring}
              >
                Continue exploring
              </button>
              <button
                type="button"
                className="re-btn re-btn--ghost"
                onClick={handleRevisitMechanic}
              >
                Revisit the mechanic
              </button>
              {nextRoom && (
                <Link to={nextRoom.route} className="re-btn re-btn--primary">
                  {nextRoom.label} →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConsentSheet && <DataConsentSheet onDismiss={handleConsentDismiss} />}
      </AnimatePresence>
    </div>
  );
}
