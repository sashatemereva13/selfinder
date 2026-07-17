import "./DiamondChart.css";

export default function DiamondChart({ points }) {
  const size = 280;
  const center = size / 2;
  const maxRadius = size / 2 - 18;
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
      {plotted.map((dot) => (
        <circle
          key={dot.key}
          className="diamondChartDot"
          cx={dot.x}
          cy={dot.y}
          r="6"
          style={{ "--dot-rgb": dot.colorRgb }}
        />
      ))}
    </svg>
  );
}
