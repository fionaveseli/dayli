import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Segmented, Text, TimeField, Toggle } from '../components';
import type { Settings } from '../data/types';
import { DAYF, fmtD, fmtT } from '../rules';
import { usePlan } from '../store';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label" tone="ink2" style={{ marginHorizontal: 4 }}>
        {title}
      </Text>
      <Card>
        <View style={{ gap: 16 }}>{children}</View>
      </Card>
    </View>
  );
}

function Row({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">{title}</Text>
          {sub ? (
            <Text variant="small" tone="muted">
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function Switch({
  title,
  sub,
  value,
  onChange,
}: {
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        {sub ? (
          <Text variant="small" tone="muted">
            {sub}
          </Text>
        ) : null}
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

const Chips = ({ children }: { children: ReactNode }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
);

export function SettingsScreen() {
  const router = useRouter();
  const { settings: st, setSettings } = usePlan();
  const set = (p: Partial<Settings>) => setSettings(p);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="h1">Settings</Text>
          <Button label="Done" kind="secondary" onPress={() => router.back()} />
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="label" tone="ink2" style={{ marginHorizontal: 4 }}>
            Theme
          </Text>
          <Segmented
            full
            value={st.theme}
            onChange={(theme) => set({ theme })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </View>

        <Group title="Working hours">
          <Row title="Work starts">
            <TimeField
              label="Work starts"
              value={st.workStart}
              onChange={(workStart) => set({ workStart })}
            />
          </Row>
          <Row title="Work ends">
            <TimeField
              label="Work ends"
              value={st.workEnd}
              onChange={(workEnd) => set({ workEnd })}
            />
          </Row>
          <Row title="My day starts" sub="Free time is counted from here">
            <TimeField label="Day starts" value={st.wake} onChange={(wake) => set({ wake })} />
          </Row>
          <Row title="Wind down from" sub="Nothing is suggested after this">
            <TimeField label="Wind down" value={st.sleep} onChange={(sleep) => set({ sleep })} />
          </Row>
        </Group>

        <Group title="Breathing room">
          <Row title="Kept free each day" sub="For meals, travel and doing nothing">
            <Chips>
              {[30, 60, 90, 120].map((m) => (
                <Chip
                  key={m}
                  label={fmtD(m)}
                  on={st.buffer === m}
                  onPress={() => set({ buffer: m })}
                />
              ))}
            </Chips>
          </Row>
          <Switch
            title="Protect my evenings"
            sub="No nudges after 21:00"
            value={st.protectEvening}
            onChange={(protectEvening) => set({ protectEvening })}
          />
          <Row title="Rest day">
            <Chips>
              {[5, 6].map((d) => (
                <Chip
                  key={d}
                  label={DAYF[d]}
                  on={st.restDay === d}
                  onPress={() => set({ restDay: d as Settings['restDay'] })}
                />
              ))}
            </Chips>
          </Row>
        </Group>

        <Group title="Daily autopilot">
          <Switch
            title="Morning plan"
            sub={`At ${fmtT(st.planTime)}, your day ready to approve`}
            value={st.nMorning}
            onChange={(nMorning) => set({ nMorning })}
          />
          {st.nMorning ? (
            <TimeField
              label="Plan time"
              value={st.planTime}
              onChange={(planTime) => set({ planTime })}
            />
          ) : null}
          <Switch
            title="Move unfinished tasks forward"
            sub="Each night, to the next day with room"
            value={st.autoRoll}
            onChange={(autoRoll) => set({ autoRoll })}
          />
          <Switch
            title="Ask me before moving them"
            sub="Otherwise it just happens"
            value={st.rollAsk}
            onChange={(rollAsk) => set({ rollAsk })}
          />
          <Switch
            title="Don’t let a day overflow"
            sub="Suggest moving something when a day has more than its free time"
            value={st.capGuard}
            onChange={(capGuard) => set({ capGuard })}
          />
        </Group>

        <Group title="Reminders">
          <Switch
            title="Keep reminding until I tick it off"
            sub="Again every 10 minutes, for reminders that matter"
            value={st.nNag}
            onChange={(nNag) => set({ nNag })}
          />
          <Switch
            title="Break through Focus and silent mode"
            sub="Only for reminders you mark important"
            value={st.nCritical}
            onChange={(nCritical) => set({ nCritical })}
          />
          <Row title="Default heads-up" sub="How early new reminders go off">
            <Chips>
              {[0, 10, 30, 60].map((m) => (
                <Chip
                  key={m}
                  label={m ? `${fmtD(m)} before` : 'At the time'}
                  on={st.defLead === m}
                  onPress={() => set({ defLead: m })}
                />
              ))}
            </Chips>
          </Row>
        </Group>

        <Group title="Other notifications">
          <Switch
            title="Gentle nudges"
            sub="When free time and a task line up"
            value={st.nNudge}
            onChange={(nNudge) => set({ nNudge })}
          />
          <Switch
            title="Sunday reset"
            sub="Plan the coming week"
            value={st.nWeekly}
            onChange={(nWeekly) => set({ nWeekly })}
          />
          <Switch
            title="Milestone dates"
            value={st.nMilestone}
            onChange={(nMilestone) => set({ nMilestone })}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}
