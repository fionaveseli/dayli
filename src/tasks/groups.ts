import type { Category, DayIndex, PlanData, ReminderWithAt, Task } from '../data/types';
import { CATS } from '../rules';

export type Section = 'today' | 'week' | 'dump' | 'rem' | 'done';
export type CatFilter = Category | 'all';

export const SECTIONS: { value: Section; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'dump', label: 'Brain dump' },
  { value: 'rem', label: 'Reminders' },
  { value: 'done', label: 'Completed' },
];

export const EMPTY_COPY: Record<Section, [string, string]> = {
  today: ['Today is clear.', 'Nothing flexible left. Pull something from this week or rest.'],
  week: ['Nothing else this week.', 'Flexible tasks for the rest of the week will show up here.'],
  dump: ['Your brain dump is empty.', 'Write down anything on your mind. No date needed.'],
  rem: ['No reminders yet.', 'Type "remind me at 4 to leave for pickup" and Dayli sets it up.'],
  done: ['Nothing completed yet.', 'Check something off and it lands here.'],
};

/** Categories offered as filters: everything except the day job, as in the prototype. */
export const FILTER_CATS = (Object.keys(CATS) as Category[]).filter((c) => c !== 'work');

export type Groups = {
  today: Task[];
  week: Task[];
  dump: Task[];
  rem: ReminderWithAt[];
  done: Task[];
};

const by = (cat: CatFilter) => (x: { cat: Category }) => cat === 'all' || x.cat === cat;

/** The five lists on the Tasks screen, with the category filter applied. */
export function groupTasks(plan: PlanData, today: DayIndex, cat: CatFilter = 'all'): Groups {
  const open = plan.tasks.filter((t) => !t.done);
  return {
    today: open.filter((t) => t.day === today).filter(by(cat)),
    week: open
      .filter((t) => t.day != null && t.day > today)
      .sort((a, b) => a.day! - b.day!)
      .filter(by(cat)),
    dump: open.filter((t) => t.day == null).filter(by(cat)),
    rem: plan.reminders
      .map((r) => ({ ...r, at: r.time - r.lead, done: false }))
      .sort((a, b) => a.at - b.at)
      .filter(by(cat)),
    done: plan.tasks.filter((t) => t.done).filter(by(cat)),
  };
}

/** Open tasks and minutes per category, for the filter summary. */
export function openByCategory(plan: PlanData): Record<Category, { n: number; mins: number }> {
  const out = {} as Record<Category, { n: number; mins: number }>;
  for (const c of Object.keys(CATS) as Category[]) out[c] = { n: 0, mins: 0 };
  for (const t of plan.tasks)
    if (!t.done) {
      out[t.cat].n += 1;
      out[t.cat].mins += t.dur;
    }
  return out;
}
