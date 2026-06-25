import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { readMeasureResult } from "../hooks/useRoomProgress";
import {
  LINES as MEASURE_LINES,
  AXIS_COLORS,
  THERMOMETER_MAX,
} from "../measure/measureConfig";
import {
  useJourneyLine,
  DEPTHS_ARRIVAL_SCENE_ID,
  DEPTHS_ARRIVAL_LINE,
} from "../content/journeyLines";
import { useChat } from "../guide/ChatContext";
import DiamondChart from "./DiamondChart";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import "./Depths.css";

export default function Depths() {
  const location = useLocation();
  const { activePhilosopher } = useChat();
  const measureResult = readMeasureResult();

  const [showPortalArrival, setShowPortalArrival] = useState(
    Boolean(location.state?.fromPortalJump),
  );
  const arrivalLine = useJourneyLine(
    DEPTHS_ARRIVAL_SCENE_ID,
    DEPTHS_ARRIVAL_LINE,
  );

  useEffect(() => {
    if (!showPortalArrival) return undefined;
    const timer = window.setTimeout(() => setShowPortalArrival(false), 1250);
    return () => window.clearTimeout(timer);
  }, [showPortalArrival]);

  const diamondPoints = MEASURE_LINES.map((line) => {
    const resultLine = measureResult?.lines?.find((l) => l.key === line.key);
    return {
      key: line.key,
      label: line.label,
      pct: resultLine ? resultLine.vibrationScore / THERMOMETER_MAX : 0,
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
            <p>{arrivalLine ?? DEPTHS_ARRIVAL_LINE}</p>
          </div>
        </div>
      )}
      <header className="depthsHeader">
        <p className="depthsKicker">The Depths</p>
        <h1 className="depthsTitle">energy store</h1>
        <p className="depthsIntro">
see what your current energy charge consists
          of and what it's useful for
        </p>
      </header>

      <div className="depthsDiamondWrap">
        <DiamondChart points={diamondPoints} />
      </div>

      <Link to="/depths/spheres" className="depthsMeasureCta sf-btn sf-btn-primary">
        {measureResult ? "Measure again" : "Feel into your vibration"} →
      </Link>
    </div>
  );
}
