import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { makeStyles } from './accountStyles';

// Every password field in AuthForm/LoggedInAccount (login/register,
// forgot-password reset, change-password's current+new) shares this — a
// plain text toggle rather than an eye icon, matching the app's existing
// register of plain-text controls (no icon library is used anywhere else
// in the app). The input itself carries no border/background of its own;
// the wrapping View owns both so the toggle sits inside the same visual
// field as a normal TextInput, not beside a second, separately-boxed
// control.
export function PasswordInput({
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
