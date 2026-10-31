import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Task } from '../data/types';
import { Card, Chip, Text } from '../components';
import { useEditor } from '../editor';
import { QuickAdd } from '../quickadd';
import { CATS, DAYF, dayIndexOf, dayInfo, fmtD } from '../rules';
import { usePlan } from '../store';
import { spacing } from '../theme';
import { ReminderRow, TaskRow } from '../today/rows';
import {
  EMPTY_COPY,
  FILTER_CATS,
  SECTIONS,
  groupTasks,
  openByCategory,
  type CatFilter,
  type Section,
} from './groups';

const PLACEHOLDER: Record<Section, string> = {
  today: 'Add to today, or "remind me at 4 to…"',
  week: 'Add for tomorrow',
  dump: 'Dump a thought, plan it later',
  rem: 'Remind me at 4 to leave for pickup',
  done: '',
};

export function TasksScreen({ now }: { now?: Date }) {
  const plan = usePlan();
  const { openEditor } = useEditor();
  const [clock] = useState(() => now ?? new Date());
  const [sec, setSec] = useState<Section>('today');
  const [cat, setCat] = useState<CatFilter>('all');
  const today = dayIndexOf(clock);

  const groups = groupTasks(plan, today, cat);
  const totals = openByCategory(plan);
  const [title, body] = EMPTY_COPY[sec];
  const addDay = sec === 'today' ? today : sec === 'week' ? Math.min(today + 1, 6) : null;

  const taskRow = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      onToggle={() => plan.toggleTask(t.id)}
      onOpen={() => openEditor({ kind: 'flex', id: t.id })}
    />
  );

  let content;
  if (groups[sec].length === 0) {
    content = (
      <View style={{ paddingVertical: 12 }}>
        <Text variant="h2">{title}</Text>
        <Text tone="muted">{body}</Text>
      </View>
    );
  } else if (sec === 'rem') {
    content = (
      <View style={{ gap: 8 }}>
        {groups.rem.map((r) => {
          const done = r.doneDays.includes(today);
          return (
            <ReminderRow
              key={r.id}
              reminder={{ ...r, done }}
              next={false}
              missed={false}
              onToggle={() => plan.toggleReminder(r.id, today)}
              onOpen={() => openEditor({ kind: 'rem', id: r.id })}
            />
          );
        })}
      </View>
    );
  } else if (sec === 'week') {
    const days = [...new Set(groups.week.map((t) => t.day as number))];
    content = (
      <View style={{ gap: 20 }}>
        {days.map((d) => (
          <View key={d} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="h3">{DAYF[d]}</Text>
              <Text variant="small" tone="muted">
                {dayInfo(plan, d).load.label}
              </Text>
            </View>
            {groups.week.filter((t) => t.day === d).map(taskRow)}
          </View>
        ))}
      </View>
    );
  } else if (sec === 'done') {
    const td = groups.done.filter((t) => t.day === today);
    const er = groups.done.filter((t) => t.day !== today);
    content = (
      <View style={{ gap: 20 }}>
        {td.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text variant="h3">Today</Text>
            {td.map(taskRow)}
          </View>
        )}
        {er.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text variant="h3">Earlier</Text>
            {er.map(taskRow)}
          </View>
        )}
        <Text variant="small" tone="muted">
          Tap a checkbox to bring a task back.
        </Text>
      </View>
    );
  } else {
    content = <View style={{ gap: 8 }}>{(groups[sec] as Task[]).map(taskRow)}</View>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <Text variant="h1">Tasks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Sections">
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {SECTIONS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                on={sec === s.value}
                count={groups[s.value].length}
                onPress={() => setSec(s.value)}
              />
            ))}
          </View>
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Filter by category"
        >
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Chip label="All" on={cat === 'all'} onPress={() => setCat('all')} />
            {FILTER_CATS.map((c) => (
              <Chip
                key={c}
                label={CATS[c].label}
                tone={CATS[c].tone}
                on={cat === c}
                onPress={() => setCat(cat === c ? 'all' : c)}
              />
            ))}
          </View>
        </ScrollView>
        {sec !== 'done' && (
          <QuickAdd day={addDay} remOnly={sec === 'rem'} placeholder={PLACEHOLDER[sec]} />
        )}
        {content}
        <Card style={{ gap: 8 }}>
          <Text variant="h3">Open by category</Text>
          {FILTER_CATS.map((c) => (
            <Text key={c} variant="small" tone="muted">
              {CATS[c].label} · {totals[c].n} · {totals[c].n ? fmtD(totals[c].mins) : '0 min'}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
