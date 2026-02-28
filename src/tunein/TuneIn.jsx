import { Link } from "react-router-dom";
import FrequencyPlayer from "./FrequencyPlayer";

const TuneIn = () => {
  return (
    <>
      <Link to="/" className="backButton">
        Back
      </Link>

      <p className="TuneInNote"> to play the sound, touch the frequency</p>
      <FrequencyPlayer />
    </>
  );
};

export default TuneIn;
