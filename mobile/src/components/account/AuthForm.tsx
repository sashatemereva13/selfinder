import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { requestPasswordReset, resetPassword } from '../../api/auth';
import { PRIVACY_POLICY_URL } from '../../utils/privacyPolicy';
import { PasswordInput } from './PasswordInput';
import { makeStyles } from './accountStyles';

export function AuthForm({
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
