import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AXIS_COLORS, THERMOMETER_MAX, VIBRATION_LEVELS, SPHERE_SUGGESTIONS } from "./measureConfig";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";

function VibrationThermometer({ score, level, axisKey, compact = false }) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilled(true), 90);
    return () => window.clearTimeout(timer);
  }, []);

  const pct = Math.min(100, Math.max(0, (score / THERMOMETER_MAX) * 100));
  const axisRgb = AXIS_COLORS[axisKey] ?? AXIS_COLORS.clarity;

  return (
    <div
      className={`measure-thermo ${compact ? "is-compact" : ""}`}
      style={{ "--thermo-axis-rgb": axisRgb }}
    >
      <div className="measure-thermoTrack">
        {VIBRATION_LEVELS.map((lvl) => (
          <span
            key={lvl.slug}
            className={`measure-thermoTick ${
              lvl.slug === level.slug ? "is-current" : ""
            }`}
            style={{ left: `${(lvl.score / THERMOMETER_MAX) * 100}%` }}
            aria-hidden="true"
          />
        ))}
        <div
          className="measure-thermoMarker"
          style={{ left: filled ? `${pct}%` : "0%" }}
          aria-hidden="true"
        >
          <span className="measure-thermoMarkerGlow" />
        </div>
      </div>
      <p className="measure-thermoReading" role="status">
        {level.name} <span>· {score}</span>
      </p>
    </div>
  );
}

export function MeasureTopBar({ phaseProgress, backTo = "/", backLabel = "Back Home" }) {
  return (
    <div className="measure-topbar">
      <Link to={backTo} className="measure-backButton">
        {backLabel}
      </Link>

      <div className="measure-progressWrap" aria-label="Progress">
        <div className="measure-progressMeta">
          <span>measure</span>
          <span>{Math.round(phaseProgress * 100)}%</span>
        </div>
        <div className="measure-progressTrack">
          <div
            className="measure-progressFill"
            style={{ width: `${Math.round(phaseProgress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MeasureEntryPhase({ onBegin }) {
  return (
    <div className="measure-phaseBlock">
      <p className="measure-kicker">Frequency Check-In</p>
      <h1 className="measure-title">
        A conversation to read where you are right now
      </h1>
      <p className="measure-copy">
        Your philosopher will ask you about four sides of your life — body, mind,
        heart, and spirit. Share what is actually true, not what you think it
        should be. The reading emerges from what you say.
      </p>
      <div className="measure-actionRow">
        <button
          type="button"
          className="measure-btn measure-btn-primary"
          onClick={onBegin}
        >
          Begin the conversation
        </button>
      </div>
    </div>
  );
}

export function MeasureInterviewPhase({
  sphereIndex,
  interviewMessages,
  currentInput,
  onInputChange,
  onSend,
  isAcknowledging,
  philosopher,
  onRestart,
}) {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const totalSpheres = 4;
  const currentQuestion = philosopher?.measureQuestions?.[sphereIndex];
  const sphereLabels = { body: "Body", mind: "Mind", heart: "Heart", spirit: "Spirit" };
  const currentSphere = currentQuestion?.sphere;
  const suggestions = currentSphere ? (SPHERE_SUGGESTIONS[currentSphere] ?? []) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [interviewMessages, isAcknowledging, sphereIndex]);

  useEffect(() => {
    if (!isAcknowledging && sphereIndex < totalSpheres) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isAcknowledging, sphereIndex]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && currentInput.trim() && !isAcknowledging) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="measure-interviewWrap">
      <div className="measure-sphereProgress" aria-label="Sphere progress">
        {["body", "mind", "heart", "spirit"].map((sphere, i) => (
          <span
            key={sphere}
            className={`measure-sphereDot${i < interviewMessages.length ? " is-done" : ""}${i === sphereIndex ? " is-current" : ""}`}
            aria-label={`${sphereLabels[sphere]}${i < interviewMessages.length ? " (answered)" : i === sphereIndex ? " (current)" : ""}`}
          >
            <span className="measure-sphereDotLabel">{sphereLabels[sphere]}</span>
          </span>
        ))}
      </div>

      <div className="measure-interviewScroll" ref={scrollRef}>
        {interviewMessages.map((msg) => (
          <div key={msg.sphere} className="measure-exchange">
            <div className="measure-bubbleRow measure-bubbleRow-philosopher">
              <div
                className="measure-bubble measure-bubble-philosopher"
                style={{ "--philo-color": philosopher?.color }}
              >
                <PhilosopherVoiceTag philosopher={philosopher} />
                <p>{msg.question}</p>
              </div>
            </div>
            <div className="measure-bubbleRow measure-bubbleRow-user">
              <div className="measure-bubble measure-bubble-user">
                <p>{msg.answer}</p>
              </div>
            </div>
            {msg.acknowledgment && (
              <div className="measure-bubbleRow measure-bubbleRow-philosopher">
                <div
                  className="measure-bubble measure-bubble-philosopher"
                  style={{ "--philo-color": philosopher?.color }}
                >
                  <PhilosopherVoiceTag philosopher={philosopher} />
                  <p>{msg.acknowledgment}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {sphereIndex < totalSpheres && currentQuestion && (
          <div className="measure-bubbleRow measure-bubbleRow-philosopher">
            <div
              className="measure-bubble measure-bubble-philosopher"
              style={{ "--philo-color": philosopher?.color }}
            >
              <PhilosopherVoiceTag philosopher={philosopher} />
              <p>{currentQuestion.question}</p>
            </div>
          </div>
        )}

        {isAcknowledging && (
          <div className="measure-bubbleRow measure-bubbleRow-philosopher">
            <div
              className="measure-bubble measure-bubble-philosopher measure-bubble-typing"
              style={{ "--philo-color": philosopher?.color }}
            >
              <span className="measure-typingDot" />
              <span className="measure-typingDot" />
              <span className="measure-typingDot" />
            </div>
          </div>
        )}
      </div>

      {sphereIndex < totalSpheres && (
        <div className="measure-interviewCompose">
          {suggestions.length > 0 && !isAcknowledging && (
            <div className="measure-suggestions" role="group" aria-label="Quick answers">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`measure-suggestion${currentInput === s ? " is-selected" : ""}`}
                  onClick={() => {
                    onInputChange(s);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="measure-interviewInputRow">
            <textarea
              ref={inputRef}
              className="measure-interviewInput"
              value={currentInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Or write your own…"
              rows={2}
              disabled={isAcknowledging}
              aria-label="Your answer"
            />
            <button
              type="button"
              className="measure-interviewSend"
              onClick={onSend}
              disabled={!currentInput.trim() || isAcknowledging}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <div className="measure-interviewFooter">
        <button type="button" className="measure-btn" onClick={onRestart}>
          Start over
        </button>
      </div>
    </div>
  );
}

export function MeasureScoringPhase({ philosopher, interviewMessages }) {
  return (
    <div className="measure-phaseBlock measure-scoringPhase">
      <PhilosopherVoiceTag philosopher={philosopher} />
      <p className="measure-scoringText">Reading your field…</p>
      <div className="measure-scoringOrbs" aria-hidden="true">
        <span className="measure-scoringOrb" />
        <span className="measure-scoringOrb" />
        <span className="measure-scoringOrb" />
        <span className="measure-scoringOrb" />
      </div>
      <p className="measure-scoringHint">
        {interviewMessages.length} spheres read
      </p>
    </div>
  );
}

export function MeasureSelectionPhase({
  stepIndex,
  totalSelectionSteps,
  currentStep,
  choices,
  activePreview,
  isPreviewMuted,
  onTogglePreviewMute,
  previewVolume,
  onPreviewVolumeChange,
  onSelect,
  selectedOptionForCurrentStep,
  stepConfig,
  getOptionSignalBars,
  stepVisuals,
  signalAxes,
  meaningVisuals,
  horizonVisuals,
  canContinueSelection,
  onBack,
  onNext,
}) {
  return (
    <div className="measure-phaseBlock">
      <p className="measure-kicker">
        Step {stepIndex + 1} of {totalSelectionSteps}
      </p>
      <h2 className="measure-title">{currentStep.title}</h2>
      <p className="measure-copy">
        {currentStep.helper}
        {currentStep.key === "sound"
          ? " Tap a card to hear and select a preview."
          : ""}
      </p>

      {currentStep.key === "sound" && (
        <div
          className="measure-audioControls"
          role="group"
          aria-label="Sound preview controls"
        >
          <button
            type="button"
            className={`measure-audioToggle ${isPreviewMuted ? "is-muted" : ""}`}
            onClick={onTogglePreviewMute}
          >
            {isPreviewMuted ? "Unmute previews" : "Mute previews"}
          </button>

          <label className="measure-volumeControl">
            <span>Preview volume</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(previewVolume * 100)}
              onChange={onPreviewVolumeChange}
            />
            <span className="measure-volumeValue">
              {Math.round(previewVolume * 100)}%
            </span>
          </label>
        </div>
      )}

      <div className={`measure-options measure-options-${currentStep.key}`}>
        {currentStep.options.map((option) => {
          const isSelected = choices[currentStep.key] === option.value;
          const signalBars = getOptionSignalBars(option);
          const stepVisual = stepVisuals[currentStep.key];

          return (
            <button
              key={option.value}
              type="button"
              className={`measure-optionCard ${isSelected ? "is-selected" : ""} ${
                currentStep.key === "color" ? "is-color" : ""
              } ${activePreview === option.value ? "is-previewing" : ""}`}
              onClick={() => onSelect(currentStep.key, option.value)}
              aria-pressed={isSelected}
            >
              {currentStep.key === "color" && (
                <span
                  className="measure-colorSwatch"
                  style={{ backgroundColor: option.swatch }}
                  aria-hidden="true"
                />
              )}
              {currentStep.key === "texture" && (
                <span
                  className={`measure-textureSwatch measure-texture-${option.value}`}
                  aria-hidden="true"
                >
                  <span className="measure-textureLayer layer-a" />
                  <span className="measure-textureLayer layer-b" />
                </span>
              )}
              {currentStep.key !== "color" &&
                currentStep.key !== "texture" &&
                currentStep.key !== "sound" && (
                  <span
                    className={`measure-optionVisual measure-visual-${currentStep.key}`}
                    aria-hidden="true"
                  >
                    {stepVisual && (
                      <span className="measure-optionBadge">
                        <span className="measure-optionBadgeIcon">
                          {stepVisual.icon}
                        </span>
                        <span className="measure-optionBadgeText">
                          {stepVisual.label}
                        </span>
                      </span>
                    )}
                    {currentStep.key === "pace" ? (
                      <span
                        className={`measure-paceVisual measure-pace-${option.value}`}
                      >
                        <span className="measure-paceIcon" aria-hidden="true">
                          <span className="pace-shape shape-1" />
                          <span className="pace-shape shape-2" />
                          <span className="pace-shape shape-3" />
                        </span>
                        <span className="measure-paceHint">
                          {option.value === "stalled" &&
                            "Dense drag / heavy pull"}
                          {option.value === "steady" &&
                            "Balanced rhythm / stable flow"}
                          {option.value === "charged" &&
                            "Fast surge / high momentum"}
                        </span>
                      </span>
                    ) : currentStep.key === "focus" ? (
                      <span
                        className={`measure-focusVisual measure-focus-${option.value}`}
                      >
                        <span
                          className="measure-focusCanvas"
                          aria-hidden="true"
                        >
                          <span className="focus-mark mark-1" />
                          <span className="focus-mark mark-2" />
                          <span className="focus-mark mark-3" />
                          <span className="focus-mark mark-4" />
                        </span>
                        <span className="measure-focusHint">
                          {option.value === "scattered" &&
                            "Many inputs, weak center"}
                          {option.value === "functional" &&
                            "Usable focus, stable enough"}
                          {option.value === "crisp" &&
                            "Clean center, high precision"}
                        </span>
                      </span>
                    ) : currentStep.key === "body" ? (
                      <span
                        className={`measure-bodyVisual measure-body-${option.value}`}
                      >
                        <span className="measure-bodyCanvas" aria-hidden="true">
                          <span className="body-aura aura-1" />
                          <span className="body-aura aura-2" />
                          <span className="body-core" />
                        </span>
                        <span className="measure-bodyHint">
                          {option.value === "contracted" &&
                            "Tight shell / guarded state"}
                          {option.value === "neutral-body" &&
                            "Balanced baseline / steady body"}
                          {option.value === "open" &&
                            "Open field / relaxed system"}
                        </span>
                      </span>
                    ) : currentStep.key === "thoughts" ? (
                      <span
                        className={`measure-thoughtVisual measure-thought-${option.value}`}
                      >
                        <span
                          className="measure-thoughtCanvas"
                          aria-hidden="true"
                        >
                          <span className="thought-line line-1" />
                          <span className="thought-line line-2" />
                          <span className="thought-line line-3" />
                        </span>
                        <span className="measure-thoughtHint">
                          {option.value === "critical" &&
                            "Sharp loops / pressure tone"}
                          {option.value === "practical" &&
                            "Ordered lines / neutral tone"}
                          {option.value === "kind" &&
                            "Soft curve / supportive tone"}
                        </span>
                      </span>
                    ) : currentStep.key === "motivation" ? (
                      <span
                        className={`measure-motivationVisual measure-motivation-${option.value}`}
                      >
                        <span
                          className="measure-motivationCanvas"
                          aria-hidden="true"
                        >
                          <span className="motivation-arrow arrow-1" />
                          <span className="motivation-arrow arrow-2" />
                          <span className="motivation-arrow arrow-3" />
                        </span>
                        <span className="measure-motivationHint">
                          {option.value === "avoidance" &&
                            "Defensive push / moving away"}
                          {option.value === "obligation" &&
                            "Reliable effort / duty-driven"}
                          {option.value === "creation" &&
                            "Inspired drive / growth-forward"}
                        </span>
                      </span>
                    ) : currentStep.key === "connection" ? (
                      <span
                        className={`measure-connectionVisual measure-connection-${option.value}`}
                      >
                        <span
                          className="measure-connectionCanvas"
                          aria-hidden="true"
                        >
                          <span className="connection-node node-a" />
                          <span className="connection-node node-b" />
                          <span className="connection-node node-c" />
                          <span className="connection-link link-a" />
                          <span className="connection-link link-b" />
                        </span>
                        <span className="measure-connectionHint">
                          {option.value === "withdrawn" &&
                            "Isolated field / low bridge"}
                          {option.value === "selective" &&
                            "Some bridges / guarded access"}
                          {option.value === "connected" &&
                            "Warm links / open exchange"}
                        </span>
                      </span>
                    ) : currentStep.key === "response" ? (
                      <span
                        className={`measure-responseVisual measure-response-${option.value}`}
                      >
                        <span
                          className="measure-responseCanvas"
                          aria-hidden="true"
                        >
                          <span className="response-mark mark-1" />
                          <span className="response-mark mark-2" />
                          <span className="response-mark mark-3" />
                        </span>
                        <span className="measure-responseHint">
                          {option.value === "freeze" &&
                            "Still lock / protective stop"}
                          {option.value === "push" &&
                            "Force forward / control reflex"}
                          {option.value === "observe" &&
                            "Pause first / aware response"}
                        </span>
                      </span>
                    ) : currentStep.key === "meaning" ? (
                      <span className="measure-meaningVisual">
                        <span
                          className="measure-meaningMeter"
                          aria-hidden="true"
                        >
                          <span className="measure-meaningTrack" />
                          <span
                            className={`measure-meaningMarker level-${meaningVisuals[option.value]?.level || 1}`}
                          />
                        </span>
                        <span className="measure-meaningPill">
                          <span>
                            {meaningVisuals[option.value]?.icon || "•"}
                          </span>
                          <span>
                            {meaningVisuals[option.value]?.pill || "Meaning"}
                          </span>
                        </span>
                        <span className="measure-meaningHint">
                          {meaningVisuals[option.value]?.hint || option.vibe}
                        </span>
                      </span>
                    ) : currentStep.key === "horizon" ? (
                      <span className="measure-horizonVisual">
                        <span
                          className="measure-horizonScale"
                          aria-hidden="true"
                        >
                          {[1, 2, 3].map((level) => (
                            <span
                              key={level}
                              className={`measure-horizonDot ${
                                level <=
                                (horizonVisuals[option.value]?.level || 1)
                                  ? "is-on"
                                  : ""
                              }`}
                            />
                          ))}
                        </span>
                        <span className="measure-horizonHint">
                          {horizonVisuals[option.value]?.hint || option.vibe}
                        </span>
                      </span>
                    ) : (
                      <>
                        <span className="measure-signalBars">
                          {signalBars.map((bar, index) => (
                            <span
                              key={`${option.value}-${bar.key}`}
                              className={`measure-signalBar bar-${index + 1}`}
                              style={{ height: `${bar.height}%` }}
                              title={`${bar.label}: ${bar.score}`}
                              aria-label={`${bar.label} score ${bar.score}`}
                            />
                          ))}
                        </span>
                        <span
                          className="measure-signalLegend"
                          aria-hidden="true"
                        >
                          {signalAxes.map((axis) => (
                            <span key={axis.key}>{axis.short}</span>
                          ))}
                        </span>
                      </>
                    )}
                  </span>
                )}
              <span className="measure-optionLabel">{option.label}</span>
              <span className="measure-optionVibe">{option.vibe}</span>
              {currentStep.key === "sound" &&
                activePreview === option.value && (
                  <span className="measure-optionStatus">previewing</span>
                )}
            </button>
          );
        })}
      </div>

      <p className="measure-selectionState" role="status" aria-live="polite">
        {selectedOptionForCurrentStep
          ? `Selected: ${selectedOptionForCurrentStep.label}`
          : "Choose one option to unlock Next."}
      </p>

      <div
        className="measure-journeyPath"
        role="list"
        aria-label="Question journey"
      >
        <div className="measure-journeyTrack">
          <div
            className="measure-journeyFill"
            style={{
              width: `${(stepIndex / (totalSelectionSteps - 1)) * 100}%`,
            }}
          />
        </div>
        {stepConfig.map((step, index) => {
          const isDone = Boolean(choices[step.key]);
          const isCurrent = index === stepIndex;
          return (
            <div
              key={step.key}
              role="listitem"
              aria-label={`${step.title}${isCurrent ? " (current)" : isDone ? " (answered)" : ""}`}
              className={`measure-journeyNode ${isCurrent ? "is-current" : ""} ${
                isDone ? "is-done" : ""
              }`}
              style={{
                left: `${(index / (totalSelectionSteps - 1)) * 100}%`,
              }}
            >
              <span className="measure-journeyNodeIcon" aria-hidden="true">
                {isDone && !isCurrent
                  ? "✓"
                  : stepVisuals[step.key]?.icon || index + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div className="measure-actionRow">
        <button type="button" className="measure-btn" onClick={onBack}>
          {stepIndex === 0 ? "Back" : "Previous"}
        </button>
        <button
          type="button"
          className="measure-btn measure-btn-primary"
          onClick={onNext}
          disabled={!canContinueSelection}
        >
          {stepIndex === totalSelectionSteps - 1 ? "See My Reading" : "Next"}
        </button>
      </div>
    </div>
  );
}

export function MeasureCompletionPhase({ result, philosopher, onRestart }) {
  return (
    <div className="measure-phaseBlock">
      <p className="measure-kicker">Complete · {result.band}</p>
      <h2 className="measure-title">Next, read what these mean</h2>
      <p className="measure-copy">
        Tap your overall reading or any of the four below — each opens what
        that state actually means and what it tends to be asking for.
      </p>

      {philosopher?.levelsBridge && (
        <div className="measure-guideBridge">
          <PhilosopherVoiceTag philosopher={philosopher} />
          <p>{philosopher.levelsBridge}</p>
        </div>
      )}

      {(result.microPractice || result.affirmation) && (
        <div className="measure-quickPractice">
          {result.microPractice && (
            <p className="measure-quickPracticeAction">{result.microPractice}</p>
          )}
          {result.affirmation && (
            <p className="measure-affirmation">"{result.affirmation}"</p>
          )}
        </div>
      )}

      <div className="measure-levelCard">
        <p className="measure-levelCardKicker">Your overall reading</p>
        <VibrationThermometer
          score={result.vibrationScore}
          level={result.vibrationLevel}
          axisKey={result.dominantAxis}
        />
        <Link
          to={result.vibrationLevel.route}
          className="measure-levelPrimaryLink"
        >
          <span className="measure-levelName">
            {result.vibrationLevel.name}
          </span>
          <span className="measure-levelTapHint">Read about {result.vibrationLevel.name} →</span>
        </Link>
      </div>

      <div className="measure-linesSection">
        <p className="measure-linesKicker">Your four sides</p>
        <p className="measure-copy measure-linesIntro">
          Life moves through many parts at once — you can read high on one
          and low on another, and that's not a contradiction. It's just
          where each side happens to be right now. Read about all four.
        </p>

        <div className="measure-linesList">
          {result.lines.map((line) => (
            <div className="measure-lineRow" key={line.key}>
              <p className="measure-lineLabel">{line.label}</p>
              <VibrationThermometer
                score={line.vibrationScore}
                level={line.vibrationLevel}
                axisKey={line.dominantAxis}
                compact
              />
              <Link to={line.vibrationLevel.route} className="measure-lineLink">
                Read about {line.vibrationLevel.name} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="measure-actionRow">
        <button type="button" className="measure-btn" onClick={onRestart}>
          Measure again
        </button>
      </div>
    </div>
  );
}
