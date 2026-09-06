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
    },
    // 2026-09-01 — the fixed-zone half of the new fixed/scroll split (see
    // this screen's own render comment). Never scrolls: the kicker,
    // PhilosopherPresence, the reading's quote, and DepthsSpiralCore's own
    // canvas (aura + sphere dots + wheel) all live here, permanently on
    // screen. A plain View, not a ScrollView — height comes from its own
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
      // A thin line marking the fixed/scroll seam — signals "this part
      // scrolls" without a generic scroll-indicator widget or a fade at
      // the edge (the user explicitly didn't want a fade: the curve
      // itself visibly continues from the scrollable menu up into the
      // aura's own body, "the source of energy," and a fade would read
      // as cutting that connection rather than just marking a boundary
      // it passes through). Same colors.bg.border stroke already used
      // for the wheel's own ring outline (VibrationSpectrum.tsx) — one
      // shared thin-line register, not a new one. Deliberately NOT a
      // gradient/fade — a flat 1px line the curve crosses over, same as
      // any other line it crosses on its way down.
      borderBottomWidth: 1,
      borderBottomColor: colors.bg.border,
    },
    // The independently-scrollable bottom zone — DepthsSpiralMenu's own
    // canvas (action points + top loop), then the timestamp/explore-map/
    // wish rows, discovery nudge, and Feeling Lucky. flex:1 so it fills
    // whatever vertical space fixedZone doesn't claim, and scrolls its own
    // content independently of fixedZone above it.
    scrollZone: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[12],
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
    arrivalSkipWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      top: CORE_GEOMETRY.groundY - AURA_METRICS.height,
      height: AURA_METRICS.height,
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
    // DepthsSpiralMenu's own wrapper — the first thing in scrollZone's
    // content, sized to MENU_GEOMETRY exactly so the seam-continuity math
    // (see MENU_GEOMETRY's own chestY comment) holds: no extra
    // margin/padding above this View, so it renders flush against
    // auraCoreWrap's own bottom edge at scroll position 0.
    menuWrap: {
      width: MENU_GEOMETRY.width,
      height: MENU_GEOMETRY.height,
      alignSelf: "center",
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
    sectionDivider: {
      height: 1,
      backgroundColor: colors.bg.border,
      marginTop: spacing[10],
      marginBottom: spacing[8],
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
    // to-edge. A plain, static percentage (tuned by the user directly to
    // 45%) — no per-render computation, no dependency on wheel size/
    // position.
    quoteBubbleWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "45%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    // Deliberately not styled as a heading — this is the philosopher speaking,
    // a reflection to read, not a screen title to scan. Lighter weight and
    // smaller size than a real title (see lastReadingLabel/kicker above it)
    // keeps it quiet and personal rather than declarative — a large bold
    // headline here read as closer to a verdict than a reflection.
    // 2026-09-03 — was fontSizes.sm (14px). Shrunk one more step (the user's
    // own framing: "the quote doesn't need to be bold and the font size can
    // be smaller") to free real horizontal room in the quote's own column —
    // this is part of making space for the reading's date to sit in the gap
    // between the quote and the wheel, without narrowing the column itself
    // (a real column-width cut was the other option considered, but this
    // reads as gentler: same words fit in less width at a smaller size,
    // rather than the same size wrapping onto more lines in a tighter box).
    title: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * lineHeights.normal,
      marginTop: spacing[2],
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
    // Still used by discoveryNudge/the wide menu rows below the spiral. position:
    // relative so bottomEnergyWrap (below) can break out to the full
    // screen width rather than being clipped to content's own padding.
    stack: { position: "relative" },
    // Breaks out of content's paddingHorizontal (spacing[6]) the same way
    // PhilosopherPresence's own energyWrap does at the top of the page —
    // the spirals should span the full device width, not just luckyWrap's
    // own narrow column.
    bottomEnergyWrap: {
      position: "relative",
      left: -spacing[6],
      width: SCREEN_WIDTH,
      marginTop: spacing[6],
    },
    discoveryNudge: {
      alignItems: "center",
      paddingVertical: spacing[3],
      marginBottom: spacing[4],
    },
    discoveryNudgeText: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: "center",
    },
    // 2026-09-03 — the closing line after sectionDivider. faint, not
    // muted — quieter than discoveryNudgeText above (which is a real,
    // occasionally-tappable row) since this is pure stillness, nothing to
    // act on. Generous paddingVertical gives it real presence as an
    // ending rather than reading as one more compressed row.
    closingLine: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontStyle: "italic",
      fontSize: fontSizes.sm,
      textAlign: "center",
      paddingVertical: spacing[6],
    },
    // The unified action-menu row style, in normal document flow below the
    // spiral (2026-09-02) — Explore the map / Feeling lucky both use this.
    // Left-aligned and same label/description size relationship the old
    // centered luckyLabel/luckyDescription used (base/sm), just re-aligned
    // to match the curve's own action rows (Stay with it/etc.) rather than
    // reading as a smaller, centered footer — the deliberate "same weight,
    // second group" hierarchy this pass introduced (see this block's own
    // header comment above).
    wideMenuRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[4],
      paddingVertical: spacing[3],
    },
    // Text column — was the row's own direct children before the row
    // became flexDirection:'row' to make space for DepthsMenuSymbol at the
    // trailing edge (2026-09-02); wrapping label+description in their own
    // flexed column keeps them left-aligned and lets the icon claim a
    // fixed slot on the right without the text stretching to fill it.
    wideMenuText: {
      flex: 1,
    },
    wideMenuLabel: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
    },
    wideMenuDescription: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      marginTop: spacing[1],
    },
  });
}
