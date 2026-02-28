import { Link } from "react-router-dom";
import LunarCalendar3D from "./LunarCalendar3D";

const LunarCalendar = () => {
  return (
    <>
      <Link to="/" className="backButton">
        Back
      </Link>
      <p className="luneComment"> as the moon goes through cycles, so are we</p>
      <LunarCalendar3D />
    </>
  );
};

export default LunarCalendar;
