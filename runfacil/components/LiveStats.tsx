import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { formatDistance, formatDuration, formatPace } from '@/constants/units';

type Props = {
  distanceMeters: number;
  paceSecPerKm: number;
  durationSeconds: number;
  heartRate: number | null;
};

export function LiveStats({ distanceMeters, paceSecPerKm, durationSeconds, heartRate }: Props) {
  const { colors } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.row}>
        <StatBlock label='Distância' value={formatDistance(distanceMeters)} textColor={colors.text} subColor={colors.textSecondary} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatBlock label='Tempo' value={formatDuration(durationSeconds)} textColor={colors.text} subColor={colors.textSecondary} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatBlock label='Pace' value={`${formatPace(paceSecPerKm)}/km`} textColor={colors.text} subColor={colors.textSecondary} />
      </View>
      {heartRate !== null && (
        <View style={[styles.hrRow, { borderTopColor: colors.border }]}>
          <Ionicons name='heart' size={16} color={colors.heartRate} />
          <Text style={[styles.hrText, { color: colors.heartRate }]}>{heartRate} bpm</Text>
        </View>
      )}
    </View>
  );
}

function StatBlock({ label, value, textColor, subColor }: {
  label: string; value: string; textColor: string; subColor: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      <Text style={[styles.label, { color: subColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', paddingVertical: 16 },
  block: { flex: 1, alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, marginVertical: 8 },
  value: { fontSize: 22, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  label: { fontSize: 12, marginTop: 2, fontFamily: 'SFProDisplay-Regular' },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hrText: { fontSize: 15, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
});
