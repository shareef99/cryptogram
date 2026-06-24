/**
 * "How to play" overlay. Shown automatically on first launch and replayable from
 * Settings. Visibility is driven by the UI store; dismissing just hides it (the
 * first-run trigger marks onboarding as seen when it opens this).
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { CoinIcon } from '@/components/CoinIcon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUiStore } from '@/store/ui-store';

type Step = {
  icon: keyof typeof Ionicons.glyphMap;
  color: (t: ReturnType<typeof useTheme>) => string;
  text: string;
};

const STEPS: Step[] = [
  { icon: 'grid', color: (t) => t.primary, text: 'Every letter is hidden behind a number — the same number is always the same letter.' },
  { icon: 'hand-left', color: (t) => t.text, text: 'Tap a cell, then tap a letter on the keyboard to fill it in.' },
  { icon: 'checkmark-circle', color: (t) => t.success, text: 'A few letters start revealed to give you a foothold.' },
  { icon: 'heart', color: (t) => t.danger, text: 'A wrong guess costs a life — you get three per puzzle.' },
  { icon: 'bulb', color: (t) => t.coin, text: 'Stuck? Spend a hint to reveal a letter, or use a Lucky Reveal.' },
];

export function HowToPlay() {
  const theme = useTheme();
  const visible = useUiStore((s) => s.helpVisible);
  const hide = useUiStore((s) => s.hideHelp);

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
      <Pressable style={styles.backdropPress} onPress={hide} />
      <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.cardWrap} pointerEvents="box-none">
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            How to play
          </ThemedText>

          <View style={styles.steps}>
            {STEPS.map((s) => (
              <View key={s.icon} style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: theme.background }]}>
                  <Ionicons name={s.icon} size={22} color={s.color(theme)} />
                </View>
                <ThemedText style={styles.rowText}>{s.text}</ThemedText>
              </View>
            ))}

            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: theme.background }]}>
                <CoinIcon size={20} />
              </View>
              <ThemedText style={styles.rowText}>Crack the whole quote to earn coins!</ThemedText>
            </View>
          </View>

          <Pressable
            onPress={hide}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
            <ThemedText themeColor="primaryText" style={styles.buttonText}>
              Got it!
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: Spacing.four },
  backdropPress: StyleSheet.absoluteFillObject,
  cardWrap: { width: '100%', maxWidth: MaxContentWidth, alignItems: 'center' },
  card: { width: '100%', borderRadius: Spacing.five, padding: Spacing.five, gap: Spacing.four },
  title: { textAlign: 'center' },
  steps: { gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconWrap: { width: 42, height: 42, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1, fontSize: 15, lineHeight: 21 },
  button: { paddingVertical: Spacing.three, borderRadius: Spacing.four, alignItems: 'center', marginTop: Spacing.one },
  buttonText: { fontSize: 18, fontWeight: '700' },
});
