/**
 * The coin icon used wherever a coin amount is shown.
 */

import { FontAwesome5 } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

export function CoinIcon({ size = 16, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  return <FontAwesome5 name="coins" size={size} color={color ?? theme.coin} />;
}
