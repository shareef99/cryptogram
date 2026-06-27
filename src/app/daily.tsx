/**
 * Daily Challenge calendar. One deterministic puzzle per date (same for
 * everyone). Today is playable until solved; missed past days can be backfilled;
 * future days are locked. Solved days are marked done. Navigate months to
 * backfill or review history.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { DayCell } from '@/components/daily/DayCell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getDailyResultsInRange, getDatabase } from '@/db';
import { buildMonthGrid, daysInMonth, monthLabel, shiftMonth, todayString } from '@/lib/calendar';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function DailyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const today = todayString();
  const curY = Number(today.slice(0, 4));
  const curM = Number(today.slice(5, 7));

  const [year, setYear] = useState(curY);
  const [month, setMonth] = useState(curM); // 1–12
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());

  const loadMonth = useCallback(async () => {
    try {
      const db = await getDatabase();
      const start = `${year}-${pad(month)}-01`;
      const end = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;
      const results = await getDailyResultsInRange(db, start, end);
      setDone(new Set(results.filter((r) => r.solvedAt != null).map((r) => r.date)));
    } catch {
      /* DB not ready — leave empty */
    }
  }, [year, month]);

  useFocusEffect(useCallback(() => void loadMonth(), [loadMonth]));

  const grid = buildMonthGrid(year, month, today, done);
  const todayDone = done.has(today);
  const atCurrentMonth = year === curY && month === curM;

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month1);
  };

  const playDate = (date: string) =>
    router.push({ pathname: '/play/[id]', params: { id: 'daily', daily: date } });

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            Daily Challenge
          </ThemedText>
          <View style={styles.back} />
        </View>

        <View style={styles.body}>
          <Pressable
            disabled={todayDone}
            onPress={() => playDate(today)}
            style={({ pressed }) => [
              styles.todayButton,
              { backgroundColor: todayDone ? theme.backgroundElement : theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText themeColor={todayDone ? 'textSecondary' : 'primaryText'} style={styles.todayLabel}>
              {todayDone ? "Today's challenge complete 🎉" : "Play today's puzzle"}
            </ThemedText>
          </Pressable>

          <View style={styles.monthNav}>
            <Pressable onPress={() => goMonth(-1)} hitSlop={8} style={styles.navArrow}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.monthLabel}>{monthLabel(year, month)}</ThemedText>
            <Pressable
              onPress={() => goMonth(1)}
              disabled={atCurrentMonth}
              hitSlop={8}
              style={[styles.navArrow, atCurrentMonth && styles.navDisabled]}>
              <Ionicons name="chevron-forward" size={22} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <ThemedText key={i} themeColor="textSecondary" style={styles.weekday}>
                {d}
              </ThemedText>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((cell, i) => (
              <DayCell key={cell.date ?? `pad-${i}`} cell={cell} onPress={playDate} />
            ))}
          </View>

          <View style={styles.legend}>
            <Legend color={theme.primary} label="Done" />
            <Legend color={theme.backgroundElement} label="Missed — tap to play" />
            <Legend ring color={theme.primary} label="Today" />
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

function Legend({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          ring ? { borderWidth: 2, borderColor: color } : { backgroundColor: color },
        ]}
      />
      <ThemedText themeColor="textSecondary" type="small">
        {label}
      </ThemedText>
    </View>
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
  body: { flex: 1, paddingHorizontal: Spacing.three, gap: Spacing.three },
  todayButton: { paddingVertical: Spacing.three, borderRadius: Spacing.four, alignItems: 'center' },
  todayLabel: { fontSize: 18, fontWeight: '700' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  legend: { gap: Spacing.two, paddingTop: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  legendSwatch: { width: 18, height: 18, borderRadius: 6 },
});
