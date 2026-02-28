import "../css/style.css";
import "./BeingToBrand.css";
import { Link } from "react-router-dom";

import des1 from "/designs/des1.png";

const BeingToBrand = () => {
  return (
    <>
      <div>
        <Link to="/" className="backButton">
          Back
        </Link>
        <div>
          <p>soul design examples</p>
          <img className="desExample" src={des1} />
        </div>
        <div className="pageBeingToBrand">
          <h1>My Process</h1>
          <h3>1. Deep Discovery Meeting</h3>
          <p>
            We meet to discuss: what you want your website to represnet, how you
            want to be perceived, your core values and vision for the future.
          </p>
          <h3>Soul Translation: Moodboard & Design Philosophy</h3>
          <p>
            Based on our conversation, I create a moodboard, capturing your
            essence visually, a design plan (fonts, colors, imagery, layout), a
            philosophy behind the design (explaining why I made these choices).
            This step is at the heart pf my work. It's where I translate the
            intangible parts of you into something visual and memorable.{" "}
          </p>
          <p>
            I translate inner essence into an interactive, visual, emotional
            experience.
          </p>
          <p>
            I am a Technical Artist who builds soul-aligned portfolio websites
            and personal brand identities for:{" "}
          </p>
          <ul>
            <li>Individuals (artists, creators, founders)</li>
            <li>Small companies / startups (under 50 people)</li>
          </ul>
          <p>I design and develop:</p>{" "}
          <ul>
            <li> Custom-built, scrollable, immersive websites</li>
            <li>
              {" "}
              Animated or interactive backgrounds (like oceans, cosmic elements)
            </li>
            <li> Deeply branded digital experiences — not just pages</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default BeingToBrand;
