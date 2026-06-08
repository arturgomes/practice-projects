import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings } from '@/hooks/useSettings';
import { RunRecord } from '@/hooks/useRunStorage';
import { formatDistance, formatDuration, formatPace } from '@/constants/units';

type Props = { run: RunRecord };

export function RunCard({ run }: Props) {
  const { colors } = useSettings();
  const router = useRouter();

  const date = new Date(run.startedAt).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/history/${run.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.iconBg, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name='walk-outline' size={20} color={colors.primary} />
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{date}</Text>
      </View>
      <View style={styles.stats}>
        <StatItem label='Distância' value={formatDistance(run.distanceMeters)} color={colors.text} sub={colors.textSecondary} />
        <StatItem label='Duração' value={formatDuration(run.durationSeconds)} color={colors.text} sub={colors.textSecondary} />
        <StatItem label='Pace' value={`${formatPace(run.avgPaceSecPerKm)}/km`} color={colors.text} sub={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

function StatItem({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: sub }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 14, fontFamily: 'SFProDisplay-Regular', textTransform: 'capitalize' },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  statLabel: { fontSize: 11, marginTop: 2, fontFamily: 'SFProDisplay-Regular' },
});
