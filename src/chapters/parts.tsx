import { Pressable, View } from 'react-native';

import { Text } from '../components';
import { chapterMeta, fmtRange, type ChapterInfo } from '../rules';
import { dateKey } from '../rules/autopilot';
import { fonts, hit, radii, toneColors, useTheme } from '../theme';

/** Today as `YYYY-MM-DD`. */
export const todayKey = () => dateKey(new Date());

export function Bar({
  p,
  height = 6,
  track,
  fill,
}: {
  p: number;
  height?: number;
  track: string;
  fill: string;
}) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`,
          flex: 1,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

const STATUS = { now: 'Now', next: 'Next', past: 'Closed' };

/** A chapter in its own colour: dates, name, time passed. */
export function ChapterCard({
  chapter,
  big,
  onPress,
}: {
  chapter: ChapterInfo;
  big?: boolean;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  const tone = toneColors(c, chapter.color);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${chapter.name}, ${STATUS[chapter.status]}`}
      onPress={onPress}
      style={{
        minHeight: hit,
        backgroundColor: tone.bg,
        borderRadius: radii.xl,
        padding: big ? 24 : 20,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="small" style={{ flex: 1, color: tone.ink, fontFamily: fonts.uiSemi }}>
          {fmtRange(chapter.start, chapter.end, todayKey())}
        </Text>
        <View
          style={{
            borderWidth: 1.5,
            borderColor: tone.ink,
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 3,
          }}
        >
          <Text variant="small" style={{ color: tone.ink, fontFamily: fonts.uiSemi }}>
            {STATUS[chapter.status]}
          </Text>
        </View>
      </View>
      <Text variant={big ? 'title' : 'h2'} style={{ color: c.ink }}>
        {chapter.name}
      </Text>
      {big && chapter.desc ? <Text tone="ink2">{chapter.desc}</Text> : null}
      <Bar p={chapter.tp} track="rgba(255,255,255,.6)" fill={tone.ink} />
      <Text variant="small" style={{ color: tone.ink, fontFamily: fonts.uiSemi }}>
        {chapterMeta(chapter)}
      </Text>
    </Pressable>
  );
}

export const SWATCHES = ['blush', 'powder', 'sage', 'lav', 'peach', 'butter'] as const;
