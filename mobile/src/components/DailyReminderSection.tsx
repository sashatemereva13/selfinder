import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { usePhilosopherStore } from '../store/philosopherStore';
import { useReminderStore } from '../store/reminderStore';

// Deliberately simple: four fixed times, no custom picker. Tapping the
// already-active preset turns the reminder off; tapping any other one
// switches to it (re-scheduling replaces the previous time, it doesn't stack).
const PRESETS = [
  { label: 'Morning', hour: 8, minute: 0 },
  { label: 'Midday', hour: 13, minute: 0 },
  { label: 'Evening', hour: 18, minute: 0 },
  { label: 'Night', hour: 21, minute: 0 },
];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function DailyReminderSection() {
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const enabled = useReminderStore((s) => s.enabled);
  const hour = useReminderStore((s) => s.hour);
  const minute = useReminderStore((s) => s.minute);
  const setReminder = useReminderStore((s) => s.setReminder);
  const clearReminder = useReminderStore((s) => s.clearReminder);
  const [deniedNotice, setDeniedNotice] = useState(false);

  if (!philosopher) return null;

  const handlePress = async (presetHour: number, presetMinute: number) => {
    const isActivePreset = enabled && hour === presetHour && minute === presetMinute;
    if (isActivePreset) {
      await clearReminder();
      return;
    }
    setDeniedNotice(false);
    const granted = await setReminder(philosopher, presetHour, presetMinute);
    if (!granted) setDeniedNotice(true);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Daily reminder</Text>
      <Text style={styles.status}>{enabled ? `On, ${formatTime(hour, minute)}` : 'Off'}</Text>

      <View style={styles.presets}>
        {PRESETS.map((preset) => {
          const active = enabled && hour === preset.hour && minute === preset.minute;
          return (
            <Pressable
              key={preset.label}
              style={[
                styles.presetButton,
                { borderColor: active ? philosopher.color : colors.bg.border },
                active && { backgroundColor: colors.bg.surface },
              ]}
              onPress={() => handlePress(preset.hour, preset.minute)}
            >
              <Text style={[styles.presetLabel, active && { color: philosopher.color }]}>
                {preset.label}
              </Text>
              <Text style={styles.presetTime}>{formatTime(preset.hour, preset.minute)}</Text>
            </Pressable>
          );
        })}
      </View>

      {deniedNotice && (
        <Text style={styles.deniedText}>
          Notifications are off for Selfinder — enable them in Settings to use this.
        </Text>
      )}
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
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  status: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  presetButton: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  presetLabel: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  presetTime: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[1],
  },
  deniedText: {
    color: colors.brand.purple,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
});
