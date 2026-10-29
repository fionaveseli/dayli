import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Segmented, Text, Toggle } from '../components';
import { CATS, DAYS, fmtD, fmtT } from '../rules';
import { fonts, hit, radii, spacing, useTheme } from '../theme';
import type { Category } from '../data/types';
import { usePlan } from '../store';
import {
  blankForm,
  canSave,
  deleteTarget,
  formFor,
  saveForm,
  type EditorTarget,
  type Form,
  type Kind,
} from './form';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'flex', label: 'Flexible' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'rem', label: 'Reminder' },
];
const HELP: Record<Kind, string> = {
  flex: 'Do it whenever there’s time. Dayli won’t pin it to a clock unless you do.',
  fixed: 'Has an exact time, like a class, a shift, or a booked session.',
  rem: 'A small thing you mustn’t forget. Dayli nudges you at the right moment.',
};
const DURATIONS = [15, 30, 45, 60, 90, 120];
const LEADS = [0, 10, 15, 30, 60];
const WHEN: { day: number | null; label: string }[] = [
  { day: 0, label: 'Today' },
  { day: 1, label: 'Tomorrow' },
  ...[2, 3, 4, 5, 6].map((d) => ({ day: d, label: DAYS[d] })),
  { day: null, label: 'Someday' },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label" tone="ink2">
        {label}
      </Text>
      {children}
      {hint ? (
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function Chips({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

function Switch({
  title,
  sub,
  value,
  onChange,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        <Text variant="small" tone="muted">
          {sub}
        </Text>
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

/** A time in 5-minute steps, set with − and +. No picker library needed. */
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (m: number) => void;
}) {
  const { colors: c } = useTheme();
  const step = (d: number) => onChange(Math.min(1435, Math.max(0, value + d)));
  const btn = (name: 'remove' | 'add', d: number, l: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${l} ${label}`}
      onPress={() => step(d)}
      style={{ width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={name} size={20} color={c.ink} />
    </Pressable>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: c.line2,
        borderRadius: radii.md,
        backgroundColor: c.card,
        alignSelf: 'flex-start',
        minWidth: 170,
      }}
    >
      {btn('remove', -5, 'Earlier')}
      <Text variant="h3" accessibilityLabel={`${label} ${fmtT(value)}`}>
        {fmtT(value)}
      </Text>
      {btn('add', 5, 'Later')}
    </View>
  );
}

function DayPicker({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  return (
    <Chips>
      {DAYS.map((n, d) => (
        <Chip
          key={n}
          label={n}
          on={days.includes(d)}
          onPress={() => onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
        />
      ))}
    </Chips>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const { colors: c } = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.faint}
      {...props}
      style={[
        {
          minHeight: hit,
          borderWidth: 1,
          borderColor: c.line2,
          borderRadius: radii.md,
          backgroundColor: c.card,
          paddingHorizontal: 14,
          paddingVertical: 10,
          color: c.ink,
          fontFamily: fonts.ui,
          fontSize: 15,
        },
        props.style,
      ]}
    />
  );
}

export function Editor({
  target,
  defaults,
  onClose,
}: {
  target: EditorTarget;
  defaults?: Partial<Form>;
  onClose: () => void;
}) {
  const plan = usePlan();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<Form>(() =>
    target ? formFor(plan, target) : blankForm(plan, defaults),
  );
  const set = (p: Partial<Form>) => setF((o) => ({ ...o, ...p }));
  const editing = !!target;
  const at = f.time - f.lead;

  const save = () => {
    plan.apply((p) => saveForm(p, target, f));
    onClose();
  };
  const remove = () => {
    if (target) plan.apply((p) => deleteTarget(p, target));
    onClose();
  };
  const heading =
    f.kind === 'rem'
      ? editing
        ? 'Reminder'
        : 'New reminder'
      : f.kind === 'fixed'
        ? editing
          ? 'Fixed commitment'
          : 'New fixed commitment'
        : editing
          ? 'Edit task'
          : 'New task';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: c.scrim,
          }}
        />
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: '93%',
            backgroundColor: c.paper,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 14,
            }}
          >
            <Text variant="title">{heading}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={22} color={c.ink} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, gap: 20 }}
          >
            <Input
              value={f.title}
              onChangeText={(title) => set({ title })}
              placeholder={
                f.kind === 'rem' ? 'What should I remind you about?' : 'What do you want to do?'
              }
              accessibilityLabel="Title"
              autoFocus={!editing}
              style={{ fontFamily: fonts.display, fontSize: 20 }}
            />

            <Field label="Type" hint={HELP[f.kind]}>
              <Segmented full value={f.kind} onChange={(kind) => set({ kind })} options={KINDS} />
            </Field>

            {f.kind === 'rem' ? (
              <>
                <Field
                  label="Days"
                  hint={
                    f.days.length > 1
                      ? 'Repeats every week on these days.'
                      : 'Pick more than one day to repeat it.'
                  }
                >
                  <DayPicker days={f.days} onChange={(days) => set({ days })} />
                </Field>
                <Field label="Happens at">
                  <TimeField label="Happens at" value={f.time} onChange={(time) => set({ time })} />
                </Field>
                <Field label="Remind me" hint={`You’ll get it at ${fmtT(at)}.`}>
                  <Chips>
                    {LEADS.map((m) => (
                      <Chip
                        key={m}
                        label={m ? `${fmtD(m)} before` : 'At the time'}
                        on={f.lead === m}
                        onPress={() => set({ lead: m })}
                      />
                    ))}
                  </Chips>
                </Field>
                <Switch
                  title="I need to leave for this"
                  sub={
                    f.leave
                      ? `The alert says “time to leave” at ${fmtT(at)}.`
                      : 'Turns it into a time-to-leave alert'
                  }
                  value={f.leave}
                  onChange={(leave) => set({ leave })}
                />
                <Switch
                  title="Keep reminding until I tick it off"
                  sub="Again every 10 minutes"
                  value={f.nag}
                  onChange={(nag) => set({ nag })}
                />
                <Field label="Where or notes">
                  <Input
                    value={f.notes}
                    onChangeText={(notes) => set({ notes })}
                    placeholder="School is 20 min from the office"
                    multiline
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Category">
                  <Chips>
                    {(Object.keys(CATS) as Category[]).map((k) => (
                      <Chip
                        key={k}
                        label={CATS[k].label}
                        tone={CATS[k].tone}
                        on={f.cat === k}
                        onPress={() => set({ cat: k })}
                      />
                    ))}
                  </Chips>
                </Field>
                {f.kind === 'flex' ? (
                  <>
                    <Field label="Estimated duration">
                      <Chips>
                        {DURATIONS.map((m) => (
                          <Chip
                            key={m}
                            label={fmtD(m)}
                            on={f.dur === m}
                            onPress={() => set({ dur: m })}
                          />
                        ))}
                      </Chips>
                    </Field>
                    <Field label="When">
                      <Chips>
                        {WHEN.map((w) => (
                          <Chip
                            key={w.label}
                            label={w.label}
                            on={f.day === w.day}
                            onPress={() => set({ day: w.day })}
                          />
                        ))}
                      </Chips>
                    </Field>
                    <Switch
                      title="Repeat every week"
                      sub="Keeps it in your weekly rhythm"
                      value={f.repeat}
                      onChange={(repeat) => set({ repeat })}
                    />
                  </>
                ) : (
                  <>
                    <Field
                      label="Days"
                      hint={
                        f.days.length > 1
                          ? 'Repeats every week on these days.'
                          : 'Pick more than one day to repeat it.'
                      }
                    >
                      <DayPicker days={f.days} onChange={(days) => set({ days })} />
                    </Field>
                    <View style={{ flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' }}>
                      <Field label="Starts">
                        <TimeField
                          label="Starts"
                          value={f.start}
                          onChange={(start) => set({ start })}
                        />
                      </Field>
                      <Field label="Ends">
                        <TimeField label="Ends" value={f.end} onChange={(end) => set({ end })} />
                      </Field>
                    </View>
                  </>
                )}
                <Field label={f.kind === 'fixed' ? 'Where or notes' : 'Notes'}>
                  <Input
                    value={f.notes}
                    onChangeText={(notes) => set({ notes })}
                    placeholder={
                      f.kind === 'fixed'
                        ? 'Room 204, Studio Flow…'
                        : 'Anything that helps future you'
                    }
                    multiline
                  />
                </Field>
                {f.kind === 'flex' && (
                  <Field label="Priority">
                    <Segmented
                      full
                      value={String(f.pri)}
                      onChange={(v) => set({ pri: Number(v) })}
                      options={[
                        { value: '1', label: 'Low' },
                        { value: '2', label: 'Normal' },
                        { value: '3', label: 'High' },
                      ]}
                    />
                  </Field>
                )}
              </>
            )}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopWidth: 1,
              borderTopColor: c.line,
            }}
          >
            {editing && <Button label="Delete" kind="danger" onPress={remove} />}
            <View style={{ flex: 1 }} />
            <Button label="Cancel" kind="ghost" onPress={onClose} />
            <Button
              label={editing ? 'Save' : f.kind === 'rem' ? 'Set reminder' : 'Add task'}
              disabled={!canSave(f)}
              onPress={save}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
