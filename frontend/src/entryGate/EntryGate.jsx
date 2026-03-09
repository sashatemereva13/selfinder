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
        <br />
        <br />
        This is how love wins fear
      </p>
      <div className="entryGateHeart" aria-hidden="true">
        <span className="entryGateCoreField" />
        <span className="entryGateCoreRing" />
        <span className="entryGateCore" />
      </div>
      <button className="entryGateButton" type="button" onClick={onEnter}>
        begin
      </button>
    </section>
  );
}

export default EntryGate;
