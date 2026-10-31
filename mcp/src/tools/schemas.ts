import { z } from 'zod';
import { ACCEPTED_DAYS } from '../core/dates';

/** Fresh schemas on each use, so the published JSON Schema spells them out instead of using $ref. */
const hhmm = () =>
  z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('Local time, 24-hour HH:MM');
const category = () => z.enum(['work', 'client', 'portfolio', 'interview', 'fitness', 'personal']);

/** Shapes, not objects: the stable SDK takes the raw shape for inputSchema and outputSchema. */
export const dayInput = {
  day: z.string().max(40).optional().describe(`Which day. Defaults to today. ${ACCEPTED_DAYS}`),
};

export const dayScheduleOutput = {
  day: z.object({
    date: z.string().describe('YYYY-MM-DD'),
    day_name: z.string(),
    is_today: z.boolean(),
    is_past: z.boolean(),
    week_start: z.string().describe('Monday of the only week Dayli can describe'),
    week_end: z.string(),
  }),
  now: hhmm().nullable().describe('Current local time, only when the day is today'),
  time_zone: z.string(),
  data_source: z.string().describe('Where the plan came from, e.g. "sample data"'),
  fixed: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: category(),
      start: hhmm(),
      end: hhmm(),
      where: z.string(),
      cut_short_by: z
        .object({ reminder_id: z.string(), reminder_title: z.string(), planned_end: hhmm() })
        .nullable()
        .describe('A "time to leave" reminder that ends this block early'),
    }),
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: category(),
      minutes: z.number().int().nonnegative(),
      start: hhmm().nullable().describe('null = flexible, no time set'),
      done: z.boolean(),
      priority: z.number().int(),
    }),
  ),
  reminders: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      time: hhmm(),
      alert_at: hhmm().describe('When the alert fires, after heads-up and snooze'),
      time_to_leave: z.boolean(),
      done: z.boolean(),
    }),
  ),
  summary: z.object({
    free_minutes: z
      .number()
      .int()
      .describe('Waking minutes not taken by fixed blocks, minus breathing room'),
    planned_minutes: z.number().int().describe('All flexible tasks on the day, done or not'),
    remaining_minutes: z.number().int().describe('Flexible tasks not done yet'),
    load: z.string().describe('Open, Light, Balanced, Full or Over capacity'),
  }),
  notes: z.array(z.string()),
};

export const DayScheduleSchema = z.object(dayScheduleOutput);
export type DayScheduleOutput = z.infer<typeof DayScheduleSchema>;

/** Open slots are calculated by the existing Dayli rules (gapsOn / fitGaps). */
export const availableTimeInput = {
  ...dayInput,
  min_minutes: z.number().int().min(30).default(30).describe('Minimum slot duration in minutes (at least 30)'),
  from_now: z.boolean().optional().describe('Default true for today, false for other days'),
};

export const availableTimeOutput = {
  day: dayScheduleOutput.day,
  now: dayScheduleOutput.now,
  time_zone: dayScheduleOutput.time_zone,
  data_source: dayScheduleOutput.data_source,
  slots: z.array(z.object({
    start: hhmm(),
    end: hhmm(),
    minutes: z.number().int().nonnegative(),
  })),
  total_open_minutes: z.number().int().nonnegative(),
  buffer_minutes: z.number().int().nonnegative(),
};

export const AvailableTimeSchema = z.object(availableTimeOutput);
export type AvailableTimeOutput = z.infer<typeof AvailableTimeSchema>;
