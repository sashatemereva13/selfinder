import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import JourneyNav from "./JourneyNav";

export default function MenuTab() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <aside
      className={`sf-menuTab ${isOpen ? "is-open" : ""}`}
      aria-label="Site menu"
    >
      <button
        type="button"
        className="sf-menuTabToggle"
        aria-expanded={isOpen}
        aria-controls="sf-menuTabPanel"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Close" : "rooms"}
      </button>

      {isOpen && (
        <div id="sf-menuTabPanel" className="sf-menuTabPanel">
          <JourneyNav
            variant="overlay"
            title="Narrative Flow"
            subtitle="keep track of your journey"
            showProgress
          />
        </div>
      )}
    </aside>
  );
}
