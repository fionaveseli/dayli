import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Text } from '../components';
import { dayIndexOf, widgetView } from '../rules';
import { usePlan } from '../store';
import { hit } from '../theme';
import { widgetsAvailable } from './bridge';
import { MediumWidget, SmallWidget } from './WidgetPreview';

/** How the home screen widgets look right now, and how to add them. */
export function WidgetsScreen({ now: fixedNow }: { now?: Date }) {
  const router = useRouter();
  const plan = usePlan();
  const [now] = useState(() => fixedNow ?? new Date());
  const view = widgetView(plan, dayIndexOf(now), now.getHours() * 60 + now.getMinutes());
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <View style={{ gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{ minHeight: hit, justifyContent: 'center' }}
          >
            <Text tone="muted">‹ Back</Text>
          </Pressable>
          <Text variant="h1">Home screen widgets</Text>
          <Text tone="muted">
            Today&apos;s next thing and Don&apos;t forget, without opening the app.
          </Text>
        </View>

        <View style={{ gap: 10 }} accessibilityLabel="Small widget">
          <Text variant="h3">Small</Text>
          <SmallWidget view={view} />
        </View>
        <View style={{ gap: 10 }} accessibilityLabel="Medium widget">
          <Text variant="h3">Medium</Text>
          <MediumWidget view={view} />
        </View>

        <Card style={{ gap: 6 }}>
          <Text variant="h3">Add one</Text>
          <Text tone="muted">
            {widgetsAvailable
              ? 'Touch and hold your home screen, tap Edit or Widgets, and choose Dayli.'
              : 'Widgets come with the installed app. In Expo Go this is a preview of what they will show.'}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
