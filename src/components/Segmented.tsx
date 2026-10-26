import { Pressable, View } from 'react-native';

import { fonts, radii, useTheme } from '../theme';
import { Text } from './Text';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch to the full width, options sharing it equally. */
  full?: boolean;
};

export function Segmented<T extends string>({ options, value, onChange, full }: Props<T>) {
  const { colors: c } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        alignSelf: full ? 'stretch' : 'flex-start',
        backgroundColor: c.paper2,
        borderColor: c.line,
        borderWidth: 1,
        borderRadius: radii.pill,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{
              flex: full ? 1 : undefined,
              minHeight: 38,
              paddingHorizontal: 14,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.pill,
              backgroundColor: on ? c.card : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.uiSemi,
                fontSize: 13.5,
                color: on ? c.ink : c.muted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
