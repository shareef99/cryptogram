/**
 * Resolves the active color palette from the user's theme-mode setting
 * ('system' follows the device; otherwise forced light/dark).
 * Learn more: https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore } from '@/store/settings-store';

/** Resolve 'light' | 'dark' from the theme-mode setting + device scheme. */
export function useResolvedScheme(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const mode = useSettingsStore((s) => s.themeMode);
  if (mode === 'light' || mode === 'dark') return mode;
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useResolvedScheme()];
}
