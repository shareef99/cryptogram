import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ThemedViewProps } from '@/types';

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
