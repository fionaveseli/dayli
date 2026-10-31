export type Category = 'work' | 'client' | 'portfolio' | 'interview' | 'fitness' | 'personal';

/** Day index: 0 = Monday … 6 = Sunday. Times are minutes since midnight. */
export type DayIndex = number;

export type Fixed = {
  id: string;
  title: string;
  cat: Category;
  days: DayIndex[];
  start: number;
  end: number;
  where: string;
  cutBy?: Reminder;
};

export type Task = {
  id: string;
  title: string;
  cat: Category;
  dur: number;
  /** null = brain dump, -1 = yesterday (completed history) */
  day: DayIndex | null;
  time: number | null;
  done: boolean;
  notes: string;
  goal: string | null;
  ms: string | null;
  pri: number;
  repeat: boolean;
  rolled?: boolean;
};

export type Reminder = {
  id: string;
  title: string;
  days: DayIndex[];
  time: number;
  /** heads-up in minutes before `time` */
  lead: number;
  /** "time to leave": ends any fixed block it falls inside */
  leave: boolean;
  note: string;
  cat: Category;
  doneDays: DayIndex[];
  nag: boolean;
  snooze?: Record<number, number>;
};

export type Settings = {
  theme: 'system' | 'light' | 'dark';
  wake: number;
  sleep: number;
  workStart: number;
  workEnd: number;
  buffer: number;
  protectEvening: boolean;
  restDay: DayIndex;
  weekStart: string;
  timeFmt: string;
  nMorning: boolean;
  nNudge: boolean;
  nWeekly: boolean;
  nMilestone: boolean;
  nNag: boolean;
  nCritical: boolean;
  defLead: number;
  autoRoll: boolean;
  rollAsk: boolean;
  capGuard: boolean;
  planTime: number;
  /** IANA time zone, e.g. `Europe/Tirane`. */
  timeZone?: string;
};

/** What the daily autopilot has already done. Dates are local `YYYY-MM-DD`. */
export type Autopilot = {
  /** The day whose plan was approved, and the minute it happened. */
  approved?: { date: string; at: number };
  /** The last day whose unfinished tasks were moved forward (or left on purpose). */
  rolledThrough?: string;
};

export type PlanData = {
  fixed: Fixed[];
  tasks: Task[];
  reminders: Reminder[];
  settings: Settings;
  autopilot?: Autopilot;
};

export type ReminderWithAt = Reminder & { at: number; done: boolean };
export type LoadKind = 'light' | 'balanced' | 'full' | 'over';
export type Load = { r: number; k: LoadKind; empty: boolean; label: string };
export type DayInfo = {
  fixed: Fixed[];
  flex: Task[];
  free: number;
  planned: number;
  left: number;
  load: Load;
};
export type Gap = { s: number; e: number };
export type RolloverMove = { t: Task; to: DayIndex | null; why: string };
export type ParsedReminder = { title: string; time: number; lead: number; leave: boolean };
