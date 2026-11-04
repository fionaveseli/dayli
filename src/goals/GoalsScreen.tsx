import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Text } from '../components';
import type { Category, Goal, Milestone } from '../data/types';
import { useEditor } from '../editor';
import { CATS, DAYF, fmtDue, goalInfo, validDue, type MilestoneInfo } from '../rules';
import { usePlan } from '../store';
import { fonts, hit, radii, spacing, toneColors, useTheme } from '../theme';
import { TaskRow } from '../today/rows';

const newId = (p: string) =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function Bar({
  p,
  height = 6,
  track,
  fill,
}: {
  p: number;
  height?: number;
  track: string;
  fill: string;
}) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`,
          flex: 1,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  label,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  label: string;
}) {
  const { colors: c } = useTheme();
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.faint}
      style={{
        minHeight: hit,
        borderWidth: 1,
        borderColor: c.line2,
        borderRadius: radii.md,
        backgroundColor: c.card,
        paddingHorizontal: 14,
        color: c.ink,
        fontFamily: fonts.ui,
        fontSize: 15,
      }}
    />
  );
}

/** Title and a soft date, for a new or edited milestone. */
function MilestoneForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Milestone;
  onSave: (title: string, due: string | null) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [due, setDue] = useState(initial?.due ?? '');
  const okDue = due === '' || validDue(due);
  return (
    <Card style={{ gap: 10 }}>
      <Text variant="h3">{initial ? 'Edit milestone' : 'New milestone'}</Text>
      <Field
        label="Milestone"
        value={title}
        onChangeText={setTitle}
        placeholder="Finish portfolio"
      />
      <Field
        label="Target date"
        value={due}
        onChangeText={setDue}
        placeholder="Target date, 2027-01-31"
      />
      {!okDue && (
        <Text variant="small" tone="muted">
          Write the date as year-month-day, like 2027-01-31, or leave it empty.
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <Button label="Cancel" kind="ghost" onPress={onCancel} />
        <Button
          label="Save"
          disabled={!title.trim() || !okDue}
          onPress={() => onSave(title.trim(), due || null)}
        />
      </View>
    </Card>
  );
}

function GoalForm({
  onSave,
  onCancel,
}: {
  onSave: (g: Pick<Goal, 'title' | 'why' | 'cat' | 'due'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [cat, setCat] = useState<Category>('personal');
  const [due, setDue] = useState('');
  const okDue = due === '' || validDue(due);
  return (
    <Card style={{ gap: 10 }}>
      <Text variant="h3">New goal</Text>
      <Field
        label="Goal"
        value={title}
        onChangeText={setTitle}
        placeholder="What do you want to reach?"
      />
      <Field
        label="Why it matters"
        value={why}
        onChangeText={setWhy}
        placeholder="Why it matters (optional)"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(CATS) as Category[]).map((k) => (
          <Chip
            key={k}
            label={CATS[k].label}
            tone={CATS[k].tone}
            on={cat === k}
            onPress={() => setCat(k)}
          />
        ))}
      </View>
      <Field
        label="Target date"
        value={due}
        onChangeText={setDue}
        placeholder="Target date, 2027-01-31 (optional)"
      />
      {!okDue && (
        <Text variant="small" tone="muted">
          Write the date as year-month-day, like 2027-01-31, or leave it empty.
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <Button label="Cancel" kind="ghost" onPress={onCancel} />
        <Button
          label="Add goal"
          disabled={!title.trim() || !okDue}
          onPress={() => onSave({ title: title.trim(), why: why.trim(), cat, due: due || null })}
        />
      </View>
    </Card>
  );
}

export function GoalsScreen() {
  const router = useRouter();
  const plan = usePlan();
  const { openEditor } = useEditor();
  const { colors: c } = useTheme();
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<
    { type: 'goal' } | { type: 'milestone'; edit?: Milestone } | null
  >(null);

  const goal = plan.goals.find((g) => g.id === picked) ?? plan.goals[0];
  const info = goal ? goalInfo(goal, plan.milestones, plan.tasks) : undefined;
  const openId = open ?? info?.next?.id ?? null;
  const tone = goal ? toneColors(c, CATS[goal.cat].tone) : null;
  const thisWeek = goal
    ? plan.tasks
        .filter((t) => t.goal === goal.id && t.day != null && t.day >= 0)
        .sort((a, b) => Number(a.done) - Number(b.done) || (a.day ?? 0) - (b.day ?? 0))
    : [];

  const addGoal = (g: Pick<Goal, 'title' | 'why' | 'cat' | 'due'>) => {
    const id = newId('g');
    plan.setGoals((gs) => [...gs, { id, short: g.title.slice(0, 28), ...g }]);
    setPicked(id);
    setOpen(null);
    setMode(null);
  };
  const saveMilestone = (title: string, due: string | null) => {
    if (!goal) return;
    if (mode?.type === 'milestone' && mode.edit) {
      const id = mode.edit.id;
      plan.setMilestones((ms) => ms.map((m) => (m.id === id ? { ...m, title, due } : m)));
    } else {
      const pos =
        Math.max(-1, ...plan.milestones.filter((m) => m.goalId === goal.id).map((m) => m.pos)) + 1;
      plan.setMilestones((ms) => [
        ...ms,
        { id: newId('m'), goalId: goal.id, title, due, done: false, pos },
      ]);
    }
    setMode(null);
  };
  const reach = (m: MilestoneInfo) =>
    plan.setMilestones((ms) => ms.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)));

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: spacing.lg, paddingBottom: 48 }}>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{ minHeight: hit, justifyContent: 'center' }}
          >
            <Text tone="muted">‹ More</Text>
          </Pressable>
          <Text variant="h1">Goals</Text>
          <Text tone="muted">Milestones and the steps toward them</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {plan.goals.map((g) => (
              <Chip
                key={g.id}
                label={g.short || g.title}
                tone={CATS[g.cat].tone}
                on={g.id === goal?.id}
                onPress={() => {
                  setPicked(g.id);
                  setOpen(null);
                  setMode(null);
                }}
              />
            ))}
            <Chip label="+ New goal" onPress={() => setMode({ type: 'goal' })} />
          </View>
        </ScrollView>

        {mode?.type === 'goal' && <GoalForm onSave={addGoal} onCancel={() => setMode(null)} />}

        {!goal || !info || !tone ? (
          mode?.type !== 'goal' && (
            <Card style={{ gap: 6 }}>
              <Text variant="h2">No goals yet</Text>
              <Text tone="muted">Add one when you know what you are working toward.</Text>
            </Card>
          )
        ) : (
          <>
            <View
              style={{ backgroundColor: tone.bg, borderRadius: radii.xl, padding: 22, gap: 12 }}
            >
              <Text variant="small" style={{ color: tone.ink, fontFamily: fonts.uiSemi }}>
                by {fmtDue(goal.due)}
              </Text>
              <Text variant="title" style={{ color: c.ink }}>
                {goal.title}
              </Text>
              {goal.why ? <Text tone="ink2">{goal.why}</Text> : null}
              <Bar p={info.p} height={10} track="rgba(255,255,255,.6)" fill={tone.ink} />
              <Text variant="small" style={{ fontFamily: fonts.uiSemi }}>
                {info.stepsDone} of {info.steps} steps done
              </Text>
              {info.next && (
                <Text variant="small" style={{ color: tone.ink, fontFamily: fonts.uiSemi }}>
                  Next: {info.next.title} by {fmtDue(info.next.due)}
                </Text>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="h3" style={{ flex: 1 }}>
                  Milestones
                </Text>
                <Button
                  label="Add milestone"
                  kind="ghost"
                  size="sm"
                  onPress={() => setMode({ type: 'milestone' })}
                />
              </View>
              {mode?.type === 'milestone' && (
                <MilestoneForm
                  key={mode.edit?.id ?? 'new'}
                  initial={mode.edit}
                  onSave={saveMilestone}
                  onCancel={() => setMode(null)}
                />
              )}
              {info.milestones.length === 0 && (
                <Text tone="muted">
                  No milestones yet. Break the goal into a few stops along the way.
                </Text>
              )}
              {info.milestones.map((m) => {
                const isOpen = openId === m.id;
                const done = m.state === 'done';
                const current = m.state === 'current';
                return (
                  <View
                    key={m.id}
                    style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        marginTop: 12,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: done ? c.btn : current ? c.rose : c.line2,
                        backgroundColor: done ? c.btn : current ? c.roseSoft : c.paper,
                      }}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={16} color={c.btnInk} />
                      ) : current ? (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: c.rose,
                          }}
                        />
                      ) : null}
                    </View>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: 12,
                        gap: 8,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: current ? c.rose : c.line,
                        backgroundColor: c.card,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                        accessibilityLabel={`${m.title}, ${m.total ? `${m.doneCount} of ${m.total} steps` : done ? 'reached' : 'no steps'}`}
                        onPress={() => setOpen(isOpen ? '' : m.id)}
                        style={{
                          minHeight: hit - 20,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="h3" tone={done ? 'muted' : 'ink'}>
                            {m.title}
                          </Text>
                          <Text variant="small" tone="muted">
                            {m.total ? `${m.doneCount}/${m.total}` : done ? 'Done' : 'No steps'} ·{' '}
                            {fmtDue(m.due)}
                          </Text>
                        </View>
                        <Ionicons
                          name={isOpen ? 'chevron-down' : 'chevron-forward'}
                          size={16}
                          color={c.muted}
                        />
                      </Pressable>
                      {m.total > 0 && <Bar p={m.p} height={5} track={c.line} fill={c.rose} />}
                      {isOpen && (
                        <View style={{ gap: 8 }}>
                          {m.tasks.map((t) => (
                            <TaskRow
                              key={t.id}
                              task={t}
                              onToggle={() => plan.toggleTask(t.id)}
                              onOpen={() => openEditor({ kind: 'flex', id: t.id })}
                            />
                          ))}
                          {m.tasks.length === 0 && !done && (
                            <Text variant="small" tone="muted">
                              No steps yet. Break it down when you get closer.
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                            {!done && (
                              <Button
                                label="Add a step"
                                kind="ghost"
                                size="sm"
                                onPress={() =>
                                  openEditor(null, {
                                    goal: goal.id,
                                    ms: m.id,
                                    cat: goal.cat,
                                    day: null,
                                  })
                                }
                              />
                            )}
                            {m.total === 0 && (
                              <Button
                                label={m.done ? 'Not reached' : 'Mark reached'}
                                kind="ghost"
                                size="sm"
                                onPress={() => reach(m)}
                              />
                            )}
                            <Button
                              label="Edit"
                              kind="ghost"
                              size="sm"
                              onPress={() => setMode({ type: 'milestone', edit: m })}
                            />
                            <Button
                              label="Delete"
                              kind="danger"
                              size="sm"
                              onPress={() => plan.deleteMilestone(m.id)}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <Card style={{ gap: 10 }}>
              <Text variant="h3">How this week feeds it</Text>
              <Text variant="small" tone="muted">
                Every task linked to this goal moves a milestone forward.
              </Text>
              {thisWeek.map((t) => (
                <View key={t.id} style={{ gap: 2 }}>
                  <TaskRow
                    task={t}
                    onToggle={() => plan.toggleTask(t.id)}
                    onOpen={() => openEditor({ kind: 'flex', id: t.id })}
                  />
                  <Text variant="small" tone="muted" style={{ paddingLeft: 8 }}>
                    {DAYF[t.day ?? 0]} · {info.milestones.find((m) => m.id === t.ms)?.title ?? ''}
                  </Text>
                </View>
              ))}
              {thisWeek.length === 0 && (
                <Text variant="small" tone="muted">
                  Nothing linked this week. That’s fine; not every week moves every goal.
                </Text>
              )}
            </Card>

            <Button
              label="Delete this goal"
              kind="danger"
              onPress={() => {
                plan.deleteGoal(goal.id);
                setPicked(null);
              }}
            />
            <Text variant="small" tone="muted" style={{ textAlign: 'center' }}>
              Small steps count. They add up.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
