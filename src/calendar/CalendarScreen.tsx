import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Task } from '../data/types';
import { Button, Card, Checkbox, Segmented, Text } from '../components';
import { useEditor } from '../editor';
import { usePlan } from '../store';
import {
  CATS,
  DAYF,
  DAYS,
  dateOfDay,
  dayIndexOf,
  dayInfo,
  fmtD,
  fmtT,
  remOn,
  weekStart,
} from '../rules';
import { hit, radii, spacing, toneColors, useTheme } from '../theme';
import { Timeline } from '../today/Timeline';
import { FixedRow } from '../today/rows';
import { loadColor } from './loadColor';
import { GapSheet, MoveSheet, PlaceSheet, type SheetState } from './Sheets';
import { WeekGrid } from './WeekGrid';

type View_ = 'day' | 'week';
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = (d: Date) => `${d.getDate()} ${MONS[d.getMonth()]}`;

function IconButton({
  name,
  label,
  onPress,
}: {
  name: 'swap-horizontal-outline' | 'time-outline';
  label: string;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={name} size={20} color={c.ink2} />
    </Pressable>
  );
}

export function CalendarScreen({ now }: { now?: Date }) {
  const plan = usePlan();
  const { openEditor } = useEditor();
  const { colors: c } = useTheme();
  const [clock] = useState(() => now ?? new Date());
  const today = dayIndexOf(clock);
  const minutes = clock.getHours() * 60 + clock.getMinutes();
  const monday = weekStart(clock);
  const [view, setView] = useState<View_>('day');
  const [sel, setSel] = useState(today);
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const info = dayInfo(plan, sel);
  const date = dateOfDay(monday, sel);
  const dateOf = (d: number) => short(dateOfDay(monday, d));
  const items = [...info.flex].sort((a, b) => +a.done - +b.done || (a.time ?? -1) - (b.time ?? -1));
  const reminders = remOn(plan, sel);
  const dump = plan.tasks.filter((t) => t.day == null && !t.done);
  const close = () => setSheet(null);
  const common = { plan, today, now: minutes, dateOf, onClose: close };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <View>
          <Text variant="h1">
            {view === 'week'
              ? `${short(monday)} – ${short(dateOfDay(monday, 6))}`
              : `${DAYS[sel]}, ${short(date)}`}
          </Text>
          <Text tone="muted" style={{ marginTop: 6 }}>
            Fixed hours stay put. Flexible tasks wait below until you place them.
          </Text>
        </View>

        <Segmented
          full
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
        />

        <View style={{ flexDirection: 'row', gap: 4 }} accessibilityRole="tablist">
          {DAYS.map((name, d) => {
            const i = dayInfo(plan, d);
            const on = sel === d;
            return (
              <Pressable
                key={d}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${DAYF[d]} ${dateOfDay(monday, d).getDate()}`}
                onPress={() => setSel(d)}
                style={{
                  flex: 1,
                  minHeight: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: on ? c.rose : 'transparent',
                  backgroundColor: on ? c.sel : 'transparent',
                }}
              >
                <Text variant="small" tone="muted">
                  {name.slice(0, 1)}
                </Text>
                <Text variant="h3" style={d === today ? { color: c.rose } : undefined}>
                  {dateOfDay(monday, d).getDate()}
                </Text>
                <View
                  style={{
                    width: 14,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i.flex.length ? loadColor(c, i.load.k) : c.line2,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        {view === 'week' ? (
          <WeekGrid plan={plan} selected={sel} today={today} now={minutes} onSelect={setSel} />
        ) : (
          <Timeline
            plan={plan}
            day={sel}
            now={sel === today ? minutes : undefined}
            hourPx={42}
            onToggleTask={plan.toggleTask}
            onGap={(day, gap) => setSheet({ type: 'gap', day, gap })}
          />
        )}

        <Text variant="h2">
          {DAYF[sel]}, {date.getDate()} {MONS[date.getMonth()]}
          {sel === today ? ' · today' : ''}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Stat label="Free" value={fmtD(info.free)} />
          <Stat label="Planned" value={info.planned ? fmtD(info.planned) : '0'} />
          <Stat
            label="Load"
            value={info.load.empty ? 'Open' : info.load.label}
            color={info.load.empty ? undefined : loadColor(c, info.load.k)}
          />
        </View>

        {info.fixed.length > 0 && (
          <View style={{ gap: 8 }}>
            {info.fixed.map((f) => (
              <FixedRow
                key={f.id}
                fixed={f}
                onOpen={() => openEditor({ kind: 'fixed', id: f.id })}
              />
            ))}
          </View>
        )}

        {reminders.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text variant="h3">Reminders</Text>
            {reminders.map((r) => (
              <Text key={r.id} tone="muted">
                {fmtT(r.at)} · {r.title}
              </Text>
            ))}
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text variant="h3">Flexible this day</Text>
          {items.map((t) => (
            <FlexCard
              key={t.id}
              task={t}
              onToggle={() => plan.toggleTask(t.id)}
              onOpen={() => openEditor({ kind: 'flex', id: t.id })}
              onMove={() => setSheet({ type: 'move', id: t.id })}
              onPlace={() => setSheet({ type: 'place', id: t.id })}
            />
          ))}
          {items.length === 0 && (
            <Card style={{ alignItems: 'center', gap: 6 }}>
              <Text variant="h3">Nothing flexible here yet</Text>
              <Text tone="muted">
                {fmtD(info.free)} of free time on {DAYF[sel]}.
              </Text>
              <Button
                kind="secondary"
                size="sm"
                label="Add a task"
                onPress={() => openEditor(null, { day: sel })}
              />
            </Card>
          )}
        </View>

        {dump.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text variant="h3">From your brain dump</Text>
            {dump.slice(0, 4).map((t) => (
              <FlexCard
                key={t.id}
                task={t}
                onToggle={() => plan.toggleTask(t.id)}
                onOpen={() => openEditor({ kind: 'flex', id: t.id })}
                onMove={() => setSheet({ type: 'move', id: t.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {sheet?.type === 'move' && <MoveSheet {...common} id={sheet.id} />}
      {sheet?.type === 'place' && <PlaceSheet {...common} id={sheet.id} />}
      {sheet?.type === 'gap' && <GapSheet {...common} day={sheet.day} gap={sheet.gap} />}
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card style={{ flex: 1, padding: 12, gap: 2 }}>
      <Text variant="h3" style={color ? { color } : undefined}>
        {value}
      </Text>
      <Text variant="small" tone="muted">
        {label}
      </Text>
    </Card>
  );
}

function FlexCard({
  task,
  onToggle,
  onOpen,
  onMove,
  onPlace,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
  onMove: () => void;
  onPlace?: () => void;
}) {
  const { colors: c } = useTheme();
  const t = toneColors(c, CATS[task.cat].tone);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingLeft: 8,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: task.done ? 'transparent' : c.card,
      }}
    >
      <Checkbox checked={task.done} onChange={onToggle} label={`Complete ${task.title}`} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${task.title}`}
        onPress={onOpen}
        style={{ flex: 1, paddingVertical: 8 }}
      >
        <Text
          variant="h3"
          tone={task.done ? 'muted' : 'ink'}
          style={task.done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {task.title}
        </Text>
        <Text variant="small" style={{ color: t.ink }}>
          {fmtD(task.dur)}
          {task.time != null ? ` · ${fmtT(task.time)}` : ''}
        </Text>
      </Pressable>
      {!task.done && (
        <>
          <IconButton name="swap-horizontal-outline" label="Move to another day" onPress={onMove} />
          {onPlace && (
            <IconButton
              name="time-outline"
              label={task.time != null ? 'Change time' : 'Place at a time'}
              onPress={onPlace}
            />
          )}
        </>
      )}
    </View>
  );
}
