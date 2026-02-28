import { Link } from "react-router-dom";
import "./levels.css";

const Fear = () => {
  return (
    <div>
      <Link to="/levels" className="backButton level-theme-fear">
        Back
      </Link>
      <div className="aLevelContainer level-theme-fear">
        <h1>Fear</h1>
        <p>
          Fear of danger runs much of the world, spurring on endless activity.
          Fear of enemies, old age, or death is a basic motivator in the lives
          of most people.
        </p>
        <p>
          Fear makes one numb and limits the ability to think and act
          rationally.
        </p>
        <p>
          The world appears hazardous, filled with traps. Fear is the favoured
          official tool for control by oppressive agencies. The proliferation of
          fears is as limitless as the human imagination.
        </p>
        <p>
          Fearful thinking can balloon into paranoia or generate neurotic
          defensive structures, becoming a contagious social trend.
        </p>
        <p>
          Fear limits the growth of the personality and leads to inhibition.
        </p>
        <p>
          The fearful seek strong leaders who appear to have conquered their
          fear to lead them out of its slavery.
        </p>
        <p>
          Fear as caution serves survival, in contrast to irrational fears,
          which—as a prevailing mode of behaviour—become uncomfortable and
          decrease the level of consciousness.
        </p>
        <p>
          To let go of fear, one can start by looking at the universe as loving
          instead of evil.
        </p>
        <p>
          Another way of conquering fear is to let it be, and feel it in the
          body. Ask yourself: where does it feel, and how does it feel?
        </p>
      </div>
    </div>
  );
};

export default Fear;
