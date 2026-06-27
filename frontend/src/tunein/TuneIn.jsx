import { useMemo } from "react";
import { Link } from "react-router-dom";
import FrequencyPlayer from "./FrequencyPlayer";
import { useChat } from "../guide/ChatContext";
import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import JourneyProgress from "../designElements/JourneyProgress";
import FeelingLuckyList from "../designElements/FeelingLuckyList.json";

const TuneIn = () => {
  const { activePhilosopher } = useChat();
  // Drawn once per visit, not on every re-render — this is the journey's
  // closing note, not an ambient remark that should keep changing.
  const closingMessage = useMemo(
    () => FeelingLuckyList[Math.floor(Math.random() * FeelingLuckyList.length)],
    [],
  );

  return (
    <main className="tuneInPage">
      <header className="tuneInTopbar">
        <Link to="/" className="sf-btn tuneInBackBtn">
          Back Home
        </Link>
      </header>

      <JourneyProgress currentKey="tunein" />

      <section className="tuneInIntro">
        <p className="sf-kicker">Regulation Layer</p>
        <h1>Tune your field with frequency</h1>
        <p>
          Choose a frequency, then press play. Keep your breath steady and stay with one tone for 1-3
          minutes before switching.
        </p>
      </section>

      <FrequencyPlayer />

      {activePhilosopher?.handoff && (
        <section className="tuneInClosing">
          <div className="tuneInHandoff">
            <PhilosopherVoiceTag philosopher={activePhilosopher} />
            <p>{activePhilosopher.handoff}</p>
          </div>

          <div className="tuneInPersonalNote" aria-label="A personal note, not from the philosopher">
            <p>{closingMessage.message}</p>
          </div>

          <Link to="/" className="sf-btn tuneInReturnBtn">
            Return to the beginning
          </Link>
        </section>
      )}
    </main>
  );
};

export default TuneIn;
