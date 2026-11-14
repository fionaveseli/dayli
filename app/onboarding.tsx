import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Text } from '../src/components';
import {
  applyRoutine,
  EXAMPLE,
  readRoutine,
  routineIssues,
  RoutineError,
  spreadPlan,
  useOnboarded,
  type Routine,
} from '../src/onboarding';
import { CATS, DAYF, daysLabel, fmtD, fmtT } from '../src/rules';
import { usePlan } from '../src/store';
import { fonts, radii, toneColors, useTheme } from '../src/theme';
import { VoiceRecorder } from '../src/voice';

type Step = 'write' | 'reading' | 'review';
type Mode = 'type' | 'voice';
const MODES: { value: Mode; icon: 'create-outline' | 'mic-outline'; label: string }[] = [
  { value: 'type', icon: 'create-outline', label: 'Type my routine' },
  { value: 'voice', icon: 'mic-outline', label: 'Record a voice note' },
];
const READING = [
  'Finding your fixed hours',
  'Counting the free time around them',
  'Spreading activities across the week',
  'Checking for crowded days',
];

export default function OnboardingScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();
  const store = usePlan();
  const { setDone } = useOnboarded();
  const [step, setStep] = useState<Step>('write');
  const [mode, setMode] = useState<Mode>('type');
  const [text, setText] = useState('');
  // Voice: the transcript, once there is one. It is shown for editing before it is used.
  const [heard, setHeard] = useState<string | null>(null);
  const words = mode === 'voice' ? (heard ?? '') : text;
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (step !== 'reading') return;
    const i = setInterval(() => setTick((t) => Math.min(t + 1, READING.length)), 900);
    return () => clearInterval(i);
  }, [step]);

  const build = async () => {
    setError(null);
    setTick(0);
    setStep('reading');
    try {
      setRoutine(await readRoutine(words.trim()));
      setStep('review');
    } catch (e) {
      setError(e instanceof RoutineError ? e.message : 'Something went wrong. Try again.');
      setStep('write');
    }
  };

  const approve = () => {
    if (!routine) return;
    const today = (new Date().getDay() + 6) % 7;
    store.apply((p) => applyRoutine(p, routine, today));
    setDone(true);
    router.replace('/');
  };
  const skip = () => {
    setDone(true);
    router.replace('/');
  };

  if (step === 'reading')
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.center}>
          <Text variant="h1" style={{ textAlign: 'center' }}>
            Putting your week on paper…
          </Text>
          <View style={{ gap: 10 }} accessibilityLiveRegion="polite">
            {READING.map((s, i) => (
              <Text key={s} tone={tick > i ? 'ink' : 'muted'}>
                {tick > i ? '✓  ' : '○  '}
                {s}
              </Text>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );

  if (step === 'review' && routine)
    return (
      <Review
        routine={routine}
        setRoutine={setRoutine}
        onApprove={approve}
        onBack={() => setStep('write')}
      />
    );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text variant="small" tone="muted">
            Step 1 of 2
          </Text>
          <Text variant="h1">Tell me what your life looks like.</Text>
          <Text tone="ink2">
            Write it or say it the way you&apos;d tell a friend: your work hours, classes, workouts,
            side projects. I&apos;ll sort what&apos;s fixed from what can move.
          </Text>
          <View
            accessibilityRole="tablist"
            accessibilityLabel="How do you want to tell Dayli"
            style={styles.modes}
          >
            {MODES.map((m) => {
              const on = mode === m.value;
              return (
                <Pressable
                  key={m.value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setMode(m.value)}
                  style={[
                    styles.mode,
                    { backgroundColor: c.card, borderColor: on ? c.ink : c.line },
                    on && { borderWidth: 2, padding: 9 },
                  ]}
                >
                  <Ionicons name={m.icon} size={18} color={on ? c.ink : c.muted} />
                  <Text variant="small" style={{ fontFamily: fonts.uiSemi, flex: 1 }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {mode === 'type' ? (
            <>
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Describe your week"
                placeholder={
                  'For example: "I work 9 to 5, Monday to Friday. I want to go to the gym four times a week and work on my portfolio twice a week."'
                }
                placeholderTextColor={c.faint}
                style={[
                  styles.input,
                  { backgroundColor: c.card, borderColor: c.line2, color: c.ink },
                ]}
              />
              <Text variant="small" tone="muted">
                Mention fixed hours and how often you&apos;d like to do things.
              </Text>
            </>
          ) : heard === null ? (
            <VoiceRecorder onText={setHeard} />
          ) : (
            <View style={{ gap: 8 }}>
              <Text variant="label" tone="muted">
                What I heard
              </Text>
              <TextInput
                value={heard}
                onChangeText={setHeard}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Transcript"
                style={[
                  styles.input,
                  { minHeight: 160, backgroundColor: c.card, borderColor: c.line2, color: c.ink },
                ]}
              />
              <Text variant="small" tone="muted">
                Fix anything I misheard before building your week.
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Button
                  label="Record again"
                  kind="ghost"
                  size="sm"
                  onPress={() => setHeard(null)}
                />
              </View>
            </View>
          )}
          {error && <Text tone="ink2">{error}</Text>}
          {mode === 'type' && !text && (
            <Button label="Use an example" kind="soft" size="sm" onPress={() => setText(EXAMPLE)} />
          )}
          <Button
            label="Build my week"
            size="lg"
            block
            disabled={words.trim().length < 8}
            onPress={build}
          />
          <View style={{ alignItems: 'center' }}>
            <Button label="I'll add things myself" kind="ghost" onPress={skip} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Review({
  routine,
  setRoutine,
  onApprove,
  onBack,
}: {
  routine: Routine;
  setRoutine: (r: Routine) => void;
  onApprove: () => void;
  onBack: () => void;
}) {
  const { colors: c } = useTheme();
  const { settings } = usePlan();
  const sp = spreadPlan(routine, settings);
  const free = sp.cap.reduce((a, b) => a + b, 0);
  const planned = sp.used.reduce((a, b) => a + b, 0);
  const issues = routineIssues(routine, settings, fmtD, DAYF);
  const empty = !routine.fixed.length && !routine.flex.length;

  const row = (
    key: string,
    title: string,
    sub: string,
    tone: ReturnType<typeof toneColors> | null,
    onRemove: () => void,
    extra?: React.ReactNode,
  ) => (
    <View
      key={key}
      style={[
        styles.row,
        { backgroundColor: c.card, borderColor: c.line },
        tone && { borderLeftColor: tone.ink, borderLeftWidth: 4 },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h3">{title}</Text>
        <Text variant="small" tone="muted">
          {sub}
        </Text>
        {extra}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title}`}
        onPress={onRemove}
        style={styles.x}
      >
        <Text tone="muted">✕</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text variant="small" tone="muted">
          Step 2 of 2
        </Text>
        <Text variant="h1">Here&apos;s your week, as I understood it.</Text>
        <Text tone="ink2">
          Nothing is saved yet. Remove what&apos;s wrong, then approve. You can fine-tune times
          afterwards.
        </Text>

        <Card style={{ gap: 6 }}>
          <Text variant="label" tone="muted">
            What I heard
          </Text>
          <Text tone="ink2">{routine.text}</Text>
        </Card>

        <Text variant="h2">Fixed commitments</Text>
        {routine.fixed.length === 0 && <Text tone="muted">No fixed commitments.</Text>}
        {routine.fixed.map((f) =>
          row(
            f.id,
            f.title,
            `${daysLabel(f.days)} · ${fmtT(f.start)}–${fmtT(f.end)}${f.where ? ' · ' + f.where : ''}`,
            toneColors(c, CATS[f.cat].tone),
            () => setRoutine({ ...routine, fixed: routine.fixed.filter((x) => x.id !== f.id) }),
          ),
        )}

        <Text variant="h2">Flexible activities</Text>
        {routine.flex.length === 0 && <Text tone="muted">Nothing flexible.</Text>}
        {routine.flex.map((x) =>
          row(
            x.id,
            x.title,
            `${x.freq}× a week · about ${fmtD(x.dur)} each`,
            toneColors(c, CATS[x.cat].tone),
            () => setRoutine({ ...routine, flex: routine.flex.filter((y) => y.id !== x.id) }),
            <View style={styles.stepper}>
              {[-1, 1].map((d) => (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={d < 0 ? `Fewer ${x.title}` : `More ${x.title}`}
                  onPress={() =>
                    setRoutine({
                      ...routine,
                      flex: routine.flex.map((y) =>
                        y.id === x.id ? { ...y, freq: Math.min(7, Math.max(1, y.freq + d)) } : y,
                      ),
                    })
                  }
                  style={[styles.stepBtn, { borderColor: c.line2 }]}
                >
                  <Text>{d < 0 ? '−' : '+'}</Text>
                </Pressable>
              ))}
            </View>,
          ),
        )}

        <Text variant="h2">Things to remember</Text>
        {routine.reminders.length === 0 && <Text tone="muted">No reminders.</Text>}
        {routine.reminders.map((m) =>
          row(
            m.id,
            m.title,
            `${daysLabel(m.days)} · ${fmtT(m.time)}${
              m.leave
                ? ` · leave at ${fmtT(m.time - m.lead)}`
                : m.lead
                  ? ` · ${fmtD(m.lead)} before`
                  : ''
            }`,
            null,
            () =>
              setRoutine({ ...routine, reminders: routine.reminders.filter((y) => y.id !== m.id) }),
          ),
        )}

        <Card style={{ gap: 4 }}>
          <Text variant="h3">
            {Math.round(free / 60)}h free · {(planned / 60).toFixed(1).replace('.0', '')}h planned
          </Text>
          <Text variant="small" tone="muted">
            Each week, after fixed hours and breathing room.
          </Text>
        </Card>
        {issues.map((i) => (
          <Card
            key={i.id}
            style={{ backgroundColor: i.tone === 'over' ? c.overBg : c.warnBg, gap: 4 }}
          >
            <Text variant="h3">{i.title}</Text>
            <Text tone="ink2">{i.body}</Text>
          </Card>
        ))}

        <Button label="Approve plan" size="lg" block disabled={empty} onPress={onApprove} />
        <View style={{ alignItems: 'center' }}>
          <Button label="Start over" kind="ghost" onPress={onBack} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 14 },
  modes: { flexDirection: 'row', gap: 8 },
  mode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    padding: 10,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26, padding: 24 },
  input: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    fontFamily: fonts.ui,
    fontSize: 16.5,
    lineHeight: 26,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    gap: 8,
  },
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', margin: -10 },
  stepper: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stepBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
