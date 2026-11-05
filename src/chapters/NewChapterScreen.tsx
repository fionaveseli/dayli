import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '../components';
import type { Chapter } from '../data/types';
import {
  CHAPTER_TEMPLATES,
  chapterFormOk,
  daysBetween,
  endAfterMonths,
  fmtRange,
  validDue,
} from '../rules';
import { usePlan } from '../store';
import { fonts, hit, radii, spacing, toneColors, useTheme } from '../theme';
import { SWATCHES, todayKey } from './parts';

const STEPS = ['New chapter', 'Name and dates', 'Make it yours'];

export function NewChapterScreen() {
  const router = useRouter();
  const plan = usePlan();
  const { colors: c } = useTheme();
  const today = todayKey();
  const [step, setStep] = useState(0);
  const [tpl, setTpl] = useState<string | null>(null);
  const [f, setF] = useState<{
    name: string;
    start: string;
    end: string;
    desc: string;
    color: Chapter['color'];
  }>({ name: '', start: today, end: endAfterMonths(today, 3), desc: '', color: 'lav' });
  const set = (p: Partial<typeof f>) => setF((o) => ({ ...o, ...p }));

  const choose = (key: string) => {
    const t = CHAPTER_TEMPLATES.find((x) => x.key === key)!;
    setTpl(key);
    setF((o) => ({
      ...o,
      name: t.name,
      desc: t.desc,
      color: t.color,
      end: validDue(o.start) ? endAfterMonths(o.start, t.months) : o.end,
    }));
  };
  const ok = [!!tpl, chapterFormOk(f), true][step];
  const datesOk = validDue(f.start) && validDue(f.end) && f.end > f.start;
  const days = datesOk ? daysBetween(f.start, f.end) + 1 : 0;

  const create = () => {
    const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    plan.setChapters((cs) => [
      ...cs,
      {
        id,
        name: f.name.trim(),
        start: f.start,
        end: f.end,
        color: f.color,
        desc: f.desc.trim() || 'A new chapter.',
        summary: '',
        rhythm: [],
      },
    ]);
    router.replace({ pathname: '/chapter/[id]', params: { id } });
  };

  const input = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    ph: string,
    multi = false,
  ) => (
    <View style={{ gap: 6 }}>
      <Text variant="label" tone="ink2">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={ph}
        placeholderTextColor={c.faint}
        multiline={multi}
        style={{
          minHeight: multi ? 88 : hit,
          borderWidth: 1,
          borderColor: c.line2,
          borderRadius: radii.md,
          backgroundColor: c.card,
          paddingHorizontal: 14,
          paddingVertical: multi ? 12 : 0,
          textAlignVertical: multi ? 'top' : 'center',
          color: c.ink,
          fontFamily: fonts.ui,
          fontSize: 15,
        }}
      />
    </View>
  );

  const tone = toneColors(c, f.color);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: spacing.lg, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => router.back()}
            style={{ minHeight: hit, justifyContent: 'center' }}
          >
            <Text tone="muted">‹ Cancel</Text>
          </Pressable>
          <Text variant="h1">{STEPS[step]}</Text>
          <Text variant="small" tone="muted">
            Step {step + 1} of 3
          </Text>
        </View>

        {step === 0 && (
          <View style={{ gap: 10 }}>
            <Text tone="muted">Pick a starting point. You can change everything.</Text>
            {CHAPTER_TEMPLATES.map((t) => {
              const tc = toneColors(c, t.color);
              return (
                <Pressable
                  key={t.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: tpl === t.key }}
                  onPress={() => choose(t.key)}
                  style={{
                    minHeight: 84,
                    padding: 16,
                    gap: 4,
                    borderRadius: radii.lg,
                    backgroundColor: tc.bg,
                    borderWidth: 2,
                    borderColor: tpl === t.key ? tc.ink : 'transparent',
                  }}
                >
                  <Text variant="h3" style={{ color: c.ink }}>
                    {t.label}
                  </Text>
                  <Text variant="small" style={{ color: tc.ink, fontFamily: fonts.uiSemi }}>
                    {t.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: spacing.md }}>
            {input('Name', f.name, (name) => set({ name }), 'The Remote Job Era')}
            {input('Starts', f.start, (start) => set({ start }), '2026-11-05')}
            {input('Ends', f.end, (end) => set({ end }), '2027-02-04')}
            {datesOk ? (
              <Text variant="small" tone="muted">
                {days} days, about {Math.round(days / 7)} weeks.
              </Text>
            ) : (
              <Text variant="small" tone="muted">
                Write dates as year-month-day, like 2027-01-31. The end comes after the start.
              </Text>
            )}
            {input(
              'What is this chapter about?',
              f.desc,
              (desc) => set({ desc }),
              'In a few words, what should this stretch of time be for?',
              true,
            )}
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: spacing.md }}>
            <Text variant="label" tone="ink2">
              Colour
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {SWATCHES.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityLabel={s}
                  accessibilityState={{ selected: f.color === s }}
                  onPress={() => set({ color: s })}
                  hitSlop={2}
                  style={{
                    width: hit,
                    height: hit,
                    borderRadius: hit / 2,
                    backgroundColor: toneColors(c, s).bg,
                    borderWidth: 2,
                    borderColor: f.color === s ? toneColors(c, s).ink : 'transparent',
                  }}
                />
              ))}
            </View>
            <View
              style={{ backgroundColor: tone.bg, borderRadius: radii.xl, padding: 22, gap: 10 }}
            >
              <Text variant="small" style={{ color: tone.ink, fontFamily: fonts.uiSemi }}>
                {datesOk ? fmtRange(f.start, f.end, today) : ''}
              </Text>
              <Text variant="title" style={{ color: c.ink }}>
                {f.name || 'Untitled chapter'}
              </Text>
              {f.desc ? <Text tone="ink2">{f.desc}</Text> : null}
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          {step > 0 && <Button label="Back" kind="ghost" onPress={() => setStep(step - 1)} />}
          {step < 2 ? (
            <Button label="Continue" disabled={!ok} onPress={() => setStep(step + 1)} />
          ) : (
            <Button label="Create chapter" onPress={create} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
