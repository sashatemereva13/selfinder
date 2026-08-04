# Selfinder Atlas of Consciousness

A reusable Three.js laboratory for making Selfinder's static posts and vertical reels. It renders every vibration from the same `FieldDefinition` contract, so the visual language stays coherent while the physics changes.

## Start

```bash
cd atlas
npm install
npm run dev
```

Open `?field=fear`, `?field=acceptance`, etc. Use the browser's device toolbar at **1080 × 1920** for reels/stories or **1080 × 1350** for portrait posts. The canvas uses `preserveDrawingBuffer`, so a clean still can be captured without changing the scene.

For the production discovery composition, use
`?field=acceptance&format=reel&cut=discovery`.
This hides laboratory controls, locks the stage to 9:16 when viewed in a wider
window, moves copy into the Instagram-safe area, and derives animation from the
selected cut's seamless loop phase. Capture at exactly **1080 × 1920**.

Reel cuts:

- `cut=discovery` — 7 seconds; immediate phenomenon, delayed body/title/question.
- `cut=atlas` — 12 seconds; the full contemplative composition.
- `cut=pure` — 6 seconds; no explanatory text, only the visual loop and mark.

Use the `TIMED REEL` button for a discovery preview with a 0–7 second clock
and progress line. Click the clock to restart from frame zero. Remove `timed=1`
from the URL before capture.

## Lossless frame export

Export a production MP4 without screen recording:

```bash
npm run export -- --field joy --cut discovery
npm run export -- --field joy --cut all
```

The exporter renders every frame deterministically at 1080 × 1920 and 30 fps,
then encodes H.264 with FFmpeg at CRF 15. `all` creates discovery (7 seconds),
atlas (12 seconds), and pure (6 seconds) clips in `atlas/exports/`. Google
Chrome or Brave and FFmpeg must be installed. Temporary PNG frames are deleted
after each successful encode.

The reel layout reserves the rightmost ~20% for Instagram's action rail and the
bottom ~18% for the account name, caption, audio, and navigation overlays. The
observer sits around 37% frame height; copy stays in the left 66% above the
metadata zone. Treat those reserved edges as expendable fractal space.
Press `G` in Reel mode (or add `&guides=1`) to preview these obstruction zones;
press `G` again before recording.

## Architecture

- `src/types.ts` — the canonical 16-parameter DNA contract. Add a property only when it has a visible consequence.
- `src/fields.ts` — the 17 vibration definitions and their observation lines.
- `src/engine.ts` — generic renderer. It must not contain vibration names or special cases.
- `src/main.ts` — laboratory controls and quiet measurement overlay.
- `src/auraFigureSvg.ts` — the mobile aura SVG geometry used as an in-scene texture.
- `PHYSICS.md` — rendering law and authoring checklist.
- `CONTENT.md` — an Instagram format and publishing system.

The first implementation is intentionally an instrument, not a final campaign. Its job is to make the rules testable. Each next iteration should improve a generic behavior (field lines, materials, particle forces, camera, export), then express levels through definitions.
