import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '../components';
import type { WidgetItem, WidgetView } from '../rules/widget';
import { radii, toneColors, useTheme } from '../theme';

const WORDMARK = { fontSize: 17, lineHeight: 20 };

function ItemBlock({ label, item }: { label: string; item: WidgetItem }) {
  const { colors: c } = useTheme();
  const t = toneColors(c, item.tone);
  const solid = item.style === 'solid';
  return (
    <View
      style={{
        gap: 2,
        padding: 10,
        borderRadius: radii.sm,
        backgroundColor: solid ? t.bg : c.paper,
        borderWidth: solid ? 0 : 1,
        borderColor: c.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {item.style === 'bell' && <Ionicons name="notifications-outline" size={12} color={t.ink} />}
        <Text variant="small" style={{ color: t.ink }}>
          {label} · {item.time}
        </Text>
      </View>
      <Text variant="h3" numberOfLines={2}>
        {item.title}
      </Text>
      {item.sub ? (
        <Text variant="small" tone="muted" numberOfLines={1}>
          {item.sub}
        </Text>
      ) : null}
    </View>
  );
}

function NextThing({ view }: { view: WidgetView }) {
  if (view.next) return <ItemBlock label="Next" item={view.next} />;
  if (view.now) return <ItemBlock label="Now" item={view.now} />;
  return (
    <Text variant="small" tone="muted">
      {view.rest}
    </Text>
  );
}

function Frame({ wide, children }: { wide?: boolean; children: ReactNode }) {
  const { colors: c } = useTheme();
  return (
    <View
      style={{
        width: wide ? 330 : 158,
        minHeight: 158,
        maxWidth: '100%',
        padding: 12,
        gap: 8,
        borderRadius: 22,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.line,
      }}
    >
      {children}
    </View>
  );
}

/** The small widget: today's next thing. */
export function SmallWidget({ view }: { view: WidgetView }) {
  return (
    <Frame>
      <Text variant="wordmark" style={WORDMARK}>
        Dayli
      </Text>
      <NextThing view={view} />
    </Frame>
  );
}

/** The medium widget: the next thing beside Don't forget. */
export function MediumWidget({ view }: { view: WidgetView }) {
  const { colors: c } = useTheme();
  return (
    <Frame wide>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="wordmark" style={WORDMARK}>
            Dayli
          </Text>
          <NextThing view={view} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="label">Don&apos;t forget</Text>
          {view.dontForget.slice(0, 3).map((r) => (
            <View key={`${r.title}${r.time}`} style={{ flexDirection: 'row', gap: 6 }}>
              <Text
                variant="small"
                style={{ color: r.missed ? c.warn : r.next ? c.rose : c.muted, width: 38 }}
              >
                {r.time}
              </Text>
              <Text variant="small" numberOfLines={2} style={{ flex: 1 }}>
                {r.title}
              </Text>
            </View>
          ))}
          {view.dontForget.length === 0 && (
            <Text variant="small" tone="muted">
              {view.dontForgetNote === 'All done' ? 'All done.' : 'Nothing to remember today.'}
            </Text>
          )}
        </View>
      </View>
    </Frame>
  );
}
