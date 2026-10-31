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
import { snoozeReminder as snoozeR } from '../notifications/plan';
import type { DayIndex, PlanData, Reminder, Settings, Task, Fixed } from '../data/types';

export const STORAGE_KEY = 'dayli.plan.v1';

export type PlanStore = PlanData & {
  ready: boolean;
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
  reset: () => void;
};

const Ctx = createContext<PlanStore | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanData>(SAMPLE_PLAN);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPlan({ ...SAMPLE_PLAN, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan)).catch(() => {});
  }, [plan]);

  const apply = useCallback((f: (p: PlanData) => PlanData) => setPlan(f), []);
  const setTasks = useCallback(
    (f: (ts: Task[]) => Task[]) => setPlan((p) => ({ ...p, tasks: f(p.tasks) })),
    [],
  );
  const setFixed = useCallback(
    (f: (fs: Fixed[]) => Fixed[]) => setPlan((p) => ({ ...p, fixed: f(p.fixed) })),
    [],
  );
  const setReminders = useCallback(
    (f: (rs: Reminder[]) => Reminder[]) => setPlan((p) => ({ ...p, reminders: f(p.reminders) })),
    [],
  );
  const setSettings = useCallback(
    (patch: Partial<Settings>) => setPlan((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [],
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
  const reset = useCallback(() => setPlan(SAMPLE_PLAN), []);

  const value = useMemo(
    () => ({
      ...plan,
      ready,
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
      reset,
    }),
    [
      plan,
      ready,
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
