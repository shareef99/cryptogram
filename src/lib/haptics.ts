/**
 * Thin, fire-and-forget wrappers around expo-haptics. Each call is best-effort
 * (errors swallowed) so haptics never interrupt gameplay on devices without a
 * vibration motor or when permission is unavailable.
 */

import * as Haptics from 'expo-haptics';

export const haptics = {
  /** Light tick for key taps / selection. */
  tap: () => {
    Haptics.selectionAsync().catch(() => {});
  },
  /** A bit stronger — hint reveals. */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** Celebratory pattern — puzzle solved. */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
