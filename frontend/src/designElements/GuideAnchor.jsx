import { useState, useEffect, useRef, useId } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useChat } from "../guide/ChatContext";
import { THRESHOLD_INTRO_LINE, THRESHOLD_UNLOCK_LINE } from "../content/journeyLines";
import { AVATARS } from "../content/philosopherAvatars";
import { SmoothTypewriter } from "./SmoothTypewriter";
import "./GuideAnchor.css";

function OracleIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id="sfOracleGlow"
          x1="12"
          y1="10"
          x2="52"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#c3a0ff" />
          <stop offset="100%" stopColor="#74ddd6" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="32" rx="20" ry="20" fill="url(#sfOracleGlow)" fillOpacity="0.12" />
      <ellipse cx="32" cy="32" rx="20" ry="20" stroke="url(#sfOracleGlow)" strokeWidth="1.4" fill="none" />
      <ellipse cx="32" cy="32" rx="7" ry="7" fill="url(#sfOracleGlow)" fillOpacity="0.8" />
      <ellipse cx="32" cy="32" rx="2.8" ry="2.8" fill="rgba(8,8,12,0.85)" />
      <line x1="32" y1="8" x2="32" y2="15" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="32" y1="49" x2="32" y2="56" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="8" y1="32" x2="15" y2="32" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="49" y1="32" x2="56" y2="32" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function MiniPhilosopherSelect({ onPick }) {
  const { philosophers } = useChat();

  return (
    <div className="ga-mini-select">
      <p className="ga-mini-label">Choose a guide to begin</p>
      <div className="ga-mini-philosophers">
        {philosophers.map((p) => (
          <button
            key={p.id}
            className="ga-mini-philo"
            style={{ "--philo-color": p.color }}
            onClick={() => onPick(p.id)}
            type="button"
          >
            <span className="ga-mini-dot" aria-hidden="true" />
            <span className="ga-mini-philo-name">{p.name}</span>
            <span className="ga-mini-philo-mode">{p.mode}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniChatInterface({ onExpandFull, onChangePhilosopher }) {
  const { activePhilosopher, messages, send, isLoading } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput("");
  };

  return (
    <div
      className="ga-mini-chat"
      style={{
        "--philo-color": activePhilosopher.color,
        "--philo-rgb": activePhilosopher.accentRgb,
      }}
    >
      <div className="ga-mini-header">
        <span className="ga-mini-who" style={{ color: activePhilosopher.color }}>
          {activePhilosopher.name}
        </span>
        <div className="ga-mini-actions">
          <button className="ga-mini-action" onClick={onChangePhilosopher} type="button">
            change
          </button>
          <button className="ga-mini-action" onClick={onExpandFull} type="button">
            expand
          </button>
        </div>
      </div>

      <div className="ga-mini-messages">
        {messages.length === 0 ? (
          <p className="ga-mini-empty">{activePhilosopher.description}</p>
        ) : (
          messages.slice(-6).map((msg, i) => (
            <div key={i} className={`ga-mini-msg ga-mini-msg-${msg.role}`}>
              <p>{msg.content}</p>
            </div>
          ))
        )}
        {isLoading && (
          <div className="ga-mini-msg ga-mini-msg-assistant ga-mini-thinking">
            <span className="guide-dot" />
            <span className="guide-dot" />
            <span className="guide-dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="ga-mini-form" onSubmit={handleSubmit}>
        <input
          className="ga-mini-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak…"
          disabled={isLoading}
        />
        <button
          className="ga-mini-send"
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
        >
          →
        </button>
      </form>
    </div>
  );
}

export default function GuideAnchor() {
  const { activePhilosopher, selectPhilosopher, thresholdEngaged, journeyUnlocked } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const panelId = useId();
  const prefersReducedMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [unlockHintVisible, setUnlockHintVisible] = useState(false);

  // On the threshold itself, the magic ball's own welcome line — and, once
  // the player has touched it and the journey unlocks, the "ready to enter"
  // confirmation that used to be FrontPage's own separate overlay — take the
  // place of any other remark. Both are plain hardcoded lines: no AI call,
  // no per-page generation. Off the threshold, GuideAnchor is a quiet dock —
  // avatar and name, no auto-remark — always one tap away from a real
  // conversation with the chosen philosopher.
  const isThresholdRoute = location.pathname === "/" || location.pathname.startsWith("/threshold");

  // Collapse the panel whenever the route changes — reopening it is one tap away.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // The unlock confirmation is a one-time milestone toast, not a persistent
  // instruction — auto-hide it after a few seconds, same lifetime FrontPage
  // used to give it before this was folded into GuideAnchor.
  useEffect(() => {
    if (!journeyUnlocked) {
      setUnlockHintVisible(false);
      return;
    }
    setUnlockHintVisible(true);
    const hideTimer = window.setTimeout(() => setUnlockHintVisible(false), 5200);
    return () => window.clearTimeout(hideTimer);
  }, [journeyUnlocked]);

  if (location.pathname === "/guide") return null;
  if (location.pathname === "/login") return null;
  if (location.pathname.startsWith("/measure") || location.pathname.startsWith("/depths/spheres")) return null;

  const avatarFn = activePhilosopher ? AVATARS[activePhilosopher.id] : null;
  // Before the sphere is touched: the intro line. After, once the journey
  // unlocks: the "ready to enter" confirmation, for a few seconds. Off the
  // threshold: nothing — just the quiet dock.
  const thresholdLine = !thresholdEngaged
    ? THRESHOLD_INTRO_LINE
    : journeyUnlocked
      ? THRESHOLD_UNLOCK_LINE
      : null;
  const displayLine = isThresholdRoute ? thresholdLine : null;
  const showRemark = isThresholdRoute
    ? Boolean(!isOpen && (!thresholdEngaged || (journeyUnlocked && unlockHintVisible)))
    : false;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleExpandFull = () => {
    setIsOpen(false);
    navigate("/guide");
  };

  return (
    <aside
      className={`ga-anchor ${isOpen ? "is-open" : ""}`}
      aria-label="Selfinder Guide"
      style={
        activePhilosopher
          ? { "--philo-color": activePhilosopher.color, "--philo-rgb": activePhilosopher.accentRgb }
          : {}
      }
    >
      {/* The panel comes first in source order so it sits above the strip —
          the whole thing grows upward from the bottom-anchored strip into
          the full conversation, like a dialogue box opening. */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id={panelId}
            className="ga-panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {activePhilosopher ? (
              <MiniChatInterface
                onExpandFull={handleExpandFull}
                onChangePhilosopher={() => selectPhilosopher(null)}
              />
            ) : (
              <>
                <div className="ga-panel-header">
                  <p className="ga-panel-eyebrow">Selfinder Guide</p>
                  <p className="ga-panel-subtitle">A structured inner conversation</p>
                </div>
                <MiniPhilosopherSelect onPick={selectPhilosopher} />
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* A narrator strip at the bottom of the screen, like dialogue
          captions — the philosopher's avatar and remark (typed out live)
          live in one anchored bar, which grows upward into the full
          conversation. The speaker's name sits above as its own nameplate
          (matching PhilosopherVoiceTag's avatar+name convention used
          elsewhere — Depths, Measure) instead of being crammed inside the
          bubble, and stays visible even when idle, so it's never just an
          unlabeled avatar.

          The toggle is a real <button> (not a div with role="button") so the
          dismiss control can be a sibling badge instead of a button nested
          inside another interactive element — nesting controls is an ARIA
          anti-pattern and confuses screen readers / voice control. */}
      <div className="ga-strip-stack">
        <span className="ga-strip-tag" aria-hidden="true">
          {isOpen ? "close" : activePhilosopher ? activePhilosopher.name : "guide"}
        </span>

        <div className="ga-strip-wrap">
          <button
            type="button"
            className={`ga-strip ${showRemark ? "has-remark" : ""}`}
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={
              isOpen
                ? "Close guide panel"
                : activePhilosopher
                  ? `Open guide panel — ${activePhilosopher.name}`
                  : "Open guide panel"
            }
            onClick={handleToggle}
          >
            <span className="ga-strip-avatar" aria-hidden="true">
              {avatarFn ? avatarFn(activePhilosopher.color) : <OracleIcon />}
            </span>

            <span className="ga-strip-body">
              <AnimatePresence mode="wait">
                {showRemark && (
                  <motion.div
                    key={displayLine}
                    className="ga-strip-remark"
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -4, scale: 0.97 }
                    }
                    animate={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, scale: 1 }
                    }
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    role="status"
                    aria-live="polite"
                  >
                    <SmoothTypewriter>{displayLine}</SmoothTypewriter>
                  </motion.div>
                )}
              </AnimatePresence>
            </span>

            <span className="ga-strip-chevron" aria-hidden="true">
              {isOpen ? "▲" : "▾"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
