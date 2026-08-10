import { Text, StyleSheet } from 'react-native';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { useThemeColors } from '../theme/useThemeColors';

// Same visual register Guide itself uses for a message bubble (see Turn in
// app/(tabs)/guide/index.tsx) — extracted so a linked conversation shown
// elsewhere (Your Arc's rich re-entry) renders identically rather than
// inventing a second chat-bubble style. Kept as its own small component
// rather than exporting Guide's private Turn, since that one is tightly
// coupled to that screen's own style object.
export function ChatTurn({ role, children }: { role: 'user' | 'assistant'; children: string }) {
  const colors = useThemeColors();
  const isUser = role === 'user';
  return (
    <Text
      style={[
        styles.text,
        isUser
          ? { alignSelf: 'flex-end', color: colors.text.secondary, textAlign: 'right' }
          : { alignSelf: 'flex-start', color: colors.text.primary, textAlign: 'left' },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.chat,
    maxWidth: '88%',
  },
});
