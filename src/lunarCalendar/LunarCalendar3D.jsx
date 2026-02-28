import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import MoonDictionary from "../list/MoonList.jsx";
import * as THREE from "three";
import { Link } from "react-router-dom";
import JourneyNav from "../designElements/JourneyNav";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import "./LunarCalendar.css";

const MEASURE_RESULT_STORAGE_KEY = "selfinder.latestMeasureResult";

function getMoonPhaseFraction(date = new Date()) {
  const synodicMonth = 29.53058867;
  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const daysSince = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const normalizedDays = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  return normalizedDays / synodicMonth;
}

function getMoonPhaseInfo(phase) {
  if (phase < 0.03 || phase > 0.97) return { name: "New Moon", symbol: "🌑" };
  if (phase < 0.22) return { name: "Waxing Crescent", symbol: "🌒" };
  if (phase < 0.28) return { name: "First Quarter", symbol: "🌓" };
  if (phase < 0.47) return { name: "Waxing Gibbous", symbol: "🌔" };
  if (phase < 0.53) return { name: "Full Moon", symbol: "🌕" };
  if (phase < 0.72) return { name: "Waning Gibbous", symbol: "🌖" };
  if (phase < 0.78) return { name: "Last Quarter", symbol: "🌗" };
  return { name: "Waning Crescent", symbol: "🌘" };
}

function readLatestMeasureResult() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MEASURE_RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.vibrationLevel?.name || typeof parsed.vibrationScore !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function getMeasureStateBand(measureResult) {
  if (!measureResult) return "unknown";
  if (measureResult.vibrationScore < 200) return "low";
  if (measureResult.vibrationScore < 350) return "mid";
  return "high";
}

function getPersonalizedMoonBridge(phaseName, measureResult) {
  if (!measureResult) {
    return {
      title: "No recent measure yet",
      body:
        "Start with Measure to capture your current vibration level, then use the moon phase as a timing lens for what kind of support you need today.",
      prompt: "Take a quick measure reading before acting on the moon guidance if you want a more personal check-in.",
      primaryLabel: "Start with Measure",
      primaryTo: "/measure",
    };
  }

  const levelName = measureResult.vibrationLevel.name;
  const stateBand = getMeasureStateBand(measureResult);
  const axis = measureResult.dominantAxis;

  const bridgeByBand = {
    low: {
      body: `Your latest reading points to ${levelName}. Under ${phaseName}, keep the moon guidance gentle and practical: reduce friction first, then build momentum.`,
      prompt:
        "Ask: what is the smallest action that restores trust in my energy today?",
    },
    mid: {
      body: `Your latest reading sits near ${levelName}. Under ${phaseName}, use the phase to refine direction, pacing, and consistency rather than forcing a big reset.`,
      prompt:
        "Ask: what action keeps me aligned and steady for the next 24 hours?",
    },
    high: {
      body: `Your latest reading points to ${levelName}. Under ${phaseName}, the opportunity is to use clarity and openness intentionally so it becomes something real, not just insight.`,
      prompt:
        "Ask: where can I translate this energy into one clear contribution or completion?",
    },
  };

  const axisNudge = {
    calm: "Let the moon phase shape your pacing more than your output.",
    clarity: "Use the phase to decide what matters most, not to collect more inputs.",
    grounding: "Anchor the moon guidance in a body-based action before reflection.",
    intensity: "Channel the phase into one direction so the charge becomes clean movement.",
  }[axis] || "Use the moon guidance as a lens for timing, not pressure.";

  return {
    title: `Personalized with your ${levelName} reading`,
    body: bridgeByBand[stateBand].body,
    prompt: `${bridgeByBand[stateBand].prompt} ${axisNudge}`,
    primaryLabel: "Re-run Measure",
    primaryTo: "/measure",
  };
}

function getSelfinderMoonGuide(phaseName, phaseFraction, measureResult) {
  const cycleStage = phaseFraction < 0.5 ? "building" : "releasing";

  const guideByPhase = {
    "New Moon": {
      title: "Begin quietly",
      focus: "Intention over action",
      reflection:
        "What wants to begin in your life if you stop forcing the outcome and just name the direction?",
      practice: "Write one clear intention and one tiny action you can take in the next 24 hours.",
      stepHint: "Start with `measure` to read your current state before setting the tone.",
    },
    "Waxing Crescent": {
      title: "Protect the spark",
      focus: "Gentle momentum",
      reflection:
        "What early idea or feeling needs patience and repetition instead of pressure right now?",
      practice: "Choose one small repeated action and commit to it for the next 3 days.",
      stepHint: "Use `measure` first, then `tune in` to build consistency.",
    },
    "First Quarter": {
      title: "Choose the path",
      focus: "Decision and commitment",
      reflection:
        "Where are you being asked to decide instead of staying in possibility?",
      practice: "Name one decision and remove one distraction that keeps you undecided.",
      stepHint: "Use `tune in` for focus, then check `levels` for perspective.",
    },
    "Waxing Gibbous": {
      title: "Refine what matters",
      focus: "Adjustment before completion",
      reflection:
        "What is almost ready, and what one refinement would make it feel true?",
      practice: "Review one project or relationship and improve one meaningful detail.",
      stepHint: "Use `measure` to avoid over-correcting from stress.",
    },
    "Full Moon": {
      title: "See clearly",
      focus: "Illumination and release",
      reflection:
        "What truth is visible now that was easier to avoid earlier in the cycle?",
      practice: "Celebrate one completed cycle and release one habit, thought, or expectation.",
      stepHint: "Visit `levels` after `measure` to place your current energy in a wider context.",
    },
    "Waning Gibbous": {
      title: "Integrate and share",
      focus: "Meaning from experience",
      reflection:
        "What have you recently learned that becomes more valuable when you share it?",
      practice: "Write or speak one lesson you want to carry forward from this cycle.",
      stepHint: "Use `levels` for reflection, then `tune in` for grounding.",
    },
    "Last Quarter": {
      title: "Release structure",
      focus: "Clearing and simplification",
      reflection:
        "What is complete, but still taking up emotional or mental space?",
      practice: "Remove one obligation, one object, or one commitment that no longer fits.",
      stepHint: "Start with `measure` to separate fatigue from real completion.",
    },
    "Waning Crescent": {
      title: "Rest and reset",
      focus: "Recovery and listening",
      reflection:
        "What would become possible if rest was treated as part of your path, not a delay?",
      practice: "Create a quiet window today: no input, no output, just reset.",
      stepHint: "Use `tune in` softly, then return at the next new moon with a fresh intention.",
    },
  };

  const guide = guideByPhase[phaseName] || guideByPhase["New Moon"];

  const stateBand = getMeasureStateBand(measureResult);
  const bridge = getPersonalizedMoonBridge(phaseName, measureResult);

  const flowByState = {
    low: cycleStage === "building"
      ? ["moon check-in", "measure", "tune in", "levels"]
      : ["moon check-in", "measure", "levels", "tune in"],
    mid: cycleStage === "building"
      ? ["moon check-in", "measure", "tune in", "levels"]
      : ["moon check-in", "levels", "measure", "tune in"],
    high: cycleStage === "building"
      ? ["moon check-in", "tune in", "measure", "levels"]
      : ["moon check-in", "levels", "tune in", "measure"],
    unknown:
      cycleStage === "building"
        ? ["moon check-in", "measure", "tune in", "levels"]
        : ["moon check-in", "levels", "measure", "tune in"],
  };

  return {
    ...guide,
    personalizedBridge: bridge,
    cycleStage,
    flowSequence: flowByState[stateBand] || flowByState.unknown,
  };
}

function Moon3D({ phase, qualityTier = "medium" }) {
  const moonRef = useRef();
  const texture = useMemo(
    () => new THREE.TextureLoader().load("/textures/moon.jpg"),
    []
  );
  useFrame(() => {
    if (moonRef.current) moonRef.current.rotation.y += 0.001;
  });

  // Full orbit so the lit side matches waxing/waning direction across the cycle.
  const angle = phase * Math.PI * 2;
  const lightDistance = 5;
  const lightX = Math.sin(angle) * lightDistance;
  const lightZ = -Math.cos(angle) * lightDistance;

  const isLowQuality = qualityTier === "low";
  const isMediumQuality = qualityTier === "medium";

  return (
    <>
      <ambientLight intensity={0.09} />
      <pointLight position={[lightX, 0, lightZ]} intensity={isLowQuality ? 6.5 : 8} />
      <mesh ref={moonRef} scale={2}>
        <sphereGeometry args={[1, isLowQuality ? 32 : isMediumQuality ? 40 : 48, isLowQuality ? 32 : isMediumQuality ? 40 : 48]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0.1} />
      </mesh>
      <Stars
        radius={90}
        depth={40}
        count={isLowQuality ? 700 : isMediumQuality ? 1100 : 1500}
        factor={isLowQuality ? 3 : 3.5}
        fade
      />
    </>
  );
}

export default function LunarCalendar3D() {
  const quality = useAdaptiveQuality();
  const [phaseData, setPhaseData] = useState({
    name: "",
    symbol: "",
    fraction: 0,
    lunarDay: 0,
    nextNewMoon: "",
    nextFullMoon: "",
  });
  const [latestMeasure, setLatestMeasure] = useState(null);

  useEffect(() => {
    const formatLocalDateTime = (date) =>
      date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

    const updatePhase = () => {
      const now = new Date();
      const fraction = getMoonPhaseFraction(now);
      const info = getMoonPhaseInfo(fraction);
      const meanings = MoonDictionary[info.name] || {};
      const synodicMonth = 29.53058867;
      const moonAgeDays = fraction * synodicMonth;
      const lunarDay = Math.max(1, Math.min(30, Math.floor(moonAgeDays) + 1));
      // Approx illuminated fraction of the visible disc (0-100%).
      const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * fraction));

      const daysToNew = (1 - fraction) * synodicMonth;
      const daysToFull = ((0.5 - fraction + 1) % 1) * synodicMonth;

      const nextNewMoon = new Date(now.getTime() + daysToNew * 86400000);
      const nextFullMoon = new Date(now.getTime() + daysToFull * 86400000);

      setPhaseData({
        name: info.name,
        symbol: info.symbol,
        fraction,
        lunarDay,
        moonAgeDays,
        illuminationPercent: Math.round(illumination * 100),
        nextNewMoon: formatLocalDateTime(nextNewMoon),
        nextFullMoon: formatLocalDateTime(nextFullMoon),
        nature: meanings.nature || "",
        people: meanings.people || "",
      });
    };

    updatePhase();
    const interval = setInterval(updatePhase, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLatestMeasure(readLatestMeasureResult());

    const handleStorage = (event) => {
      if (event.key === MEASURE_RESULT_STORAGE_KEY) {
        setLatestMeasure(readLatestMeasureResult());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeZoneLabel =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time"
      : "Local time";
  const selfinderGuide = getSelfinderMoonGuide(phaseData.name, phaseData.fraction, latestMeasure);

  return (
    <div className="lunarCalendar">
      <div className="moonAmbientGlow moonAmbientGlowA" aria-hidden="true" />
      <div className="moonAmbientGlow moonAmbientGlowB" aria-hidden="true" />

      <header className="moonHero">
        <div className="moonHeroIntro">
          <p className="moonKicker">Selfinder Lunar Field</p>
          <div className="date">{today}</div>
          <h1 className="moonHeroTitle">
            <span className="moonHeroSymbol" aria-hidden="true">
              {phaseData.symbol || "🌙"}
            </span>
            <span>{phaseData.name || "Moon Phase"}</span>
          </h1>
          <p className="moonHeroLead">
            A lunar timing page designed for reflection and action. Start with the current phase,
            then use the flow prompts below to move through Selfinder intentionally.
          </p>

          <div className="moonHeroMeta">
            <div className="moonMetaPill">
              <span>Cycle stage</span>
              <strong>{selfinderGuide.cycleStage}</strong>
            </div>
            <div className="moonMetaPill">
              <span>Lunar day</span>
              <strong>{phaseData.lunarDay}</strong>
            </div>
            {latestMeasure?.vibrationLevel?.name && (
              <div className="moonMetaPill">
                <span>Latest measure</span>
                <strong>{latestMeasure.vibrationLevel.name}</strong>
              </div>
            )}
          </div>

          <div className="moonMetricsGrid" aria-label="Moon metrics">
            <div className="moonMetricCard">
              <span className="moonMetricLabel">Moon age</span>
              <strong className="moonMetricValue">{phaseData.moonAgeDays?.toFixed?.(1) ?? "0.0"}d</strong>
            </div>
            <div className="moonMetricCard">
              <span className="moonMetricLabel">Illumination</span>
              <strong className="moonMetricValue">{phaseData.illuminationPercent ?? 0}%</strong>
            </div>
            <div className="moonMetricCard">
              <span className="moonMetricLabel">Cycle progress</span>
              <strong className="moonMetricValue">{Math.round(phaseData.fraction * 100)}%</strong>
            </div>
            <div className="moonMetricCard">
              <span className="moonMetricLabel">Timezone</span>
              <strong className="moonMetricValue moonMetricValueTimeZone">{timeZoneLabel}</strong>
            </div>
          </div>
        </div>

        <div className="moonHeroVisual">
          <div className="moonContainer">
            <Canvas
              dpr={quality.dpr}
              gl={{ antialias: quality.tier !== "low", powerPreference: "high-performance" }}
              performance={{ min: 0.5 }}
              camera={{ position: [0, 0, 7], fov: 45 }}
            >
              <Moon3D phase={phaseData.fraction} qualityTier={quality.tier} />
            </Canvas>
            <div className="moonCanvasBadge" aria-hidden="true">
              {phaseData.symbol || "🌙"} {phaseData.name || "Moon"}
            </div>
          </div>

          <div className="moonUpcomingPanel">
            <div className="moonUpcomingHeader">
              <span>Upcoming phases</span>
              <strong>{timeZoneLabel}</strong>
            </div>
            <div className="moonUpcomingRows">
              <div className="moonUpcomingRow">
                <span className="moonUpcomingIcon" aria-hidden="true">
                  🌑
                </span>
                <div>
                  <p>Next New Moon</p>
                  <strong>{phaseData.nextNewMoon}</strong>
                </div>
              </div>
              <div className="moonUpcomingRow">
                <span className="moonUpcomingIcon" aria-hidden="true">
                  🌕
                </span>
                <div>
                  <p>Next Full Moon</p>
                  <strong>{phaseData.nextFullMoon}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="moonJourneyNavWrap">
        <JourneyNav
          variant="compact"
          currentKey="luna"
          title="Narrative Flow"
          subtitle="Read the current signal, then use lunar timing to guide the next move."
          primaryAction={{
            to: latestMeasure ? "/tunein" : "/measure",
            label: latestMeasure ? "Continue to Tune In" : "Start with Measure",
          }}
        />
      </div>

      <section className="moonReadingLayout">
        <article className="moonMeaning moonPanel">
          <h3>🌿 Nature</h3>
          <p>{phaseData.nature}</p>
          <h3>💫 Energy & People</h3>
          <p>{phaseData.people}</p>
        </article>

        <section className="moonSelfinder moonPanel">
        <div className="moonSelfinderHeader">
          <p className="moonKicker">Selfinder Lunar Check-In</p>
          <h2>{selfinderGuide.title}</h2>
          <p className="moonLead">
            Use the moon as a timing lens, not a rulebook. Let the phase shape the kind of question
            you ask yourself today.
          </p>
        </div>

        <div className="moonSelfinderGrid">
          <div className="moonSelfinderCard">
            <h3>Focus</h3>
            <p>{selfinderGuide.focus}</p>
            <h3>Reflection</h3>
            <p>{selfinderGuide.reflection}</p>
          </div>

          <div className="moonSelfinderCard">
            <h3>Practice</h3>
            <p>{selfinderGuide.practice}</p>
            <h3>Flow Hint</h3>
            <p>{selfinderGuide.stepHint}</p>
          </div>
        </div>

        <div className="moonFlowStrip" aria-label="Selfinder flow sequence">
          {selfinderGuide.flowSequence.map((step, index) => (
            <div key={`${step}-${index}`} className="moonFlowChip">
              <span className="moonFlowIndex">{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="moonMeasureBridge" aria-live="polite">
          <div className="moonMeasureBridgeTop">
            <p className="moonMeasureBridgeLabel">{selfinderGuide.personalizedBridge.title}</p>
            {latestMeasure && (
              <p className="moonMeasureStamp">
                {latestMeasure.vibrationLevel.name} · {latestMeasure.vibrationScore}
              </p>
            )}
          </div>

          <p>{selfinderGuide.personalizedBridge.body}</p>
          <p>{selfinderGuide.personalizedBridge.prompt}</p>

          {latestMeasure?.savedAt && (
            <p className="moonMeasureMeta">
              Latest measure:{" "}
              {new Date(latestMeasure.savedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="moonActions">
          <Link to={selfinderGuide.personalizedBridge.primaryTo} className="moonActionBtn primary">
            {selfinderGuide.personalizedBridge.primaryLabel}
          </Link>
          <Link to="/tunein" className="moonActionBtn">
            Tune In
          </Link>
          {latestMeasure?.vibrationLevel?.route && latestMeasure?.vibrationLevel?.name && (
            <Link to={latestMeasure.vibrationLevel.route} className="moonActionBtn">
              Open {latestMeasure.vibrationLevel.name}
            </Link>
          )}
          <Link to="/levels" className="moonActionBtn">
            Explore Levels
          </Link>
        </div>
        </section>
      </section>
    </div>
  );
}
