/**
 * Hint-1 pick-mode prompt: instruction + "Surprise me" / "Cancel".
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function HintPickBar({
  onSurprise,
  onCancel,
}: {
  onSurprise: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.bar}>
      <ThemedText themeColor="textSecondary" type="small" style={styles.prompt}>
        Tap a highlighted letter to reveal it
      </ThemedText>
      <View style={styles.row}>
        <Pressable
          onPress={onSurprise}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="shuffle" size={18} color={theme.primaryText} />
          <ThemedText themeColor="primaryText" style={styles.buttonText}>
            Surprise me
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.button,
            styles.outline,
            { borderColor: theme.cellBorder, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText style={styles.buttonText}>Cancel</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  prompt: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.two },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  outline: { borderWidth: 1.5, backgroundColor: 'transparent' },
  buttonText: { fontSize: 15, fontWeight: '700' },
});
