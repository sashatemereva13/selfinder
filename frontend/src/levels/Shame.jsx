import { Link } from "react-router-dom";
import "./levels.css";

const Shame = () => {
  return (
    <div>
      <Link to="/levels" className="backButton level-theme-shame">
        Back
      </Link>
      <div className="aLevelContainer level-theme-shame">
        <h1>Shame: Despair</h1>
        <p>Feels like: wanting to be invisible.</p>
        <p>Personality: shy, withdrawn, introverted, self-deprecating.</p>
        <p>Used in society: as a fear of disapproval; a tool for cruelty.</p>
        <p>
          Factors leading to it: neglect, physical, emotional, or sexual abuse.
        </p>
        <p>
          Prone to: bizarre crimes, paranoia, psychosis, hallucinations of an
          accusatory nature.
        </p>
        <p>
          To go up: see that all fear is illusion, so it is safe to let go of
          ego attachments. The ego is not the source of life, no matter how
          intense the experience may seem. With the surrender of what seems to
          be the very source, irreducible core, and essence of one’s life—the
          personal “I”—the mind dissolves into the Infinite “I” of the Eternal,
          with its profound peace and state of Oneness beyond all time.
        </p>
        <p>
          Despair is characterised by helplessness and hopelessness. It is a
          hellish state to endure. The will to live is lost, while the act of
          suicide is not possible due to lack of energy. Passive suicide occurs
          through failure to eat or provide for physical necessities.
        </p>
        <p>
          Shame is reflective of self-hatred, which can result in homicidal
          aggression.
        </p>
        <p>
          Depression is accompanied by major changes in brain physiology and low
          levels of critical neurotransmitters such as norepinephrine and
          serotonin.
        </p>
        <p>
          This state may also be a transitory phase, as a consequence of intense
          inner spiritual work. Severe spiritual depression—the “dark night of
          the soul”—can represent the last toehold of the ego as it fights for
          survival. The ego’s basic illusion is that it is God, and that without
          it, death will occur. What is described as “the dark night of the
          soul” is actually the dark night of the ego. It is not really the soul
          that is in the dark, but the ego.
        </p>
        <p>
          Some comfort can be obtained by recalling the spiritual dictum that
          one can only go as high as they have been low, or that Jesus Christ
          sweat blood in Gethsemane, or that the Buddha reported he felt as
          though his bones were being broken and he was being attacked by
          demons.
        </p>
      </div>
    </div>
  );
};

export default Shame;
