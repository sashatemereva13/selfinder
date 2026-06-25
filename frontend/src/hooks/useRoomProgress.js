import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
export const LOCAL_CONSENT_KEY = "sfr_local_consent";
export const ROOM_KEYS = ["self"];
const MEASURE_KEY = "selfinder.latestMeasureResult";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeVisitId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function roomKey(key) {
  return `sfr_${key}`;
}

function readRoom(key) {
  try {
    const raw = localStorage.getItem(roomKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRoom(key, data) {
  try {
    localStorage.setItem(roomKey(key), JSON.stringify(data));
  } catch {
    // storage full or unavailable — fail silently
  }
}

function readSummary() {
  try {
    const raw = localStorage.getItem("sfr_summary");
    return raw ? JSON.parse(raw) : { artefacts: {} };
  } catch {
    return { artefacts: {} };
  }
}

function writeSummary(data) {
  try {
    localStorage.setItem("sfr_summary", JSON.stringify(data));
  } catch {
    // fail silently
  }
}

// ─── Non-hook utilities (for data management outside room context) ─────────────

export function readAllRooms() {
  return Object.fromEntries(ROOM_KEYS.map((k) => [k, readRoom(k)]));
}

export function readMeasureResult() {
  try {
    const raw = localStorage.getItem(MEASURE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteVisitFromRoom(key, visitId) {
  const current = readRoom(key);
  if (!current) return;

  const deletedIndex = current.visits.findIndex((v) => v.id === visitId);
  if (deletedIndex === -1) return;

  const newVisits = current.visits.filter((v) => v.id !== visitId);

  let newActiveIndex = current.activeVisitIndex;
  if (deletedIndex < current.activeVisitIndex) newActiveIndex--;
  else if (deletedIndex === current.activeVisitIndex) newActiveIndex = -1;

  writeRoom(key, { visits: newVisits, activeVisitIndex: Math.max(-1, newActiveIndex) });

  const summary = readSummary();
  const completedRemaining = newVisits.filter((v) => v.completedAt);
  if (completedRemaining.length === 0) {
    delete summary.artefacts[key];
  } else {
    const mostRecent = completedRemaining.sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    )[0];
    summary.artefacts[key] = {
      unlock: mostRecent.unlock,
      date: mostRecent.completedAt.slice(0, 10),
      visitCount: completedRemaining.length,
    };
  }
  writeSummary(summary);
}

export function clearRoomFromStorage(key) {
  localStorage.removeItem(roomKey(key));
  const summary = readSummary();
  delete summary.artefacts[key];
  writeSummary(summary);
}

export function clearAllLocalData() {
  ROOM_KEYS.forEach((k) => localStorage.removeItem(roomKey(k)));
  localStorage.removeItem("sfr_summary");
  localStorage.removeItem(LOCAL_CONSENT_KEY);
  localStorage.removeItem(MEASURE_KEY);
}

// ─── getJourneySummaryText (non-hook) ─────────────────────────────────────────
export function getJourneySummaryText() {
  const summary = readSummary();
  const entries = Object.entries(summary.artefacts || {});
  if (entries.length === 0) return "";
  const lines = entries.map(
    ([room, data]) =>
      `${room} (visited ${data.visitCount}x on ${data.date}): "${data.unlock}"`
  );
  return `── JOURNEY ARTEFACTS ──\n${lines.join("\n")}\n── END JOURNEY ARTEFACTS ──`;
}

// ─── useJourneySummary ────────────────────────────────────────────────────────
export function useJourneySummary() {
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const summary = readSummary();
  const artefacts = summary.artefacts || {};
  const completedCount = Object.keys(artefacts).length;
  const summaryText = getJourneySummaryText();

  return { artefacts, completedCount, summaryText, refresh };
}

// ─── useRoomProgress ─────────────────────────────────────────────────────────
export function useRoomProgress(key) {
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  function getState() {
    const stored = readRoom(key);
    if (!stored) return { visits: [], activeVisitIndex: -1 };
    return stored;
  }

  const state = getState();
  const { visits, activeVisitIndex } = state;
  const activeVisit = activeVisitIndex >= 0 ? visits[activeVisitIndex] ?? null : null;

  // ── startNewVisit ──
  const startNewVisit = useCallback(() => {
    const current = getState();
    const newVisit = {
      id: makeVisitId(),
      date: new Date().toISOString(),
      mechanic: null,
      messages: [],
      unlock: null,
      completedAt: null,
    };
    const updatedVisits = [...current.visits, newVisit];
    const updated = {
      visits: updatedVisits,
      activeVisitIndex: updatedVisits.length - 1,
    };
    writeRoom(key, updated);
    rerender();
    return newVisit;
  }, [key, rerender]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── continueVisit ──
  const continueVisit = useCallback(
    (index) => {
      const current = getState();
      const updated = { ...current, activeVisitIndex: index };
      writeRoom(key, updated);
      rerender();
    },
    [key, rerender] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── setMechanic ──
  const setMechanic = useCallback(
    (mechanicData) => {
      const current = getState();
      if (current.activeVisitIndex < 0) return;
      const updatedVisits = current.visits.map((v, i) =>
        i === current.activeVisitIndex ? { ...v, mechanic: mechanicData } : v
      );
      writeRoom(key, { ...current, visits: updatedVisits });
      rerender();
    },
    [key, rerender] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── addMessage ──
  const addMessage = useCallback(
    (message) => {
      const current = getState();
      if (current.activeVisitIndex < 0) return;
      const updatedVisits = current.visits.map((v, i) =>
        i === current.activeVisitIndex
          ? { ...v, messages: [...v.messages, message] }
          : v
      );
      writeRoom(key, { ...current, visits: updatedVisits });
      rerender();
    },
    [key, rerender] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── setUnlock ──
  const setUnlock = useCallback(
    (unlockText) => {
      const current = getState();
      if (current.activeVisitIndex < 0) return;
      const updatedVisits = current.visits.map((v, i) =>
        i === current.activeVisitIndex ? { ...v, unlock: unlockText } : v
      );
      writeRoom(key, { ...current, visits: updatedVisits });
      rerender();
    },
    [key, rerender] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── completeVisit ──
  const completeVisit = useCallback(
    (unlockText) => {
      const current = getState();
      if (current.activeVisitIndex < 0) return;
      const now = new Date().toISOString();
      const updatedVisits = current.visits.map((v, i) =>
        i === current.activeVisitIndex
          ? { ...v, unlock: unlockText, completedAt: now }
          : v
      );
      writeRoom(key, { ...current, visits: updatedVisits });

      // update journey summary
      const summary = readSummary();
      const existing = summary.artefacts[key];
      summary.artefacts[key] = {
        unlock: unlockText,
        date: now.slice(0, 10),
        visitCount: existing ? existing.visitCount + 1 : 1,
      };
      writeSummary(summary);

      rerender();
    },
    [key, rerender] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    visits,
    activeVisit,
    activeIndex: activeVisitIndex,
    startNewVisit,
    continueVisit,
    setMechanic,
    addMessage,
    setUnlock,
    completeVisit,
  };
}
