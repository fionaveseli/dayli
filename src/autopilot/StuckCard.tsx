import { View } from 'react-native';

import { Button, Card, Text } from '../components';
import { decideStuck, fmtD, stuckOn, stuckText, type StuckChoice } from '../rules';
import { usePlan } from '../store';

/** A task that keeps moving forward asks whether it still matters, one at a time. */
export function StuckCard({ day }: { day: number }) {
  const plan = usePlan();
  const t = stuckOn(plan, day)[0];
  if (!t) return null;
  const { title, body } = stuckText(t);
  const choose = (c: StuckChoice) => plan.setTasks((ts) => decideStuck(ts, t.id, c));
  return (
    <Card accessibilityLabel="Stuck task" style={{ gap: 10 }}>
      <View>
        <Text variant="h3">{title}</Text>
        <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
          {`${body} It needs ${fmtD(t.dur)}.`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button label="Keep it today" size="sm" onPress={() => choose('keep')} />
        <Button label="Brain dump" kind="ghost" size="sm" onPress={() => choose('dump')} />
        <Button label="Let it go" kind="ghost" size="sm" onPress={() => choose('drop')} />
      </View>
    </Card>
  );
}
