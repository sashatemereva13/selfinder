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

const POSITION_ORDER = ["top", "right", "bottom", "left"];

export default function Depths() {
  const location = useLocation();
  const { activePhilosopher } = useChat();
  const measureResult = readMeasureResult();
  const previousResult = readPreviousMeasureResult();

  const [showPortalArrival, setShowPortalArrival] = useState(
    Boolean(location.state?.fromPortalJump),
  );
  const [showingPrevious, setShowingPrevious] = useState(false);

  useEffect(() => {
    if (!showPortalArrival) return undefined;
    const timer = window.setTimeout(() => setShowPortalArrival(false), 1250);
    return () => window.clearTimeout(timer);
  }, [showPortalArrival]);

  const activeResult = showingPrevious && previousResult ? previousResult : measureResult;

  const diamondPoints = MEASURE_LINES.map((line, index) => {
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
      position: POSITION_ORDER[index],
    };
  });

  return (
    <div className={`depthsPage ${showPortalArrival ? "is-portal-arrival" : ""}`}>
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
        <div className="depthsOverallBlock">
          <p className="depthsKicker">The Depths</p>
          {activeResult?.vibrationLevel ? (
            <>
              <h1 className="depthsOverallLevel">{activeResult.vibrationLevel.name}</h1>
              <Link to={activeResult.vibrationLevel.route} className="depthsReadLink">
                Read what this means →
              </Link>
            </>
          ) : (
            <h1 className="depthsOverallLevel is-empty">No reading yet</h1>
          )}
        </div>

        <div className="depthsDiamondGrid">
          {diamondPoints.map((pt) => (
            <div key={pt.key} className={`depthsAxisLabel depthsAxisLabel-${pt.position}`}>
              <p className="depthsAxisName">{pt.label}</p>
              {activeResult && pt.levelName && pt.route ? (
                <Link
                  to={pt.route}
                  className="depthsAxisLevel"
                  style={{ "--axis-rgb": pt.colorRgb }}
                >
                  {pt.levelName}
                </Link>
              ) : (
                <span className="depthsAxisLevel is-empty">—</span>
              )}
            </div>
          ))}
          <div className="depthsDiamondWrap">
            <DiamondChart points={diamondPoints} />
          </div>
        </div>

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

        <Link to="/depths/spheres" className="depthsMeasureCta sf-btn sf-btn-primary">
          {measureResult ? "Measure again" : "Feel into your vibration"} →
        </Link>
      </div>
    </div>
  );
}
