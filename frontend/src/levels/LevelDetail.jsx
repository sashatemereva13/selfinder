import { Link, Navigate, useParams } from "react-router-dom";
import { getLevelBySlug } from "./levelsContent";
import "./levels.css";

// Minimal inline-bold support so content can use **text** without a markdown
// dependency — only `Neutrality` currently relies on it.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

export default function LevelDetail() {
  const { slug } = useParams();
  const level = getLevelBySlug(slug);

  if (!level) return <Navigate to="/levels" replace />;

  const themeClass = `level-theme-${level.slug}`;

  return (
    <div>
      <Link to="/levels" className={`backButton ${themeClass}`}>
        Back
      </Link>
      <div className={`aLevelContainer ${themeClass}`}>
        <h1>{level.title}</h1>
        {level.frame && <p className="aLevelFrame">{level.frame}</p>}

        {level.signals && (
          <dl className="aLevelSignals">
            {level.signals.map((signal) => (
              <div className="aLevelSignal" key={signal.label}>
                <dt>{signal.label}</dt>
                <dd>{renderInline(signal.value)}</dd>
              </div>
            ))}
          </dl>
        )}

        {level.sections
          ? level.sections.map((section) => (
              <section className="aLevelSection" key={section.heading}>
                <h3>{section.heading}</h3>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{renderInline(paragraph)}</p>
                ))}
              </section>
            ))
          : level.paragraphs?.map((paragraph, index) => (
              <p key={index}>{renderInline(paragraph)}</p>
            ))}
      </div>
    </div>
  );
}
