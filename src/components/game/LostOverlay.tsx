/**
 * Full-screen "out of guesses" overlay — turns a dead end into a choice. The
 * headline play is a rewarded **Continue**: watch an ad to refill lives and keep
 * the board you've already filled in (loss-aversion: don't lose your progress /
 * streak). Falls back to Restart (fresh from the foothold) or Home.
 */

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { letterCells } from '@/game';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';

export function LostOverlay({
  onContinue,
  onRestart,
  onHome,
  continuing,
  canContinue,
}: {
  onContinue: () => void;
  onRestart: () => void;
  onHome: () => void;
  continuing: boolean;
  canContinue: boolean;
}) {
  const theme = useTheme();
  const pct = useGameStore((s) => {
    if (!s.puzzle) return 0;
    const total = letterCells(s.puzzle).length;
    return total ? Math.round((Object.keys(s.cellGuesses).length / total) * 100) : 0;
  });

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
      <Animated.View entering={ZoomIn.springify().damping(15)} style={styles.cardWrap}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.emoji}>💔</ThemedText>
          <ThemedText style={styles.title}>Out of guesses!</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            You&apos;re {pct}% there — don&apos;t lose your progress. Finish it to keep your streak going.
          </ThemedText>

          {canContinue && (
            <Pressable
              onPress={onContinue}
              disabled={continuing}
              style={({ pressed }) => [
                styles.continue,
                { backgroundColor: theme.coin, opacity: pressed || continuing ? 0.7 : 1 },
              ]}>
              {continuing ? (
                <ActivityIndicator color="#1a1205" />
              ) : (
                <Ionicons name="play-circle" size={22} color="#1a1205" />
              )}
              <View style={styles.continueText}>
                <ThemedText style={[styles.continueTitle, styles.darkText]}>
                  {continuing ? 'Loading ad…' : 'Continue'}
                </ThemedText>
                {!continuing && (
                  <ThemedText style={[styles.continueSub, styles.darkText]}>
                    Watch a quick ad · keep your board + refill ❤❤❤
                  </ThemedText>
                )}
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={onRestart}
            disabled={continuing}
            style={({ pressed }) => [styles.restart, { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText themeColor="primary" style={styles.restartText}>
              Restart puzzle
            </ThemedText>
          </Pressable>

          <Pressable onPress={onHome} disabled={continuing} style={styles.home}>
            <ThemedText themeColor="textSecondary" style={styles.homeText}>
              Back home
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    zIndex: 50,
  },
  cardWrap: { width: '100%', maxWidth: 360 },
  card: { borderRadius: Spacing.four, padding: Spacing.five, alignItems: 'center', gap: Spacing.two },
  emoji: { fontSize: 52 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { textAlign: 'center', marginBottom: Spacing.two },
  continue: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  continueText: { alignItems: 'flex-start' },
  continueTitle: { fontSize: 18, fontWeight: '800' },
  continueSub: { fontSize: 12, fontWeight: '600', opacity: 0.85 },
  darkText: { color: '#1a1205' },
  restart: {
    alignSelf: 'stretch',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  restartText: { fontSize: 17, fontWeight: '700' },
  home: { paddingVertical: Spacing.two, alignItems: 'center' },
  homeText: { fontSize: 15, fontWeight: '600' },
});
