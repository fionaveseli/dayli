import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button, Text } from '../components';
import type { DayIndex } from '../data/types';
import { usePlan } from '../store';
import { fonts, hit, radii, useTheme } from '../theme';
import { asLine, clock, MicButton, useVoiceNote } from '../voice';
import { quickAdd } from './quickAddText';

const PLACEHOLDER = 'Add something, or "remind me at 4 to…"';

/** One line to add a task or a reminder. Shows what it did underneath. */
export function QuickAdd({
  day,
  remOnly,
  placeholder = PLACEHOLDER,
}: {
  day: DayIndex | null;
  remOnly?: boolean;
  placeholder?: string;
}) {
  const { colors: c } = useTheme();
  const plan = usePlan();
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  // The transcript lands in the field so it can be checked before Add.
  const heard = useCallback((t: string) => {
    setValue(asLine(t));
    setMessage('Check what I heard, then tap Add.');
  }, []);
  const voice = useVoiceNote(heard);
  const hint =
    voice.status === 'recording'
      ? `Listening… ${clock(voice.secs)} · tap ✓ to finish`
      : voice.status === 'transcribing'
        ? 'Writing down what you said…'
        : (voice.error ?? message);

  const submit = () => {
    const r = quickAdd(plan, value, { day, remOnly });
    if (!r) return;
    plan.apply(() => r.plan);
    setValue('');
    setMessage(r.message);
  };

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: hit,
          borderWidth: 1,
          borderColor: c.line2,
          borderRadius: radii.md,
          backgroundColor: c.card,
          paddingLeft: 14,
          paddingRight: 4,
        }}
      >
        <Ionicons name="add" size={18} color={c.muted} />
        <TextInput
          value={value}
          onChangeText={(t) => {
            setValue(t);
            setMessage('');
          }}
          onSubmitEditing={submit}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={c.faint}
          accessibilityLabel={placeholder}
          style={{
            flex: 1,
            minHeight: hit,
            color: c.ink,
            fontFamily: fonts.ui,
            fontSize: 15,
          }}
        />
        {value.trim() !== '' && voice.status === 'idle' ? (
          <Button label="Add" onPress={submit} />
        ) : (
          <MicButton status={voice.status} secs={voice.secs} onPress={voice.toggle} />
        )}
      </View>
      {hint !== '' && (
        <Text variant="small" tone="muted" accessibilityLiveRegion="polite">
          {hint}
        </Text>
      )}
    </View>
  );
}
