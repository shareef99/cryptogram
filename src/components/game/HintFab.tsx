/**
 * A circular hint FAB: a centered icon with a small badge in the top-right
 * corner. The badge can carry a leading glyph (e.g. a coin) so a price reads
 * differently from a plain remaining-count.
 */

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function HintFab({
  icon,
  iconColor,
  onPress,
  onLongPress,
  disabled,
  badge,
  badgeColor,
  badgeIcon,
}: {
  icon: IoniconName;
  iconColor: string;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  badge: string | number;
  badgeColor: string;
  badgeIcon?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      // A disabled Pressable swallows long-press too; stay interactive when a
      // long-press handler is set (onPress is no-op'd by the caller's guards).
      disabled={disabled && !onLongPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : disabled ? 0.4 : 1 },
      ]}>
      <Ionicons name={icon} size={26} color={iconColor} />
      <View style={[styles.badge, { backgroundColor: badgeColor, borderColor: theme.background }]}>
        {badgeIcon}
        <ThemedText themeColor="primaryText" style={styles.badgeText}>
          {badge}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
});
