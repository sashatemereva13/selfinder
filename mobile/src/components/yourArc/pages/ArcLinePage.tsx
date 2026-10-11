import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Ellipse as SvgEllipse } from "react-native-svg";
import { useThemeColors } from "../../../theme/useThemeColors";
import type { Colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useAppAccentTextRgb } from "../../../utils/appAccent";
import {
  TimeCone,
  TimeConePoint,
  buildTimeConeGeometry,
  CURVED_LABEL_PADDING,
  PLANE_RX_RATIO,
  PLANE_RY_RATIO,
} from "../TimeCone";

interface ArcLinePageProps {
  onJumpToPresent: () => void;
  onJumpToPast: () => void;
  onJumpToFuture: () => void;
  // The record on arrival (2026-10-09, docs/your-arc-concept.md §3) — the
  // person's real points in the cone, and the one the dial is on.
  pastPoints?: TimeConePoint[];
  futurePoints?: TimeConePoint[];
  focusedId?: string | null;
  focusRgb?: string;
  // The past and present ellipses stop being tap targets once the dial
  // moves through time — they stay drawn, as part of the image.
  pastAndPresentTappable?: boolean;
  // The height this page actually has (2026-10-09) — once Your Arc put
  // the moment's name and the dial under the cone, sizing from the
  // window's width alone made the cone taller than its space, clipped at
  // both ends. When given, the cone also fits this height.
  availableHeight?: number;
}

// Your Arc's opening page (2026-08-22: previously Cover, above the
// kaleidoscope — now the pager's first page since Cover and the time cone
// both spun out into Center, see RULES.md's Product/positioning section).
// Deliberately the quietest page in the whole pager, opening onto Facts
// (dense: stat rows, past-readings list) with a breath first rather than
// launching straight into the densest content.
//
// 2026-09-05: a since-superseded version of this page laid a philosopher
// quote (the present zone) and a short description line (future/past)
// directly over the cone shape, so all three zones read as "one
// deliberate index." 2026-09-12, at the user's own request: all of that
// free-floating text is gone — the cone's own curved labels (baked
// directly onto its geometry via TimeCone's curvedLabels prop below) are
// now the ONLY text on this page, so the shape speaks for itself instead
// of being captioned by copy layered on top of it. Each removed line's
// actual content didn't disappear, it moved to live at the start of
// whichever destination it was describing — see the zoneStack render
// below for exactly where each one landed (or deliberately didn't).
//
// The light cone (TimeCone.tsx) sits behind all three zones as pure
// ambient structure, not a second data visualization — rendered with
// EMPTY point arrays (no dots), scaled large and faded, the same
// "atmosphere behind content" role AmbientGlow plays everywhere else, not
// a diagram meant to be read or tapped directly (the three real tap
// targets are the Pressables layered on top of it). Its own geometry
// already says "future rises, past falls, they meet at now" — which is
// exactly this page's structure, so the zones are positioned at the
// cone's own future rim / vertex / past rim, rather than a plain vertical
// list, letting the shape carry the structure on its own.
export function ArcLinePage({
  onJumpToPresent,
  onJumpToPast,
  onJumpToFuture,
  pastPoints = [],
  futurePoints = [],
  focusedId,
  focusRgb,
  pastAndPresentTappable = true,
  availableHeight,
}: ArcLinePageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const accentTextRgb = useAppAccentTextRgb();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Wider/taller than TimeConePage's own 260×338 preview — this is the
  // page's whole background, not an inline illustration alongside text,
  // so it's sized off the real viewport (capped so it doesn't blow out on
  // a tablet-width screen) rather than a fixed constant.
  // The whole drawing is about coneWidth × 1.3 × 1.66 (the outermost
  // extra ring, see EXTRA_RINGS below) tall, plus room for the curved
  // labels and the zones' own ellipses — so when the available height is
  // known, the width is also capped by it.
  const fitHeightWidth = availableHeight
    ? (availableHeight - spacing[6] * 2 - 40) / (1.3 * 1.66)
    : Infinity;
  const coneWidth = Math.max(120, Math.min(width * 0.75, 300, fitHeightWidth));
  const coneHeight = coneWidth * 1.3;
  // 2026-09-12 — how many extra concentric rings TimeCone draws beyond
  // its own base rim (see that component's own extraRings prop comment).
  // TimeCone's `height` prop directly sets vertexY=height/2 and
  // coneHeight=height/2-baseRy-4 — since a ring now extends to
  // coneHeight×(1+EXTRA_RING_STEP×n) beyond the vertex, both the height
  // GIVEN to TimeCone and the width given to canvasWidth below need to
  // grow proportionally too, or the outermost ring clips against the
  // SVG's own fixed viewBox/canvas edges. Kept in sync with TimeCone's
  // own EXTRA_RING_STEP constant (0.22) — if that ever changes, this
  // ratio needs to change with it (confirmed via on-device screenshot
  // that mismatched values here clip the outermost ring).
  const EXTRA_RINGS = 3;
  const EXTRA_RING_STEP = 0.22;
  const outermostRingScale = 1 + EXTRA_RINGS * EXTRA_RING_STEP;
  const coneRenderHeight = coneHeight * outermostRingScale;
  // The eternal-now plane extends past the cone's own width (see
  // TimeCone's PLANE_RX_RATIO) — canvasWidth gives it that room; capped
  // at the real viewport width so it never causes horizontal overflow on
  // a narrow screen. Widened further by the same outermostRingScale so
  // the extra rings' own larger rx doesn't clip against this canvas
  // either.
  const planeCanvasWidth = Math.min(coneWidth * 1.4 * outermostRingScale, width);
  // 2026-09-12, at the user's own request — each zone's tap target is now
  // shaped and positioned to match the actual ellipse TimeCone draws for
  // it (same buildTimeConeGeometry/PLANE_*_RATIO math that component uses
  // internally), not a generic rectangle placed near it. "The whole
  // circle's inside should be tappable," not just a thin rim or an
  // unrelated box — so each zone below renders BOTH a highlighted stroke
  // ellipse (the interactive affordance this page previously had none of,
  // once the caption text was removed) and an invisibly-hit-tested View
  // shaped to the same ellipse via width/height + borderRadius:9999.
  const cone = useMemo(
    () => buildTimeConeGeometry(coneWidth, coneHeight),
    [coneWidth, coneHeight],
  );
  const futureRx = cone.baseRx;
  const futureRy = cone.baseRy;
  const pastRx = cone.baseRx;
  const pastRy = cone.baseRy;
  const planeRx = cone.baseRx * PLANE_RX_RATIO;
  const planeRy = cone.baseRy * PLANE_RY_RATIO;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.arcLinePageContent,
        // With a known height, the block is exactly as tall as the
        // drawing and centred in the space — the cone (anchored to the
        // block's top) and the zone ellipses (centred in it) only line up
        // when the block's height matches the drawing's.
        availableHeight !== undefined && {
          flexGrow: 0,
          height: coneRenderHeight + CURVED_LABEL_PADDING * 2,
          marginTop: Math.max(0, (availableHeight - coneRenderHeight - CURVED_LABEL_PADDING * 2) / 2),
        },
      ]}
    >
      {/* No explicit height here (was `height: coneHeight`) — TimeCone's
          own View is now taller than coneHeight by CURVED_LABEL_PADDING*2
          (see that component's own comment: curved labels' ascenders/
          descenders need headroom the bare cone geometry didn't reserve).
          coneBackdrop was always position:absolute with no explicit top
          (anchors to this ScrollView content's own top, at 0) rather than
          centered against zoneStack the way its own old comment assumed
          — confirmed live 2026-09-06 that offsetting it by
          -CURVED_LABEL_PADDING to "recenter" it just moved the whole
          cone up off its actual anchor point instead. Left unoffset: the
          extra height simply grows the box symmetrically around its
          existing anchored position, which is exactly the headroom the
          curved labels need with no other layout consequence. */}
      <View
        style={[styles.coneBackdrop, { width: planeCanvasWidth }]}
        pointerEvents="none"
      >
        <TimeCone
          width={coneWidth}
          height={coneRenderHeight}
          canvasWidth={planeCanvasWidth}
          pastPoints={pastPoints}
          futurePoints={futurePoints}
          focusedId={focusedId}
          focusRgb={focusRgb}
          hideNowLabel
          showEternalNowPlane
          extraRings={EXTRA_RINGS}
          curvedLabels={{
            future: t("yourArc.zoneFutureLabel"),
            past: t("yourArc.zonePastLabel"),
            plane: t("yourArc.zonePresentLabel"),
          }}
        />
      </View>
      <View style={[styles.zoneStack, { height: coneHeight }]}>
        {/* 2026-09-12, at the user's own request — the free-floating text
            that used to ride on top of the cone (the philosopher quote in
            the present zone, and a description line under each of
            future/past) is gone. The cone's own curved labels
            (curvedLabels above — "what's calling you forward"/"how
            you've told it"/"the eternal now," baked directly onto its
            geometry) are now the ONLY text on this page: the shape
            speaks for itself instead of being captioned by copy sitting
            over it. Each removed description's actual CONTENT didn't
            disappear — it moved to live at the start of the destination
            it was pointing to: "every reading, the shape of it..." is
            already TimeConePage's own coneIntroLine (your-arc-past.tsx,
            reached via the past zone below) — no new copy needed there,
            it already said this. "The wish you're holding..." has no
            equally natural home (your-arc-future's own first real page,
            WishCrossingPage, is a dense task screen, not an intro-style
            one) — deliberately NOT forcing manufactured intro copy onto
            it just to mirror the past side; an intentional asymmetry,
            not an oversight. The philosopher quote (arcLine) itself was
            later re-homed too (2026-09-13) — it now lives on FactsPage
            (your-arc-past.tsx's own first page), not duplicated here.
            2026-09-13 — tapping present now opens Center (the
            kaleidoscope), not Depths (see your-arc.tsx's own header
            comment for the full reasoning) — this vertex/"eternal now"
            reads as a better conceptual match for a fresh, generated
            reflection of the present moment than it ever did for a
            reading, which belongs to the historical record instead.
            2026-09-12, follow-up — removing that text left this page
            with literally no visual signal any of the three zones do
            anything (confirmed via the user's own on-device report).
            Fixed with two changes together: (1) each zone's hit area is
            now shaped/sized to match its own real ellipse (via
            buildTimeConeGeometry/PLANE_*_RATIO above), covering the
            WHOLE interior, not a thin rim or a generic rectangle
            somewhere nearby — RN can't hit-test a true ellipse, so this
            is a matching-aspect-ratio rectangle with borderRadius:9999,
            which reads visually as an ellipse and is close enough for a
            forgiving tap target; (2) a highlighted stroke ellipse
            (rendered as each Pressable's own Svg child) sits near, not
            exactly on, TimeCone's own plain wireframe rim underneath —
            confirmed on-device this reads as a deliberate layered
            "halo" effect (loosely the same register as Depths' own
            aggregate-marker halo, see VibrationSpectrum.tsx) rather than
            a misalignment bug, and the user explicitly chose to KEEP
            this offset rather than have it corrected to a pixel-exact
            overlay. Do not "fix" this alignment without checking with
            the user first — it looks imprecise but isn't accidental.
            2026-09-12, follow-up #2 — the highlight ellipse's own color
            was first colors.text.secondary (a plain gray), which the
            user correctly flagged as barely distinguishable from
            TimeCone's own ambient wireframe rings right next to it —
            "highlighted" in name only. Switched to the app's real accent
            color (useAppAccentTextRgb, the same "this is the one
            meaningfully different thing" signal Depths/every other
            screen already uses — see RULES.md's "one accent color"
            rule) at a real, standout opacity (0.85, not 0.5) and a
            slightly thicker stroke (1.5, not 1) so each zone genuinely
            reads as interactive against the cold-gray ambient structure
            around it, not just another faint line.
            2026-09-12, follow-up #3 — added a very faint accent-colored
            FILL (fillOpacity 0.08) inside each ellipse, at the user's own
            suggestion, confirmed on-device as an improvement. This is a
            deliberate, narrow exception to this page's/TimeCone's own
            wireframe-only convention (see TimeCone.tsx's own header
            comment — "no fill, matches AuraField/VibrationSpectrum's own
            standing convention") — kept faint enough that it reads as a
            soft area of light around the aura's own glow language, not
            as a bordered UI card (the "no cards" rule in aesthetic.md).
            If this component is ever reused somewhere the fill reads as
            too card-like, that's a signal to lower fillOpacity further,
            not to remove the affordance these follow-ups exist for. */}
        <Pressable
          style={[
            styles.futureZone,
            {
              top: -spacing[6] - futureRy,
              left: "50%",
              marginLeft: -futureRx,
              width: futureRx * 2,
              height: futureRy * 2,
              borderRadius: futureRy,
            },
          ]}
          onPress={onJumpToFuture}
          accessibilityRole="button"
          accessibilityLabel={t("yourArc.zoneFutureLabel")}
        >
          <Svg
            width={futureRx * 2}
            height={futureRy * 2}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <SvgEllipse
              cx={futureRx}
              cy={futureRy}
              rx={futureRx - 1}
              ry={futureRy - 1}
              fill={`rgb(${accentTextRgb})`}
              fillOpacity={0.08}
              stroke={`rgb(${accentTextRgb})`}
              strokeOpacity={0.85}
              strokeWidth={1.5}
            />
          </Svg>
        </Pressable>
        <Pressable
          disabled={!pastAndPresentTappable}
          onPress={onJumpToPresent}
          style={[
            styles.presentZone,
            {
              width: planeRx * 2,
              height: planeRy * 2,
              borderRadius: planeRy,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("yourArc.zonePresentLabel")}
        >
          <Svg
            width={planeRx * 2}
            height={planeRy * 2}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <SvgEllipse
              cx={planeRx}
              cy={planeRy}
              rx={planeRx - 1}
              ry={planeRy - 1}
              fill={`rgb(${accentTextRgb})`}
              fillOpacity={0.08}
              stroke={`rgb(${accentTextRgb})`}
              strokeOpacity={0.85}
              strokeWidth={1.5}
            />
          </Svg>
        </Pressable>
        <Pressable
          style={[
            styles.pastZone,
            {
              bottom: -spacing[6] - pastRy,
              left: "50%",
              marginLeft: -pastRx,
              width: pastRx * 2,
              height: pastRy * 2,
              borderRadius: pastRy,
            },
          ]}
          disabled={!pastAndPresentTappable}
          onPress={onJumpToPast}
          accessibilityRole="button"
          accessibilityLabel={t("yourArc.zonePastLabel")}
        >
          <Svg
            width={pastRx * 2}
            height={pastRy * 2}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <SvgEllipse
              cx={pastRx}
              cy={pastRy}
              rx={pastRx - 1}
              ry={pastRy - 1}
              fill={`rgb(${accentTextRgb})`}
              fillOpacity={0.08}
              stroke={`rgb(${accentTextRgb})`}
              strokeOpacity={0.85}
              strokeWidth={1.5}
            />
          </Svg>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    arcLinePageContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing[8],
    },
    // Centered behind zoneStack via absolute positioning + matched
    // width/height (both computed from the same coneWidth/coneHeight in
    // the component body) rather than a shared parent box, since the cone
    // needs to sit strictly behind the zone rows in paint order, not
    // interleaved with them by flex layout.
    //
    // 2026-09-05: no container-level opacity anymore — that dimmed the
    // eternal-now plane along with everything else, which fought the
    // "make the plane fully opaque" fix (a stroke-opacity of 1 inside a
    // 0.3-opacity container is still only ~0.3 effective). TimeCone's own
    // per-element opacities (rim ellipses at 0.3, the gradient-faded
    // slant lines, the plane now at a real 1) already carry the
    // "atmosphere behind content" quieting on their own — no need to
    // dim the whole backdrop uniformly on top of that.
    coneBackdrop: {
      position: "absolute",
      alignSelf: "center",
    },
    // Present (the quote) is the only child left in zoneStack's own
    // layout flow, centered by justifyContent/alignItems same as before.
    // future/past are now absolutely positioned against this container
    // instead (see their own styles below) — `relative` here is what
    // lets their top/bottom values resolve against zoneStack's own box
    // rather than the page's outer ScrollView.
    zoneStack: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    // top/left/width/height/borderRadius all set inline per-render now
    // (see the JSX) — sized/shaped/centered to match each zone's own real
    // ellipse geometry (buildTimeConeGeometry/PLANE_*_RATIO), not a fixed
    // constant. These are position:"absolute", so alignSelf/alignItems
    // have no effect on them (same lesson as Depths' own arrivalSkipWrap
    // fix this session) — `left` is computed explicitly per-render
    // instead. Only the positioning MODE lives here.
    futureZone: { position: "absolute" },
    pastZone: { position: "absolute" },
    presentZone: {},
  });
}
