import { useEffect } from "react";
import "./EntryGate.css";

function EntryGate({ onEnter }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Enter") {
        onEnter();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onEnter]);

  return (
    <section className="entryGate" aria-label="Entry screen">
      <p className="entryGateText">
        You can always come back to your heart and live your life from your
        heart
        <br />
        <br />
        <div className="entryGateHeart" aria-hidden="true">
          <div className="entryGateHeartField" />
          <div className="entryGateHeartGlow" />
          <div className="entryGateHeartOuter" />
          <div className="entryGateHeartInner" />
          <span className="entryGateOrbit entryGateOrbitA" />
          <span className="entryGateOrbit entryGateOrbitB" />
          <div className="entryGateHeartParticles">
            {Array.from({ length: 10 }).map((_, index) => (
              <span
                key={`entry-heart-particle-${index}`}
                className="entryGateHeartParticle"
                style={{
                  "--entry-particle-i": index,
                  "--entry-particle-delay": `${index * 120}ms`,
                }}
              />
            ))}
          </div>

          <div className="entryGateOrbitBeads">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={`entry-orbit-bead-${index}`}
                className="entryGateOrbitBead"
                style={{
                  "--entry-bead-i": index,
                  "--entry-bead-delay": `${index * 140}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <br />
        <br />
        This is how love wins fear
      </p>
      <button className="entryGateButton" type="button" onClick={onEnter}>
        begin
      </button>
    </section>
  );
}

export default EntryGate;
