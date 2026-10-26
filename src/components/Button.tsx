import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { fonts, hit, radii, useTheme } from '../theme';
import { Text } from './Text';

export type ButtonKind = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  size = 'md',
  block,
  disabled,
  style,
}: Props) {
  const { colors: c } = useTheme();
  const look = {
    primary: { bg: c.btn, fg: c.btnInk, border: c.btn },
    secondary: { bg: c.card, fg: c.ink, border: c.line2 },
    soft: { bg: c.roseSoft, fg: c.blushInk, border: c.roseSoft },
    ghost: { bg: 'transparent', fg: c.ink2, border: 'transparent' },
    danger: { bg: 'transparent', fg: c.over, border: 'transparent' },
  }[kind];
  const height = size === 'lg' ? 54 : hit;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size === 'sm' ? 5 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          height: size === 'sm' ? 34 : height,
          paddingHorizontal: size === 'lg' ? 26 : size === 'sm' ? 13 : 18,
          backgroundColor: look.bg,
          borderColor: look.border,
          opacity: disabled ? 0.35 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        block && styles.block,
        style,
      ]}
    >
      <Text
        style={{
          color: look.fg,
          fontFamily: fonts.uiSemi,
          fontSize: size === 'lg' ? 16 : size === 'sm' ? 13.5 : 14.5,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch' },
});
