import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import JourneyNav from "./JourneyNav";
import { useAuth } from "../auth/AuthContext";
import { useChat } from "../guide/ChatContext";

const ICON_MENU = (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <line x1="0" y1="1.5" x2="16" y2="1.5" />
    <line x1="0" y1="5.5" x2="16" y2="5.5" />
    <line x1="0" y1="9.5" x2="16" y2="9.5" />
  </svg>
);

const ICON_CLOSE = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <line x1="1" y1="1" x2="12" y2="12" />
    <line x1="12" y1="1" x2="1" y2="12" />
  </svg>
);

export default function MenuTab() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePhilosopher } = useChat();
  const containerRef = useRef(null);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function onOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [isOpen]);

  function handleAuthClick() {
    navigate(user ? "/space" : "/login");
  }

  return (
    <div className="sf-nav" ref={containerRef}>
      <div className={`sf-navPill ${isOpen ? "is-open" : ""}`}>

        {/* Left — nav toggle */}
        <button
          type="button"
          className="sf-navToggle"
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          aria-controls="sf-navPanel"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
        >
          {isOpen ? ICON_CLOSE : ICON_MENU}
        </button>

        <span className="sf-navSep" aria-hidden="true" />

        {/* Right — identity */}
        <button
          type="button"
          className="sf-navIdentity"
          onClick={handleAuthClick}
          aria-label={user ? `${user.username}'s space` : "Sign in"}
        >
          {activePhilosopher && (
            <span
              className="sf-navPhiloDot"
              style={{
                background: activePhilosopher.color,
                boxShadow: `0 0 7px rgba(${activePhilosopher.accentRgb}, 0.55)`,
              }}
            />
          )}

          {user ? (
            <>
              <span className="sf-navInitial">
                {user.username[0].toUpperCase()}
              </span>
              <span className="sf-navUsername">{user.username}</span>
            </>
          ) : (
            <span className="sf-navSignIn">sign in</span>
          )}
        </button>
      </div>

      {isOpen && (
        <div id="sf-navPanel" className="sf-navPanel">
          <JourneyNav
            variant="overlay"
            title="The House of the Psyche"
            subtitle="Move through the rooms at your own pace."
          />
        </div>
      )}
    </div>
  );
}
