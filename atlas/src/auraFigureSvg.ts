// DOM-SVG counterpart of mobile/src/components/AuraFigure.tsx. Keep the
// primitive coordinates and filter values synchronized with that component.
function rng(seed = 4127) {
  let value = seed;
  return () => ((value = Math.imul(value ^ (value >>> 15), 1 | value) + 0x6d2b79f5 | 0) >>> 0) / 4294967296;
}

function auraDots() {
  const random = rng();
  const zones = [[100,42,32,36,55],[100,145,96,116,120],[100,260,56,130,90]];
  return zones.flatMap(([cx,cy,rx,ry,count]) => Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const outward = .78 + random() * .52;
    const x = cx + Math.cos(angle) * rx * outward;
    const y = cy + Math.sin(angle) * ry * outward;
    const radius = .35 + random() * .85;
    const opacity = .12 + random() * .52;
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="var(--field)" opacity="${opacity.toFixed(2)}"/>`;
  })).join("");
}

const primitives = `
  <circle cx="100" cy="40" r="23"/><rect x="86" y="54" width="28" height="44" rx="13"/>
  <ellipse cx="100" cy="148" rx="32" ry="52"/>
  <polygon points="78,88 58,96 46,192 62,196"/><polygon points="122,88 142,96 154,192 138,196"/>
  <polygon points="93,196 74,199 66,320 88,324"/><polygon points="107,196 126,199 134,320 112,324"/>
  <circle cx="53" cy="193" r="13"/><circle cx="147" cy="193" r="13"/>
  <ellipse cx="75" cy="330" rx="17" ry="10"/><ellipse cx="125" cy="330" rx="17" ry="10"/>`;

export function auraFigureSvg(color = "#efe3cf", lineOnly = true) {
  const renderedBody = lineOnly
    ? `<g fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${primitives}</g>`
    : `<g filter="url(#atlas-soft)" opacity=".85"><g filter="url(#atlas-goo)" fill="${color}" stroke="${color}" stroke-width="15" stroke-linejoin="round">${primitives}</g></g>
       <g fill="${color}" stroke="${color}" stroke-width="8" stroke-linejoin="round">${primitives}</g>
       <g filter="url(#atlas-goo)" fill="${color}" stroke="${color}" stroke-width="8" stroke-linejoin="round">${primitives}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="840" viewBox="-20 -30 240 420" aria-label="Observed aura figure" role="img">
    <defs>
      <filter id="atlas-goo" x="-40%" y="-20%" width="180%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/>
        <feComposite in="goo" in2="goo" operator="atop"/>
      </filter>
      <filter id="atlas-soft" x="-60%" y="-40%" width="220%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>
      <radialGradient id="atlas-core"><stop offset="0" stop-color="#fff9ef" stop-opacity=".95"/><stop offset=".35" stop-color="#fff9ef" stop-opacity=".65"/><stop offset=".7" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>
    </defs>
    ${renderedBody}
    <path d="M79 90 Q65 108 68 130" fill="none" stroke="${color}" stroke-opacity=".42" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M121 90 Q135 108 132 130" fill="none" stroke="${color}" stroke-opacity=".42" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="100" cy="148" r="25" fill="url(#atlas-core)" opacity=".7"/>
    <circle cx="100" cy="148" r="7" fill="#fff9ef" opacity=".82"/>
    <g opacity=".55">${auraDots()}</g>
  </svg>`.replaceAll("var(--field)", color);
}
