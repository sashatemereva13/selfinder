import { useState } from "react";
import FrequencyOrb from "./FrequencyOrb";
import "./frequencyPlayer.css";

const frequencies = [
  { name: "Stability (396Hz)", hz: 396, color: "#a7b9ff" },
  { name: "Creativity (417Hz)", hz: 417, color: "#ffc7fa" },
  { name: "Confidence (528Hz)", hz: 528, color: "#aef8e3" },
  { name: "Love (639Hz)", hz: 639, color: "#e9a8ff" },
  { name: "Clarity (741Hz)", hz: 741, color: "#c6ffdd" },
  { name: "Intuition (852Hz)", hz: 852, color: "#fffacd" },
  { name: "Unity (963Hz)", hz: 963, color: "#ffd4e2" },
];

function FrequencyPlayer() {
  const [active, setActive] = useState(frequencies[0]);

  const playTone = (hz) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = hz;
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 2);
  };

  const handleSelect = (f) => {
    setActive(f);
    playTone(f.hz);
  };

  return (
    <div className="tuneInLayout">
      <div className="freqList">
        {frequencies.map((f) => (
          <button
            key={f.hz}
            className={`freqItem ${active.hz === f.hz ? "active" : ""}`}
            onClick={() => handleSelect(f)}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="orbContainer">
        <FrequencyOrb color={active.color} />
        <div className="freqLabel">{active.name}</div>
      </div>
    </div>
  );
}

export default FrequencyPlayer;
