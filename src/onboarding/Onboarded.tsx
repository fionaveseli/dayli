import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const ONBOARDED_KEY = 'dayli.onboarded.v1';

type Value = { ready: boolean; done: boolean; setDone: (v: boolean) => void };
const Ctx = createContext<Value | null>(null);

/** Remembers on this phone whether the first-run welcome has been completed or skipped. */
export function OnboardedProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [done, setDoneState] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setDoneState(v === '1'))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const setDone = useCallback((v: boolean) => {
    setDoneState(v);
    AsyncStorage.setItem(ONBOARDED_KEY, v ? '1' : '0').catch(() => {});
  }, []);
  const value = useMemo(() => ({ ready, done, setDone }), [ready, done, setDone]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarded(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarded must be used inside OnboardedProvider');
  return v;
}
