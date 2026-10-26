import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { PlanProvider, STORAGE_KEY, usePlan } from './PlanStore';

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

describe('PlanStore', () => {
  it('starts from the sample plan, saves changes, and loads them back', async () => {
    const first = await renderHook(() => usePlan(), { wrapper });
    await waitFor(() => expect(first.result.current.ready).toBe(true));
    expect(first.result.current.tasks.length).toBeGreaterThan(0);

    await act(async () => {
      first.result.current.toggleTask('a2');
    });
    await waitFor(() => expect(mem[STORAGE_KEY]).toContain('"done":true'));
    first.unmount();

    const second = await renderHook(() => usePlan(), { wrapper });
    await waitFor(() => expect(second.result.current.ready).toBe(true));
    expect(second.result.current.tasks.find((t) => t.id === 'a2')?.done).toBe(true);
  });
});
