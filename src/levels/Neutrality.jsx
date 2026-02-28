import { Link } from "react-router-dom";
import "./levels.css";
import Reveal from "../utils/Reveal";

const Neutrality = () => {
  return (
    <div>
      <Link to="/levels" className="backButton level-theme-neutrality">
        Back
      </Link>
      <div className="aLevelContainer level-theme-neutrality">
        <h1>Neutrality</h1>

        <Reveal>
          <p>
            To be neutral means to be relatively unattached to outcomes. Not
            getting one’s way is no longer experienced as defeating,
            frightening, or frustrating.
          </p>
        </Reveal>

        <Reveal>
          <p>
            At the neutral level, a person can say: “Well, if I don’t get this
            job, then I’ll get another.” This is the beginning of inner
            confidence.
          </p>
        </Reveal>
        <p>
          People at neutrality have a sense of well-being. This is the level of
          safety. People at this level are easy to get along with and safe to
          associate with because they are not interested in conflict,
          competition, or guilt. They are comfortable and basically emotionally
          undisturbed. This attitude is nonjudgmental and does not lead to any
          need to control other people’s behaviours.
        </p>
        <p>
          This level results in greater freedom for self and others. One is free
          from trying to “prove” anything about oneself.
        </p>
        <p>
          The level of neutrality is relatively free of anxiety, for it doesn’t
          place survival value on preconceived outcomes. Thus, the source of
          happiness is not projected externally onto others or the outside
          world.
        </p>
        <p>
          **Nonattachment vs detachment** — detachment indicates withdrawal as
          well as negation, leading to indifference, which in itself is a
          defense against the fear of attachment. The pathway to the state of
          Enlightenment is via nonattachment rather than negation. Nonattachment
          means nondependence on form. It allows for freedom from the attraction
          of projected values and anticipations such as gain.
        </p>
        <p>
          Without fear of either attraction or aversion, neutrality allows for
          participation and the enjoyment of life because life becomes more like
          a play than a high-stakes involvement. This is consistent with the
          teachings of Tao, in that the flow of life is neither sought nor
          resisted. Thus, life becomes effortless, and existence itself is
          pleasurable, without conditions—easygoing, like a cork in the sea.
        </p>
      </div>
    </div>
  );
};

export default Neutrality;
