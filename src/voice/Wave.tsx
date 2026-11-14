import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

import { useTheme } from '../theme';

const BARS = 22;

/** The listening wave: small rose bars that rise and fall while recording. */
export function Wave({ on }: { on: boolean }) {
  const { colors: c } = useTheme();
  const [vals] = useState(() => Array.from({ length: BARS }, () => new Animated.Value(0)));

  useEffect(() => {
    if (!on) return;
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      loop = Animated.parallel(
        vals.map((v, i) =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(((i * 70) % 1000) / 2),
              Animated.timing(v, {
                toValue: 1,
                duration: 500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(v, {
                toValue: 0,
                duration: 500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ),
        ),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
      vals.forEach((v) => v.setValue(0));
    };
  }, [on, vals]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 34 }}
    >
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 30,
            borderRadius: 2,
            backgroundColor: c.rose,
            transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
          }}
        />
      ))}
    </View>
  );
}
