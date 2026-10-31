import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, Text } from '../components';
import { DAYF, dateKey, fmtD, fmtT, planLine, planSummary } from '../rules';
import { fonts, radii, useTheme } from '../theme';
import { usePlan } from '../store';
import type { DayIndex } from '../data/types';

/** Today's plan, made at the plan time, to approve with one tap. */
export function MorningPlan({ day, now }: { day: DayIndex; now: Date }) {
  const plan = usePlan();
  const { colors: c } = useTheme();
  const a = plan.autopilot?.approved;

  if (a && a.date === dateKey(now)) {
    return (
      <View
        accessibilityLabel="Plan approved"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: radii.lg,
          backgroundColor: c.sage,
        }}
      >
        <Ionicons name="checkmark" size={16} color={c.sageInk} />
        <Text variant="small" style={{ flex: 1, color: c.sageInk }}>
          Today&apos;s plan approved at {fmtT(a.at)}. Changes save as you go.
        </Text>
        <Button label="Review" kind="ghost" size="sm" onPress={plan.unapprovePlan} />
      </View>
    );
  }

  const s = planSummary(plan, day);
  return (
    <Card accessibilityLabel="Your plan for today" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">Your plan for today</Text>
          <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
            Made at {fmtT(plan.settings.planTime)}. Approve it or change what you like.
          </Text>
        </View>
        <Text variant="small" style={{ color: c.warn, fontFamily: fonts.uiSemi }}>
          To approve
        </Text>
      </View>
      <Text>{planLine(s)}</Text>

      {s.over && s.suggest ? (
        <View
          style={{ backgroundColor: c.warnBg, borderRadius: radii.md, padding: 14, gap: 8 }}
          accessibilityRole="alert"
        >
          <Text variant="h3">That&apos;s more than fits today</Text>
          <Text variant="small">
            {fmtD(s.left)} planned, {fmtD(s.free)} free.{' '}
            {s.target != null
              ? `Move “${s.suggest.title}” to ${DAYF[s.target]}?`
              : 'Move something to the brain dump?'}
          </Text>
          <Button
            kind="secondary"
            size="sm"
            label={s.target != null ? `Move to ${DAYF[s.target]}` : 'Move to brain dump'}
            onPress={() => plan.moveTask(s.suggest!.id, s.target)}
          />
        </View>
      ) : (
        <Text variant="small" style={{ color: c.sageInk, fontFamily: fonts.uiSemi }}>
          It all fits, with {fmtD(Math.max(0, s.free - s.left))} to spare.
        </Text>
      )}

      <Button label="Looks good" onPress={() => plan.approvePlan(now)} />
    </Card>
  );
}
