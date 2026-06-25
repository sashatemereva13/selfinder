import { useEffect, useState } from "react";
import { apiUrl } from "../api/baseUrl";
import { useChat } from "../guide/ChatContext";

const JOURNEY_LINE_API = apiUrl("/chat/journey-line");
const JOURNEY_LINE_DELAY_MS = 480;

// Shared so GuideAnchor (which renders the line, now that the magic ball's
// own under-ball typewriter has been folded into it) and anything else that
// touches the threshold scene resolve to the same cache entry.
export const THRESHOLD_INTRO_SCENE_ID = "threshold-intro";
export const THRESHOLD_INTRO_LINE = "Welcome traveller.\nTouch the sphere to cross the threshold.";

// Shared so the portal jump (which pre-warms this line while the player is
// mid-flight) and the Measure arrival caption (which renders it) resolve to
// the same cache entry — the line is already settled by the time it's shown.
export const MEASURE_ARRIVAL_SCENE_ID = "measure-arrival";
export const MEASURE_ARRIVAL_LINE = "Signal lock acquired. Entering measurement protocol.";

// Same pattern, for the portal jump that lands on the Depths hub.
export const DEPTHS_ARRIVAL_SCENE_ID = "depths-arrival";
export const DEPTHS_ARRIVAL_LINE = "Descending. Several parts of you are about to come into view.";

const journeyLineCache = new Map();
let journeyLineEndpointMissing = false;

async function fetchJourneyLine({ philosopher, sceneId, referenceLine, signal }) {
  if (journeyLineEndpointMissing) return null;

  const res = await fetch(JOURNEY_LINE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      philosopherId: philosopher.id,
      sceneId,
      referenceLine,
    }),
    signal,
  });

  if (!res.ok) {
    if (res.status === 404) journeyLineEndpointMissing = true;
    throw new Error("Failed to generate journey line");
  }

  const data = await res.json();
  const line = typeof data.line === "string" ? data.line.trim() : "";
  if (!line) throw new Error("No journey line returned");

  return line;
}

/**
 * Resolves a scripted line into the active philosopher's voice via the
 * journey-line endpoint, falling back to the original line on failure or
 * timeout. Resolves exactly once per (philosopher, scene, reference) so the
 * typewriter never restarts mid-animation when the generated line lands late.
 */
export function useJourneyLine(sceneId, referenceLine) {
  const { activePhilosopher } = useChat();
  const [resolvedLine, setResolvedLine] = useState(null);

  useEffect(() => {
    setResolvedLine(null);

    if (!activePhilosopher || !referenceLine) {
      setResolvedLine(referenceLine ?? "");
      return;
    }

    const cacheKey = `${activePhilosopher.id}:${sceneId}:${referenceLine}`;
    const cached = journeyLineCache.get(cacheKey);
    if (cached) {
      setResolvedLine(cached);
      return;
    }

    let settled = false;
    let preferred = null;
    const controller = new AbortController();

    fetchJourneyLine({
      philosopher: activePhilosopher,
      sceneId,
      referenceLine,
      signal: controller.signal,
    })
      .then((generated) => {
        if (generated) preferred = generated;
      })
      .catch(() => {});

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      const finalLine = preferred ?? referenceLine;
      journeyLineCache.set(cacheKey, finalLine);
      setResolvedLine(finalLine);
    }, JOURNEY_LINE_DELAY_MS);

    return () => {
      settled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activePhilosopher, sceneId, referenceLine]);

  return resolvedLine;
}
