import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useChat } from "../guide/ChatContext";
import {
  getBadgePageContext,
  getPhilosopherComment,
  resolveCommentPath,
} from "../content/philosopherComments";
import {
  useJourneyLine,
  THRESHOLD_INTRO_SCENE_ID,
  THRESHOLD_INTRO_LINE,
} from "../content/journeyLines";
import { apiUrl } from "../api/baseUrl";
import { AVATARS } from "../content/philosopherAvatars";
import { SmoothTypewriter } from "./SmoothTypewriter";
import "./GuideAnchor.css";

const COMMENT_DELAY_MS = 520;
const COMMENT_API = apiUrl("/chat/badge-comment");
const badgeCommentCache = new Map();
let badgeCommentEndpointMissing = false;

async function fetchBadgeComment({
  philosopher,
  pathname,
  pageContext,
  fallbackComment,
  signal,
}) {
  const cacheKey = `${philosopher.id}:${resolveCommentPath(pathname)}`;
  const cached = badgeCommentCache.get(cacheKey);
  if (cached) return cached;

  if (badgeCommentEndpointMissing) {
    if (fallbackComment) return fallbackComment;
    throw new Error("Badge comment endpoint unavailable");
  }

  const res = await fetch(COMMENT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      philosopherId: philosopher.id,
      pathname: resolveCommentPath(pathname),
      pageContext,
      fallbackComment,
    }),
    signal,
  });

  if (!res.ok) {
    if (res.status === 404) {
      badgeCommentEndpointMissing = true;
    }
    throw new Error("Failed to generate badge comment");
  }

  const data = await res.json();
  const comment = typeof data.comment === "string" ? data.comment.trim() : "";

  if (!comment) {
    throw new Error("No badge comment returned");
  }

  badgeCommentCache.set(cacheKey, comment);
  return comment;
}

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
  const { activePhilosopher, selectPhilosopher, thresholdEngaged } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const panelId = useId();
  const prefersReducedMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState(null);
  const [commentVisible, setCommentVisible] = useState(false);
  const showTimerRef = useRef(null);
  const requestSeqRef = useRef(0);

  // On the threshold itself, the magic ball's own welcome line takes the
  // place of the generic page remark — one combined speech-and-typewriter
  // element instead of two separate ones.
  const isThresholdRoute = location.pathname === "/" || location.pathname.startsWith("/threshold");
  const introLine = useJourneyLine(THRESHOLD_INTRO_SCENE_ID, THRESHOLD_INTRO_LINE);

  const clearTimers = useCallback(() => clearTimeout(showTimerRef.current), []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  // Collapse the panel whenever the route changes — reopening it is one tap away.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Ambient, page-aware remark — skipped while the panel itself is open, and
  // skipped entirely on the threshold (which uses introLine instead, above).
  useEffect(() => {
    if (!activePhilosopher) return;
    if (location.pathname === "/guide") return;
    if (isThresholdRoute) return;
    if (isOpen) return;

    const fallbackComment = getPhilosopherComment(
      activePhilosopher.id,
      location.pathname,
    );
    const pageContext = getBadgePageContext(location.pathname);
    const requestKey = ++requestSeqRef.current;
    const controller = new AbortController();
    let preferredComment =
      badgeCommentCache.get(`${activePhilosopher.id}:${pageContext.pathname}`) ?? null;
    let hasShown = false;

    clearTimers();
    setCommentVisible(false);

    fetchBadgeComment({
      philosopher: activePhilosopher,
      pathname: location.pathname,
      pageContext,
      fallbackComment,
      signal: controller.signal,
    })
      .then((generatedComment) => {
        if (requestSeqRef.current !== requestKey) return;
        preferredComment = generatedComment;
        if (!hasShown && !fallbackComment) {
          clearTimers();
          setComment(generatedComment);
          setCommentVisible(true);
          hasShown = true;
        }
      })
      .catch(() => {
        // Fallback text remains the source of truth if generation fails.
      });

    showTimerRef.current = setTimeout(() => {
      if (requestSeqRef.current !== requestKey) return;
      const nextComment = preferredComment ?? fallbackComment;
      if (!nextComment) return;
      hasShown = true;
      setComment(nextComment);
      setCommentVisible(true);
    }, COMMENT_DELAY_MS);

    return () => {
      controller.abort();
      clearTimers();
    };
  }, [location.pathname, activePhilosopher, isOpen, isThresholdRoute, clearTimers]);

  if (location.pathname === "/guide") return null;
  if (location.pathname === "/login") return null;

  const avatarFn = activePhilosopher ? AVATARS[activePhilosopher.id] : null;
  const displayLine = isThresholdRoute ? introLine : comment;
  const showRemark = isThresholdRoute
    ? Boolean(introLine && !isOpen && !thresholdEngaged)
    : Boolean(commentVisible && comment && !isOpen);

  const handleToggle = () => {
    setCommentVisible(false);
    setIsOpen((prev) => !prev);
  };

  const handleStripKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  // The threshold's welcome line is the actual play instruction (touch the
  // sphere), not a one-off ambient remark, so it isn't dismissible — it
  // stays until the player acts or the panel opens.
  const canDismissRemark = showRemark && !isThresholdRoute;

  const handleDismissRemark = (e) => {
    e.stopPropagation();
    setCommentVisible(false);
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
          captions — the philosopher's avatar, name, and remark (typed out
          live) live in one anchored bar, which grows upward into the full
          conversation. No corner chat-bubble icon. */}
      <div
        className={`ga-strip ${showRemark ? "has-remark" : ""}`}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close guide panel" : "Open guide panel"}
        onClick={handleToggle}
        onKeyDown={handleStripKeyDown}
      >
        <span className="ga-strip-avatar" aria-hidden="true">
          {avatarFn ? avatarFn(activePhilosopher.color) : <OracleIcon />}
        </span>

        <span className="ga-strip-body">
          <span className="ga-strip-name">
            {isOpen ? "close" : activePhilosopher ? activePhilosopher.name : "guide"}
          </span>
          <AnimatePresence mode="wait">
            {showRemark && (
              <motion.div
                key={displayLine}
                className="ga-strip-remark"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                role="status"
                aria-live="polite"
              >
                <SmoothTypewriter>{displayLine}</SmoothTypewriter>
              </motion.div>
            )}
          </AnimatePresence>
        </span>

        {canDismissRemark && (
          <button
            type="button"
            className="ga-strip-dismiss"
            onClick={handleDismissRemark}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}

        <span className="ga-strip-chevron" aria-hidden="true">
          {isOpen ? "▲" : "▾"}
        </span>
      </div>
    </aside>
  );
}
