/**
 * Theme color key, derived from the palette in `@/constants/theme`.
 */

import { Colors } from '@/constants/theme';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
