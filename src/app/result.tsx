/**
 * Result screen shown after a puzzle is solved: the full quote + author, coins
 * earned (with an opt-in "Double it" rewarded ad), and next/home actions.
 */

import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maybeShowInterstitial, showRewarded } from '@/ads';
import { CoinIcon } from '@/components/CoinIcon';
import { MonthRewardModal } from '@/components/meta/MonthRewardModal';
import { RewardModal } from '@/components/meta/RewardModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/player-store';
import { useResultStore } from '@/store/result-store';
import { useSettingsStore } from '@/store/settings-store';

export default function ResultScreen() {
  const theme = useTheme();
  const result = useResultStore((s) => s.result);
  const awardCoins = usePlayerStore((s) => s.awardCoins);
  const adsRemoved = useSettingsStore((s) => s.adsRemoved);

  const [earned, setEarned] = useState(result?.coinsEarned ?? 0);
  const [doubled, setDoubled] = useState(false);
  const [doubling, setDoubling] = useState(false);
  const [milestone, setMilestone] = useState(result?.milestone ?? null);
  const [monthReward, setMonthReward] = useState(result?.monthReward ?? null);

  // No result in memory (e.g. deep-linked or reloaded) — bounce home.
  if (!result) return <Redirect href="/" />;

  const handleDoubleIt = async () => {
    if (doubled || doubling) return;
    setDoubling(true);
    if (await showRewarded()) {
      await awardCoins(result.coinsEarned);
      setEarned((c) => c * 2);
      setDoubled(true);
    }
    setDoubling(false);
  };

  const handleNext = async () => {
    await maybeShowInterstitial(adsRemoved, Date.now());
    router.replace({
      pathname: '/play/[id]',
      params: { id: 'new', difficulty: String(result.difficulty) },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Animated.View entering={ZoomIn.springify().damping(13)} style={styles.badge}>
            <Ionicons name="checkmark-circle" size={64} color={theme.success} />
          </Animated.View>
          <ThemedText type="title" style={styles.solved}>
            Solved!
          </ThemedText>

          <Animated.View entering={FadeIn.delay(150)} style={styles.quoteWrap}>
            <ThemedText style={styles.quote}>“{result.quote}”</ThemedText>
            {result.author && (
              <ThemedText themeColor="textSecondary" style={styles.author}>
                — {result.author}
              </ThemedText>
            )}
          </Animated.View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.earned}>
            <CoinIcon size={20} />
            <ThemedText style={styles.earnedText}>+{earned}</ThemedText>
          </View>

          {!doubled && (
            <Pressable
              onPress={handleDoubleIt}
              disabled={doubling}
              style={[styles.button, { backgroundColor: theme.coin, opacity: doubling ? 0.6 : 1 }]}>
              <Ionicons name="play-circle" size={20} color="#1a1205" />
              <ThemedText style={[styles.buttonText, styles.darkText]}>
                {doubling ? 'Loading ad…' : 'Double it'}
              </ThemedText>
            </Pressable>
          )}

          <Pressable onPress={handleNext} style={[styles.button, { backgroundColor: theme.primary }]}>
            <ThemedText themeColor="primaryText" style={styles.buttonText}>
              Next puzzle
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.replace('/')} style={styles.homeButton}>
            <ThemedText themeColor="primary" style={styles.buttonText}>
              Home
            </ThemedText>
          </Pressable>
        </View>

        <RewardModal milestone={milestone} onClose={() => setMilestone(null)} />
        <MonthRewardModal reward={monthReward} onClose={() => setMonthReward(null)} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four },
  top: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  badge: {},
  solved: { textAlign: 'center' },
  quoteWrap: { alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  quote: { fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
  author: { fontSize: 16 },
  bottom: { gap: Spacing.three, paddingBottom: Spacing.four },
  earned: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  earnedText: { fontSize: 24, fontWeight: '800' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  homeButton: { alignItems: 'center', paddingVertical: Spacing.two },
  buttonText: { fontSize: 18, fontWeight: '700' },
  darkText: { color: '#1a1205' },
});
