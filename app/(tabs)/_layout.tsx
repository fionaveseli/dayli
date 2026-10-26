import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { fonts, useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline' },
  { name: 'calendar', title: 'Calendar', icon: 'calendar-outline' },
  { name: 'add', title: 'Add', icon: 'add-circle-outline' },
  { name: 'tasks', title: 'Tasks', icon: 'checkbox-outline' },
  { name: 'more', title: 'More', icon: 'ellipsis-horizontal' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.uiSemi, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={t.icon} size={size} color={color as string} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
