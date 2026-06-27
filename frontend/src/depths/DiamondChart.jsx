import { useNavigate } from "react-router-dom";
import "./DiamondChart.css";

// Plots an arbitrary set of facets evenly around a center point — at 4
// points this draws a diamond, which is the shape the rest of the app's
// copy uses as the metaphor for "many sides, all at once." Each point is
// { key, label, pct (0-1), levelName, route, colorRgb ("r,g,b") }. Named
// level only, no percentage — a number out of 100 implies 100% is the goal,
// which isn't the point here. Each named facet is also the only durable way
// back to a level's full page: the Measure flow's own breakdown screen only
// ever shows once, but this chart lives on Depths, which is reachable anytime.
export default function DiamondChart({ points, showLevels = false }) {
  const navigate = useNavigate();
  const size = 280;
  const center = size / 2;
  const maxRadius = size / 2 - 46;
  const total = points.length;
  const angleFor = (index) => ((2 * Math.PI) / total) * index - Math.PI / 2;

  const plotted = points.map((point, index) => {
    const pct = Math.min(1, Math.max(0, point.pct));
    const radius = maxRadius * pct;
    const angle = angleFor(index);
    return {
      ...point,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  const labelPoints = points.map((point, index) => {
    const angle = angleFor(index);
    return {
      ...point,
      x: center + (maxRadius + 22) * Math.cos(angle),
      y: center + (maxRadius + 22) * Math.sin(angle),
    };
  });

  const guide = points
    .map((_, index) => {
      const angle = angleFor(index);
      return `${center + maxRadius * Math.cos(angle)},${center + maxRadius * Math.sin(angle)}`;
    })
    .join(" ");

  const polygon = plotted.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      className="diamondChart"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Your facets plotted as a diamond"
    >
      <polygon className="diamondChartGuide" points={guide} />
      <polygon className="diamondChartShape" points={polygon} />
      {points.map((point, index) => {
        const dot = plotted[index];
        const label = labelPoints[index];
        const isLinked = showLevels && point.levelName && point.route;

        const facet = (
          <>
            <circle
              className="diamondChartDot"
              cx={dot.x}
              cy={dot.y}
              r="6"
              style={{ "--dot-rgb": point.colorRgb }}
            />
            <text
              className="diamondChartLabel"
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <tspan x={label.x}>{point.label}</tspan>
              {showLevels && point.levelName && (
                <tspan
                  x={label.x}
                  dy="1.2em"
                  className="diamondChartLevel"
                  style={{ "--dot-rgb": point.colorRgb }}
                >
                  {point.levelName}
                </tspan>
              )}
            </text>
          </>
        );

        if (!isLinked) {
          return <g key={point.key}>{facet}</g>;
        }

        return (
          <g
            key={point.key}
            className="diamondChartFacet is-linked"
            role="link"
            tabIndex={0}
            aria-label={`Read about ${point.levelName}`}
            onClick={() => navigate(point.route)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(point.route);
              }
            }}
          >
            {facet}
          </g>
        );
      })}
    </svg>
  );
}
