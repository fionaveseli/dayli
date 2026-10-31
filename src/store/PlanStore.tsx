import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SAMPLE_PLAN } from '../data/sample';
import { moveTask as moveT, placeTask as placeT, unplaceTask as unplaceT } from '../rules/calendar';
import { dateKey, rolloverFor } from '../rules/autopilot';
import { snoozeReminder as snoozeR } from '../notifications/plan';
import { mondayKey } from '../sync/dates';
import { fromView, migrateWeekPlan, toView, type DatedPlan } from '../sync/dated';
import type { DayIndex, PlanData, Reminder, Settings, Task, Fixed } from '../data/types';

/** The first shape: day indexes of one week. Read once to move it to the dated shape. */
export const LEGACY_KEY = 'dayli.plan.v1';
export const STORAGE_KEY = 'dayli.plan.v2';

const thisMonday = () => mondayKey(new Date());
const zone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};
const withZone = (d: DatedPlan): DatedPlan =>
  d.settings.timeZone ? d : { ...d, settings: { ...d.settings, timeZone: zone() } };
const initial = () => withZone(migrateWeekPlan(SAMPLE_PLAN, thisMonday()));

export type PlanStore = PlanData & {
  ready: boolean;
  /** The plan with real dates, as it is saved and synced. */
  dated: DatedPlan;
  setDated: (f: (d: DatedPlan) => DatedPlan) => void;
  apply: (f: (p: PlanData) => PlanData) => void;
  setTasks: (f: (ts: Task[]) => Task[]) => void;
  setFixed: (f: (fs: Fixed[]) => Fixed[]) => void;
  setReminders: (f: (rs: Reminder[]) => Reminder[]) => void;
  setSettings: (patch: Partial<Settings>) => void;
  toggleTask: (id: string) => void;
  toggleReminder: (id: string, day: DayIndex) => void;
  markReminderDone: (id: string, day: DayIndex) => void;
  snoozeReminder: (id: string, day: DayIndex, nowMin: number) => void;
  moveTask: (id: string, day: DayIndex | null) => void;
  placeTask: (id: string, day: DayIndex, time: number) => void;
  unplaceTask: (id: string) => void;
  approvePlan: (now: Date) => void;
  unapprovePlan: () => void;
  /** Move unfinished tasks of days that have ended to the next day with room. */
  runRollover: (now: Date) => void;
  /** Mark ended days as handled without moving anything. */
  skipRollover: (through: string) => void;
  reset: () => void;
};

const Ctx = createContext<PlanStore | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [dated, setDated] = useState<DatedPlan>(initial);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const monday = thisMonday();
  const plan = useMemo(() => toView(dated, monday), [dated, monday]);

  /** Change the plan the way the screens see it (day indexes); it is saved with dates. */
  const setPlan = useCallback(
    (f: (p: PlanData) => PlanData) =>
      setDated((d) => {
        const m = thisMonday();
        return fromView(d, f(toView(d, m)), m);
      }),
    [],
  );

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) return setDated(withZone({ ...initial(), ...JSON.parse(raw) }));
      const old = await AsyncStorage.getItem(LEGACY_KEY);
      if (old) {
        const p: PlanData = { ...SAMPLE_PLAN, ...JSON.parse(old) };
        setDated(withZone(migrateWeekPlan(p, thisMonday())));
      }
    })()
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dated)).catch(() => {});
  }, [dated]);

  const apply = useCallback((f: (p: PlanData) => PlanData) => setPlan(f), [setPlan]);
  const setTasks = useCallback(
    (f: (ts: Task[]) => Task[]) => setPlan((p) => ({ ...p, tasks: f(p.tasks) })),
    [setPlan],
  );
  const setFixed = useCallback(
    (f: (fs: Fixed[]) => Fixed[]) => setPlan((p) => ({ ...p, fixed: f(p.fixed) })),
    [setPlan],
  );
  const setReminders = useCallback(
    (f: (rs: Reminder[]) => Reminder[]) => setPlan((p) => ({ ...p, reminders: f(p.reminders) })),
    [setPlan],
  );
  const setSettings = useCallback(
    (patch: Partial<Settings>) => setPlan((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [setPlan],
  );
  const toggleTask = useCallback(
    (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    [setTasks],
  );
  const toggleReminder = useCallback(
    (id: string, day: DayIndex) =>
      setReminders((rs) =>
        rs.map((r) =>
          r.id !== id
            ? r
            : {
                ...r,
                doneDays: r.doneDays.includes(day)
                  ? r.doneDays.filter((x) => x !== day)
                  : [...r.doneDays, day],
              },
        ),
      ),
    [setReminders],
  );
  const markReminderDone = useCallback(
    (id: string, day: DayIndex) =>
      setReminders((rs) =>
        rs.map((r) =>
          r.id !== id || r.doneDays.includes(day) ? r : { ...r, doneDays: [...r.doneDays, day] },
        ),
      ),
    [setReminders],
  );
  const snoozeReminder = useCallback(
    (id: string, day: DayIndex, nowMin: number) =>
      setReminders((rs) => rs.map((r) => (r.id === id ? snoozeR(r, day, nowMin) : r))),
    [setReminders],
  );
  const moveTask = useCallback(
    (id: string, day: DayIndex | null) => setTasks((ts) => moveT(ts, id, day)),
    [setTasks],
  );
  const placeTask = useCallback(
    (id: string, day: DayIndex, time: number) => setTasks((ts) => placeT(ts, id, day, time)),
    [setTasks],
  );
  const unplaceTask = useCallback((id: string) => setTasks((ts) => unplaceT(ts, id)), [setTasks]);
  const approvePlan = useCallback(
    (now: Date) =>
      setPlan((p) => ({
        ...p,
        autopilot: {
          ...p.autopilot,
          approved: { date: dateKey(now), at: now.getHours() * 60 + now.getMinutes() },
        },
      })),
    [setPlan],
  );
  const unapprovePlan = useCallback(
    () =>
      setPlan((p) => {
        const { approved: _gone, ...rest } = p.autopilot ?? {};
        return { ...p, autopilot: rest };
      }),
    [setPlan],
  );
  const runRollover = useCallback(
    (now: Date) =>
      setPlan((p) => {
        const r = rolloverFor(p, now);
        if (!r.through) return p;
        return { ...p, tasks: r.tasks, autopilot: { ...p.autopilot, rolledThrough: r.through } };
      }),
    [setPlan],
  );
  const skipRollover = useCallback(
    (through: string) =>
      setPlan((p) => ({ ...p, autopilot: { ...p.autopilot, rolledThrough: through } })),
    [setPlan],
  );
  const reset = useCallback(() => setDated(initial()), []);

  const value = useMemo(
    () => ({
      ...plan,
      ready,
      dated,
      setDated,
      apply,
      setTasks,
      setFixed,
      setReminders,
      setSettings,
      toggleTask,
      toggleReminder,
      markReminderDone,
      snoozeReminder,
      moveTask,
      placeTask,
      unplaceTask,
      approvePlan,
      unapprovePlan,
      runRollover,
      skipRollover,
      reset,
    }),
    [
      plan,
      ready,
      dated,
      apply,
      setTasks,
      setFixed,
      setReminders,
      setSettings,
      toggleTask,
      toggleReminder,
      markReminderDone,
      snoozeReminder,
      moveTask,
      placeTask,
      unplaceTask,
      approvePlan,
      unapprovePlan,
      runRollover,
      skipRollover,
      reset,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlan(): PlanStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlan must be used inside PlanProvider');
  return v;
}
