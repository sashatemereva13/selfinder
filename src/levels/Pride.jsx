import { Link } from "react-router-dom";
import "./levels.css";

const Pride = () => {
  return (
    <div>
      <Link to="/levels" className="backButton level-theme-pride">
        Back
      </Link>
      <div className="aLevelContainer level-theme-pride">
        <h1>Pride</h1>
        <p>
          This level is characterised by a rise in self-esteem, which balms all
          the pain experienced at lower levels of consciousness. But it feels
          good only in contrast to the lower levels.
        </p>
        <p>
          The downside of pride is arrogance and denial, which block growth.
          Recovery from addictions is impossible because emotional problems are
          denied.
        </p>
        <p>
          Pride, like anger and fear, is still a defensive posture due to its
          intrinsic vulnerability that requires its positions to be guarded and
          defended. Pride is gratifying, yet a block to moving on to the solid
          ground of courage, which lies beyond fear and vulnerability.
        </p>
        <p>
          The self-esteem of pride rests on an inflated and exaggerated opinion
          rather than on reality. Thus, the ego searches for confirmation, which
          rests on the insecure premises of opinion.
        </p>
        <p>
          Pride is operationally serviceable as a transitory self-reward for
          successful accomplishment, but the error occurs when the ego assumes
          that it is the “me” being rewarded, rather than the behaviour itself.
          This leads to seeking the reward of admiration, by which actions
          become subservient to the goal of winning approval.
        </p>
        <p>
          This motivating pattern persists in most adults to varying degrees,
          but with progressive maturity, the pattern becomes internalised, and
          self-reward occurs by virtue of the authority of internalised parental
          figures and standards.
        </p>
        <p>
          Pride is often dependent on social image and its expressions via
          possessions, publicity, title, and wealth. Social status and its
          symbols motivate subcultures, which have their own intrinsic earmarks
          of success.
        </p>
        <p>
          Each subculture has its own ranking system and stratifications. These
          appear in nuances of roles and privileges, as well as responsibilities
          and expectations, with consequent rewards and obligations as a result
          of complex system motivators. Values can automatically accrue to
          certain activities and qualities, such as education, personality
          traits, and styles of behaviour and speech.
        </p>
        <p>
          The social pressure of subcultures is quite strong and often
          determines the content of internalised behavioural patterns that
          define success or failure—and affect pride, self-esteem, and perceived
          social value.
        </p>
        <p>
          The same behavioural style that leads to approval or success in one
          subculture may spell failure and rejection in another. “When in Rome,
          do as the Romans do.”
        </p>
      </div>
    </div>
  );
};

export default Pride;
