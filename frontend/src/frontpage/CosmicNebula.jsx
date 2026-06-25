// A fixed multi-hue painterly nebula sitting behind the threshold canvas —
// CSS-only blurred radial blobs (screen-blended over the dark void), no
// WebGL/GPU cost. Independent of which philosopher is chosen — the ball and
// wordmark carry that theming; this is the room's own atmosphere. No pink in
// the palette by design.
const NEBULA_BLOBS = [
  { rgb: "126, 92, 214", top: "-12%", left: "-14%", size: "55vmax", blur: "90px", opacity: 0.5, duration: "42s", dx: "26px", dy: "-14px" },
  { rgb: "224, 138, 56", top: "-18%", left: "52%", size: "52vmax", blur: "90px", opacity: 0.42, duration: "48s", dx: "-22px", dy: "16px", delay: "-8s" },
  { rgb: "64, 140, 224", top: "32%", left: "38%", size: "58vmax", blur: "100px", opacity: 0.4, duration: "54s", dx: "-18px", dy: "-20px", delay: "-20s" },
  { rgb: "226, 178, 76", top: "62%", left: "4%", size: "30vmax", blur: "70px", opacity: 0.28, duration: "38s", dx: "14px", dy: "-10px", delay: "-6s" },
];

export default function CosmicNebula() {
  return (
    <div className="nebulaField" aria-hidden="true">
      {NEBULA_BLOBS.map((blob, i) => (
        <span
          key={i}
          className="nebulaBlob"
          style={{
            "--blob-rgb": blob.rgb,
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            "--blob-blur": blob.blur,
            "--blob-opacity": blob.opacity,
            "--blob-duration": blob.duration,
            "--blob-delay": blob.delay || "0s",
            "--blob-dx": blob.dx,
            "--blob-dy": blob.dy,
          }}
        />
      ))}
    </div>
  );
}
