import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { readMeasureResult, readPreviousMeasureResult } from "../hooks/useRoomProgress";
import {
  LINES as MEASURE_LINES,
  AXIS_COLORS,
  THERMOMETER_MAX,
} from "../measure/measureConfig";
import { DEPTHS_ARRIVAL_LINE } from "../content/journeyLines";
import { useChat } from "../guide/ChatContext";
import DiamondChart from "./DiamondChart";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import JourneyProgress from "../designElements/JourneyProgress";
import "./Depths.css";

function formatSavedDate(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function Depths() {
  const location = useLocation();
  const { activePhilosopher } = useChat();
  const measureResult = readMeasureResult();
  const previousResult = readPreviousMeasureResult();

  const [showPortalArrival, setShowPortalArrival] = useState(
    Boolean(location.state?.fromPortalJump),
  );
  // Lets a person glance back at where they were without losing today's
  // reading — only ever one reading back, not a full history.
  const [showingPrevious, setShowingPrevious] = useState(false);

  useEffect(() => {
    if (!showPortalArrival) return undefined;
    const timer = window.setTimeout(() => setShowPortalArrival(false), 1250);
    return () => window.clearTimeout(timer);
  }, [showPortalArrival]);

  const activeResult = showingPrevious && previousResult ? previousResult : measureResult;

  const diamondPoints = MEASURE_LINES.map((line) => {
    const resultLine = activeResult?.lines?.find((l) => l.key === line.key);
    return {
      key: line.key,
      label: line.label,
      pct: resultLine ? resultLine.vibrationScore / THERMOMETER_MAX : 0,
      levelName: resultLine?.vibrationLevel?.name ?? null,
      route: resultLine?.vibrationLevel?.route ?? null,
      colorRgb: resultLine
        ? (AXIS_COLORS[resultLine.dominantAxis] ?? AXIS_COLORS.clarity)
        : "120,120,140",
    };
  });

  return (
    <div
      className={`depthsPage ${showPortalArrival ? "is-portal-arrival" : ""}`}
    >
      {showPortalArrival && (
        <div className="depthsPortalArrival" aria-hidden="true">
          <div className="depthsPortalArrivalRing" />
          <div className="depthsPortalArrivalCaption">
            <PhilosopherVoiceTag philosopher={activePhilosopher} />
            <p>{DEPTHS_ARRIVAL_LINE}</p>
          </div>
        </div>
      )}
      <JourneyProgress currentKey="measure" />

      <div className="depthsMain">
        <header className="depthsHeaderCard">
          <p className="depthsKicker">The Depths</p>
          <h1 className="depthsTitle">energy store</h1>
          <p className="depthsIntro">
see what your current energy charge consists
            of and what it's useful for
          </p>
        </header>

        <div className="depthsDiamondCard">
          <div className="depthsDiamondWrap">
            <DiamondChart points={diamondPoints} showLevels={Boolean(activeResult)} />
          </div>

          {activeResult && (
            <p className="depthsScoreLegend">
              Each side names where that part of you sits right now — from
              heavier states like <strong>Shame</strong> toward expansive ones
              like <strong>Enlightenment</strong>. There's no score to hit;
              naming it is the point. Tap any side to read what it means.
            </p>
          )}

          {activeResult?.vibrationLevel && (
            <Link to={activeResult.vibrationLevel.route} className="depthsOverallLink">
              Overall, this reads as <strong>{activeResult.vibrationLevel.name}</strong> →
            </Link>
          )}

          {previousResult && (
            <div className="depthsHistoryToggle" role="group" aria-label="Switch reading">
              <button
                type="button"
                className={`depthsHistoryBtn ${!showingPrevious ? "is-active" : ""}`}
                onClick={() => setShowingPrevious(false)}
              >
                Current
              </button>
              <button
                type="button"
                className={`depthsHistoryBtn ${showingPrevious ? "is-active" : ""}`}
                onClick={() => setShowingPrevious(true)}
              >
                Previous{previousResult.savedAt ? ` · ${formatSavedDate(previousResult.savedAt)}` : ""}
              </button>
            </div>
          )}
        </div>

        <Link to="/depths/spheres" className="depthsMeasureCta sf-btn sf-btn-primary">
          {measureResult ? "Measure again" : "Feel into your vibration"} →
        </Link>
      </div>
    </div>
  );
}
