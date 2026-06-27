/**
 * Achievements screen: the full catalog with locked/unlocked state and a
 * progress count. Unlocked state is read from the DB on focus.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { AchievementRow } from '@/components/achievements/AchievementRow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getDatabase, getUnlockedIds } from '@/db';
import { ACHIEVEMENTS } from '@/game/achievements';
import { useTheme } from '@/hooks/use-theme';

export default function AchievementsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [unlocked, setUnlocked] = useState<ReadonlySet<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getDatabase()
        .then(getUnlockedIds)
        .then((ids) => active && setUnlocked(ids))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            Achievements
          </ThemedText>
          <View style={styles.back} />
        </View>

        <ThemedText themeColor="textSecondary" style={styles.count}>
          {unlocked.size} of {ACHIEVEMENTS.length} unlocked
        </ThemedText>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {ACHIEVEMENTS.map((a) => (
            <AchievementRow key={a.id} achievement={a} unlocked={unlocked.has(a.id)} />
          ))}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24 },
  count: { textAlign: 'center', paddingBottom: Spacing.three },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two },
});
