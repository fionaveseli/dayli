import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';

import { hit, radii, useTheme } from '../theme';
import { clock } from './format';
import type { VoiceStatus } from './useVoiceNote';

/** A small mic for one-line inputs. Pair it with `useVoiceNote`. */
export function MicButton({
  status,
  secs,
  onPress,
}: {
  status: VoiceStatus;
  secs: number;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  const rec = status === 'recording';
  const busy = status === 'transcribing';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rec ? `Stop recording, ${clock(secs)}` : 'Add by voice'}
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={onPress}
      style={{
        width: hit,
        height: hit,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: rec ? c.rose : 'transparent',
      }}
    >
      {busy ? (
        <ActivityIndicator color={c.muted} />
      ) : (
        <Ionicons
          name={rec ? 'checkmark' : 'mic-outline'}
          size={20}
          color={rec ? '#fff' : c.muted}
        />
      )}
    </Pressable>
  );
}
