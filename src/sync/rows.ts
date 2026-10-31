import type { Settings } from '../data/types';
import { SETTINGS0 } from '../data/sample';
import type { DatedFixed, DatedPlan, DatedReminder, DatedTask, Meta } from './dated';

export type Table = 'tasks' | 'fixed_commitments' | 'reminders' | 'settings';
export const TABLES: Table[] = ['settings', 'fixed_commitments', 'reminders', 'tasks'];

/** A database row as sent (`content`) plus what the server added (`meta`). */
export type Row = { table: Table; id: string; content: Record<string, unknown>; meta: Meta };
export type DbRow = Record<string, unknown> & { id: string };

export const rowKey = (r: { table: Table; id: string }) => `${r.table}:${r.id}`;
/** What changing a row means: its content, ignoring server fields. */
export const fingerprint = (r: Row) => JSON.stringify(r.content);

const metaOf = (r: DbRow): Meta => ({
  userId: r.user_id as string,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export function toRows(p: DatedPlan): Row[] {
  const rows: Row[] = [];
  const settings = p.settings;
  rows.push({
    table: 'settings',
    id: p.settingsId ?? '',
    meta: p.settingsMeta ?? {},
    content: {
      ...(p.settingsId ? { id: p.settingsId } : {}),
      time_zone: settings.timeZone ?? 'UTC',
      data: settings,
      autopilot: p.autopilot ?? {},
    },
  });
  for (const f of p.fixed)
    rows.push({
      table: 'fixed_commitments',
      id: f.id,
      meta: f,
      content: {
        id: f.id,
        title: f.title,
        cat: f.cat,
        weekdays: f.days,
        start_min: f.start,
        end_min: f.end,
        place: f.where,
        starts_on: f.startsOn,
        ends_on: f.endsOn,
      },
    });
  for (const r of p.reminders)
    rows.push({
      table: 'reminders',
      id: r.id,
      meta: r,
      content: {
        id: r.id,
        title: r.title,
        cat: r.cat,
        weekdays: r.days,
        time_min: r.time,
        lead: r.lead,
        leave: r.leave,
        note: r.note,
        nag: r.nag,
        starts_on: r.startsOn,
        ends_on: r.endsOn,
        done_on: [...r.doneOn].sort(),
        snooze: r.snoozeOn,
      },
    });
  for (const t of p.tasks)
    rows.push({
      table: 'tasks',
      id: t.id,
      meta: t,
      content: {
        id: t.id,
        title: t.title,
        cat: t.cat,
        dur: t.dur,
        date: t.date,
        start_min: t.time,
        done: t.done,
        notes: t.notes,
        goal_id: t.goal,
        milestone_id: t.ms,
        pri: t.pri,
        repeat: t.repeat,
        rolled: t.rolled ?? false,
      },
    });
  return rows;
}

/** Rebuild the plan from what the server holds. */
export function fromRows(db: Record<Table, DbRow[]>): DatedPlan {
  const s = db.settings[0];
  const settings: Settings = {
    ...SETTINGS0,
    ...((s?.data as Partial<Settings>) ?? {}),
    ...(s ? { timeZone: s.time_zone as string } : {}),
  };
  return {
    settings,
    settingsId: s?.id,
    settingsMeta: s ? metaOf(s) : undefined,
    autopilot: s ? ((s.autopilot as DatedPlan['autopilot']) ?? {}) : undefined,
    fixed: db.fixed_commitments.map((r): DatedFixed => ({
      id: r.id,
      title: r.title as string,
      cat: r.cat as DatedFixed['cat'],
      days: r.weekdays as number[],
      start: r.start_min as number,
      end: r.end_min as number,
      where: r.place as string,
      startsOn: r.starts_on as string,
      endsOn: (r.ends_on as string | null) ?? null,
      ...metaOf(r),
    })),
    reminders: db.reminders.map((r): DatedReminder => ({
      id: r.id,
      title: r.title as string,
      cat: r.cat as DatedReminder['cat'],
      days: r.weekdays as number[],
      time: r.time_min as number,
      lead: r.lead as number,
      leave: r.leave as boolean,
      note: r.note as string,
      nag: r.nag as boolean,
      startsOn: r.starts_on as string,
      endsOn: (r.ends_on as string | null) ?? null,
      doneOn: (r.done_on as string[]) ?? [],
      snoozeOn: (r.snooze as Record<string, number>) ?? {},
      ...metaOf(r),
    })),
    tasks: db.tasks.map((r): DatedTask => ({
      id: r.id,
      title: r.title as string,
      cat: r.cat as DatedTask['cat'],
      dur: r.dur as number,
      date: (r.date as string | null) ?? null,
      time: (r.start_min as number | null) ?? null,
      done: r.done as boolean,
      notes: r.notes as string,
      goal: (r.goal_id as string | null) ?? null,
      ms: (r.milestone_id as string | null) ?? null,
      pri: r.pri as number,
      repeat: r.repeat as boolean,
      ...(r.rolled ? { rolled: true } : {}),
      ...metaOf(r),
    })),
  };
}

/** Put server fields (after an insert or update) back on the matching items. */
export function applyMeta(p: DatedPlan, metas: Map<string, Meta & { id?: string }>): DatedPlan {
  const m = (table: Table, id: string) => metas.get(`${table}:${id}`);
  const set = <T extends { id: string } & Meta>(table: Table, xs: T[]): T[] =>
    xs.map((x) => {
      const v = m(table, x.id);
      return v ? { ...x, userId: v.userId, createdAt: v.createdAt, updatedAt: v.updatedAt } : x;
    });
  const sv = metas.get('settings:');
  return {
    ...p,
    fixed: set('fixed_commitments', p.fixed),
    reminders: set('reminders', p.reminders),
    tasks: set('tasks', p.tasks),
    ...(sv ? { settingsId: sv.id, settingsMeta: sv } : {}),
  };
}

export function hasRows(db: Record<Table, DbRow[]>) {
  return TABLES.some((t) => db[t].length > 0);
}
