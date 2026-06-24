/**
 * A circular hint FAB: a centered icon with a small badge in the top-right
 * corner (coin cost or remaining count).
 */

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function HintFab({
  icon,
  iconColor,
  onPress,
  disabled,
  badge,
  badgeColor,
}: {
  icon: IoniconName;
  iconColor: string;
  onPress: () => void;
  disabled?: boolean;
  badge: string | number;
  badgeColor: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : disabled ? 0.4 : 1 },
      ]}>
      <Ionicons name={icon} size={26} color={iconColor} />
      <View style={[styles.badge, { backgroundColor: badgeColor, borderColor: theme.background }]}>
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
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
});
