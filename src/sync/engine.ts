import type { SupabaseClient } from '@supabase/supabase-js';
import type { Meta } from './dated';
import { TABLES, fingerprint, rowKey, type DbRow, type Row, type Table } from './rows';

export type Synced = Record<string, string>;

export async function pullAll(client: SupabaseClient): Promise<Record<Table, DbRow[]>> {
  const out = {} as Record<Table, DbRow[]>;
  for (const t of TABLES) {
    const { data, error } = await client.from(t).select('*');
    if (error) throw error;
    out[t] = (data ?? []) as DbRow[];
  }
  return out;
}

export const snapshot = (rows: Row[]): Synced =>
  Object.fromEntries(rows.map((r) => [rowKey(r), fingerprint(r)]));

export type Changes = { add: Row[]; change: Row[]; remove: string[] };

/** Which rows are new, edited or gone since the last time they matched the server. */
export function diffRows(rows: Row[], synced: Synced): Changes {
  const add: Row[] = [];
  const change: Row[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const k = rowKey(r);
    seen.add(k);
    if (!r.meta.updatedAt) add.push(r);
    else if (synced[k] !== fingerprint(r)) change.push(r);
  }
  const remove = Object.keys(synced).filter((k) => !seen.has(k) && !k.startsWith('settings:'));
  return { add, change, remove };
}

export type PushResult = {
  synced: Synced;
  metas: Map<string, Meta & { id?: string }>;
  /** A row changed on the server since we read it, so it was not overwritten. */
  conflict: boolean;
};

const metaFrom = (r: DbRow): Meta & { id: string } => ({
  id: r.id,
  userId: r.user_id as string,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

/** Send the changes. An update only goes through if the row still has the `updated_at` we read. */
export async function pushChanges(
  client: SupabaseClient,
  userId: string,
  changes: Changes,
  synced: Synced,
): Promise<PushResult> {
  const next: Synced = { ...synced };
  const metas = new Map<string, Meta & { id?: string }>();
  let conflict = false;

  for (const r of changes.add) {
    const { data, error } = await client
      .from(r.table)
      .insert({ ...r.content, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    const row = data as DbRow;
    metas.set(r.table === 'settings' ? 'settings:' : rowKey(r), metaFrom(row));
    next[r.table === 'settings' ? `settings:${row.id}` : rowKey(r)] = fingerprint(r);
  }

  for (const r of changes.change) {
    const { data, error } = await client
      .from(r.table)
      .update(r.content)
      .eq('user_id', userId)
      .eq('id', r.id)
      .eq('updated_at', r.meta.updatedAt as string)
      .select();
    if (error) throw error;
    if (!data?.length) {
      conflict = true;
      continue;
    }
    metas.set(rowKey(r), metaFrom(data[0] as DbRow));
    next[rowKey(r)] = fingerprint(r);
  }

  for (const k of changes.remove) {
    const [table, id] = [k.slice(0, k.indexOf(':')) as Table, k.slice(k.indexOf(':') + 1)];
    const { error } = await client.from(table).delete().eq('user_id', userId).eq('id', id);
    if (error) throw error;
    delete next[k];
  }
  return { synced: next, metas, conflict };
}
