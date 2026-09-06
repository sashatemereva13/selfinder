import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { View, Text, TextInput, Pressable, Share, Linking } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { fonts } from '../../theme/typography';
import { useLocaleStore } from '../../store/localeStore';
import { getMe, grantConsent, withdrawConsent, exportMyData, deleteAccount, updateEmail } from '../../api/user';
import { changePassword as changePasswordApi } from '../../api/auth';
import { AuthSession, UserProfile } from '../../types';
import { PRIVACY_POLICY_URL } from '../../utils/privacyPolicy';
import { PasswordInput } from './PasswordInput';
import { makeStyles } from './accountStyles';

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

export function LoggedInAccount({
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
