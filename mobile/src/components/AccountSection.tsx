import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Share, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';
import { getMe, grantConsent, withdrawConsent, getMeasureHistory, exportMyData, deleteAccount, updateEmail } from '../api/user';
import { changePassword as changePasswordApi, requestPasswordReset, resetPassword } from '../api/auth';
import { AuthSession, UserProfile, SavedMeasureResult } from '../types';
import { track } from '../utils/analytics';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
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
      setError('Accept the privacy policy to create an account.');
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
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
      setNotice('If that account has an email on file, a reset code was sent to it.');
      setMode('forgot-reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
      setNotice('Password reset. Sign in with your new password.');
      setMode('login');
      setPassword('');
      setCode('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const goToForgot = () => { setMode('forgot-request'); setError(null); setNotice(null); };
  const backToLogin = () => { setMode('login'); setError(null); setNotice(null); setCode(''); setNewPassword(''); };

  if (mode === 'forgot-request' || mode === 'forgot-reset') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardKicker}>Account</Text>
        <Text style={styles.cardCopy}>
          {mode === 'forgot-request'
            ? "We'll email a code to the address on file, if you've added one."
            : 'Check your inbox for the 6-digit code.'}
        </Text>

        {notice && <Text style={styles.noticeText}>{notice}</Text>}

        {mode === 'forgot-request' ? (
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
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
              placeholder="Reset code"
              placeholderTextColor={colors.text.muted}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
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
            <ActivityIndicator color={colors.bg.base} />
          ) : (
            <Text style={styles.submitButtonText}>{mode === 'forgot-request' ? 'Send code' : 'Reset password'}</Text>
          )}
        </Pressable>

        <Pressable onPress={backToLogin}>
          <Text style={styles.forgotLink}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>Account</Text>
      <Text style={styles.cardCopy}>Create an account to save your readings across sessions.</Text>

      <View style={styles.modeRow}>
        <Pressable onPress={() => { setMode('login'); setError(null); }}>
          <Text style={[styles.modeText, mode === 'login' && { color: colors.text.primary }]}>Log in</Text>
        </Pressable>
        <Pressable onPress={() => { setMode('register'); setError(null); }}>
          <Text style={[styles.modeText, mode === 'register' && { color: colors.text.primary }]}>
            Create account
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.text.muted}
        secureTextEntry
      />

      {mode === 'register' && (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email (optional)"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <Text style={styles.cardCopy}>Used only so you can reset your password if you forget it.</Text>
        </>
      )}

      {mode === 'register' && (
        <Pressable style={styles.consentRow} onPress={() => setAccepted((a) => !a)}>
          <View style={[styles.checkbox, accepted && { backgroundColor: colors.brand.purple, borderColor: colors.brand.purple }]} />
          <Text style={styles.consentRowText}>I accept the privacy policy</Text>
        </Pressable>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        style={[styles.submitButton, { opacity: loading || !username.trim() || !password ? 0.5 : 1 }]}
        onPress={handleSubmit}
        disabled={loading || !username.trim() || !password}
      >
        {loading ? (
          <ActivityIndicator color={colors.bg.base} />
        ) : (
          <Text style={styles.submitButtonText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>
        )}
      </Pressable>

      {mode === 'login' && (
        <Pressable onPress={goToForgot}>
          <Text style={styles.forgotLink}>Forgot password?</Text>
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<SavedMeasureResult[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!consentGiven) return;
    setLoadingHistory(true);
    getMeasureHistory(session.token)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [consentGiven, session.token]);

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
      setEmailMsg('Email saved. Password resets can now be sent to it.');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to update email.');
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
      setPasswordMsg('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
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
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== session.username) {
      setDeleteError('Username does not match.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(session.token);
      await onLogout();
    } catch {
      setDeleteError('Deletion failed. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>Account</Text>
      <Text style={styles.signedInAs}>Signed in as {session.username}</Text>

      <View style={styles.consentToggleRow}>
        <Text style={styles.consentToggleLabel}>Save my readings to my account</Text>
        <Pressable
          style={[styles.consentToggleButton, consentGiven && { backgroundColor: colors.brand.purple, borderColor: colors.brand.purple }]}
          onPress={toggleConsent}
          disabled={consentBusy || loadingProfile}
        >
          <Text style={[styles.consentToggleButtonText, consentGiven && { color: colors.bg.base }]}>
            {consentBusy ? '…' : consentGiven ? 'On' : 'Off'}
          </Text>
        </Pressable>
      </View>
      {consentTimestamp && (
        <Text style={styles.consentTimestamp}>
          {consentGiven ? 'Granted' : 'Withdrawn'} {formatDate(consentTimestamp)}
        </Text>
      )}

      {consentGiven && (
        <View style={styles.historySection}>
          <Text style={styles.historyKicker}>Your readings</Text>
          {loadingHistory ? (
            <Text style={styles.historyEmpty}>Loading…</Text>
          ) : history.length === 0 ? (
            <Text style={styles.historyEmpty}>
              No readings saved yet — take a Measure check-in to start your history.
            </Text>
          ) : (
            history.map((reading) => {
              const hasTranscript = reading.qaPairs && reading.qaPairs.length > 0;
              const isExpanded = expandedReadingId === reading.id;
              return (
                <View key={reading.id}>
                  <Pressable
                    style={styles.historyRow}
                    onPress={() => {
                      if (!hasTranscript) return;
                      const next = isExpanded ? null : reading.id;
                      setExpandedReadingId(next);
                      if (next) track('history_transcript_viewed');
                    }}
                  >
                    <View>
                      <Text style={styles.historyDate}>{formatDate(reading.savedAt)}</Text>
                      <Text style={styles.historyLabel}>
                        {reading.vibrationLevel.name} · {reading.vibrationScore}
                      </Text>
                    </View>
                    {hasTranscript && (
                      <Text style={styles.historyChevron}>{isExpanded ? '↑' : '↓'}</Text>
                    )}
                  </Pressable>

                  {isExpanded && hasTranscript && (
                    <View style={styles.historyDetail}>
                      {reading.qaPairs.map((pair, i) => (
                        <View key={i} style={styles.historyQA}>
                          <Text style={styles.historyQuestion}>{pair.question}</Text>
                          <Text style={styles.historyAnswer}>{pair.answer}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      <View style={styles.dataSection}>
        <Text style={styles.dataKicker}>Account security</Text>

        <View style={styles.dataRow}>
          <Text style={styles.dataRowText}>
            {profile?.email
              ? 'Used for password resets.'
              : "Add an email so you can reset your password if you ever forget it. Optional, but recommended."}
          </Text>
          <TextInput
            style={styles.input}
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!emailBusy}
          />
          <Pressable style={styles.dataButton} onPress={handleUpdateEmail} disabled={emailBusy || !emailInput.trim()}>
            <Text style={styles.dataButtonText}>{emailBusy ? '…' : profile?.email ? 'Update' : 'Save'}</Text>
          </Pressable>
        </View>
        {emailMsg && <Text style={styles.noticeText}>{emailMsg}</Text>}
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <View style={styles.dataRow}>
          <Text style={styles.dataRowText}>Update your password. You'll need your current one.</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
            editable={!passwordBusy}
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
            editable={!passwordBusy}
          />
          <Pressable
            style={styles.dataButton}
            onPress={handleChangePassword}
            disabled={passwordBusy || !currentPassword || !newPassword}
          >
            <Text style={styles.dataButtonText}>{passwordBusy ? '…' : 'Change password'}</Text>
          </Pressable>
        </View>
        {passwordMsg && <Text style={styles.noticeText}>{passwordMsg}</Text>}
        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
      </View>

      <View style={styles.dataSection}>
        <Text style={styles.dataKicker}>Your data &amp; privacy</Text>

        <View style={styles.dataRow}>
          <Text style={styles.dataRowText}>
            Export everything Selfinder holds about you as JSON — profile, consent records,
            saved readings and conversations.
          </Text>
          <Pressable style={styles.dataButton} onPress={handleExport} disabled={exporting}>
            <Text style={styles.dataButtonText}>{exporting ? '…' : 'Export'}</Text>
          </Pressable>
        </View>
        {exportError && <Text style={styles.errorText}>{exportError}</Text>}

        <View style={styles.dangerRow}>
          <Text style={styles.dataRowText}>
            Permanently delete your account and all associated data. This cannot be undone.
          </Text>
          {deleteStep === 0 && (
            <Pressable style={styles.dangerButton} onPress={() => setDeleteStep(1)}>
              <Text style={styles.dangerButtonText}>Delete</Text>
            </Pressable>
          )}
        </View>

        {deleteStep === 1 && (
          <View style={styles.deleteConfirmBlock}>
            <Text style={styles.dataRowText}>
              Type your username <Text style={{ fontFamily: fonts.medium }}>{session.username}</Text> to confirm.
            </Text>
            <TextInput
              style={styles.input}
              value={deleteConfirmText}
              onChangeText={(t) => { setDeleteConfirmText(t); setDeleteError(null); }}
              placeholder={session.username}
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}
            <View style={styles.deleteConfirmRow}>
              <Pressable
                style={styles.dangerButton}
                onPress={handleDelete}
                disabled={!deleteConfirmText || deleting}
              >
                <Text style={styles.dangerButtonText}>{deleting ? '…' : 'Confirm delete'}</Text>
              </Pressable>
              <Pressable
                style={styles.dataButton}
                onPress={() => { setDeleteStep(0); setDeleteConfirmText(''); setDeleteError(null); }}
              >
                <Text style={styles.dataButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Pressable style={styles.signOutButton} onPress={onLogout}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
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
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  consentRowText: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  errorText: { color: colors.brand.purple, fontFamily: fonts.light, fontSize: fontSizes.sm },
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
    backgroundColor: colors.brand.purple,
  },
  submitButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.base },
  signedInAs: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.base },
  consentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  consentToggleLabel: {
    flex: 1,
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  consentToggleButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  consentToggleButtonText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  historySection: { gap: spacing[2], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.bg.border },
  historyKicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  historyEmpty: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  historyDate: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  historyLabel: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  historyChevron: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  historyDetail: {
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.bg.base,
  },
  historyQA: { gap: spacing[1] },
  historyQuestion: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  historyAnswer: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  consentTimestamp: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs, marginTop: -spacing[1] },
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
  dataButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  dataButtonText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  dangerButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: `rgb(${colors.axis.heart})`,
  },
  dangerButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  deleteConfirmBlock: { gap: spacing[3] },
  deleteConfirmRow: { flexDirection: 'row', gap: spacing[3] },
  signOutButton: { alignItems: 'center', paddingTop: spacing[3] },
  signOutText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
});
