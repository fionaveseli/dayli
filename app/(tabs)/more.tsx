import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Text } from '../../src/components';
import { useOnboarded } from '../../src/onboarding';
import { useAuth, useSyncStatus } from '../../src/sync';

const STATUS = {
  off: '',
  syncing: 'Saving to your account…',
  synced: 'Saved to your account.',
  error: 'Could not reach your account. Your plan is safe on this phone and will sync later.',
};

export default function MoreScreen() {
  const router = useRouter();
  const { enabled, session, signOut } = useAuth();
  const status = useSyncStatus();
  const { setDone } = useOnboarded();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <Text variant="h1">More</Text>
        <Card>
          <View style={{ gap: 10 }}>
            <Text variant="h3">Account</Text>
            {session ? (
              <>
                <Text tone="muted">Signed in as {session.user.email}</Text>
                {status !== 'off' && <Text tone="muted">{STATUS[status]}</Text>}
                <Button label="Sign out" kind="secondary" onPress={signOut} />
              </>
            ) : (
              <>
                <Text tone="muted">
                  {enabled
                    ? 'Sign in to keep your plan safe and the same on every phone.'
                    : 'Sign-in is not set up yet.'}
                </Text>
                {enabled && <Button label="Sign in" onPress={() => router.push('/sign-in')} />}
              </>
            )}
          </View>
        </Card>
        <Card>
          <View style={{ gap: 10 }}>
            <Text variant="h3">Goals and milestones</Text>
            <Text tone="muted">Steps toward the bigger things.</Text>
            <Button label="Open goals" kind="secondary" onPress={() => router.push('/goals')} />
          </View>
        </Card>
        <Card>
          <View style={{ gap: 10 }}>
            <Text variant="h3">Settings</Text>
            <Text tone="muted">Hours, rest, autopilot, reminders and theme.</Text>
            <Button
              label="Open settings"
              kind="secondary"
              onPress={() => router.push('/settings')}
            />
          </View>
        </Card>
        <Card>
          <View style={{ gap: 10 }}>
            <Text variant="h3">Set up again</Text>
            <Text tone="muted">See the welcome and describe your week again.</Text>
            <Button
              label="Replay onboarding"
              kind="secondary"
              onPress={() => {
                setDone(false);
                router.push('/welcome');
              }}
            />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
