import { Link } from "react-router-dom";
import "./levels.css";
import Reveal from "../utils/Reveal";

const Desire = () => {
  return (
    <div className="levelPage">
      <Link to="/levels" className="backButton level-theme-desire">
        Back
      </Link>
      <div className="aLevelContainer level-theme-desire">
        <h1>Desire</h1>
        <div className="levelContent">
          <Reveal>
            <p>
              Desire motivates vast areas of human activity, including the
              economy. Advertisers play on desires to program us with needs
              linked to instinctual drives. It is linked to jealousy and greed.
            </p>
          </Reveal>

          <Reveal>
            <p>
              Desire moves us to expend great effort to achieve goals or obtain
              rewards. The desire for money, prestige, or power runs the lives
              of many of those who have risen above fear as their predominant
              life motive.
            </p>
          </Reveal>

          <Reveal>
            <p>
              The desire for power and control over others is a common
              expression of this level of consciousness.
            </p>
          </Reveal>

          <Reveal>
            <p>
              Desire is also the level of addictions, wherein desire becomes a
              craving more important than life itself. The victims of desire may
              actually be unaware of the basis of their motives.
            </p>
          </Reveal>

          <Reveal>
            <p>
              The desire for sexual approval has produced the huge cosmetics and
              fashion industries that extol glamour and allure.
            </p>
          </Reveal>

          <Reveal>
            <p>
              Desire has to do with acquisition and accumulation, but
              satisfaction of one desire is merely replaced by the unsatisfied
              desire for something else, so the acquisition is endless.
            </p>
          </Reveal>
          <p>
            The consequence of a life of endless pursuit and anxiety about the
            acquisition of externalised, artificial sources of satisfaction is
            increased exposure to fear of loss.
          </p>
          <p>
            Cravings can be continuous due to a failure of the internal
            satisfaction mechanism, by which there never seems to be enough, and
            acquisition becomes a lifestyle of endless pursuit.
          </p>
          <p>
            Social craving is often compensatory to self-doubt and low
            self-esteem. Social expressions of needing and wanting may attach to
            external concepts, political positions, and the need to control
            others for the sought-after feelings of importance and public
            attention.
          </p>
          <p>
            The basic problem with this level of consciousness is the inner
            feeling of lack that results in chronic dissatisfaction. The ego
            becomes infatuated with its own projections of attractiveness onto
            external objects, without recognising the value of what it already
            possesses.
          </p>
          <p>
            The ego's inner anxiety about fulfillment of its projected needs
            leads to an insatiable greed for power and control over others that
            emerges, in its most expanded form, as a desire to dominate the
            entire world.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Desire;
