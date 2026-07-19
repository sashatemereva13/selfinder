import { useEffect, useMemo, useRef, useState } from "react";
import FrequencyOrb from "./FrequencyOrb";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import "./frequencyPlayer.css";

// Binaural beats: two pure tones a few Hz apart, one per ear, read by the
// brainstem as a single "beat" at the difference frequency. Requires stereo
// headphones — through speakers the tones just mix acoustically and the
// beat never forms. carrierHz is the pitch in the left ear; the right ear
// gets carrierHz + beatHz. Carrier pitch itself barely matters scientifically
// (mainly comfort/audibility) — the beat frequency is what's meant to matter,
// so these three map onto the standard calming EEG bands: alpha (8-13Hz),
// theta (4-8Hz), delta (0.5-4Hz).
const states = [
  {
    name: "Calm",
    band: "Alpha",
    beatHz: 10,
    carrierHz: 200,
    color: "#9fffd0",
    intent: "Relaxed, alert stillness — good for settling before or after something stressful.",
  },
  {
    name: "Deep Rest",
    band: "Theta",
    beatHz: 6,
    carrierHz: 200,
    color: "#c39fff",
    intent: "Meditation-depth stillness. Best with eyes closed, not mid-task.",
  },
  {
    name: "Sleep",
    band: "Delta",
    beatHz: 2,
    carrierHz: 150,
    color: "#7ea6ff",
    intent: "The slowest band, associated with deep sleep. Lie down and let it run.",
  },
];

function FrequencyPlayer() {
  const quality = useAdaptiveQuality();
  const [active, setActive] = useState(states[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.18);

  const audioContextRef = useRef(null);
  const oscLRef = useRef(null);
  const oscRRef = useRef(null);
  const gainRef = useRef(null);

  const activeLabel = useMemo(
    () => `${active.name} — ${active.band} (${active.beatHz}Hz beat)`,
    [active]
  );

  const getAudioContext = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const stopTone = () => {
    const ctx = audioContextRef.current;
    const oscL = oscLRef.current;
    const oscR = oscRRef.current;
    const gain = gainRef.current;

    if (ctx && gain) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
    }

    [oscL, oscR].forEach((osc) => {
      if (!osc) return;
      const stopAt = (ctx?.currentTime || 0) + 0.1;
      try {
        osc.stop(stopAt);
      } catch {
        // Oscillator may already be stopped.
      }
      try {
        osc.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup.
      }
    });

    if (gain) {
      window.setTimeout(() => {
        try {
          gain.disconnect();
        } catch {
          // Ignore disconnect errors during cleanup.
        }
      }, 120);
    }

    oscLRef.current = null;
    oscRRef.current = null;
    gainRef.current = null;
    setIsPlaying(false);
  };

  const startTone = async () => {
    const ctx = await getAudioContext();
    if (!ctx) return;

    stopTone();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.max(0.001, volume), ctx.currentTime + 0.12);
    gain.connect(ctx.destination);

    const oscL = ctx.createOscillator();
    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-1, ctx.currentTime);
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(active.carrierHz, ctx.currentTime);
    oscL.connect(panL).connect(gain);
    oscL.start();

    const oscR = ctx.createOscillator();
    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(1, ctx.currentTime);
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(active.carrierHz + active.beatHz, ctx.currentTime);
    oscR.connect(panR).connect(gain);
    oscR.start();

    oscLRef.current = oscL;
    oscRRef.current = oscR;
    gainRef.current = gain;
    setIsPlaying(true);
  };

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      stopTone();
      return;
    }

    await startTone();
  };

  const handleSelect = async (state) => {
    setActive(state);

    if (isPlaying && oscLRef.current && oscRRef.current && audioContextRef.current) {
      const rampTo = audioContextRef.current.currentTime + 0.14;
      oscLRef.current.frequency.linearRampToValueAtTime(state.carrierHz, rampTo);
      oscRRef.current.frequency.linearRampToValueAtTime(state.carrierHz + state.beatHz, rampTo);
    }
  };

  useEffect(() => {
    if (gainRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      gainRef.current.gain.cancelScheduledValues(now);
      gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
      gainRef.current.gain.linearRampToValueAtTime(Math.max(0.001, volume), now + 0.08);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopTone();

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <section className="tuneInShell" aria-label="Binaural beat player">
      <aside className="tuneInLeftPanel">
        <div className="tuneInControlsCard">
          <p className="sf-kicker">Now Selected</p>
          <h2>{activeLabel}</h2>
          <p className="tuneInIntent">{active.intent}</p>
          <p className="tuneInHeadphonesNote">🎧 Needs stereo headphones — through speakers the beat won't form.</p>

          <div className="tuneInControlRow">
            <button
              type="button"
              className="tuneInPlayBtn"
              aria-pressed={isPlaying}
              onClick={handleTogglePlayback}
            >
              {isPlaying ? "Stop" : "Play"}
            </button>
            <span className={`tuneInStatus ${isPlaying ? "is-playing" : ""}`}>
              {isPlaying ? "Playing" : "Stopped"}
            </span>
          </div>

          <label className="tuneInVolume" htmlFor="tunein-volume">
            <span>Volume</span>
            <input
              id="tunein-volume"
              type="range"
              min="0"
              max="40"
              step="1"
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
            />
            <strong>{Math.round(volume * 100)}%</strong>
          </label>
        </div>

        <div className="freqList" role="listbox" aria-label="States">
          {states.map((s) => (
            <button
              key={s.name}
              className={`freqItem ${active.name === s.name ? "active" : ""}`}
              onClick={() => {
                void handleSelect(s);
              }}
              aria-pressed={active.name === s.name}
              aria-label={`${s.name}, ${s.band}, ${s.beatHz} hertz beat`}
            >
              <span className="freqName">{s.name}</span>
              <span className="freqHz">{s.band} · {s.beatHz}Hz</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="orbContainer">
        <FrequencyOrb color={active.color} qualityTier={quality.tier} />
        <div className="freqLabel">{activeLabel}</div>
      </div>
    </section>
  );
}

export default FrequencyPlayer;
