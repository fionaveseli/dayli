import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '../../src/components';
import { useEditor } from '../../src/editor';
import { QuickAdd } from '../../src/quickadd';
import { dayIndexOf } from '../../src/rules';

export default function AddScreen() {
  const { openEditor } = useEditor();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        <Text variant="h1">Add</Text>
        <QuickAdd day={dayIndexOf(new Date())} />
        <Text tone="muted">Or choose what you&apos;re adding</Text>
        <Button label="Flexible task" onPress={() => openEditor(null, { kind: 'flex' })} />
        <Button
          label="Fixed commitment"
          kind="secondary"
          onPress={() => openEditor(null, { kind: 'fixed' })}
        />
        <Button
          label="Reminder"
          kind="secondary"
          onPress={() => openEditor(null, { kind: 'rem' })}
        />
      </View>
    </SafeAreaView>
  );
}
