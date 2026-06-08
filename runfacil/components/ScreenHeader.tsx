import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/hooks/useSettings';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, showBack = true, right }: Props) {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.side} hitSlop={12}>
            <Ionicons name='chevron-back' size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.side}>{right ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { width: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
  subtitle: { fontSize: 12, marginTop: 2, fontFamily: 'SFProDisplay-Regular' },
});
