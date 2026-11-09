import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Text } from '../components';
import { chapterInfo, groupChapters } from '../rules';
import { usePlan } from '../store';
import { hit, spacing } from '../theme';
import { ChapterCard, todayKey } from './parts';

export function ChaptersScreen() {
  const router = useRouter();
  const plan = usePlan();
  const today = todayKey();
  const g = groupChapters(plan.chapters, today);
  const info = (c: (typeof plan.chapters)[number]) =>
    chapterInfo(c, plan.goals, plan.milestones, plan.tasks, today);
  const open = (id: string) => router.push({ pathname: '/chapter/[id]', params: { id } });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: spacing.lg, paddingBottom: 48 }}>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{ minHeight: hit, justifyContent: 'center' }}
          >
            <Text tone="muted">‹ More</Text>
          </Pressable>
          <Text variant="h1">Chapters</Text>
          <Text tone="muted">A stretch of time with its own goals and rhythm.</Text>
        </View>

        {plan.chapters.length === 0 && (
          <Card style={{ gap: 6 }}>
            <Text variant="h2">No chapters yet</Text>
            <Text tone="muted">
              A semester, a career sprint, a reset. Start one when a new stretch of life begins.
            </Text>
          </Card>
        )}

        {g.now.length > 0 && (
          <View style={{ gap: 14 }}>
            {g.now.map((c) => (
              <ChapterCard key={c.id} big chapter={info(c)} onPress={() => open(c.id)} />
            ))}
          </View>
        )}

        <View style={{ gap: 10 }}>
          <Text variant="h3">Coming up</Text>
          {g.next.map((c) => (
            <ChapterCard key={c.id} chapter={info(c)} onPress={() => open(c.id)} />
          ))}
          <Button
            label="Start a new chapter"
            kind="secondary"
            onPress={() => router.push('/new-chapter')}
          />
        </View>

        {g.past.length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="h3" style={{ flex: 1 }}>
                Earlier chapters
              </Text>
              <Text variant="small" tone="muted">
                {g.past.length}
              </Text>
            </View>
            {g.past.map((c) => (
              <ChapterCard key={c.id} chapter={info(c)} onPress={() => open(c.id)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
