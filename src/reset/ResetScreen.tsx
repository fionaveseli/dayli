import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadColor } from '../calendar/loadColor';
import { Button, Card, Chip, Text } from '../components';
import type { Task } from '../data/types';
import {
  CATS,
  DAYF,
  DAYS,
  dayInfo,
  fmtD,
  resetPreview,
  weekRange,
  type SlipChoice,
} from '../rules';
import { usePlan } from '../store';
import { mondayKey } from '../sync/dates';
import { fonts, hit, radii, spacing, toneColors, useTheme } from '../theme';

const CHOICES: { value: SlipChoice; label: string }[] = [
  { value: 'next', label: 'Next week' },
  { value: 'dump', label: 'Brain dump' },
  { value: 'drop', label: 'Let go' },
];

function Dot({ task }: { task: Task }) {
  const { colors: c } = useTheme();
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: toneColors(c, CATS[task.cat].tone).ink,
      }}
    />
  );
}

/** A two-minute weekly review: what slipped, next week proposed, approve. */
export function ResetScreen({ now: fixedNow }: { now?: Date }) {
  const router = useRouter();
  const plan = usePlan();
  const { colors: c } = useTheme();
  const [now] = useState(() => fixedNow ?? new Date());
  const [choices, setChoices] = useState<Record<string, SlipChoice>>({});
  const monday = mondayKey(now);

  const preview = useMemo(() => {
    let n = 0;
    return resetPreview(plan.dated, monday, now, choices, () => `preview${n++}`);
  }, [plan.dated, monday, now, choices]);
  const { review, proposal, nextMonday } = preview;
  const approved = plan.autopilot?.resetWeek === nextMonday;
  const moved = new Map(proposal.moves.map((m) => [m.t.id, m]));
  const sessions = new Set(proposal.sessions.map((t) => t.id));
  const total = review.done.length + review.slipped.length;
  const toDump = proposal.moves.filter((m) => m.to == null);

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
            <Text tone="muted">‹ Back</Text>
          </Pressable>
          <Text variant="h1">Sunday reset</Text>
          <Text tone="muted">Two minutes: look back, then approve next week.</Text>
        </View>

        {approved && (
          <View
            accessibilityLabel="Next week approved"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minHeight: hit,
              paddingHorizontal: 14,
              borderRadius: radii.lg,
              backgroundColor: c.sage,
            }}
          >
            <Ionicons name="checkmark" size={16} color={c.sageInk} />
            <Text variant="small" style={{ flex: 1, color: c.sageInk }}>
              Next week is set. Changes save as you go.
            </Text>
          </View>
        )}

        <Card style={{ gap: 12 }} accessibilityLabel="This week">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text variant="h3">This week</Text>
            <Text variant="small" tone="muted">
              {review.done.length} of {total} done · {fmtD(review.doneMin)}
            </Text>
          </View>
          {review.slipped.length === 0 ? (
            <Text tone="muted">Nothing slipped. That was a good week.</Text>
          ) : (
            <>
              <Text variant="label">What slipped</Text>
              {review.slipped.map((t) => {
                const pick = choices[t.id] ?? 'next';
                const m = moved.get(t.id);
                return (
                  <View key={t.id} style={{ gap: 8 }} accessibilityLabel={`Slipped ${t.title}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Dot task={t} />
                      <Text style={{ flex: 1, fontFamily: fonts.uiSemi }}>{t.title}</Text>
                      <Text variant="small" tone="muted">
                        {DAYS[t.day as number]} · {fmtD(t.dur)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {CHOICES.map((o) => (
                        <Chip
                          key={o.value}
                          label={o.label}
                          on={pick === o.value}
                          onPress={() => setChoices((cs) => ({ ...cs, [t.id]: o.value }))}
                        />
                      ))}
                    </View>
                    {m && (
                      <Text variant="small" tone="muted">
                        {m.to != null ? `→ ${DAYF[m.to]}. ` : '→ Brain dump. '}
                        {m.why}.
                      </Text>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </Card>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text variant="h2">Next week</Text>
            <Text variant="small" tone="muted">
              {weekRange(nextMonday)}
            </Text>
          </View>
          {proposal.sessions.length > 0 && (
            <Text variant="small" tone="muted">
              {proposal.sessions.length} rhythm{' '}
              {proposal.sessions.length === 1 ? 'session' : 'sessions'} placed on the lightest days.
            </Text>
          )}
          {DAYF.map((name, d) => {
            const i = dayInfo(proposal.next, d);
            const rest = d === proposal.next.settings.restDay;
            return (
              <Card key={name} style={{ gap: 8, padding: 14 }} accessibilityLabel={name}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text variant="h3" style={{ flex: 1 }}>
                    {name}
                  </Text>
                  <Text variant="small" tone="muted">
                    {fmtD(i.planned)} of {fmtD(i.free)}
                  </Text>
                  <Text
                    variant="small"
                    style={{ color: loadColor(c, i.load.k), fontFamily: fonts.uiSemi }}
                  >
                    {i.load.label}
                  </Text>
                </View>
                {i.fixed.length > 0 && (
                  <Text variant="small" tone="muted">
                    {i.fixed.map((f) => f.title).join(' · ')}
                  </Text>
                )}
                {i.flex.map((t) => (
                  <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Dot task={t} />
                    <Text style={{ flex: 1 }}>{t.title}</Text>
                    <Text variant="small" tone="muted">
                      {moved.has(t.id)
                        ? 'From this week · '
                        : sessions.has(t.id)
                          ? 'Rhythm · '
                          : ''}
                      {fmtD(t.dur)}
                    </Text>
                  </View>
                ))}
                {i.flex.length === 0 && (
                  <Text variant="small" tone="faint">
                    {rest ? 'Rest day. Rest counts.' : 'Nothing planned yet.'}
                  </Text>
                )}
              </Card>
            );
          })}
          {toDump.length > 0 && (
            <Text variant="small" tone="muted">
              {toDump.map((m) => m.t.title).join(', ')} {toDump.length === 1 ? 'waits' : 'wait'} in
              the brain dump: no day next week has room.
            </Text>
          )}
        </View>

        {approved ? (
          <Button label="Done" onPress={() => router.back()} />
        ) : (
          <View style={{ gap: 8 }}>
            <Button
              label="Approve next week"
              onPress={() => {
                plan.approveReset(now, choices);
                router.back();
              }}
            />
            <Button
              label="Not this week"
              kind="ghost"
              onPress={() => {
                plan.skipReset();
                router.back();
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
