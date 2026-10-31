import { localNow } from '../core/clock';
import { resolveDay } from '../core/dates';
import { ToolError, toErrorResult } from '../core/errors';
import { fitGaps, fmtT, gapsOn, type PlanData } from '../dayli';
import type { ToolDeps } from './getDaySchedule';
import type { AvailableTimeOutput } from './schemas';

/** Uses Dayli's own gap rules; never independently computes occupied intervals. */
export function buildAvailableTime(
  plan: PlanData,
  day: ReturnType<typeof resolveDay>,
  now: ReturnType<typeof localNow>,
  dataSource: string,
  minMinutes: number,
  fromNow: boolean,
): AvailableTimeOutput {
  const gaps = fromNow && day.isToday
    ? fitGaps(plan, day.dayIndex, minMinutes, { today: day.dayIndex, now: now.minutes })
    : gapsOn(plan, day.dayIndex).filter((g) => g.e - g.s >= minMinutes);
  const slots = gaps.map((g) => ({
    start: fmtT(g.s),
    end: fmtT(g.e),
    minutes: g.e - g.s,
  }));
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
    slots,
    total_open_minutes: slots.reduce((sum, slot) => sum + slot.minutes, 0),
    buffer_minutes: plan.settings.buffer,
  };
}

export async function getAvailableTime(
  deps: ToolDeps,
  input: { day?: string; min_minutes?: number; from_now?: boolean },
) {
  try {
    const now = localNow(deps.clock);
    const day = resolveDay(input.day, now);
    const minMinutes = input.min_minutes ?? 30;
    if (!Number.isSafeInteger(minMinutes) || minMinutes < 30) {
      throw new ToolError('INVALID_INPUT', 'min_minutes must be an integer of at least 30.', 'Use 30 or a larger whole number.');
    }
    if (input.from_now !== undefined && typeof input.from_now !== 'boolean') {
      throw new ToolError('INVALID_INPUT', 'from_now must be a boolean.', 'Use true or false.');
    }
    const fromNow = input.from_now ?? day.isToday;
    let plan: PlanData;
    try {
      plan = await deps.source.load();
    } catch {
      throw new ToolError('DATA_UNAVAILABLE', 'Dayli could not read the plan.', 'Try again later.');
    }
    const out = buildAvailableTime(plan, day, now, deps.source.name, minMinutes, fromNow);
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify(out) },
        { type: 'text' as const, text: `${out.day.day_name} ${out.day.date}: ${out.slots.length} available slots, ${out.total_open_minutes} minutes total. Source: ${out.data_source}.` },
      ],
      structuredContent: out,
    };
  } catch (err) {
    return toErrorResult(err);
  }
}
