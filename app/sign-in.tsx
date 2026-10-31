import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Segmented, Text } from '../src/components';
import { radii, useTheme } from '../src/theme';
import { useAuth } from '../src/sync';

export default function SignInScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();
  const { enabled, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const err = await (mode === 'in' ? signIn : signUp)(email, password);
      if (err) setMsg(err);
      else router.back();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, { backgroundColor: c.card, borderColor: c.line2, color: c.ink }];
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.wrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text variant="h1">{mode === 'in' ? 'Welcome back' : 'Make an account'}</Text>
        <Text tone="muted">
          Your plan is kept safe in your account and stays the same on every phone you sign in on.
        </Text>
        {!enabled && (
          <Text tone="muted">Sign-in is not set up yet: add the Supabase keys to .env.</Text>
        )}
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'in', label: 'Sign in' },
            { value: 'up', label: 'Create account' },
          ]}
        />
        <TextInput
          style={input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={c.faint}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password (8 or more characters)"
          placeholderTextColor={c.faint}
          secureTextEntry
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          textContentType={mode === 'in' ? 'password' : 'newPassword'}
        />
        {msg && <Text tone="ink2">{msg}</Text>}
        <Button
          label={busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
          block
          disabled={busy || !enabled || !email.includes('@') || password.length < 8}
          onPress={submit}
        />
        <View style={{ alignItems: 'center' }}>
          <Button label="Not now" kind="ghost" onPress={() => router.back()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 14 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    fontFamily: 'Figtree_400Regular',
    fontSize: 16,
  },
});
