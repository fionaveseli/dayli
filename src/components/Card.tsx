import { View, type ViewProps } from 'react-native';

import { radii, useTheme } from '../theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors: c } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: c.card,
          borderColor: c.line,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: 18,
        },
        style,
      ]}
    />
  );
}
