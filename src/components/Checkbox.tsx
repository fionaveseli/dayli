import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { hit, useTheme } from '../theme';

type Props = { checked: boolean; onChange?: (checked: boolean) => void; label?: string };

const SIZE = 26;

export function Checkbox({ checked, onChange, label }: Props) {
  const { colors: c } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const first = useRef(true);

  // Little pop when it becomes ticked, like the prototype.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!checked) return;
    scale.setValue(0.7);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [checked, scale]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange?.(!checked)}
      style={{ width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: 1.7,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: checked ? c.btn : c.card,
            borderColor: checked ? c.btn : c.line2,
          }}
        >
          {checked && <Ionicons name="checkmark" size={16} color={c.btnInk} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}
