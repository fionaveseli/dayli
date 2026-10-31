import { Pressable, View } from 'react-native';

import { Text } from '../components';
import type { DayIndex, PlanData } from '../data/types';
import { CATS, dayInfo, DAYF, fmtT, remOn } from '../rules';
import { toneColors, useTheme } from '../theme';

const START = 7 * 60;
const END = 23 * 60;
const HP = 26;
const GUTTER = 26;
const y = (m: number) => ((m - START) / 60) * HP;

/** Seven columns on one hour grid: fixed blocks, placed tasks, reminder ticks and the now line. */
export function WeekGrid({
  plan,
  selected,
  today,
  now,
  onSelect,
}: {
  plan: PlanData;
  selected: DayIndex;
  today: DayIndex;
  now: number;
  onSelect: (d: DayIndex) => void;
}) {
  const { colors: c } = useTheme();
  const hours = [8, 11, 14, 17, 20, 23];
  return (
    <View style={{ flexDirection: 'row', height: y(END) }} testID="week-grid">
      <View style={{ width: GUTTER }}>
        {hours.map((h) => (
          <Text
            key={h}
            style={{ position: 'absolute', top: y(h * 60) - 7, fontSize: 10, color: c.faint }}
          >
            {h}
          </Text>
        ))}
      </View>
      {DAYF.map((name, d) => {
        const info = dayInfo(plan, d);
        const placed = info.flex.filter((t) => t.time != null);
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${info.fixed.length} fixed, ${placed.length} placed`}
            onPress={() => onSelect(d)}
            style={{
              flex: 1,
              marginHorizontal: 1,
              borderRadius: 8,
              borderWidth: selected === d ? 1.5 : 1,
              borderColor: selected === d ? c.rose : c.line,
              backgroundColor: c.card,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y(plan.settings.wake),
                height: y(plan.settings.sleep) - y(plan.settings.wake),
                backgroundColor: c.paper,
              }}
            />
            {info.fixed.map((f) => (
              <View
                key={f.id}
                style={{
                  position: 'absolute',
                  left: 2,
                  right: 2,
                  top: y(f.start) + 1,
                  height: y(f.end) - y(f.start) - 2,
                  borderRadius: 5,
                  backgroundColor: toneColors(c, CATS[f.cat].tone).bg,
                }}
              />
            ))}
            {placed.map((t) => (
              <View
                key={t.id}
                style={{
                  position: 'absolute',
                  left: 2,
                  right: 2,
                  top: y(t.time!) + 1,
                  height: Math.max(y(t.time! + t.dur) - y(t.time!) - 2, 8),
                  borderRadius: 5,
                  borderWidth: 1.2,
                  borderStyle: 'dashed',
                  borderColor: toneColors(c, CATS[t.cat].tone).ink,
                  backgroundColor: c.card,
                  opacity: t.done ? 0.5 : 1,
                }}
              />
            ))}
            {remOn(plan, d).map((r) => (
              <View
                key={r.id}
                accessibilityLabel={`Reminder ${fmtT(r.at)}`}
                style={{
                  position: 'absolute',
                  right: 3,
                  top: y(r.at) - 2.5,
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: r.done ? c.line2 : c.ink,
                }}
              />
            ))}
            {d === today && now >= START && now <= END && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: y(now) - 1,
                  borderTopWidth: 2,
                  borderTopColor: c.rose,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
