import { localNow, type Clock } from '../core/clock';
import { resolveDay, type DayRef } from '../core/dates';
import { ToolError, toErrorResult } from '../core/errors';
import type { PlanSource } from '../data/source';
import { dayInfo, fixedOn, fmtT, remOn, type PlanData } from '../dayli';
import type { DayScheduleOutput } from './schemas';

export type ToolDeps = { source: PlanSource; clock: Clock };

/** Builds the schedule for one day of the current week. Pure: no I/O, no clock. */
export function buildDaySchedule(
  plan: PlanData,
  day: DayRef,
  now: { minutes: number; timeZone: string },
  dataSource: string,
): DayScheduleOutput {
  const d = day.dayIndex;
  const info = dayInfo(plan, d);
  const plannedEnd = new Map(fixedOn(plan.fixed, d).map((f) => [f.id, f.end]));

  const tasks = [...info.flex].sort((a, b) => {
    if (a.time != null && b.time != null) return a.time - b.time;
    if (a.time != null) return -1;
    if (b.time != null) return 1;
    return b.pri - a.pri;
  });

  const notes: string[] = [];
  if (day.isPast) notes.push('This day has already passed this week.');

  return {
    day: {
      date: day.date,
      day_name: day.dayName,
      is_today: day.isToday,
      is_past: day.isPast,
      week_start: day.week.start,
      week_end: day.week.end,
    },
    now: day.isToday ? fmtT(now.minutes) : null,
    time_zone: now.timeZone,
    data_source: dataSource,
    fixed: info.fixed.map((f) => ({
      id: f.id,
      title: f.title,
      category: f.cat,
      start: fmtT(f.start),
      end: fmtT(f.end),
      where: f.where,
      cut_short_by: f.cutBy
        ? {
            reminder_id: f.cutBy.id,
            reminder_title: f.cutBy.title,
            planned_end: fmtT(plannedEnd.get(f.id) ?? f.end),
          }
        : null,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.cat,
      minutes: t.dur,
      start: t.time == null ? null : fmtT(t.time),
      done: t.done,
      priority: t.pri,
    })),
    reminders: remOn(plan, d).map((r) => ({
      id: r.id,
      title: r.title,
      time: fmtT(r.time),
      alert_at: fmtT(r.at),
      time_to_leave: r.leave,
      done: r.done,
    })),
    summary: {
      free_minutes: info.free,
      planned_minutes: info.planned,
      remaining_minutes: info.left,
      load: info.load.label,
    },
    notes,
  };
}

function summaryLine(s: DayScheduleOutput): string {
  const when = s.day.is_today
    ? `today, now ${s.now}`
    : s.day.is_past
      ? 'earlier this week'
      : 'this week';
  const open = s.tasks.filter((t) => !t.done).length;
  return (
    `${s.day.day_name} ${s.day.date} (${when}): ${s.fixed.length} fixed, ` +
    `${open} open task${open === 1 ? '' : 's'} (${s.summary.remaining_minutes} min left), ` +
    `${s.reminders.length} reminder${s.reminders.length === 1 ? '' : 's'}. ` +
    `Load: ${s.summary.load}. Source: ${s.data_source}.`
  );
}

/** The tool handler: resolves the day, loads the plan, never throws. */
export async function getDaySchedule(deps: ToolDeps, input: { day?: string }) {
  try {
    const now = localNow(deps.clock);
    const day = resolveDay(input.day, now);
    let plan: PlanData;
    try {
      plan = await deps.source.load();
    } catch {
      throw new ToolError('DATA_UNAVAILABLE', 'Dayli could not read the plan.', 'Try again later.');
    }
    const out = buildDaySchedule(plan, day, now, deps.source.name);
    return {
      content: [
        // Serialized structured content first, as the MCP spec recommends, then a readable line.
        { type: 'text' as const, text: JSON.stringify(out) },
        { type: 'text' as const, text: summaryLine(out) },
      ],
      structuredContent: out,
    };
  } catch (err) {
    return toErrorResult(err);
  }
}
