import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { Checkbox, Text } from '../components';
import type { Fixed, ReminderWithAt, Task } from '../data/types';
import { CATS, fmtD, fmtT, toLine } from '../rules';
import { radii, toneColors, useTheme } from '../theme';

function Dot({ cat }: { cat: Task['cat'] }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: toneColors(colors, CATS[cat].tone).ink,
      }}
    />
  );
}

/** Settles with a small swell when it flips to done, like the prototype. */
function useSettle(done: boolean) {
  const [scale] = useState(() => new Animated.Value(1));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!done) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.015, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [done, scale]);
  return scale;
}

export function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const { colors: c } = useTheme();
  const scale = useSettle(task.done);
  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minHeight: 56,
        paddingVertical: 6,
        paddingLeft: 8,
        paddingRight: 14,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: task.done ? 'transparent' : c.card,
      }}
    >
      <Checkbox checked={task.done} onChange={onToggle} label={`Complete ${task.title}`} />
      <View style={{ flex: 1, paddingVertical: 4 }}>
        <Text
          variant="h3"
          tone={task.done ? 'muted' : 'ink'}
          style={task.done ? { textDecorationLine: 'line-through', fontWeight: '500' } : undefined}
        >
          {task.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Dot cat={task.cat} />
          <Text variant="small" tone="muted">
            {CATS[task.cat].label} · {fmtD(task.dur)}
            {task.time != null ? ` · ${fmtT(task.time)}` : ''}
          </Text>
          {task.pri === 3 && !task.done && (
            <Text variant="small" style={{ color: c.blushInk }}>
              Priority
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export function FixedRow({ fixed }: { fixed: Fixed }) {
  const { colors } = useTheme();
  const t = toneColors(colors, CATS[fixed.cat].tone);
  return (
    <View
      accessible
      accessibilityLabel={`${fixed.title}, ${fmtT(fixed.start)} to ${fmtT(fixed.end)}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radii.md,
        backgroundColor: t.bg,
      }}
    >
      <Text variant="label" style={{ color: t.ink, width: 94 }}>
        {fmtT(fixed.start)}–{fmtT(fixed.end)}
      </Text>
      <View style={{ flex: 1 }}>
        <Text variant="h3">{fixed.title}</Text>
        {fixed.cutBy ? (
          <Text variant="small" style={{ color: t.ink }}>
            Leaving at {fmtT(fixed.end)} to {toLine(fixed.cutBy.title)}
          </Text>
        ) : fixed.where ? (
          <Text variant="small" style={{ color: t.ink }}>
            {fixed.where}
          </Text>
        ) : null}
      </View>
      <Ionicons name="lock-closed-outline" size={16} color={t.ink} />
    </View>
  );
}

export function ReminderRow({
  reminder,
  next,
  missed,
  onToggle,
}: {
  reminder: ReminderWithAt;
  next: boolean;
  missed: boolean;
  onToggle: () => void;
}) {
  const { colors: c } = useTheme();
  const r = reminder;
  const sub = r.leave
    ? `Leave at ${fmtT(r.at)} for ${fmtT(r.time)}`
    : r.lead
      ? `Heads-up ${fmtD(r.lead)} before ${fmtT(r.time)}`
      : null;
  const meta = [sub, r.note || null].filter(Boolean).join(' · ') || 'Reminder at the time';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minHeight: 56,
        paddingVertical: 6,
        paddingLeft: 8,
        paddingRight: 12,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: next && !r.done ? c.rose : c.line,
        backgroundColor: r.done ? 'transparent' : c.card,
      }}
    >
      <Checkbox checked={r.done} onChange={onToggle} label={`Done: ${r.title}`} />
      <Text variant="label" style={{ width: 48 }}>
        {fmtT(r.at)}
      </Text>
      <View style={{ flex: 1, paddingVertical: 4 }}>
        <Text
          variant="h3"
          tone={r.done ? 'muted' : 'ink'}
          style={r.done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {r.title}
        </Text>
        <Text variant="small" tone="muted">
          {meta}
        </Text>
      </View>
      {next && !r.done && (
        <Text variant="small" style={{ color: c.rose }}>
          Next
        </Text>
      )}
      {missed && (
        <Text variant="small" style={{ color: c.warn }}>
          Missed
        </Text>
      )}
    </View>
  );
}
