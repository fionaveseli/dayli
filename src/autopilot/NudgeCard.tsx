import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '../components';
import { fmtT, nudgeNow, nudgeText, type Nudge } from '../rules';
import { usePlan } from '../store';

/** "You have a free hour now and the case study fits": start it now, or let it be. */
export function NudgeCard({ day, now }: { day: number; now: number }) {
  const plan = usePlan();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const n: Nudge | null = nudgeNow(plan, day, now);
  if (!n || dismissed === n.task.id) return null;
  const { title, body } = nudgeText(n);
  return (
    <Card accessibilityLabel="Free time now" style={{ gap: 10 }}>
      <View>
        <Text variant="h3">{title}</Text>
        <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
          {`${body} Free until ${fmtT(n.e)}.`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          label="Start it now"
          size="sm"
          onPress={() => plan.placeTask(n.task.id, day, now)}
        />
        <Button label="Not now" kind="ghost" size="sm" onPress={() => setDismissed(n.task.id)} />
      </View>
    </Card>
  );
}
