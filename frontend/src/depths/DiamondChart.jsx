import "./DiamondChart.css";

// Plots an arbitrary set of facets evenly around a center point — at 4
// points this draws a diamond, which is the shape the rest of the app's
// copy uses as the metaphor for "many sides, all at once." Each point is
// { key, label, pct (0-1), colorRgb ("r,g,b") }.
export default function DiamondChart({ points }) {
  const size = 220;
  const center = size / 2;
  const maxRadius = size / 2 - 30;
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
      x: center + (maxRadius + 18) * Math.cos(angle),
      y: center + (maxRadius + 18) * Math.sin(angle),
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
      {plotted.map((p) => (
        <circle
          key={p.key}
          className="diamondChartDot"
          cx={p.x}
          cy={p.y}
          r="5"
          style={{ "--dot-rgb": p.colorRgb }}
        />
      ))}
      {labelPoints.map((p) => (
        <text
          key={p.key}
          className="diamondChartLabel"
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
