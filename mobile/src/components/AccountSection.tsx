import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { View, Text, TextInput, Pressable, ActivityIndicator, Share, Linking, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';
import { useLocaleStore } from '../store/localeStore';
import { getMe, grantConsent, withdrawConsent, exportMyData, deleteAccount, updateEmail } from '../api/user';
import { changePassword as changePasswordApi, requestPasswordReset, resetPassword } from '../api/auth';
import { AuthSession, UserProfile } from '../types';
import { PRIVACY_POLICY_URL } from '../utils/privacyPolicy';

// Was hardcoded to 'en-GB' — meant every date rendered in British-English
// format regardless of the app's own language, the one date-formatting
// site in the app that didn't already defer to device/app locale
// automatically. Maps to a real BCP-47 tag per the current app locale.
const DATE_LOCALE_TAG: Record<'en' | 'ru', string> = { en: 'en-GB', ru: 'ru-RU' };

function formatDate(iso: string, locale: 'en' | 'ru') {
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE_TAG[locale], { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

// Every password field in this file (login/register, forgot-password reset,
// change-password's current+new) shares this — a plain text toggle rather
// than an eye icon, matching the app's existing register of plain-text
// controls (no icon library is used anywhere else in the app). The input
// itself carries no border/background of its own; the wrapping View owns
// both so the toggle sits inside the same visual field as a normal
// TextInput, not beside a second, separately-boxed control.
function PasswordInput({
  value,
  onChangeText,
  placeholder,
  editable = true,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.passwordInputWrap}>
      <TextInput
        style={styles.passwordInputField}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={!visible}
        editable={editable}
      />
      <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
        <Text style={styles.passwordToggle}>
          {visible ? t('account.hidePassword') : t('account.showPassword')}
        </Text>
      </Pressable>
    </View>
  );
}

export function AccountSection() {
  const session = useAuthStore((s) => s.session);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);

  if (session) {
    return <LoggedInAccount session={session} onLogout={logout} />;
  }
  return <AuthForm onLogin={login} onRegister={register} />;
}

function AuthForm({
  onLogin,
  onRegister,
}: {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, privacyPolicyAccepted: boolean, email?: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-request' | 'forgot-reset'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!username.trim() || !password) return;

    if (mode === 'register' && !accepted) {
      setError(t('account.acceptPrivacyPolicy'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password, accepted, email.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(username.trim());
      setNotice(t('account.forgotRequestSent'));
      setMode('forgot-reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async () => {
    if (!code.trim() || !newPassword) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(username.trim(), code.trim(), newPassword);
      setNotice(t('account.passwordResetDone'));
      setMode('login');
      setPassword('');
      setCode('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const goToForgot = () => { setMode('forgot-request'); setError(null); setNotice(null); };
  const backToLogin = () => { setMode('login'); setError(null); setNotice(null); setCode(''); setNewPassword(''); };

  if (mode === 'forgot-request' || mode === 'forgot-reset') {
    return (
      <View style={styles.section}>
        <Text style={styles.cardKicker}>{t('account.kicker')}</Text>
        <Text style={styles.cardCopy}>
          {mode === 'forgot-request' ? t('account.forgotRequestCopy') : t('account.forgotResetCopy')}
        </Text>

        {notice && <Text style={styles.noticeText}>{notice}</Text>}

        {mode === 'forgot-request' ? (
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t('account.usernamePlaceholder')}
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder={t('account.resetCodePlaceholder')}
              placeholderTextColor={colors.text.muted}
              keyboardType="number-pad"
            />
            <PasswordInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('account.newPasswordPlaceholder')}
            />
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[
            styles.submitButton,
            {
              opacity:
                loading ||
                (mode === 'forgot-request' ? !username.trim() : !code.trim() || !newPassword)
                  ? 0.5
                  : 1,
            },
          ]}
          onPress={mode === 'forgot-request' ? handleForgotRequest : handleForgotReset}
          disabled={loading || (mode === 'forgot-request' ? !username.trim() : !code.trim() || !newPassword)}
        >
          {loading ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'forgot-request' ? t('account.sendCode') : t('account.resetPassword')}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={backToLogin}>
          <Text style={styles.forgotLink}>{t('account.backToSignIn')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.cardKicker}>{t('account.kicker')}</Text>
      <Text style={styles.cardCopy}>{t('account.createAccountCopy')}</Text>

      <View style={styles.modeRow}>
        <Pressable onPress={() => { setMode('login'); setError(null); }}>
          <Text style={[styles.modeText, mode === 'login' && { color: colors.text.primary }]}>{t('account.logIn')}</Text>
        </Pressable>
        <Pressable onPress={() => { setMode('register'); setError(null); }}>
          <Text style={[styles.modeText, mode === 'register' && { color: colors.text.primary }]}>
            {t('account.createAccount')}
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder={t('account.usernamePlaceholder')}
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <PasswordInput
        value={password}
        onChangeText={setPassword}
        placeholder={t('account.passwordPlaceholder')}
      />
      {/* Shown before submitting, not just after a rejected request — the
          8-character minimum is enforced server-side (register, same as
          change/reset password), this is just letting someone know the
          requirement upfront. */}
      {mode === 'register' && <Text style={styles.cardCopy}>{t('account.passwordMinLengthHint')}</Text>}

      {mode === 'register' && (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('account.emailPlaceholder')}
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <Text style={styles.cardCopy}>{t('account.emailHelperCopy')}</Text>
        </>
      )}

      {mode === 'register' && (
        <View style={styles.consentBlock}>
          <Pressable style={styles.consentRow} onPress={() => setAccepted((a) => !a)}>
            <View style={[styles.checkbox, accepted && { backgroundColor: colors.accent.ivory, borderColor: colors.accent.ivory }]} />
            <Text style={styles.consentRowText}>{t('account.acceptPrivacyPolicyLabel')}</Text>
          </Pressable>
          {/* A real, tappable link to what's actually being accepted — the
              checkbox label alone used to promise "the privacy policy"
              with no way to reach it from the app. Its own Pressable, not
              nested inside the checkbox's, so tapping the link doesn't
              also toggle acceptance. */}
          <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.consentLinkText}>{t('account.readPrivacyPolicy')}</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        style={[styles.submitButton, { opacity: loading || !username.trim() || !password ? 0.5 : 1 }]}
        onPress={handleSubmit}
        disabled={loading || !username.trim() || !password}
      >
        {loading ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.submitButtonText}>{mode === 'login' ? t('account.logIn') : t('account.createAccount')}</Text>
        )}
      </Pressable>

      {mode === 'login' && (
        <Pressable onPress={goToForgot}>
          <Text style={styles.forgotLink}>{t('account.forgotPassword')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function LoggedInAccount({
  session,
  onLogout,
}: {
  session: AuthSession;
  onLogout: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [consentBusy, setConsentBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const consentGiven = profile?.consent?.psychologicalData?.given ?? false;
  const consentTimestamp = profile?.consent?.psychologicalData?.timestamp;

  const refreshProfile = async () => {
    setLoadingProfile(true);
    try {
      const p = await getMe(session.token);
      setProfile(p);
      if (p.email) setEmailInput(p.email);
    } catch {
      // best-effort
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [session.token]);

  const toggleConsent = async () => {
    setConsentBusy(true);
    try {
      if (consentGiven) await withdrawConsent(session.token);
      else await grantConsent(session.token);
      await refreshProfile();
    } catch {
      // best-effort
    } finally {
      setConsentBusy(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailBusy(true);
    setEmailMsg(null);
    setEmailError(null);
    try {
      await updateEmail(session.token, emailInput.trim());
      await refreshProfile();
      setEmailMsg(t('account.emailSaved'));
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : t('account.failedToUpdateEmail'));
    } finally {
      setEmailBusy(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordBusy(true);
    setPasswordMsg(null);
    setPasswordError(null);
    try {
      await changePasswordApi(session.token, currentPassword, newPassword);
      setPasswordMsg(t('account.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('account.failedToChangePassword'));
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportMyData(session.token);
      await Share.share({
        title: `selfinder-data-${session.username}.json`,
        message: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      // Was a fixed generic string regardless of what actually failed —
      // every other handler in this file already surfaces err.message
      // directly (client.ts now throws specific, actionable messages for
      // a timeout vs. a connection failure vs. a real server error; see
      // its own REQUEST_TIMEOUT_MS comment). This was the one outlier.
      setExportError(err instanceof Error ? err.message : t('account.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== session.username) {
      setDeleteError(t('account.usernameDoesNotMatch'));
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(session.token);
      await onLogout();
    } catch {
      setDeleteError(t('account.deletionFailed'));
      setDeleting(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.cardKicker}>{t('account.kicker')}</Text>
      <Text style={styles.signedInAs}>{t('account.signedInAs', { username: session.username })}</Text>

      <View style={styles.consentToggleRow}>
        <View style={styles.consentToggleLabelCol}>
          <Text style={styles.consentToggleLabel}>{t('account.saveReadingsToAccount')}</Text>
          {/* The button below says what TAPPING does ("Turn on"/"Turn
              off") — it used to just say the current state ("On"/"Off"),
              which on a plain pill read as an instruction to press
              ("Off" looked like a button that turns things off, when the
              opposite was true: it meant saving was ALREADY off and
              tapping would turn it on). Without a separate status word,
              changing the button to an action label alone would leave
              nothing on screen stating the CURRENT state for a
              first-time visitor (consentTimestamp, which does state it,
              only exists after the toggle's been touched once) — this
              line is that missing, always-visible status. */}
          <Text style={[styles.consentStatus, consentGiven && { color: colors.accent.buttonFill }]}>
            {consentBusy ? '…' : consentGiven ? t('account.consentStatusOn') : t('account.consentStatusOff')}
          </Text>
        </View>
        <Pressable
          style={[styles.consentToggleButton, consentGiven && { backgroundColor: colors.accent.buttonFill }]}
          onPress={toggleConsent}
          disabled={consentBusy || loadingProfile}
        >
          <Text style={[styles.consentToggleButtonText, consentGiven && { color: colors.onAccent }]}>
            {consentBusy ? '…' : consentGiven ? t('account.consentOn') : t('account.consentOff')}
          </Text>
        </Pressable>
      </View>
      {/* This one toggle actually gates several things (readings, Guide
          conversations saved via flushPendingSave, kept Spill entries) —
          previously only the label above named readings specifically,
          leaving Guide's own silent best-effort save (see
          guideChatStore.ts) with no explanation anywhere in the app of
          what turns it on. */}
      <Text style={styles.consentDescription}>{t('account.saveDataDescription')}</Text>
      {consentTimestamp && (
        <Text style={styles.consentTimestamp}>
          {consentGiven ? t('account.consentGranted') : t('account.consentWithdrawn')} {formatDate(consentTimestamp, locale)}
        </Text>
      )}

      <View style={styles.dataSection}>
        <Text style={styles.dataKicker}>{t('account.accountSecurity')}</Text>

        <View style={styles.dataRow}>
          <Text style={styles.dataRowText}>
            {profile?.email ? t('account.emailUsedForReset') : t('account.emailAddHelper')}
          </Text>
          <TextInput
            style={styles.input}
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder={t('account.emailPlaceholderExample')}
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!emailBusy}
          />
          <Pressable style={styles.dataButton} onPress={handleUpdateEmail} disabled={emailBusy || !emailInput.trim()}>
            <Text style={styles.dataButtonText}>{emailBusy ? '…' : profile?.email ? t('account.update') : t('account.save')}</Text>
          </Pressable>
        </View>
        {emailMsg && <Text style={styles.noticeText}>{emailMsg}</Text>}
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <View style={styles.dataRow}>
          <Text style={styles.dataRowText}>{t('account.changePasswordCopy')}</Text>
          <PasswordInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('account.currentPasswordPlaceholder')}
            editable={!passwordBusy}
          />
          <PasswordInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('account.newPasswordPlaceholder')}
            editable={!passwordBusy}
          />
          <Pressable
            style={styles.dataButton}
            onPress={handleChangePassword}
            disabled={passwordBusy || !currentPassword || !newPassword}
          >
            <Text style={styles.dataButtonText}>{passwordBusy ? '…' : t('account.changePassword')}</Text>
          </Pressable>
        </View>
        {passwordMsg && <Text style={styles.noticeText}>{passwordMsg}</Text>}
        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
      </View>

      <View style={styles.dataSection}>
        <Text style={styles.dataKicker}>{t('account.dataAndPrivacy')}</Text>

        {/* The real policy, reachable from the one section someone would
            actually check when wondering what Selfinder does with their
            data — same URL as the registration checkbox's own link. */}
        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Text style={styles.dataRowText}>{t('account.readPrivacyPolicy')}</Text>
        </Pressable>

        <View style={styles.dataRow}>
          <Text style={styles.dataRowText}>
            {t('account.exportCopy')}
          </Text>
          <Pressable style={styles.dataButton} onPress={handleExport} disabled={exporting}>
            <Text style={styles.dataButtonText}>{exporting ? t('account.exportPreparing') : t('account.export')}</Text>
          </Pressable>
        </View>
        {/* Without this, a slow export (client.ts's own 15s timeout) left
            the button on a bare '…' with nothing telling the person
            whether it was working or stuck — same complaint that led to
            client.ts's timeout fix in the first place. */}
        {exporting && <Text style={styles.dataRowText}>{t('account.exportLoadingNote')}</Text>}
        {exportError && <Text style={styles.errorText}>{exportError}</Text>}

        <View style={styles.dangerRow}>
          <Text style={styles.dataRowText}>
            {t('account.deleteCopy')}
          </Text>
          {deleteStep === 0 && (
            <Pressable style={styles.dangerButton} onPress={() => setDeleteStep(1)}>
              <Text style={styles.dangerButtonText}>{t('account.delete')}</Text>
            </Pressable>
          )}
        </View>

        {deleteStep === 1 && (
          <View style={styles.deleteConfirmBlock}>
            <Text style={styles.dataRowText}>
              <Trans
                i18nKey="account.typeUsernameToConfirm"
                values={{ username: session.username }}
                components={{ 1: <Text style={{ fontFamily: fonts.medium }} /> }}
              />
            </Text>
            <TextInput
              style={styles.input}
              value={deleteConfirmText}
              onChangeText={(value) => { setDeleteConfirmText(value); setDeleteError(null); }}
              // Was session.username — showed the real username in grey,
              // indistinguishable at a glance from it already being typed
              // in (2026-08-14: user reported "Confirm delete" not
              // responding to any number of taps; root cause was the
              // field looking pre-filled while deleteConfirmText was
              // actually still '', so the disabled check below was
              // correctly blocking every tap with no visible sign why).
              // A generic instruction can't be mistaken for real content.
              placeholder={t('account.typeUsernamePlaceholder')}
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}
            <View style={styles.deleteConfirmRow}>
              <Pressable
                style={[styles.dangerButton, !deleteConfirmText && styles.dangerButtonDisabled]}
                onPress={handleDelete}
                disabled={!deleteConfirmText || deleting}
              >
                <Text style={styles.dangerButtonText}>{deleting ? '…' : t('account.confirmDelete')}</Text>
              </Pressable>
              <Pressable
                style={styles.dataButton}
                onPress={() => { setDeleteStep(0); setDeleteConfirmText(''); setDeleteError(null); }}
              >
                <Text style={styles.dataButtonText}>{t('account.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Pressable style={styles.signOutButton} onPress={onLogout}>
        <Text style={styles.signOutText}>{t('account.signOut')}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Colors) {
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
