import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Text } from '../components';
import { useEditor } from '../editor';
import { CATS, chapterInfo, fmtD, fmtDue, fmtRange } from '../rules';
import { usePlan } from '../store';
import { fonts, hit, radii, spacing, toneColors, useTheme } from '../theme';
import { TaskRow } from '../today/rows';
import { Bar, todayKey } from './parts';

export function ChapterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = usePlan();
  const { openEditor } = useEditor();
  const { colors: c } = useTheme();
  const today = todayKey();
  const chapter = plan.chapters.find((x) => x.id === id);

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => router.back()}
      style={{ minHeight: hit, justifyContent: 'center' }}
    >
      <Text tone="muted">‹ Chapters</Text>
    </Pressable>
  );
  if (!chapter) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 20, gap: 12 }}>
          {back}
          <Text variant="h2">This chapter is gone</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ci = chapterInfo(chapter, plan.goals, plan.milestones, plan.tasks, today);
  const tone = toneColors(c, chapter.color);
  const kind = { now: 'Current chapter', next: 'Next chapter', past: 'Closed' }[ci.status];
  const goalIds = new Set(ci.goals.map((g) => g.id));
  const upcoming = plan.tasks
    .filter((t) => t.goal && goalIds.has(t.goal) && !t.done && t.day != null && t.day >= 0)
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
    .slice(0, 6);
  const milestones = ci.goals
    .flatMap((g) => g.milestones.filter((m) => m.state !== 'done').map((m) => ({ m, g })))
    .slice(0, 4);
  const loose = plan.goals.filter((g) => g.chapterId !== chapter.id);
  const setGoalChapter = (goalId: string, chapterId: string | null) =>
    plan.setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, chapterId } : g)));

  const stats: [string, string][] = [
    [
      String(ci.status === 'now' ? ci.left : ci.status === 'next' ? ci.startsIn : ci.total),
      ci.status === 'now' ? 'days left' : ci.status === 'next' ? 'days to go' : 'days long',
    ],
    [`${Math.round(ci.tp * 100)}%`, 'of the time'],
    [`${ci.milestonesDone}/${ci.milestonesTotal}`, 'milestones'],
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: spacing.lg, paddingBottom: 48 }}>
        {back}
        <View style={{ backgroundColor: tone.bg, borderRadius: radii.xl, padding: 22, gap: 12 }}>
          <Text variant="small" style={{ color: tone.ink, fontFamily: fonts.uiSemi }}>
            {fmtRange(chapter.start, chapter.end, today)} · {kind}
          </Text>
          <Text variant="h1" style={{ color: c.ink }}>
            {chapter.name}
          </Text>
          {chapter.desc ? <Text tone="ink2">{chapter.desc}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {stats.map(([n, label]) => (
              <View
                key={label}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: radii.md,
                  backgroundColor: 'rgba(255,255,255,.5)',
                }}
              >
                <Text variant="h2" style={{ color: '#20242C' }}>
                  {n}
                </Text>
                <Text variant="small" style={{ color: '#4B4F58' }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <Bar p={ci.tp} height={8} track="rgba(255,255,255,.6)" fill={tone.ink} />
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="h3" style={{ flex: 1 }}>
              Goals
            </Text>
            <Text variant="small" tone="muted">
              {ci.goals.length}
            </Text>
          </View>
          {ci.goals.map((g) => (
            <View
              key={g.id}
              style={{
                gap: 8,
                padding: 16,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: c.line,
                backgroundColor: c.card,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open goal ${g.title}`}
                onPress={() => router.push('/goals')}
                style={{ minHeight: hit - 12, justifyContent: 'center', gap: 8 }}
              >
                <Text variant="h3">{g.title}</Text>
                <Bar p={g.p} track={c.line} fill={toneColors(c, CATS[g.cat].tone).ink} />
                <Text variant="small" tone="muted">
                  {g.stepsDone} of {g.steps} steps done ·{' '}
                  {g.next ? `next: ${g.next.title}` : 'all milestones reached'}
                </Text>
              </Pressable>
              <Button
                label="Remove from chapter"
                kind="ghost"
                size="sm"
                onPress={() => setGoalChapter(g.id, null)}
              />
            </View>
          ))}
          {ci.goals.length === 0 && (
            <Card style={{ gap: 6 }}>
              <Text variant="h3">No goals yet</Text>
              <Text tone="muted">
                {ci.status === 'past'
                  ? 'This chapter was about rhythm, not targets.'
                  : 'Add a goal when you know what this chapter is for.'}
              </Text>
            </Card>
          )}
          {ci.status !== 'past' && loose.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text variant="small" tone="muted">
                Add a goal to this chapter
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {loose.map((g) => (
                  <Chip
                    key={g.id}
                    label={`+ ${g.short || g.title}`}
                    tone={CATS[g.cat].tone}
                    onPress={() => setGoalChapter(g.id, chapter.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {chapter.rhythm.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text variant="h3">Weekly rhythm</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {chapter.rhythm.map((r, i) => {
                const t = toneColors(c, CATS[r.cat].tone);
                return (
                  <View
                    key={i}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: t.bg,
                    }}
                  >
                    <Text variant="small" style={{ color: c.ink, fontFamily: fonts.uiSemi }}>
                      {r.title}{' '}
                      <Text variant="small" style={{ color: t.ink }}>
                        {r.freq}× · {fmtD(r.dur)}
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {upcoming.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text variant="h3">Coming up this week</Text>
            {upcoming.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={() => plan.toggleTask(t.id)}
                onOpen={() => openEditor({ kind: 'flex', id: t.id })}
              />
            ))}
          </View>
        )}

        {milestones.length > 0 && (
          <Card style={{ gap: 12 }}>
            <Text variant="h3">Next milestones</Text>
            {milestones.map(({ m, g }) => (
              <View key={m.id}>
                <Text style={{ fontFamily: fonts.uiSemi }}>{m.title}</Text>
                <Text variant="small" tone="muted">
                  {g.short || g.title} · by {fmtDue(m.due)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <Card style={{ gap: 10 }}>
          <Text variant="h3">About this chapter</Text>
          <Text tone="muted">{chapter.desc || 'No description yet.'}</Text>
          {chapter.summary ? (
            <Text style={{ fontFamily: fonts.uiSemi }}>{chapter.summary}</Text>
          ) : null}
        </Card>

        <Button
          label="Delete this chapter"
          kind="danger"
          onPress={() => {
            plan.deleteChapter(chapter.id);
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
