import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { Editor } from './Editor';
import type { EditorTarget, Form } from './form';

type Open = { target: EditorTarget; defaults?: Partial<Form>; key: number };
type Api = { openEditor: (target?: EditorTarget, defaults?: Partial<Form>) => void };

const Ctx = createContext<Api | null>(null);

/** Mounts the editor sheet once, so any screen can open it. */
export function EditorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const openEditor = useCallback(
    (target: EditorTarget = null, defaults?: Partial<Form>) =>
      setOpen({ target, defaults, key: Date.now() }),
    [],
  );
  const value = useMemo(() => ({ openEditor }), [openEditor]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {open && (
        <Editor
          key={open.key}
          target={open.target}
          defaults={open.defaults}
          onClose={() => setOpen(null)}
        />
      )}
    </Ctx.Provider>
  );
}

export function useEditor(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEditor must be used inside EditorProvider');
  return v;
}
