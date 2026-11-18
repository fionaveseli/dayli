import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Text } from '../components';
import { usePlan } from '../store';
import { mondayKey } from '../sync/dates';
import { CsvPicker, type PickedFile } from './CsvPicker';
import { addImported } from './csv';

export function ImportScreen() {
  const router = useRouter();
  const { dated, setDated } = usePlan();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const n = file?.fixed.length ?? 0;

  const add = () => {
    if (!file) return;
    const items = file.fixed;
    const monday = mondayKey(new Date());
    setAdded(addImported(dated, items, monday).added);
    setDated((d) => addImported(d, items, monday).plan);
    setFile(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="h1">Import a CSV</Text>
          <Button label="Done" kind="secondary" onPress={() => router.back()} />
        </View>
        <Text tone="ink2">
          Bring in a timetable or a calendar export. Everything comes in as fixed commitments, and
          nothing is added until you say so.
        </Text>
        {added != null && (
          <Card style={{ gap: 4 }}>
            <Text variant="h3" accessibilityLiveRegion="polite">
              {added === 0
                ? 'Those were already in your plan.'
                : `Added ${added} ${added === 1 ? 'commitment' : 'commitments'}.`}
            </Text>
            <Text variant="small" tone="muted">
              You&apos;ll find them in Today and the calendar. Tap one there to change it.
            </Text>
          </Card>
        )}
        <CsvPicker
          file={file}
          onChange={(f) => {
            setFile(f);
            if (f) setAdded(null);
          }}
        />
        {file && (
          <Button
            label={n === 1 ? 'Add 1 commitment' : `Add ${n} commitments`}
            size="lg"
            block
            disabled={n === 0}
            onPress={add}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
