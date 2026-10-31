import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { usePlan } from '../store';
import { useAuth } from './Auth';
import { supabase } from './client';
import { applyMeta, fromRows, hasRows, toRows } from './rows';
import { diffRows, pullAll, pushChanges, snapshot, type Synced } from './engine';
import { stripMeta } from './dated';

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error';
const Ctx = createContext<SyncStatus>('off');
export const useSyncStatus = () => useContext(Ctx);

/**
 * Keeps the plan on the phone and in Supabase the same while someone is signed in.
 * First sign-in with an empty account uploads what is on the phone; otherwise the account wins.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { dated, setDated, ready } = usePlan();
  const userId = session?.user.id ?? null;
  const [status, setStatus] = useState<SyncStatus>('off');
  const [pulled, setPulled] = useState<string | null>(null);
  const synced = useRef<Synced>({});
  const datedRef = useRef(dated);
  useEffect(() => {
    datedRef.current = dated;
  });
  const busy = useRef(false);
  const again = useRef(false);

  // Pull once per sign-in.
  useEffect(() => {
    if (!supabase || !userId || !ready) return;
    let live = true;
    pullAll(supabase)
      .then((db) => {
        if (!live) return;
        if (hasRows(db)) {
          const remote = fromRows(db);
          synced.current = snapshot(toRows(remote));
          setDated((d) => ({
            ...remote,
            settings: {
              ...remote.settings,
              timeZone: remote.settings.timeZone ?? d.settings.timeZone,
            },
          }));
        } else {
          synced.current = {};
          setDated(stripMeta);
        }
        setPulled(userId);
      })
      .catch(() => live && setStatus('error'));
    return () => {
      live = false;
      setPulled(null);
    };
  }, [userId, ready, setDated]);

  // Push local changes, a moment after they stop.
  useEffect(() => {
    if (!supabase || !userId || pulled !== userId) return;
    const client = supabase;
    const timer = setTimeout(async function run() {
      if (busy.current) {
        again.current = true;
        return;
      }
      busy.current = true;
      try {
        const changes = diffRows(toRows(datedRef.current), synced.current);
        if (!changes.add.length && !changes.change.length && !changes.remove.length) {
          setStatus('synced');
          return;
        }
        setStatus('syncing');
        const res = await pushChanges(client, userId, changes, synced.current);
        synced.current = res.synced;
        setDated((d) => applyMeta(d, res.metas));
        if (res.conflict) {
          // Changed somewhere else since we read it: take the account's version.
          const remote = fromRows(await pullAll(client));
          synced.current = snapshot(toRows(remote));
          setDated(() => remote);
        }
        setStatus('synced');
      } catch {
        setStatus('error');
      } finally {
        busy.current = false;
        if (again.current) {
          again.current = false;
          void run();
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [dated, userId, pulled, setDated]);

  return <Ctx.Provider value={userId ? status : 'off'}>{children}</Ctx.Provider>;
}
