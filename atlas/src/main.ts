import "./style.css";
import { ConsciousnessEngine } from "./engine";
import { fields, getField } from "./fields";

const app = document.querySelector<HTMLElement>("#app")!;
const params = new URLSearchParams(location.search);
const format = params.get("format") === "reel" ? "reel" : "lab";
const requestedCut = params.get("cut");
const cut = requestedCut === "atlas" || requestedCut === "pure" ? requestedCut : "discovery";
app.innerHTML = `
  <main class="atlas format-${format} cut-${cut}${params.get("guides") === "1" ? " show-guides" : ""}">
    <div class="viewport" aria-label="Consciousness field"></div>
    <div class="measure"><span>FIELD <b id="field-index">08</b></span><span>FORM <b id="fractal">JULIA</b></span><span>STABILITY <b id="stability">0.00</b></span><span>SIGNAL <b id="signal">0.00</b></span><button class="timed-toggle" type="button">TIMED REEL</button><button class="format-toggle" type="button">REEL PREVIEW</button></div>
    <section class="copy">
      <p class="kicker">ATLAS OF CONSCIOUSNESS · OBSERVATION</p>
      <div class="field-identity"><h1></h1><span class="identity-line" aria-hidden="true"><i></i><i></i></span></div>
      <p class="question"></p>
    </section>
    <nav><label for="field">FIELD DEFINITION</label><select id="field">${fields.map((f) => `<option value="${f.id}">${String(f.score).padStart(3, "0")} · ${f.name}</option>`).join("")}</select></nav>
    <div class="mark">SELFINDER</div>
    <div class="reel-guides" aria-hidden="true"><span class="guide-actions">ACTIONS</span><span class="guide-meta">ACCOUNT · CAPTION · AUDIO</span></div>
    <button class="preview-clock" type="button" aria-label="Restart timed preview"><b>0.0</b><span></span></button>
  </main>`;

const viewport = document.querySelector<HTMLElement>(".viewport")!;
const select = document.querySelector<HTMLSelectElement>("#field")!;
const initialId = params.get("field") ?? "courage";
select.value = initialId;
let current = getField(initialId);
const offline = params.get("export") === "1";
const engine = new ConsciousnessEngine(viewport, current, format, cut, offline);

function renderCopy() {
  document.querySelector("h1")!.textContent = current.name;
  document.querySelector(".question")!.textContent = current.observation;
  document.querySelector("#stability")!.textContent = current.spatialCoherence.toFixed(2);
  document.querySelector("#signal")!.textContent = current.informationFlow.toFixed(2);
  document.querySelector("#field-index")!.textContent = String(fields.indexOf(current) + 1).padStart(2, "0");
  document.querySelector("#fractal")!.textContent = current.shaderBehavior.fractal.toUpperCase();
  document.documentElement.style.setProperty("--field", current.color);
}
select.addEventListener("change", () => {
  current = getField(select.value);
  engine.setDefinition(current);
  history.replaceState(null, "", `?field=${current.id}${format === "reel" ? `&format=reel&cut=${cut}` : ""}`);
  renderCopy();
});
renderCopy();

declare global {
  interface Window { __SELFINDER_RENDER_FRAME__?: (seconds: number) => Promise<void>; }
}
window.__SELFINDER_RENDER_FRAME__ = async (seconds: number) => {
  engine.renderAt(seconds);
  for (const animation of document.getAnimations()) {
    animation.pause();
    animation.currentTime = seconds * 1000;
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

function toggleReelMode() {
  const next = new URLSearchParams(location.search);
  next.set("field", current.id);
  if (next.get("format") === "reel") { next.delete("format"); next.delete("guides"); }
  else { next.set("format", "reel"); next.set("cut", "discovery"); }
  location.search = next.toString();
}

document.querySelector<HTMLButtonElement>(".format-toggle")!.addEventListener("click", toggleReelMode);
document.querySelector<HTMLButtonElement>(".timed-toggle")!.addEventListener("click", () => {
  const next = new URLSearchParams(location.search);
  next.set("field", current.id); next.set("format", "reel"); next.set("cut", "discovery"); next.set("timed", "1");
  location.search = next.toString();
});
document.querySelector<HTMLButtonElement>(".preview-clock")!.addEventListener("click", () => location.reload());
if (params.get("timed") === "1") {
  const clock = document.querySelector<HTMLElement>(".preview-clock")!;
  clock.classList.add("visible");
  const started = performance.now();
  const updateClock = () => {
    const elapsed = ((performance.now() - started) / 1000) % 7;
    clock.querySelector("b")!.textContent = elapsed.toFixed(1);
    clock.style.setProperty("--preview-progress", `${elapsed / 7 * 100}%`);
    requestAnimationFrame(updateClock);
  };
  updateClock();
}
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && !event.altKey) toggleReelMode();
  if (event.key.toLowerCase() === "g" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const next = new URLSearchParams(location.search);
    next.set("field", current.id);
    next.set("format", "reel");
    if (params.get("guides") === "1") next.delete("guides"); else next.set("guides", "1");
    location.search = next.toString();
  }
});
