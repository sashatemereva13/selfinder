import { Link } from "react-router-dom";
import FrequencyPlayer from "./FrequencyPlayer";

const TuneIn = () => {
  return (
    <main className="tuneInPage">
      <header className="tuneInTopbar">
        <Link to="/" className="sf-btn tuneInBackBtn">
          Back Home
        </Link>
      </header>

      <section className="tuneInIntro">
        <p className="sf-kicker">Regulation Layer</p>
        <h1>Tune your field with frequency</h1>
        <p>
          Choose a frequency, then press play. Keep your breath steady and stay with one tone for 1-3
          minutes before switching.
        </p>
      </section>

      <FrequencyPlayer />
    </main>
  );
};

export default TuneIn;
