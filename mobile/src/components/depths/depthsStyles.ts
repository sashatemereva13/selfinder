import { StyleSheet } from "react-native";
import { type Colors } from "../../theme/colors";
import { fonts, fontSizes, letterSpacings, lineHeights } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { AURA_NEUTRAL_COLOR } from "../shared/AuraFigure";
import { SCREEN_WIDTH, BLEED_AMOUNT_PX, type DepthsGeometry } from "./depthsGeometry";

export function makeStyles(colors: Colors, geometry: DepthsGeometry) {
  const CORE_GEOMETRY = geometry.core;
  const MENU_GEOMETRY = geometry.menu;
  const AURA_METRICS = geometry.auraMetrics;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
      // The reading sits on the minimap, not floating above it: any height
      // the fixed zone doesn't need goes above it (2026-10-09 — removing
      // the "DEPTHS" kicker had freed height that reappeared as a gap
      // between the aura's ground and the minimap).
      justifyContent: "flex-end",
    },
    // 2026-09-01 — the fixed-zone half of the new fixed/scroll split (see
    // this screen's own render comment). Never scrolls: the kicker, the
    // reading's quote, DepthsSpiralCore's own canvas (aura + sphere dots +
    // wheel), and PhilosopherSeam all live here, permanently on screen. A plain View, not a ScrollView — height comes from its own
    // content (the quote's text height plus CORE_GEOMETRY.totalHeight),
    // same as any normal flex column.
    fixedZone: {
      paddingHorizontal: spacing[6],
      // 2026-09-02 — overflow:hidden so the spiral's own deliberate top
      // bleed (auraCoreWrap's own negative marginTop, BLEED_AMOUNT_PX)
      // actually crops at this zone's own visible top edge instead of
      // just rendering past it uncropped (RN's own default is
      // overflow:visible). Scoped to fixedZone specifically, not root —
      // root also contains scrollZone/the tab bar below, which must never
      // be clipped by this.
      overflow: "hidden",
      // (The thin line that used to mark the fixed/scroll seam here was
      // removed 2026-09-26 along with the scrolling menu below it — there
      // is no scroll left to signal, and the thread's curve now runs on
      // unbroken from the aura into the art below.)
    },
    // The independently-scrollable bottom zone — DepthsSpiralMenu's own
    // canvas (action points + top loop), then the timestamp/explore-map/
    // wish rows, discovery nudge, and Feeling Lucky. flex:1 so it fills
    // whatever vertical space fixedZone doesn't claim, and scrolls its own
    // content independently of fixedZone above it.
    scrollZone: {
      flex: 1,
    },
    // Below the reading — takes no height of its own now (see root).
    lowerZone: {
      position: "relative",
    },
    // Absolutely fills the same area ringWrap occupies (see ringWrap's own
    // `top` computed from groundY) rather than sizing itself from normal
    // flow — ringWrap is itself absolutely positioned now (the aura sits at
    // the base of a much taller composition, not centered in it), so
    // without this the Pressable's own hit area would collapse to nothing.
    // Sized to the AURA IMAGE's own height (not the ring's — the ring is
    // now a small flat ellipse anchored at the feet, always smaller than
    // the standing figure it surrounds), with its BOTTOM edge — not its
    // center — pinned to groundY, so the aura's own feet land on the
    // ground the ring/cone are also built from, and the figure stands
    // normally above that line rather than being bisected by it.
    // 2026-09-12 — width narrowed from full-canvas (left:0, right:0) to
    // AURA_METRICS.width, centered. This Pressable is now also a real tap
    // target (Option A: tapping the aura clears a selected sphere, see
    // depths/index.tsx's own comment on arrivalSkipWrap) and it renders
    // AFTER spiralOverlay, on top of it in z-order — at full canvas width
    // it silently stole taps from Body/Spirit's own dots/labels, which
    // sit closest to the aura's own vertical band (see labelLayout's own
    // AURA_BODY_TOP/BOTTOM push-away logic in DepthsSpiralCore.tsx).
    // Confirmed as a real, reported bug: tapping Body or Spirit while
    // another sphere was already selected (the only time this Pressable
    // is pointerEvents:"auto") cleared the selection instead of
    // selecting the tapped sphere — the tap was landing on THIS layer,
    // not the dot underneath it. AURA_METRICS.width already includes the
    // figure's own side padding for its blur/glow (see AuraFigure.tsx's
    // PAD_SIDE), so this is still generous, just no longer wider than
    // the actual figure. `left` is computed explicitly (not alignSelf:
    // "center") because this View is position:"absolute" — RN removes
    // absolutely-positioned children from flex layout entirely, so
    // alignSelf has no effect on them; centering an absolute child inside
    // a wider absolute parent needs a real computed offset.
    arrivalSkipWrap: {
      position: "absolute",
      top: CORE_GEOMETRY.groundY - AURA_METRICS.height,
      left: (CORE_GEOMETRY.width - AURA_METRICS.width) / 2,
      height: AURA_METRICS.height,
      width: AURA_METRICS.width,
      alignItems: "center",
    },
    // Pre-reading branch's own equivalent of arrivalSkipWrap/ringWrap — no
    // AuraArrival/AnimatedAuraField here (nothing to animate in before a
    // first reading exists), just AuraWithDots pinned to the same groundY
    // so both branches' aura lands at the identical point the spiral's own
    // base ellipse is built from.
    groundWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      top: CORE_GEOMETRY.groundY - AURA_METRICS.height,
      height: AURA_METRICS.height,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    // Shared positioning parent for both branches' aura + DepthsSpiralCore's
    // own canvas overlay — sized to that canvas exactly (CORE_GEOMETRY, not
    // the old full-height DEPTHS_COMPOSITION_GEOMETRY) so spiralOverlay
    // (below) can center within it and land on the exact same point the
    // aura itself is centered on, by construction rather than measurement.
    // Renamed from auraSpiralWrap (2026-09-01) — now specifically the
    // CORE canvas's own wrapper, distinct from DepthsSpiralMenu's own
    // menuWrap further down in the scroll zone.
    // 2026-09-03 — the quote and this canvas now sit in the SAME row (see
    // this screen's own render comment above the quote), so the top margin
    // that used to live on auraCoreWrap itself (below) moved up to the row
    // wrapper instead — it was always "breathing room above this whole
    // block," not something specific to the canvas, and a row's own two
    // children need to share one top edge, not each carry their own
    // separate offset. flexDirection: 'row' with a flexed quote column on
    // the left and this canvas anchored full-width on the right — width
    // stays the full canvas width (still needs room for both sphere-label
    // sides), only its starting Y moved up to align with the quote's own
    // top instead of stacking below it.
    readingRow: {
      position: "relative",
      marginTop: spacing[2],
    },
    auraCoreWrap: {
      width: CORE_GEOMETRY.width,
      height: CORE_GEOMETRY.totalHeight,
      // 2026-09-02 — shifts the WHOLE canvas (curve + wheel + aura) up by
      // BLEED_AMOUNT_PX so that amount of its own topmost region (the
      // wheel/curve, since nothing else in this canvas extends that high)
      // renders past fixedZone's own visible top edge and gets cropped
      // there (fixedZone now has overflow:'hidden', see its own comment) —
      // the deliberate "energy extends beyond the app" effect, at the
      // user's own request. quoteBubbleWrap (the sibling absolutely
      // positioned over readingRow, top:0) is UNAFFECTED by this — it's
      // not in the same flow position, so it stays exactly where it is;
      // only this canvas moves. Paired with the onLayout measurement fix
      // above (naturalContentHeight subtracts this same amount) so the
      // shrink-to-fit mechanism doesn't fight this by shrinking everything
      // else to compensate.
      marginTop: -BLEED_AMOUNT_PX,
      // Negative — auraCoreWrap's own height reserves the full CORE canvas
      // (CORE_GEOMETRY.totalHeight), but nothing ever renders below the
      // aura's own feet (groundY) — no h<0 content exists — so everything
      // from groundY down to the canvas's own bottom edge is genuinely
      // empty, reclaimable space, not visible content this margin could
      // clip. Was -spacing[10] (partial reclaim, tuned pre-split when the
      // canvas held the WHOLE h∈[0,H_MAX] curve and this space was cheap to
      // leave alone); widened to reclaim the full empty span
      // (2026-09-01, fixed/scroll split) because fixedZone can no longer
      // scroll — every pixel of true dead space left in its own canvas is
      // now permanently-visible screen real estate taken away from
      // scrollZone below, confirmed on-device (an 844pt-tall viewport left
      // scrollZone with under 30px of visible height without this).
      marginBottom: -(CORE_GEOMETRY.totalHeight - CORE_GEOMETRY.groundY - 5),
    },
    // Fills the whole tall wrapper — DepthsSpiralCore's own width/height
    // match this exactly, so its base ellipse lands at
    // CORE_GEOMETRY.groundY by construction, not by measuring this View. No
    // alignItems/justifyContent centering here (unlike the old flat/square
    // version): the cone is NOT vertically centered in this box, it rises
    // from the bottom, so centering would float it wrong.
    spiralOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    entryFade: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg.base,
    },
    kickerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    kicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: "uppercase",
    },
    // Relocated here (2026-08-28) from beside the top kicker, where it was
    // sitting in the same corner ProfileIcon now occupies. Still chrome —
    // same faint weight as before, just under the sphere buttons instead of
    // up top, in a part of the screen nothing else claims.
    // 2026-09-03 — was centered, full device width, its own line directly
    // above readingRow (a real cost: a whole line height of vertical space
    // for a short faint date, confirmed as visible "extra empty space" on
    // real device). Now sits inside quoteBubbleWrap itself, above the
    // quote text, in the same left-aligned column — no more marginTop
    // (readingRow's own marginTop already provides the gap above this
    // whole block; a second top margin here would just re-add space back).
    readingTimestamp: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    // A sentence, styled like one — warm ivory (AURA_NEUTRAL_COLOR, the same
    // tone onboarding uses for "you feel" / "is an experience" before any
    // reading gives the app its accent color) rather than colors.text's
    // lavender-tinted gray, so this line reads as continuous with the first
    // screens instead of the app's generic UI-chrome color.
    lastReadingLabel: {
      color: AURA_NEUTRAL_COLOR,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[2],
    },
    // Absolutely positioned over the ring (ringWrap's own center), not laid
    // out beside it — the figure sits INSIDE the ring, not next to it.
    auraWrap: { alignItems: "center", marginVertical: spacing[8] },
    // Only applied when layered over ringWrap's ring — see AuraWithDots'
    // `overlay` prop. Fills and centers within the nearest positioned
    // ancestor rather than relying on inherited flex centering from
    // whatever wraps it — AuraArrival nests this inside extra Animated.View
    // layers for the arrival animation, none of which set alignItems, so a
    // bare `position: absolute` (no top/left/right/bottom) previously left
    // it pinned to its flex-computed position in an unpositioned ancestor
    // instead of centered, which is what put the aura in the wrong place.
    auraWrapOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // The animated body wrapper AuraArrival scales/fades/rotates as a whole —
    // fills and centers over the ring the same way auraWrapOverlay does, so
    // its own children (the neutral/settled aura layers) have a positioning
    // context to resolve against.
    auraArrivalBody: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // Stacks the settled (level-colored) aura directly on top of the neutral
    // one during arrival, both filling/centering over auraArrivalBody, so
    // crossfading their opacity reads as one figure changing color rather
    // than two figures swapping places.
    auraArrivalLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // 2026-09-02 — a flat left-side column again, not full-width and not
    // derived from the wheel's own exact geometry (that fragile
    // wheelLeftEdge/quoteColumnWidth math was removed once the wheel
    // stopped sharing horizontal space with the quote at all — see the
    // wheel's own bleed, DepthsSpiralCore.tsx's wheelPos comment). Full-
    // width read wrong regardless of the wheel not overlapping it — the
    // user's own request: the quote should stay confined to the screen's
    // LEFT side so it reads as its own contained block, not sprawl edge-
    // to-edge. A plain, static percentage — no per-render computation, no
    // dependency on wheel size/position.
    // 2026-09-12 — widened from 45% to 58%, at the user's own request: a
    // long combinationMessage was visibly truncating ("...") against
    // title's own numberOfLines cap below. The wheel bleeds off-canvas at
    // top-right and never actually occupies this column's own top-left
    // region (confirmed via DepthsSpiralCore's wheelPos comment — only
    // its bottom-left quarter is visible, well clear of this width even
    // at 58%), so there was real unclaimed horizontal space between the
    // quote and the wheel to give back here without the two ever
    // colliding or the wheel needing to shrink.
    quoteBubbleWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "68%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    // Deliberately not styled as a heading — this is the philosopher speaking,
    // a reflection to read, not a screen title to scan. Lighter weight than
    // a real title (see lastReadingLabel/kicker above it) keeps it quiet and
    // personal rather than declarative — a large bold headline here read as
    // closer to a verdict than a reflection.
    // 2026-09-03 — was fontSizes.sm (14px). Shrunk one more step (the user's
    // own framing: "the quote doesn't need to be bold and the font size can
    // be smaller") to free real horizontal room in the quote's own column —
    // this is part of making space for the reading's date to sit in the gap
    // between the quote and the wheel, without narrowing the column itself
    // (a real column-width cut was the other option considered, but this
    // reads as gentler: same words fit in less width at a smaller size,
    // rather than the same size wrapping onto more lines in a tighter box).
    // 2026-09-12 — bumped to fontSizes.sm (14px) earlier the same session,
    // after a size-hierarchy review found this had drifted into a real
    // inversion: the quote (the philosopher's own reflection about THIS
    // reading — arguably the single most important piece of content on the
    // screen) had ended up tied for the SMALLEST text anywhere on Depths,
    // identical to a sphere point's data label and an action-menu row's own
    // label, while a generic "Explore the map" row (wideMenuLabel below)
    // sat a full tier above it at fontSizes.base (16px).
    // That fix overshot, per the user's own direct feedback minutes later
    // on-device: "the quote is overpowering the aura-body." Landed here at
    // 12 — a deliberately chosen intermediate value (no existing token
    // between xs=11 and sm=14), splitting the difference between "tied for
    // smallest text on the page" (the original bug) and "now the loudest
    // thing in front of the aura" (this fix's own overcorrection). Kept
    // fonts.light — the actual overpowering was about SIZE, not weight.
    // NOT paired with narrowing quoteBubbleWrap's own 68% column back down
    // — a narrower column at a given font size means MORE lines (taller
    // block), which risks re-triggering the real Mind-label collision the
    // 68% width was specifically widened to fix, and a taller block likely
    // reads as MORE dominant regardless of width. Dropping the font size
    // alone shrinks the block on every axis at once. numberOfLines (see
    // depths/index.tsx's own render-site comment) may need re-verifying at
    // this size — smaller text needs FEWER lines for the same sentence, so
    // the existing cap is a safe upper bound, not to be raised further.
    // 2026-10-08 — the reflection read as shrunk: small text squeezed into
    // a narrow column with empty sky beneath it. Now the philosopher's
    // voice weight (thin — it reads quieter than Medium at the same size,
    // which is what lets it grow without overpowering the figure again),
    // larger, and allowed up to 10 lines flowing down into that sky, the
    // aura itself having moved lower.
    title: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * 1.45,
      marginTop: spacing[2],
    },
    reflectionByline: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      marginTop: spacing[2],
    },
    reflectionName: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
    },
    reflectionWhen: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    // Today once the walk is done: the session's before and after, and
    // what was done, in one plain sentence (2026-10-14).
    todaysShift: { alignItems: "flex-start", marginTop: spacing[4], gap: spacing[1] },
    todaysShiftLine: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
    },
    // Today's headline: the overall state's name, read first (2026-10-12).
    headline: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xl,
      lineHeight: fontSizes.xl * 1.15,
      marginBottom: spacing[2],
    },
    answerHint: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginTop: spacing[3],
    },
    // The ring (AuraField's rings) and the aura share this one center
    // point — ring renders first so the aura sits visually on top of/
    // inside it. `position: 'relative'` makes this the positioning context
    // the aura's `overlay` (position: 'absolute') resolves against —
    // AuraArrival nests the aura inside two extra Animated.View layers (for
    // the arrival animation) that carry no positioning of their own, so
    // without this the "nearest positioned ancestor" search skips straight
    // past ringWrap to whatever wraps it further up, landing the aura
    // somewhere else on the page entirely instead of centered on the ring.
    // Fills its parent (arrivalSkipWrap — sized/positioned so its own
    // BOTTOM edge lands at CORE_GEOMETRY.groundY) rather than centering
    // within the FULL tall auraCoreWrap (the old approach, which would
    // float the aura in the middle of the whole rising-cone composition
    // instead of at its base). justifyContent 'flex-end' (not
    // 'center') so the aura image's own bottom edge — its feet — lands
    // exactly on groundY, with the ring/cone's shared ground plane, rather
    // than the aura's geometric center landing there and bisecting the
    // figure.
    ringWrap: {
      position: "relative",
      width: "100%",
      height: AURA_METRICS.height,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    // Text column — was the row's own direct children before the row
    // became flexDirection:'row' to make space for DepthsMenuSymbol at the
    // trailing edge (2026-09-02); wrapping label+description in their own
    // flexed column keeps them left-aligned and lets the icon claim a
    // fixed slot on the right without the text stretching to fill it.
    wideMenuText: {
      flex: 1,
    },
  });
}
