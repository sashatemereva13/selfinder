import { useEffect, useMemo, useRef, useState } from "react";
import FrequencyOrb from "./FrequencyOrb";
import "./frequencyPlayer.css";

const frequencies = [
  { name: "Stability", hz: 396, color: "#a7b9ff", intent: "Release tension and settle." },
  { name: "Creativity", hz: 417, color: "#ffc7fa", intent: "Loosen stuck patterns." },
  { name: "Confidence", hz: 528, color: "#aef8e3", intent: "Rebuild trust in your center." },
  { name: "Love", hz: 639, color: "#e9a8ff", intent: "Open relational warmth." },
  { name: "Clarity", hz: 741, color: "#c6ffdd", intent: "Clear mental noise." },
  { name: "Intuition", hz: 852, color: "#fffacd", intent: "Deepen inner listening." },
  { name: "Unity", hz: 963, color: "#ffd4e2", intent: "Expand into coherence." },
];

function FrequencyPlayer() {
  const [active, setActive] = useState(frequencies[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.18);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);

  const activeLabel = useMemo(() => `${active.name} (${active.hz}Hz)`, [active]);

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
    const osc = oscillatorRef.current;
    const gain = gainRef.current;

    if (ctx && gain) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
    }

    if (osc) {
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
    }

    if (gain) {
      window.setTimeout(() => {
        try {
          gain.disconnect();
        } catch {
          // Ignore disconnect errors during cleanup.
        }
      }, 120);
    }

    oscillatorRef.current = null;
    gainRef.current = null;
    setIsPlaying(false);
  };

  const startTone = async () => {
    const ctx = await getAudioContext();
    if (!ctx) return;

    stopTone();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(active.hz, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.max(0.001, volume), ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    oscillatorRef.current = osc;
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

  const handleSelect = async (frequency) => {
    setActive(frequency);

    if (isPlaying && oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.linearRampToValueAtTime(
        frequency.hz,
        audioContextRef.current.currentTime + 0.14,
      );
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
    <section className="tuneInShell" aria-label="Frequency player">
      <aside className="tuneInLeftPanel">
        <div className="tuneInControlsCard">
          <p className="sf-kicker">Now Selected</p>
          <h2>{activeLabel}</h2>
          <p className="tuneInIntent">{active.intent}</p>

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

        <div className="freqList" role="listbox" aria-label="Frequencies">
          {frequencies.map((f) => (
            <button
              key={f.hz}
              className={`freqItem ${active.hz === f.hz ? "active" : ""}`}
              onClick={() => {
                void handleSelect(f);
              }}
              aria-pressed={active.hz === f.hz}
              aria-label={`${f.name} ${f.hz} hertz`}
            >
              <span className="freqName">{f.name}</span>
              <span className="freqHz">{f.hz}Hz</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="orbContainer">
        <FrequencyOrb color={active.color} />
        <div className="freqLabel">{activeLabel}</div>
      </div>
    </section>
  );
}

export default FrequencyPlayer;
