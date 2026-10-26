import { Text as RNText, type TextProps } from 'react-native';

import { textStyles, useTheme, type TextVariant } from '../theme';

type Props = TextProps & {
  variant?: TextVariant;
  tone?: 'ink' | 'ink2' | 'muted' | 'faint';
};

export function Text({ variant = 'body', tone = 'ink', style, ...rest }: Props) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[textStyles[variant], { color: colors[tone] }, style]} />;
}
