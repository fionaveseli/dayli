import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../components';
import { radii, useTheme } from '../theme';
import { clock } from './format';
import { useVoiceNote } from './useVoiceNote';
import { Wave } from './Wave';

/** The big record card from onboarding: tap, talk through a week, tap to finish. */
export function VoiceRecorder({ onText }: { onText: (text: string) => void }) {
  const { colors: c } = useTheme();
  const { status, secs, error, toggle } = useVoiceNote(onText);
  const rec = status === 'recording';
  const busy = status === 'transcribing';

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
      <View style={[styles.halo, rec && { backgroundColor: c.roseSoft }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rec ? 'Stop recording' : 'Start recording'}
          accessibilityState={{ busy }}
          disabled={busy}
          onPress={toggle}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: c.rose, opacity: busy ? 0.6 : 1 },
            pressed && { transform: [{ scale: 0.96 }] },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={rec ? 'checkmark' : 'mic-outline'} size={30} color="#fff" />
          )}
        </Pressable>
      </View>
      <Wave on={rec} />
      <Text variant="small" tone="muted" style={styles.center} accessibilityLiveRegion="polite">
        {rec
          ? `Listening… ${clock(secs)} · tap to finish`
          : busy
            ? 'Writing down what you said…'
            : 'Tap and talk through a normal week. Thirty seconds is plenty.'}
      </Text>
      {error && (
        <Text variant="small" tone="ink2" style={styles.center}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  halo: { padding: 10, borderRadius: radii.pill },
  btn: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
