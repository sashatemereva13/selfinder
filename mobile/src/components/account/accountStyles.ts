import { StyleSheet } from 'react-native';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export function makeStyles(colors: Colors) {
  return StyleSheet.create({
  // No card — space and the kicker label do the separating, same register
  // as every other screen. This is the largest section on the page (login
  // form or the full logged-in account panel), so its internal
  // subsections (historySection, dataSection) still use a thin top border
  // to separate from each other — consistent with how Depths uses
  // sectionDivider, a line rather than a box.
  section: { gap: spacing[3] },
  cardKicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  cardCopy: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  modeRow: { flexDirection: 'row', gap: spacing[5] },
  modeText: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.base,
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    paddingHorizontal: spacing[4],
  },
  // Same visual field as .input (same border/background/radius/height) —
  // the TextInput and the toggle sit inside it as a row instead of .input
  // drawing its own border around just the text field.
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.base,
    paddingRight: spacing[4],
  },
  passwordInputField: {
    flex: 1,
    minHeight: 44,
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    paddingHorizontal: spacing[4],
  },
  passwordToggle: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
  },
  consentBlock: { gap: spacing[2] },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  consentRowText: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  consentLinkText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginLeft: 18 + spacing[3], // aligns under consentRowText, past the checkbox
  },
  errorText: { color: colors.accent.ivory, fontFamily: fonts.light, fontSize: fontSizes.sm },
  noticeText: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  forgotLink: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  submitButton: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
    backgroundColor: colors.accent.buttonFill,
  },
  submitButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.base },
  signedInAs: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.base },
  consentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  consentToggleLabelCol: { flex: 1, gap: spacing[1] },
  consentToggleLabel: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  consentStatus: {
    color: colors.text.faint,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
  },
  // Filled, not outlined — matches submitButton's convention for the one
  // other real action in this file; an outlined pill was the odd one out.
  consentToggleButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
  },
  consentToggleButtonText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  consentTimestamp: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs, marginTop: -spacing[1] },
  consentDescription: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    marginTop: -spacing[1],
  },
  dataSection: {
    gap: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
  },
  dataKicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  dataRow: { gap: spacing[2] },
  dangerRow: { gap: spacing[2], paddingTop: spacing[1] },
  dataRowText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  // No border — weight (medium) and the accent-ish secondary tone carry
  // the affordance, same register as action rows elsewhere in the app
  // rather than an outlined-pill convention this file was the only user of.
  dataButton: { alignSelf: 'flex-start', paddingVertical: spacing[2] },
  dataButtonText: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  dangerButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.danger,
  },
  // Without this, a disabled Pressable renders pixel-identical to an
  // enabled one (RN's disabled prop blocks onPress but changes nothing
  // visually by default) — the confirm-delete button looked fully
  // pressable while actually inert, with no way to tell why taps did
  // nothing (2026-08-14 bug report).
  dangerButtonDisabled: { opacity: 0.4 },
  dangerButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  deleteConfirmBlock: { gap: spacing[3] },
  deleteConfirmRow: { flexDirection: 'row', gap: spacing[3] },
  signOutButton: { alignItems: 'center', paddingTop: spacing[3] },
  signOutText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  });
}
