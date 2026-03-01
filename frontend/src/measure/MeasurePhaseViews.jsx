import { Link } from "react-router-dom";

export function MeasureTopBar({ phaseProgress }) {
  return (
    <div className="measure-topbar">
      <Link to="/" className="measure-backButton">
        Back Home
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
      <h1 className="measure-title">Take a quick reading of your current frequency</h1>
      <p className="measure-copy">
        This is a reflection tool, not a diagnosis. Follow instinct first, then use the reading to
        choose one grounded action you can actually do now.
      </p>
      <div className="measure-actionRow">
        <button type="button" className="measure-btn measure-btn-primary" onClick={onBegin}>
          Begin
        </button>
      </div>
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
        {currentStep.key === "sound" ? " Tap a card to hear and select a preview." : ""}
      </p>

      {currentStep.key === "sound" && (
        <div className="measure-audioControls" role="group" aria-label="Sound preview controls">
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
            <span className="measure-volumeValue">{Math.round(previewVolume * 100)}%</span>
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
                <span className={`measure-textureSwatch measure-texture-${option.value}`} aria-hidden="true">
                  <span className="measure-textureLayer layer-a" />
                  <span className="measure-textureLayer layer-b" />
                </span>
              )}
              {currentStep.key !== "color" && currentStep.key !== "texture" && currentStep.key !== "sound" && (
                <span className={`measure-optionVisual measure-visual-${currentStep.key}`} aria-hidden="true">
                  {stepVisual && (
                    <span className="measure-optionBadge">
                      <span className="measure-optionBadgeIcon">{stepVisual.icon}</span>
                      <span className="measure-optionBadgeText">{stepVisual.label}</span>
                    </span>
                  )}
                  {currentStep.key === "pace" ? (
                    <span className={`measure-paceVisual measure-pace-${option.value}`}>
                      <span className="measure-paceIcon" aria-hidden="true">
                        <span className="pace-shape shape-1" />
                        <span className="pace-shape shape-2" />
                        <span className="pace-shape shape-3" />
                      </span>
                      <span className="measure-paceHint">
                        {option.value === "stalled" && "Dense drag / heavy pull"}
                        {option.value === "steady" && "Balanced rhythm / stable flow"}
                        {option.value === "charged" && "Fast surge / high momentum"}
                      </span>
                    </span>
                  ) : currentStep.key === "focus" ? (
                    <span className={`measure-focusVisual measure-focus-${option.value}`}>
                      <span className="measure-focusCanvas" aria-hidden="true">
                        <span className="focus-mark mark-1" />
                        <span className="focus-mark mark-2" />
                        <span className="focus-mark mark-3" />
                        <span className="focus-mark mark-4" />
                      </span>
                      <span className="measure-focusHint">
                        {option.value === "scattered" && "Many inputs, weak center"}
                        {option.value === "functional" && "Usable focus, stable enough"}
                        {option.value === "crisp" && "Clean center, high precision"}
                      </span>
                    </span>
                  ) : currentStep.key === "body" ? (
                    <span className={`measure-bodyVisual measure-body-${option.value}`}>
                      <span className="measure-bodyCanvas" aria-hidden="true">
                        <span className="body-aura aura-1" />
                        <span className="body-aura aura-2" />
                        <span className="body-core" />
                      </span>
                      <span className="measure-bodyHint">
                        {option.value === "contracted" && "Tight shell / guarded state"}
                        {option.value === "neutral-body" && "Balanced baseline / steady body"}
                        {option.value === "open" && "Open field / relaxed system"}
                      </span>
                    </span>
                  ) : currentStep.key === "thoughts" ? (
                    <span className={`measure-thoughtVisual measure-thought-${option.value}`}>
                      <span className="measure-thoughtCanvas" aria-hidden="true">
                        <span className="thought-line line-1" />
                        <span className="thought-line line-2" />
                        <span className="thought-line line-3" />
                      </span>
                      <span className="measure-thoughtHint">
                        {option.value === "critical" && "Sharp loops / pressure tone"}
                        {option.value === "practical" && "Ordered lines / neutral tone"}
                        {option.value === "kind" && "Soft curve / supportive tone"}
                      </span>
                    </span>
                  ) : currentStep.key === "motivation" ? (
                    <span className={`measure-motivationVisual measure-motivation-${option.value}`}>
                      <span className="measure-motivationCanvas" aria-hidden="true">
                        <span className="motivation-arrow arrow-1" />
                        <span className="motivation-arrow arrow-2" />
                        <span className="motivation-arrow arrow-3" />
                      </span>
                      <span className="measure-motivationHint">
                        {option.value === "avoidance" && "Defensive push / moving away"}
                        {option.value === "obligation" && "Reliable effort / duty-driven"}
                        {option.value === "creation" && "Inspired drive / growth-forward"}
                      </span>
                    </span>
                  ) : currentStep.key === "connection" ? (
                    <span className={`measure-connectionVisual measure-connection-${option.value}`}>
                      <span className="measure-connectionCanvas" aria-hidden="true">
                        <span className="connection-node node-a" />
                        <span className="connection-node node-b" />
                        <span className="connection-node node-c" />
                        <span className="connection-link link-a" />
                        <span className="connection-link link-b" />
                      </span>
                      <span className="measure-connectionHint">
                        {option.value === "withdrawn" && "Isolated field / low bridge"}
                        {option.value === "selective" && "Some bridges / guarded access"}
                        {option.value === "connected" && "Warm links / open exchange"}
                      </span>
                    </span>
                  ) : currentStep.key === "response" ? (
                    <span className={`measure-responseVisual measure-response-${option.value}`}>
                      <span className="measure-responseCanvas" aria-hidden="true">
                        <span className="response-mark mark-1" />
                        <span className="response-mark mark-2" />
                        <span className="response-mark mark-3" />
                      </span>
                      <span className="measure-responseHint">
                        {option.value === "freeze" && "Still lock / protective stop"}
                        {option.value === "push" && "Force forward / control reflex"}
                        {option.value === "observe" && "Pause first / aware response"}
                      </span>
                    </span>
                  ) : currentStep.key === "meaning" ? (
                    <span className="measure-meaningVisual">
                      <span className="measure-meaningMeter" aria-hidden="true">
                        <span className="measure-meaningTrack" />
                        <span className={`measure-meaningMarker level-${meaningVisuals[option.value]?.level || 1}`} />
                      </span>
                      <span className="measure-meaningPill">
                        <span>{meaningVisuals[option.value]?.icon || "•"}</span>
                        <span>{meaningVisuals[option.value]?.pill || "Meaning"}</span>
                      </span>
                      <span className="measure-meaningHint">
                        {meaningVisuals[option.value]?.hint || option.vibe}
                      </span>
                    </span>
                  ) : currentStep.key === "horizon" ? (
                    <span className="measure-horizonVisual">
                      <span className="measure-horizonScale" aria-hidden="true">
                        {[1, 2, 3].map((level) => (
                          <span
                            key={level}
                            className={`measure-horizonDot ${
                              level <= (horizonVisuals[option.value]?.level || 1) ? "is-on" : ""
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
                      <span className="measure-signalLegend" aria-hidden="true">
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
              {currentStep.key === "sound" && activePreview === option.value && (
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

      <div className="measure-stepDots" aria-hidden="true">
        {stepConfig.map((step, index) => (
          <span
            key={step.key}
            className={`measure-stepDot ${index === stepIndex ? "is-current" : ""} ${
              choices[step.key] ? "is-done" : ""
            }`}
          />
        ))}
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
          {stepIndex === totalSelectionSteps - 1 ? "Read My Pattern" : "Next"}
        </button>
      </div>
    </div>
  );
}

export function MeasureInterpretationPhase({
  result,
  stepConfig,
  selectedMeta,
  onJumpToStep,
  onBack,
  onNext,
}) {
  return (
    <div className="measure-phaseBlock">
      <p className="measure-kicker">
        {result.band} • Level estimate: {result.vibrationLevel.name} ({result.vibrationLevel.score})
      </p>
      <h2 className="measure-title">{result.title}</h2>
      <p className="measure-copy">{result.summary}</p>

      <div className="measure-chipRow">
        {stepConfig.map((step, index) => (
          <button
            key={step.key}
            type="button"
            className="measure-chip"
            onClick={() => onJumpToStep(index)}
          >
            {step.key}: {selectedMeta[step.key]?.label}
          </button>
        ))}
      </div>

      <div className="measure-cardStack">
        {result.interpretationLines.map((line) => (
          <div className="measure-insightCard" key={line}>
            {line}
          </div>
        ))}
      </div>

      <div className="measure-actionRow">
        <button type="button" className="measure-btn" onClick={onBack}>
          Back
        </button>
        <button type="button" className="measure-btn measure-btn-primary" onClick={onNext}>
          Get Guidance
        </button>
      </div>
    </div>
  );
}

export function MeasureGuidancePhase({ result, onBack, onNext }) {
  return (
    <div className="measure-phaseBlock">
      <p className="measure-kicker">Guidance</p>
      <h2 className="measure-title">Work with the signal, not against it</h2>

      <div className="measure-guidanceGrid">
        <div className="measure-guidancePanel">
          <h3>Next 10 minutes</h3>
          <ul className="measure-list">
            {result.guidance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="measure-guidancePanel">
          <h3>Micro practice</h3>
          <p>{result.microPractice}</p>
          <h3>Action style</h3>
          <p>{result.textureAction}</p>
          <h3>Affirmation</h3>
          <p className="measure-affirmation">“{result.affirmation}”</p>
        </div>
      </div>

      <div className="measure-actionRow">
        <button type="button" className="measure-btn" onClick={onBack}>
          Back
        </button>
        <button type="button" className="measure-btn measure-btn-primary" onClick={onNext}>
          Finish
        </button>
      </div>
    </div>
  );
}

export function MeasureCompletionPhase({ result, showBack, onBack, onRestart }) {
  return (
    <div className="measure-phaseBlock">
      <p className="measure-kicker">Complete</p>
      <h2 className="measure-title">Your reading is ready to use</h2>
      <p className="measure-copy">
        Return later and compare what changed. The value is not the label itself, but the pattern
        shifts you begin to notice over time.
      </p>

      <div className="measure-levelCard">
        <div className="measure-levelTop">
          <span className="measure-summaryLabel">Estimated vibration level</span>
          <span className="measure-levelScore">{result.vibrationLevel.score}</span>
        </div>
        <Link to={result.vibrationLevel.route} className="measure-levelPrimaryLink">
          <span className="measure-levelName">{result.vibrationLevel.name}</span>
          <span className="measure-levelTapHint">Tap to open this level</span>
        </Link>
        <p className="measure-levelCopy">
          Based on your 10 responses, this is the closest match from your levels list. Use it as a
          reflective checkpoint, not a fixed identity.
        </p>
      </div>

      <div className="measure-completionSummary">
        <div>
          <span className="measure-summaryLabel">Band</span>
          <strong>{result.band}</strong>
        </div>
        <div>
          <span className="measure-summaryLabel">Pattern</span>
          <strong>{result.title}</strong>
        </div>
        <div>
          <span className="measure-summaryLabel">Dominant axis</span>
          <strong>{result.dominantAxis}</strong>
        </div>
        <div>
          <span className="measure-summaryLabel">Average vibration score</span>
          <strong>{result.vibrationScore}</strong>
        </div>
      </div>

      <div className="measure-actionRow">
        {showBack && (
          <button type="button" className="measure-btn" onClick={onBack}>
            Back
          </button>
        )}
        <button type="button" className="measure-btn measure-btn-primary" onClick={onRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}
