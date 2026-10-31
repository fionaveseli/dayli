import { View } from 'react-native';

import { Button, Card, Text } from '../components';
import { DAYS, fmtD, rolloverFor } from '../rules';
import { usePlan } from '../store';

/** Shown instead of moving things silently when the user chose to be asked first. */
export function RolloverAsk({ now }: { now: Date }) {
  const plan = usePlan();
  if (!plan.settings.autoRoll || !plan.settings.rollAsk) return null;
  const r = rolloverFor(plan, now);
  if (!r.through || r.moves.length === 0) return null;
  const n = r.moves.length;
  return (
    <Card accessibilityLabel="Unfinished tasks" style={{ gap: 10 }}>
      <Text variant="h3">
        {n} unfinished {n === 1 ? 'task' : 'tasks'} from earlier
      </Text>
      <View style={{ gap: 4 }}>
        {r.moves.map((m) => (
          <Text key={m.t.id} variant="small" tone="muted">
            {m.t.title} · {fmtD(m.t.dur)} → {m.to != null ? DAYS[m.to] : 'Brain dump'}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="Move them" size="sm" onPress={() => plan.runRollover(now)} />
        <Button
          label="Leave them"
          kind="ghost"
          size="sm"
          onPress={() => plan.skipRollover(r.through!)}
        />
      </View>
    </Card>
  );
}
