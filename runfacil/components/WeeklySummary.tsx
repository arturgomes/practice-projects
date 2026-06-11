import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RunRecord } from '@/hooks/useRunStorage';
import { formatDistance, formatDuration } from '@/constants/units';

type Props = { runs: RunRecord[] };

export function WeeklySummary({ runs }: Props) {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = runs.filter((r) => r.startedAt >= weekStart);

  const totalDist = week.reduce((s, r) => s + r.distanceMeters, 0);
  const totalTime = week.reduce((s, r) => s + r.durationSeconds, 0);
  const longest = week.reduce((m, r) => (r.distanceMeters > m ? r.distanceMeters : m), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>ESTA SEMANA</Text>
      <View style={styles.row}>
        <Stat label='Corridas' value={String(week.length)} />
        <Stat label='Distância' value={formatDistance(totalDist)} />
        <Stat label='Tempo' value={formatDuration(totalTime)} />
        <Stat label='Maior' value={formatDistance(longest)} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.val}>{value}</Text>
      <Text style={styles.lbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: 'SFProDisplay-Medium',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  val: { color: '#FFF', fontSize: 18, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  lbl: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2, fontFamily: 'SFProDisplay-Regular' },
});
