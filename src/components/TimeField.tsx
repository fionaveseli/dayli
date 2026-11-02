import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { fmtT } from '../rules/format';
import { hit, radii, useTheme } from '../theme';
import { Text } from './Text';

/** A time in 5-minute steps, set with − and +. No picker library needed. */
export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (m: number) => void;
}) {
  const { colors: c } = useTheme();
  const step = (d: number) => onChange(Math.min(1435, Math.max(0, value + d)));
  const btn = (name: 'remove' | 'add', d: number, l: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${l} ${label}`}
      onPress={() => step(d)}
      style={{ width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={name} size={20} color={c.ink} />
    </Pressable>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: c.line2,
        borderRadius: radii.md,
        backgroundColor: c.card,
        alignSelf: 'flex-start',
        minWidth: 170,
      }}
    >
      {btn('remove', -5, 'Earlier')}
      <Text variant="h3" accessibilityLabel={`${label} ${fmtT(value)}`}>
        {fmtT(value)}
      </Text>
      {btn('add', 5, 'Later')}
    </View>
  );
}
