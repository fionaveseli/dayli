import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented, Text } from '../components';
import { dateLine, dayIndexOf, dayInfo, fmtD, fmtT, greetingFor, remOn, toLine } from '../rules';
import { spacing, useTheme } from '../theme';
import { useEditor } from '../editor';
import { MorningPlan, RolloverAsk } from '../autopilot';
import { QuickAdd } from '../quickadd';
import { usePlan } from '../store';
import { FixedRow, ReminderRow, TaskRow } from './rows';
import { Timeline } from './Timeline';

type Mode = 'visual' | 'list';

function SectionHead({
  title,
  note,
  icon,
}: {
  title: string;
  note?: string;
  icon?: 'bell' | 'lock';
}) {
  const { colors: c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && (
          <Ionicons
            name={icon === 'bell' ? 'notifications-outline' : 'lock-closed-outline'}
            size={16}
            color={c.ink}
          />
        )}
        <Text variant="h3">{title}</Text>
      </View>
      {note ? (
        <Text variant="small" tone="muted">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

export function TodayChecklist({ now }: { now?: Date }) {
  const plan = usePlan();
  const { openEditor } = useEditor();
  const [clock] = useState(() => now ?? new Date());
  const [mode, setMode] = useState<Mode>('visual');
  const day = dayIndexOf(clock);
  const minutes = clock.getHours() * 60 + clock.getMinutes();

  const info = dayInfo(plan, day);
  const reminders = remOn(plan, day);
  const open = info.flex.filter((t) => !t.done);
  const done = info.flex.filter((t) => t.done);
  const anytime = info.flex.filter((t) => t.time == null).sort((x, y) => +x.done - +y.done);
  const remLeft = reminders.filter((r) => !r.done).length;
  const next = reminders.find((r) => !r.done && r.at >= minutes);
  const leave = reminders.find((r) => r.leave && !r.done);

  const fact = leave
    ? `Leave work at ${fmtT(leave.at)} to ${toLine(leave.title)}`
    : `${fmtD(info.free)} free today`;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 28 }}>
        <View>
          <Text variant="h1">{greetingFor(clock)}</Text>
          <Text tone="muted" style={{ marginTop: 6 }}>
            {dateLine(clock)} · {fact}
          </Text>
        </View>

        <RolloverAsk now={clock} />
        <MorningPlan day={day} now={clock} />

        <Card style={{ gap: 4 }} accessibilityLabel="Don't forget">
          <SectionHead
            title="Don't forget"
            icon="bell"
            note={remLeft ? `${remLeft} left today` : reminders.length ? 'All done' : undefined}
          />
          <View style={{ gap: 8 }}>
            {reminders.map((r) => (
              <ReminderRow
                key={r.id}
                reminder={r}
                next={next?.id === r.id}
                missed={!r.done && r.at < minutes}
                onToggle={() => plan.toggleReminder(r.id, day)}
                onOpen={() => openEditor({ kind: 'rem', id: r.id })}
              />
            ))}
            {reminders.length === 0 && <Text tone="muted">Nothing to remember today.</Text>}
          </View>
        </Card>

        <QuickAdd day={day} />

        <Segmented
          full
          value={mode}
          onChange={setMode}
          options={[
            { value: 'visual', label: 'Visual day' },
            { value: 'list', label: 'Checklist' },
          ]}
        />

        {mode === 'visual' ? (
          <>
            <View>
              <SectionHead
                title="Anytime today"
                note={`${anytime.filter((t) => !t.done).length} flexible · no fixed time`}
              />
              <View style={{ gap: 8 }}>
                {anytime.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggle={() => plan.toggleTask(t.id)}
                    onOpen={() => openEditor({ kind: 'flex', id: t.id })}
                  />
                ))}
                {anytime.length === 0 && <Text tone="muted">Nothing without a time today.</Text>}
              </View>
            </View>
            <View>
              <SectionHead title="Your day" />
              <Timeline
                plan={plan}
                day={day}
                now={minutes}
                onToggleTask={(id) => plan.toggleTask(id)}
              />
            </View>
          </>
        ) : (
          <>
            <View>
              <SectionHead title="Set in stone" icon="lock" note={`${info.fixed.length} fixed`} />
              <View style={{ gap: 8 }}>
                {info.fixed.map((f) => (
                  <FixedRow
                    key={f.id}
                    fixed={f}
                    onOpen={() => openEditor({ kind: 'fixed', id: f.id })}
                  />
                ))}
                {info.fixed.length === 0 && <Text tone="muted">Nothing fixed today.</Text>}
              </View>
            </View>

            <View>
              <SectionHead title="Flexible today" note={`${fmtD(info.left)} in total`} />
              <View style={{ gap: 8 }}>
                {open.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggle={() => plan.toggleTask(t.id)}
                    onOpen={() => openEditor({ kind: 'flex', id: t.id })}
                  />
                ))}
                {open.length === 0 && (
                  <View style={{ paddingVertical: 12 }}>
                    <Text variant="h2">That&apos;s the whole list.</Text>
                    <Text tone="muted">Nothing flexible left for today. Enjoy the evening.</Text>
                  </View>
                )}
              </View>
            </View>

            {done.length > 0 && (
              <View>
                <SectionHead title="Done today" note={String(done.length)} />
                <View style={{ gap: 8 }}>
                  {done.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onToggle={() => plan.toggleTask(t.id)}
                      onOpen={() => openEditor({ kind: 'flex', id: t.id })}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
