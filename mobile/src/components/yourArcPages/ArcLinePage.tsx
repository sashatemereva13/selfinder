import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useThemeColors } from "../../theme/useThemeColors";
import type { Colors } from "../../theme/colors";
import { fonts, fontSizes, lineHeights } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { TimeCone } from "../TimeCone";

interface ArcLinePageProps {
  arcLine: string | null;
  onJumpToPresent: () => void;
  onJumpToPast: () => void;
  onJumpToFuture: () => void;
}

// Your Arc's opening page (2026-08-22: previously Cover, above the
// kaleidoscope — now the pager's first page since Cover and the time cone
// both spun out into Center, see RULES.md's Product/positioning section).
// Deliberately the quietest page in the whole pager, opening onto Facts
// (dense: stat rows, past-readings list) with a breath first rather than
// launching straight into the densest content.
//
// 2026-09-05: the opening line's own three clauses ("here is where you
// are... how you've told it... what's calling you forward") are a real
// present/past/future structure the rest of the pager already follows —
// but "where you are" had no destination at all (Your Arc's own pages
// only ever cover the record and the wish; a reading itself lives only on
// Depths, per RULES.md's "one reading, one screen" rule). The quote
// becomes the present zone's own content rather than a separate
// description row: when a real arcLine exists it's already a
// philosopher's live reflection on the current reading, generated fresh
// each visit — genuinely stronger "where you are" content than a generic
// sentence could be. It still gets the same label treatment as the two
// rows below (so all three read as one deliberate index, not a quote plus
// an unrelated list), and tapping it goes to Depths, the reading's one
// real home, rather than repeating it here. Past/future stay as their own
// rows, each jumping into this same pager rather than duplicating that
// content here — this is navigation, not a second copy of the record or
// the wish.
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
// list, letting the shape and the copy agree rather than sitting side by
// side making the same claim twice.
export function ArcLinePage({
  arcLine,
  onJumpToPresent,
  onJumpToPast,
  onJumpToFuture,
}: ArcLinePageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Wider/taller than TimeConePage's own 260×338 preview — this is the
  // page's whole background, not an inline illustration alongside text,
  // so it's sized off the real viewport (capped so it doesn't blow out on
  // a tablet-width screen) rather than a fixed constant.
  const coneWidth = Math.min(width * 0.75, 300);
  const coneHeight = coneWidth * 1.3;
  // The eternal-now plane extends past the cone's own width (see
  // TimeCone's PLANE_RX_RATIO) — canvasWidth gives it that room; capped
  // at the real viewport width so it never causes horizontal overflow on
  // a narrow screen.
  const planeCanvasWidth = Math.min(coneWidth * 1.4, width);

  return (
    <ScrollView contentContainerStyle={styles.arcLinePageContent}>
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
          height={coneHeight}
          canvasWidth={planeCanvasWidth}
          pastPoints={[]}
          futurePoints={[]}
          hideNowLabel
          showEternalNowPlane
          curvedLabels={{
            future: t("yourArc.zoneFutureLabel"),
            past: t("yourArc.zonePastLabel"),
            plane: t("yourArc.zonePresentLabel"),
          }}
        />
      </View>
      <View style={[styles.zoneStack, { height: coneHeight }]}>
        {/* Absolutely positioned within zoneStack (not part of its own
            space-between flow) — padding alone (the old futureZone/
            pastZone paddingTop/paddingBottom) can never go negative, so
            it bottoms out with these rows sitting flush against
            zoneStack's own top/bottom edge and no further. top/bottom
            here CAN go negative, which is the only way to actually push
            future higher (past the cone's top rim) and past lower (past
            the cone's bottom rim) than that. */}
        <Pressable
          style={[styles.futureZone, { top: -spacing[6] }]}
          onPress={onJumpToFuture}
        >
          <Text style={styles.zoneDescription}>
            {t("yourArc.zoneFutureDescription")}
          </Text>
        </Pressable>
        <Pressable onPress={onJumpToPresent} style={styles.presentZone}>
          <Text
            style={styles.coverPhilosopherLine}
          >{`"${arcLine ?? t("yourArc.coneFramingLine")}"`}</Text>
        </Pressable>
        <Pressable
          style={[styles.pastZone, { bottom: -spacing[6] }]}
          onPress={onJumpToPast}
        >
          <Text style={styles.zoneDescription}>
            {t("yourArc.zonePastDescription")}
          </Text>
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
    // top/bottom set inline per-render (see the JSX) since they carry a
    // negative offset — position:absolute + full width so the row still
    // centers its own text via alignItems, matching how it looked
    // sitting in zoneStack's normal flow before this change.
    futureZone: { position: "absolute", top: 0, width: "100%", alignItems: "center" },
    pastZone: { position: "absolute", bottom: 0, width: "100%", alignItems: "center" },
    // Philosopher voice — no fontStyle: 'italic' (a silent no-op on this
    // typeface); quote marks in the string carry the "this is spoken"
    // signal instead of a slant that was never rendering.
    //
    // 2026-08-29: bumped from sm/secondary (the same weight every other
    // page uses for plain body text) to base/primary — this line is the
    // entire content of the page, not an aside, so it should read as this
    // page's headline even though the page stays visually quiet overall
    // (no kicker, generous whitespace) per its own opening-breath role.
    presentZone: { alignItems: "center" },
    coverPhilosopherLine: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      textAlign: "center",
    },
    // Full-weight destinations (present/past/future), matching RULES.md's
    // "a next step some users are meant to genuinely adopt gets full row
    // weight" rule the same way Depths' "Talk about it" row does. Each
    // one's own KICKER label is now curved directly onto the cone
    // (TimeCone's curvedLabels) rather than duplicated here as flat text
    // right next to it — this description is the only text left in this
    // layer.
    zoneDescription: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * lineHeights.normal,
      textAlign: "center",
    },
  });
}
