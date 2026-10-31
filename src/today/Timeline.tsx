import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Checkbox, Text } from '../components';
import type { DayIndex, Gap, PlanData } from '../data/types';
import { CATS, dayInfo, fmtD, fmtT, gapsOn, remOn } from '../rules';
import { radii, toneColors, useTheme } from '../theme';

const START = 7 * 60;
const END = 23 * 60;
const GUTTER = 42;
const SHORT = 44;

type Props = {
  plan: PlanData;
  day: DayIndex;
  /** Minutes since midnight; draws the now line when set. */
  now?: number;
  hourPx?: number;
  onToggleTask?: (id: string) => void;
  /** Makes open time tappable. */
  onGap?: (day: DayIndex, gap: Gap) => void;
};

/** The visual day: fixed blocks, placed tasks, open gaps and reminder pills on an hour grid. */
export function Timeline({ plan, day, now, hourPx = 44, onToggleTask, onGap }: Props) {
  const { colors: c } = useTheme();
  const y = (m: number) => ((m - START) / 60) * hourPx;
  const info = dayInfo(plan, day);
  const placed = info.flex.filter((t) => t.time != null);
  const gaps = gapsOn(plan, day);
  const reminders = remOn(plan, day);
  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => 7 + i);
  const showNow = now != null && now >= START && now <= END;

  return (
    <View style={{ height: y(END) + 8 }} testID="timeline">
      {hours.map((h) => (
        <View
          key={h}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y(h * 60),
            borderTopWidth: 1,
            borderTopColor: c.line,
          }}
        >
          <Text
            style={{
              position: 'absolute',
              top: -8,
              left: 0,
              fontSize: 10.5,
              lineHeight: 12,
              color: c.faint,
              backgroundColor: c.paper,
              paddingRight: 6,
            }}
          >
            {String(h).padStart(2, '0')}:00
          </Text>
        </View>
      ))}

      {plan.settings.sleep < END && (
        <View
          style={{
            position: 'absolute',
            left: GUTTER,
            right: 0,
            top: y(plan.settings.sleep) + 2,
            height: y(END) - y(plan.settings.sleep) - 2,
            backgroundColor: c.paper2,
            borderRadius: radii.sm,
            alignItems: 'flex-end',
            padding: 6,
          }}
        >
          <Text variant="small" tone="muted">
            Wind down
          </Text>
        </View>
      )}

      <View style={{ position: 'absolute', left: GUTTER, right: 0, top: 0, bottom: 0 }}>
        {gaps.map((g) => {
          const past = now != null && g.e <= now;
          return (
            <Pressable
              key={`g${g.s}`}
              accessible
              accessibilityRole={onGap && !past ? 'button' : undefined}
              accessibilityLabel={`Open time ${fmtT(g.s)} to ${fmtT(g.e)}`}
              disabled={!onGap || past}
              onPress={() => onGap?.(day, g)}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y(g.s) + 2,
                height: y(g.e) - y(g.s) - 4,
                borderRadius: radii.md - 2,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: c.line2,
                justifyContent: 'center',
                paddingHorizontal: 12,
                opacity: past ? 0.45 : 1,
              }}
            >
              <Text variant="small" tone="muted">
                {past ? 'Earlier' : 'Open'} · {fmtD(g.e - g.s)}
              </Text>
            </Pressable>
          );
        })}

        {info.fixed.map((f) => {
          const t = toneColors(c, CATS[f.cat].tone);
          const h = y(f.end) - y(f.start) - 3;
          const short = h < SHORT;
          return (
            <View
              key={f.id}
              accessible
              accessibilityLabel={`${f.title}, ${fmtT(f.start)} to ${fmtT(f.end)}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y(f.start) + 1.5,
                height: h,
                borderRadius: radii.md - 2,
                backgroundColor: t.bg,
                paddingHorizontal: 11,
                paddingVertical: short ? 3 : 7,
                flexDirection: 'row',
                alignItems: short ? 'center' : 'flex-start',
                gap: 10,
                overflow: 'hidden',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="h3" numberOfLines={1}>
                  {f.title}
                </Text>
                <Text variant="small" numberOfLines={1} style={{ color: t.ink }}>
                  {fmtT(f.start)}–{fmtT(f.end)}
                  {f.cutBy ? ' · leaving early' : f.where && !short ? ` · ${f.where}` : ''}
                </Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color={t.ink} />
            </View>
          );
        })}

        {placed.map((task) => {
          const t = toneColors(c, CATS[task.cat].tone);
          const h = y(task.time! + task.dur) - y(task.time!) - 3;
          return (
            <View
              key={task.id}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y(task.time!) + 1.5,
                height: h,
                borderRadius: radii.md - 2,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: t.ink,
                backgroundColor: c.card,
                paddingRight: 11,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: task.done ? 0.55 : 1,
              }}
            >
              <Checkbox
                checked={task.done}
                onChange={() => onToggleTask?.(task.id)}
                label={`Complete ${task.title}`}
              />
              <View style={{ flex: 1 }}>
                <Text
                  variant="h3"
                  numberOfLines={1}
                  style={task.done ? { textDecorationLine: 'line-through' } : undefined}
                >
                  {task.title}
                </Text>
                {h >= SHORT && (
                  <Text variant="small" numberOfLines={1} style={{ color: t.ink }}>
                    {fmtT(task.time!)}–{fmtT(task.time! + task.dur)} · flexible, placed
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {reminders.map((r) => (
          <View
            key={r.id}
            accessible
            accessibilityLabel={`Reminder at ${fmtT(r.at)}: ${r.title}`}
            style={{
              position: 'absolute',
              right: 8,
              top: y(r.at) - 11,
              maxWidth: '72%',
              height: 22,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 8,
              borderRadius: radii.pill,
              borderWidth: 1.5,
              borderColor: r.done ? c.line2 : c.ink,
              backgroundColor: r.leave && !r.done ? c.ink : c.card,
              opacity: r.done ? 0.55 : 1,
              zIndex: 7,
            }}
          >
            <Ionicons
              name={r.done ? 'checkmark' : 'notifications-outline'}
              size={13}
              color={r.done ? c.muted : r.leave ? c.paper : c.ink}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                lineHeight: 14,
                fontWeight: '600',
                color: r.done ? c.muted : r.leave ? c.paper : c.ink,
              }}
            >
              {fmtT(r.at)} {r.leave ? 'Leave: ' : ''}
              {r.title}
            </Text>
          </View>
        ))}

        {showNow && (
          <View
            testID="now-line"
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -8,
              right: 0,
              top: y(now) - 1,
              borderTopWidth: 2,
              borderTopColor: c.rose,
              zIndex: 6,
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: -1,
                top: -6,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: c.rose,
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}
