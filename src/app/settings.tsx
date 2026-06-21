/**
 * Settings: theme mode, sound, Remove Ads (IAP), and Reset progress.
 */

import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingRow } from '@/components/settings/SettingRow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getDatabase, resetProgress } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { IAP_AVAILABLE, purchaseRemoveAds } from '@/iap';
import { usePlayerStore } from '@/store/player-store';
import { useSettingsStore } from '@/store/settings-store';
import type { ThemeMode } from '@/types';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const adsRemoved = useSettingsStore((s) => s.adsRemoved);
  const setAdsRemoved = useSettingsStore((s) => s.setAdsRemoved);

  const handleRemoveAds = async () => {
    if (await purchaseRemoveAds()) {
      await setAdsRemoved(true);
      Alert.alert('Thanks!', 'Ads have been removed.');
    } else {
      Alert.alert('Unavailable', 'Purchases are not available in this build yet.');
    }
  };

  const handleReset = () => {
    Alert.alert('Reset progress?', 'This permanently erases your solved puzzles, coins, and streak.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const db = await getDatabase();
          await resetProgress(db);
          await usePlayerStore.getState().hydrate();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
            <ThemedText style={styles.backIcon}>‹</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            Settings
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <SettingRow label="Theme">
              <View style={styles.segment}>
                {THEME_OPTIONS.map((o) => {
                  const active = themeMode === o.value;
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() => setThemeMode(o.value)}
                      style={[
                        styles.segmentItem,
                        { backgroundColor: active ? theme.primary : 'transparent' },
                      ]}>
                      <ThemedText themeColor={active ? 'primaryText' : 'text'} type="small">
                        {o.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </SettingRow>

            <View style={[styles.divider, { backgroundColor: theme.cellBorder }]} />

            <SettingRow label="Sound">
              <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
            </SettingRow>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Pressable onPress={adsRemoved ? undefined : handleRemoveAds} style={styles.rowButton}>
              <ThemedText style={styles.rowLabel}>Remove ads</ThemedText>
              <ThemedText themeColor={adsRemoved ? 'success' : 'primary'} style={styles.rowAction}>
                {adsRemoved ? 'Removed ✓' : IAP_AVAILABLE ? 'Buy' : 'Soon'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Pressable onPress={handleReset} style={styles.rowButton}>
              <ThemedText themeColor="danger" style={styles.rowLabel}>
                Reset progress
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedText themeColor="textSecondary" type="small" style={styles.version}>
            Cryptogram · v1.0.0
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  back: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 34, lineHeight: 36, fontWeight: '300' },
  title: { fontSize: 26 },
  content: { padding: Spacing.three, gap: Spacing.three },
  card: { borderRadius: Spacing.four, paddingHorizontal: Spacing.four },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.four,
  },
  rowLabel: { fontSize: 17, fontWeight: '600' },
  rowAction: { fontSize: 16, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth },
  segment: { flexDirection: 'row', gap: 4 },
  segmentItem: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: 999 },
  version: { textAlign: 'center', paddingVertical: Spacing.four },
});
