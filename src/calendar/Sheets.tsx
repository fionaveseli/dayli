import { View } from 'react-native';

import { Text } from '../components';
import type { DayIndex, Gap, PlanData, Task } from '../data/types';
import { CATS, DAYF, fmtD, fmtT, dayInfo, fitGaps, loadAfter } from '../rules';
import { toneColors, useTheme } from '../theme';
import { loadColor } from './loadColor';
import { Option, Sheet } from './Sheet';

export type SheetState =
  | { type: 'move'; id: string }
  | { type: 'place'; id: string }
  | { type: 'gap'; day: DayIndex; gap: Gap };

type Common = {
  plan: PlanData & {
    moveTask: (id: string, day: DayIndex | null) => void;
    placeTask: (id: string, day: DayIndex, time: number) => void;
    unplaceTask: (id: string) => void;
  };
  today: DayIndex;
  now: number;
  /** Date label for each day, e.g. "26 Oct". */
  dateOf: (d: DayIndex) => string;
  onClose: () => void;
};

function TaskChip({ task }: { task: Task }) {
  const { colors } = useTheme();
  const t = toneColors(colors, CATS[task.cat].tone);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: t.bg,
      }}
    >
      <Text variant="h3" style={{ flex: 1 }}>
        {task.title}
      </Text>
      <Text variant="label" style={{ color: t.ink }}>
        {fmtD(task.dur)}
      </Text>
    </View>
  );
}

export function MoveSheet({ id, plan, today, dateOf, onClose }: Common & { id: string }) {
  const { colors: c } = useTheme();
  const task = plan.tasks.find((t) => t.id === id);
  if (!task) return null;
  const pick = (d: DayIndex | null) => {
    plan.moveTask(id, d);
    onClose();
  };
  return (
    <Sheet title="Move to another day" onClose={onClose}>
      <TaskChip task={task} />
      {DAYF.map((name, d) => {
        const i = dayInfo(plan, d);
        const after = loadAfter(plan, d, task);
        return (
          <Option
            key={d}
            current={task.day === d}
            label={d === today ? 'Today' : d === (today + 1) % 7 ? 'Tomorrow' : name}
            sub={`${dateOf(d)} · ${fmtD(i.free)} free · ${i.flex.length} planned`}
            right={
              <Text variant="label" style={{ color: loadColor(c, after.k) }}>
                {after.label}
              </Text>
            }
            onPress={() => pick(d)}
          />
        );
      })}
      <Option
        current={task.day == null}
        label="Brain dump"
        sub="No day yet, plan it later"
        onPress={() => pick(null)}
      />
    </Sheet>
  );
}

export function PlaceSheet({ id, plan, today, now, onClose }: Common & { id: string }) {
  const task = plan.tasks.find((t) => t.id === id);
  if (!task) return null;
  const day = task.day == null || task.day < 0 ? today : task.day;
  const gaps = fitGaps(plan, day, task.dur, { taskId: id, today, now });
  return (
    <Sheet title="Place at a time" onClose={onClose}>
      <Text tone="muted">
        {task.title} takes about {fmtD(task.dur)}. These open times on{' '}
        {day === today ? 'today' : DAYF[day]} fit it.
      </Text>
      {gaps.map((g) => (
        <Option
          key={g.s}
          label={`${fmtT(g.s)} – ${fmtT(g.s + task.dur)}`}
          sub={`in an open stretch until ${fmtT(g.e)} (${fmtD(g.e - g.s)})`}
          onPress={() => {
            plan.placeTask(id, day, g.s);
            onClose();
          }}
        />
      ))}
      {gaps.length === 0 && (
        <Text variant="h3">
          No open stretch is long enough. Move it to a lighter day, or keep it flexible.
        </Text>
      )}
      {task.time != null && (
        <Option
          label="Keep it flexible"
          sub="Remove the time, keep the day"
          onPress={() => {
            plan.unplaceTask(id);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

export function GapSheet({
  day,
  gap,
  plan,
  today,
  now,
  onClose,
}: Common & { day: DayIndex; gap: Gap }) {
  const s = day === today ? Math.max(gap.s, Math.ceil(now / 15) * 15) : gap.s;
  const len = gap.e - s;
  const cands = plan.tasks
    .filter((t) => !t.done && t.time == null && (t.day === day || t.day == null))
    .sort((a, b) => +(a.day == null) - +(b.day == null) || +(b.dur <= len) - +(a.dur <= len));
  return (
    <Sheet title={`Open from ${fmtT(s)}`} onClose={onClose}>
      <Text tone="muted">
        {fmtD(len)} free until {fmtT(gap.e)}. Pick something to do here.
      </Text>
      {cands.map((t) => {
        const fits = t.dur <= len;
        return (
          <Option
            key={t.id}
            muted={!fits}
            label={t.title}
            sub={`${fmtD(t.dur)} · ${t.day == null ? 'from brain dump' : 'planned for this day'}`}
            right={
              <Text variant="small" tone="muted">
                {fits ? 'Place' : 'Too long'}
              </Text>
            }
            onPress={() => {
              if (!fits) return;
              plan.placeTask(t.id, day, s);
              onClose();
            }}
          />
        );
      })}
      {cands.length === 0 && (
        <Text tone="muted">Nothing waiting. Every flexible task already has a place.</Text>
      )}
    </Sheet>
  );
}
