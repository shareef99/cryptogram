/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',

    // Brand / accent
    primary: '#208AEF',
    primaryText: '#ffffff',

    // Puzzle cell states
    cellBackground: '#F0F0F3',
    cellBorder: '#D4D5DB',
    cellSelected: '#CFE6FF',
    cellSelectedBorder: '#208AEF',
    cellText: '#11181C',
    cellCode: '#7A7F87', // the small cipher number under a cell
    cellGiven: '#3C7D2E', // revealed-by-hint letter
    cellCorrect: '#2E9E5B',
    cellError: '#E5484D',
    cellHighlight: '#FFE9A8', // hint-1 "pick a letter" highlight

    // On-screen keyboard
    keyBackground: '#E6E7EB',
    keyText: '#11181C',
    keyDisabled: '#C2C4CC',
    keyDisabledText: '#9296A0',

    // Economy / engagement
    coin: '#F5A623',
    streak: '#FF6A3D',
    success: '#2E9E5B',
    danger: '#E5484D',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',

    // Brand / accent
    primary: '#3C9FFE',
    primaryText: '#ffffff',

    // Puzzle cell states
    cellBackground: '#1B1C1F',
    cellBorder: '#3A3C42',
    cellSelected: '#11324F',
    cellSelectedBorder: '#3C9FFE',
    cellText: '#ECEDEE',
    cellCode: '#8B9096',
    cellGiven: '#7FD68A',
    cellCorrect: '#4FC97D',
    cellError: '#FF6369',
    cellHighlight: '#4A3E12',

    // On-screen keyboard
    keyBackground: '#2A2C31',
    keyText: '#ECEDEE',
    keyDisabled: '#1B1C1F',
    keyDisabledText: '#5C6066',

    // Economy / engagement
    coin: '#FFB84D',
    streak: '#FF7A52',
    success: '#4FC97D',
    danger: '#FF6369',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
