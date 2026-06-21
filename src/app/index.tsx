import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            Cryptogram
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Crack the code. Decode the quote.
          </ThemedText>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/play/[id]', params: { id: 'new' } })}
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText themeColor="primaryText" style={styles.playLabel}>
            Play
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.six,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  playButton: {
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    minWidth: 200,
    alignItems: 'center',
  },
  playLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
});
