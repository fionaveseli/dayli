import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Text } from '../components';
import { resetDue } from '../rules';
import { usePlan } from '../store';
import { mondayKey } from '../sync/dates';

function Offer() {
  const router = useRouter();
  const plan = usePlan();
  return (
    <Card accessibilityLabel="Sunday reset" style={{ gap: 10 }}>
      <View>
        <Text variant="h3">Sunday reset</Text>
        <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
          Two minutes: what slipped this week, and next week proposed for you to approve.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="Start the reset" size="sm" onPress={() => router.push('/reset')} />
        <Button label="Not this week" kind="ghost" size="sm" onPress={plan.skipReset} />
      </View>
    </Card>
  );
}

/** On Sundays, offers the weekly review until next week is set up or skipped. */
export function ResetCard({ now }: { now: Date }) {
  const plan = usePlan();
  if (!resetDue(plan, now, mondayKey(now))) return null;
  return <Offer />;
}
