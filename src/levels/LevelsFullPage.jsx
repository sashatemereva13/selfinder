import { Link } from "react-router-dom";
import LevelsText from "./LevelsText";

const LevelsFullPage = () => {
  return (
    <div>
      <Link to="/" className="backButton">
        Back
      </Link>
      <LevelsText />
    </div>
  );
};

export default LevelsFullPage;
