import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { formatDistance, formatDuration, formatPace } from '@/constants/units';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';

export default function RunSummaryScreen() {
  const { colors } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadRuns } = useRunStorage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [run, setRun] = useState<RunRecord | null>(null);

  useEffect(() => {
    loadRuns().then((runs) => setRun(runs.find((r) => r.id === id) ?? null));
  }, [id]);

  if (!run) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: 'SFProDisplay-Regular' }}>Carregando…</Text>
      </View>
    );
  }

  const date = new Date(run.startedAt).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Orange hero header */}
      <View style={[styles.hero, { paddingTop: insets.top + 20, backgroundColor: colors.primary }]}>
        <Ionicons name='checkmark-circle' size={40} color='rgba(255,255,255,0.9)' />
        <Text style={styles.heroTitle}>Corrida Concluída!</Text>
        <Text style={styles.heroDate}>{date}</Text>
        <Text style={styles.heroDistance}>{formatDistance(run.distanceMeters)}</Text>
        <Text style={styles.heroDistLabel}>percorridos</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main stats card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatRow label={t('run.summary.duration')} value={formatDuration(run.durationSeconds)} colors={colors} />
          <StatRow label={t('run.summary.avgPace')} value={`${formatPace(run.avgPaceSecPerKm)}/km`} colors={colors} />
          <StatRow label={t('run.summary.calories')} value={`${run.caloriesKcal} kcal`} colors={colors} last />
        </View>

        {/* Heart rate card — shown only if data available */}
        {run.avgHeartRate !== null && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <StatRow label={t('run.summary.avgHR')} value={`${run.avgHeartRate} bpm`} colors={colors} />
            {run.maxHeartRate !== null && (
              <StatRow label={t('run.summary.maxHR')} value={`${run.maxHeartRate} bpm`} colors={colors} last />
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
        >
          <Ionicons name='home' size={20} color='#FFF' />
          <Text style={styles.homeBtnLabel}>Voltar ao início</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyBtn, { borderColor: colors.border }]}
          onPress={() => router.replace('/history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.historyBtnLabel, { color: colors.textSecondary }]}>Ver histórico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatRow({
  label,
  value,
  colors,
  last,
}: {
  label: string;
  value: string;
  colors: Colors;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.statRow,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 4,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'SFProDisplay-Bold',
    marginTop: 8,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'SFProDisplay-Regular',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  heroDistance: {
    color: '#FFF',
    fontSize: 60,
    fontWeight: '700',
    fontFamily: 'SFProDisplay-Bold',
    lineHeight: 68,
  },
  heroDistLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontFamily: 'SFProDisplay-Regular',
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { fontSize: 15, fontFamily: 'SFProDisplay-Regular' },
  statValue: { fontSize: 15, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
  footer: {
    padding: 20,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
  },
  homeBtnLabel: { color: '#FFF', fontSize: 16, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
  historyBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBtnLabel: { fontSize: 15, fontFamily: 'SFProDisplay-Regular' },
});
