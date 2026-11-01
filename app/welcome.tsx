import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '../src/components';
import { useOnboarded } from '../src/onboarding';
import { radii, toneColors, useTheme, type Tone } from '../src/theme';

const NOTES: { t: string; s: string; tone: Tone; r: number }[] = [
  { t: 'Work', s: 'Mon–Fri · 09:00–17:00', tone: 'powder', r: -3 },
  { t: 'Pilates', s: 'Tuesday, 18:00', tone: 'sage', r: 2 },
  { t: 'Portfolio', s: 'Twice a week · 90 min', tone: 'blush', r: -2 },
  { t: 'Interview prep', s: 'Once a week · 1h', tone: 'peach', r: 3 },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { setDone } = useOnboarded();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
        <View style={{ gap: 10, paddingTop: 12 }} accessibilityElementsHidden>
          {NOTES.map((n) => {
            const c = toneColors(colors, n.tone);
            return (
              <View
                key={n.t}
                style={{
                  alignSelf: n.r > 0 ? 'flex-end' : 'flex-start',
                  width: 190,
                  padding: 13,
                  backgroundColor: c.bg,
                  borderRadius: radii.sm,
                  borderBottomRightRadius: 14,
                  transform: [{ rotate: `${n.r}deg` }],
                }}
              >
                <Text variant="h3">{n.t}</Text>
                <Text variant="small" style={{ color: c.ink }}>
                  {n.s}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={{ gap: 14 }}>
          <Text variant="wordmark" style={{ fontSize: 44, lineHeight: 44 }}>
            dayli
          </Text>
          <Text variant="h1" style={{ fontSize: 40, lineHeight: 42 }}>
            Plan your life.{'\n'}Your way.
          </Text>
          <Text tone="ink2">
            Dayli keeps your fixed hours in place and lets everything else move with you.
          </Text>
          <Button label="Get started" size="lg" block onPress={() => router.push('/onboarding')} />
          <View style={{ alignItems: 'center' }}>
            <Button
              label="Skip to the demo week"
              kind="ghost"
              onPress={() => {
                setDone(true);
                router.replace('/');
              }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
