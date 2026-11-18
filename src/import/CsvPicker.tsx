import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '../components';
import { CATS } from '../rules';
import { keyOf } from '../sync/dates';
import { hit, radii, toneColors, useTheme } from '../theme';
import {
  ImportError,
  readSchedule,
  SAMPLE_CSV,
  whenLabel,
  type ImportedFixed,
  type ImportResult,
} from './csv';

export type PickedFile = ImportResult & { name: string };

const MIME = ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel'];
const MAX_BYTES = 1_000_000;

/** Opens the system file picker and reads a CSV. Null when the user cancels. */
async function pickCsv(): Promise<{ name: string; text: string } | null> {
  const picked = await File.pickFileAsync({ mimeTypes: MIME });
  if (picked.canceled || !picked.result) return null;
  const f = picked.result;
  if (f.size > MAX_BYTES)
    throw new ImportError('That file is too big. Try a single term or month.');
  return { name: f.name || 'schedule.csv', text: await f.text() };
}

/** "2 already over, 1 all-day event" */
const skippedSummary = (r: ImportResult) => {
  const n = new Map<string, number>();
  r.skipped.forEach((s) => n.set(s.why, (n.get(s.why) ?? 0) + 1));
  return [...n].map(([why, k]) => `${k} × ${why.toLowerCase()}`).join(', ');
};

/**
 * The drop box from the prototype: choose a CSV (or the sample), then see what was found
 * and remove anything that shouldn't come in.
 */
export function CsvPicker({
  file,
  onChange,
}: {
  file: PickedFile | null;
  onChange: (f: PickedFile | null) => void;
}) {
  const { colors: c } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const read = (name: string, text: string) => {
    try {
      onChange({ ...readSchedule(text, keyOf(new Date())), name });
      setError(null);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : 'I couldn’t read that file.');
    }
  };
  const choose = async () => {
    try {
      const got = await pickCsv();
      if (got) read(got.name, got.text);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : 'I couldn’t open that file.');
    }
  };
  const remove = (f: ImportedFixed) =>
    file && onChange({ ...file, fixed: file.fixed.filter((x) => x.id !== f.id) });

  if (!file)
    return (
      <View style={{ gap: 10 }}>
        <View style={[styles.drop, { borderColor: c.line2, backgroundColor: c.card }]}>
          <Ionicons name="document-outline" size={28} color={c.ink2} />
          <Text variant="h3" style={{ textAlign: 'center' }}>
            Bring a schedule from somewhere else
          </Text>
          <Text variant="small" tone="muted" style={{ textAlign: 'center' }}>
            A CSV with title, days, start and end works. Exports from Google Calendar or a
            university timetable are fine.
          </Text>
          <Button label="Choose a CSV file" onPress={choose} />
          <Button
            label="Use a sample file"
            kind="secondary"
            size="sm"
            onPress={() => read('my-week.csv', SAMPLE_CSV)}
          />
        </View>
        {error && <Text tone="ink2">{error}</Text>}
      </View>
    );

  const fixedCount = file.fixed.length;
  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
        <Ionicons name="document-text-outline" size={20} color={c.ink2} />
        <View style={{ flex: 1 }}>
          <Text variant="h3" numberOfLines={1}>
            {file.name}
          </Text>
          <Text variant="small" tone="muted">
            {file.rows} {file.rows === 1 ? 'row' : 'rows'} · {fixedCount} fixed
            {file.skipped.length ? ` · ${file.skipped.length} skipped` : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove file"
          onPress={() => onChange(null)}
          style={styles.x}
        >
          <Ionicons name="close" size={18} color={c.muted} />
        </Pressable>
      </View>
      {file.fixed.map((f) => {
        const tone = toneColors(c, CATS[f.cat].tone);
        return (
          <View
            key={f.id}
            style={[
              styles.row,
              { backgroundColor: tone.bg, borderColor: c.line, borderLeftColor: tone.ink },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h3">{f.title}</Text>
              <Text variant="small" tone="ink2">
                {whenLabel(f)}
                {f.where ? ` · ${f.where}` : ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${f.title}`}
              onPress={() => remove(f)}
              style={styles.x}
            >
              <Ionicons name="close" size={18} color={c.ink2} />
            </Pressable>
          </View>
        );
      })}
      {fixedCount === 0 && <Text tone="muted">Nothing left to import from this file.</Text>}
      {file.skipped.length > 0 && (
        <Text variant="small" tone="muted">
          Left out: {skippedSummary(file)}.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drop: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: 26,
    alignItems: 'center',
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
  },
  x: { width: hit, height: hit, alignItems: 'center', justifyContent: 'center' },
});
