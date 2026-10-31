import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SAMPLE_PLAN } from '../data/sample';
import { LEGACY_KEY, PlanProvider, usePlan } from './PlanStore';

const mem: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mem[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      mem[k] = v;
    }),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => <PlanProvider>{children}</PlanProvider>;

it('moves a plan saved in the first shape to dates', async () => {
  mem[LEGACY_KEY] = JSON.stringify({
    ...SAMPLE_PLAN,
    tasks: SAMPLE_PLAN.tasks.map((t) => (t.id === 'a2' ? { ...t, done: true } : t)),
  });
  const r = await renderHook(() => usePlan(), { wrapper });
  await waitFor(() => expect(r.result.current.ready).toBe(true));
  expect(r.result.current.tasks.find((t) => t.id === 'a2')?.done).toBe(true);
  const saved = r.result.current.dated.tasks.find((t) => t.id === 'a2');
  expect(saved?.date === null || /^\d{4}-\d{2}-\d{2}$/.test(saved!.date!)).toBe(true);
  expect(r.result.current.dated.settings.timeZone).toBeTruthy();
});
