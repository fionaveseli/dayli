import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components';
import { hit, useTheme } from '../theme';

/** A small bottom sheet for short choices. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: c.scrim,
          }}
        />
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: '85%',
            backgroundColor: c.paper,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 14,
            }}
          >
            <Text variant="title">{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={22} color={c.ink} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingTop: 8,
              paddingBottom: 20 + insets.bottom,
              gap: 10,
            }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** One tappable choice in a sheet. */
export function Option({
  label,
  sub,
  right,
  current,
  muted,
  onPress,
}: {
  label: string;
  sub?: string;
  right?: ReactNode;
  current?: boolean;
  muted?: boolean;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: current ? 1.5 : 1,
        borderColor: current ? c.rose : c.line,
        backgroundColor: current ? c.sel : c.card,
        opacity: muted ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="h3">{label}</Text>
        {sub ? (
          <Text variant="small" tone="muted">
            {sub}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}
