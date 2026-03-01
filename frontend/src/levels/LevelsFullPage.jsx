import { Link } from "react-router-dom";
import LevelsText from "./LevelsText";

const LevelsFullPage = () => {
  return (
    <main className="levelsExperience">
      <header className="levelsTopbar">
        <Link to="/" className="backButton">
          Back Home
        </Link>
      </header>
      <LevelsText />
    </main>
  );
};

export default LevelsFullPage;
