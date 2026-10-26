import { Pressable } from 'react-native';

import { fonts, radii, toneColors, useTheme, type Tone } from '../theme';
import { Text } from './Text';

type Props = {
  label: string;
  on?: boolean;
  onPress?: () => void;
  /** Category colour used when the chip is on; plain ink otherwise. */
  tone?: Tone;
  count?: number;
};

export function Chip({ label, on, onPress, tone, count }: Props) {
  const { colors: c } = useTheme();
  const t = tone ? toneColors(c, tone) : null;
  const bg = on ? (t ? t.bg : c.ink) : c.card;
  const fg = on ? (t ? t.ink : c.paper) : c.ink;
  const border = on ? (t ? t.ink : c.ink) : c.line2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      hitSlop={4}
      style={{
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 14,
        borderRadius: radii.pill,
        borderWidth: 1,
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <Text style={{ color: fg, fontFamily: fonts.uiSemi, fontSize: 13.5 }}>{label}</Text>
      {count !== undefined && (
        <Text style={{ color: fg, opacity: 0.6, fontSize: 12 }}>{count}</Text>
      )}
    </Pressable>
  );
}
