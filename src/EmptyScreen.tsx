import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from './components';

export function EmptyScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text variant="h1">{title}</Text>
      </View>
    </SafeAreaView>
  );
}
