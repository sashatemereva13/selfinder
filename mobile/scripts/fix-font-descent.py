#!/usr/bin/env python3
"""
Fixes a real font-metrics bug in Etude-Noire-Medium.ttf (the app's only
loaded typeface — see src/theme/typography.ts, both `fonts.light` and
`fonts.medium` map to this one file): the font declares
OS/2.sTypoDescender = -435 and hhea.descent = -428, but several glyphs'
actual outlines extend to yMin = -650 — a ~215-222 unit shortfall (about
1.7pt at a 16pt size, proportionally more at larger sizes).

OS/2.fsSelection has the USE_TYPO_METRICS bit set, which tells renderers
that honor it (confirmed: iOS/CoreText) to size line boxes from
sTypoAscender/sTypoDescender rather than usWinAscent/usWinDescent. Since
the declared typo descender is shallower than the real glyph depth, iOS
clips the bottom of any glyph whose descender goes deeper than the
declared value — which is exactly y, g, and j (all yMin -650), matching
the "letters look cut off at the bottom, only on iPhone" report. Other
renderers (confirmed: Android) apparently fall back to a metric or
default padding generous enough to avoid the clip, which is why this
was never visible there.

This patches the metrics (not the artwork/outlines) to genuinely cover
the deepest real glyph in the font, with a small safety margin, in all
three places a renderer might read descent from — so it can't matter
which one a given platform picks.

Run from mobile/: python3 scripts/fix-font-descent.py
"""
from fontTools.ttLib import TTFont
from pathlib import Path

FONT_PATH = Path(__file__).resolve().parents[1] / "assets/fonts/Etude-Noire-Medium.ttf"
SAFETY_MARGIN = 20  # font units, on top of the deepest real glyph — a little headroom, not just an exact fit

def deepest_glyph_y_min(font):
    glyf = font["glyf"]
    min_y = 0
    for name in glyf.keys():
        g = glyf[name]
        if not hasattr(g, "yMin"):
            continue
        try:
            if g.yMin < min_y:
                min_y = g.yMin
        except Exception:
            # Composite/space glyphs with no direct yMin — skip, they
            # can't be deeper than a real outline glyph anyway.
            continue
    return min_y

def main():
    font = TTFont(str(FONT_PATH))
    real_min_y = deepest_glyph_y_min(font)
    new_descent = real_min_y - SAFETY_MARGIN

    os2 = font["OS/2"]
    hhea = font["hhea"]

    print(f"Deepest real glyph yMin: {real_min_y}")
    print(f"Before — OS/2.sTypoDescender: {os2.sTypoDescender}, hhea.descent: {hhea.descent}, OS/2.usWinDescent: {os2.usWinDescent}")

    os2.sTypoDescender = new_descent
    hhea.descent = new_descent
    # usWinDescent is stored as a positive magnitude, not signed.
    os2.usWinDescent = abs(new_descent)

    print(f"After  — OS/2.sTypoDescender: {os2.sTypoDescender}, hhea.descent: {hhea.descent}, OS/2.usWinDescent: {os2.usWinDescent}")

    font.save(str(FONT_PATH))
    print(f"Saved {FONT_PATH}")

if __name__ == "__main__":
    main()
