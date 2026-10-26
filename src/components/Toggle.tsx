import { Pressable, View } from 'react-native';

import { hit, radii, useTheme } from '../theme';

type Props = { value: boolean; onChange: (value: boolean) => void; label?: string };

export function Toggle({ value, onChange, label }: Props) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ minHeight: hit, justifyContent: 'center' }}
    >
      <View
        style={{
          width: 46,
          height: 28,
          borderRadius: radii.pill,
          backgroundColor: value ? c.ink : c.line2,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: c.card,
            marginLeft: value ? 21 : 3,
          }}
        />
      </View>
    </Pressable>
  );
}
