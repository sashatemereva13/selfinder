import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';
import { getMe, grantConsent, withdrawConsent, getMeasureHistory } from '../api/user';
import { AuthSession, UserProfile, SavedMeasureResult } from '../types';

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
  onRegister: (username: string, password: string, privacyPolicyAccepted: boolean) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        await onRegister(username.trim(), password, accepted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

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
  const [consentBusy, setConsentBusy] = useState(false);

  const consentGiven = profile?.consent?.psychologicalData?.given ?? false;

  const refreshProfile = async () => {
    setLoadingProfile(true);
    try {
      setProfile(await getMe(session.token));
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
            history.map((reading) => (
              <View key={reading.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{formatDate(reading.savedAt)}</Text>
                <Text style={styles.historyLabel}>
                  {reading.vibrationLevel.name} · {reading.vibrationScore}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

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
  signOutButton: { alignItems: 'center', paddingTop: spacing[3] },
  signOutText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
});
