/**
 * Shared component prop types.
 */

import type { TextProps, ViewProps } from 'react-native';

import type { ThemeColor } from './theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'small'
  | 'smallBold'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};
