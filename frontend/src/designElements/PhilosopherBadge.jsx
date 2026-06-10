import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "../guide/ChatContext";
import {
  getBadgePageContext,
  getPhilosopherComment,
  resolveCommentPath,
} from "../content/philosopherComments";
import { apiUrl } from "../api/baseUrl";
import { AVATARS } from "../content/philosopherAvatars";
import "./PhilosopherBadge.css";

const COMMENT_DELAY_MS = 520;
const COMMENT_API = apiUrl("/chat/badge-comment");
const badgeCommentCache = new Map();
let badgeCommentEndpointMissing = false;

function getBadgePlacement(pathname) {
  if (!pathname) return "left";
  if (
    pathname.startsWith("/levels") ||
    pathname.startsWith("/luna") ||
    pathname.startsWith("/frequencyupgrade")
  ) {
    return "right";
  }
  return "left";
}

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

export default function PhilosopherBadge() {
  const { activePhilosopher } = useChat();
  const location = useLocation();
  const [comment, setComment] = useState(null);
  const [commentVisible, setCommentVisible] = useState(false);
  const showTimerRef = useRef(null);
  const requestSeqRef = useRef(0);
  const badgePlacement = getBadgePlacement(location.pathname);

  const dismiss = useCallback(() => setCommentVisible(false), []);
  const clearTimers = useCallback(() => {
    clearTimeout(showTimerRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!activePhilosopher) return;
    if (location.pathname === "/guide") return;

    const fallbackComment = getPhilosopherComment(
      activePhilosopher.id,
      location.pathname,
    );
    const pageContext = getBadgePageContext(location.pathname);
    const requestKey = ++requestSeqRef.current;
    const controller = new AbortController();
    let preferredComment =
      badgeCommentCache.get(
        `${activePhilosopher.id}:${pageContext.pathname}`,
      ) ?? null;
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

        // If there is no static fallback for this route, show the AI line as soon as it arrives.
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
  }, [location.pathname, activePhilosopher, dismiss, clearTimers]);

  if (!activePhilosopher) return null;
  if (location.pathname === "/guide") return null;
  if (location.pathname === "/login") return null;

  const avatarFn = AVATARS[activePhilosopher.id];

  return (
    <>
      <Link
        to="/guide"
        className={`philoBadge ${badgePlacement === "right" ? "philoBadge--right" : ""}`}
        style={{
          "--philo-color": activePhilosopher.color,
          "--philo-rgb": activePhilosopher.accentRgb,
        }}
        aria-label={`${activePhilosopher.name} — open guide`}
      >
        <span className="philoAvatarWrap" aria-hidden="true">
          {avatarFn?.(activePhilosopher.color)}
        </span>
        <span className="philoBadgeName">{activePhilosopher.name}</span>
      </Link>

      <AnimatePresence>
        {commentVisible && comment && (
          <motion.aside
            className={`philoBubble ${badgePlacement === "right" ? "philoBubble--right" : ""}`}
            style={{
              "--philo-color": activePhilosopher.color,
              "--philo-rgb": activePhilosopher.accentRgb,
            }}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            role="status"
            aria-live="polite"
          >
            <p className="philoBubbleText">{comment}</p>
            <button
              className="philoBubbleDismiss"
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
            >
              ×
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
