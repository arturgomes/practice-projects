import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { RunMap } from '@/components/RunMap';
import { Colors } from '@/constants/theme';
import { formatDistance, formatDuration, formatPace } from '@/constants/units';
import { t } from '@/i18n';

export default function RunDetailScreen() {
  const { colors } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadRuns, deleteRun } = useRunStorage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [run, setRun] = useState<RunRecord | null>(null);

  useEffect(() => {
    loadRuns().then((runs) => setRun(runs.find((r) => r.id === id) ?? null));
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      t('history.detail.delete'),
      t('history.detail.deleteConfirm'),
      [
        { text: t('history.detail.deleteConfirmNo'), style: 'cancel' },
        {
          text: t('history.detail.deleteConfirmYes'),
          style: 'destructive',
          onPress: async () => {
            await deleteRun(id);
            router.back();
          },
        },
      ]
    );
  };

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

      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name='chevron-back' size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('history.detail.title')}</Text>
          <Text style={[styles.headerDate, { color: colors.textSecondary }]}>{date}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name='trash-outline' size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Route map */}
        <View style={styles.mapContainer}>
          {run.coordinates.length >= 2 ? (
            <RunMap coordinates={run.coordinates} mode='static' />
          ) : (
            <View style={[styles.noMap, { backgroundColor: colors.card }]}>
              <Ionicons name='map-outline' size={36} color={colors.textTertiary} />
              <Text style={[styles.noMapText, { color: colors.textTertiary }]}>Sem dados de rota</Text>
            </View>
          )}
        </View>

        {/* Hero strip: distance / duration / pace */}
        <View style={[styles.heroStrip, { backgroundColor: colors.primary }]}>
          <HeroStat label='distância' value={formatDistance(run.distanceMeters)} />
          <View style={styles.heroDivider} />
          <HeroStat label='duração' value={formatDuration(run.durationSeconds)} />
          <View style={styles.heroDivider} />
          <HeroStat label='pace/km' value={formatPace(run.avgPaceSecPerKm)} />
        </View>

        {/* Detailed stats */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StatRow label='Melhor pace' value={`${formatPace(run.bestPaceSecPerKm)}/km`} colors={colors} />
            <StatRow label={t('run.summary.calories')} value={`${run.caloriesKcal} kcal`} colors={colors} last />
          </View>

          {run.avgHeartRate !== null && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
              <StatRow label={t('run.summary.avgHR')} value={`${run.avgHeartRate} bpm`} colors={colors} />
              {run.maxHeartRate !== null && (
                <StatRow label={t('run.summary.maxHR')} value={`${run.maxHeartRate} bpm`} colors={colors} last />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroItem}>
      <Text style={styles.heroValue}>{value}</Text>
      <Text style={styles.heroLabel}>{label}</Text>
    </View>
  );
}

function StatRow({ label, value, colors, last }: {
  label: string; value: string; colors: Colors; last?: boolean;
}) {
  return (
    <View style={[
      styles.statRow,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
    ]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
  headerDate: { fontSize: 12, fontFamily: 'SFProDisplay-Regular', textTransform: 'capitalize', marginTop: 1 },
  mapContainer: { height: 280 },
  noMap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noMapText: { fontSize: 14, fontFamily: 'SFProDisplay-Regular' },
  heroStrip: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 16 },
  heroItem: { flex: 1, alignItems: 'center' },
  heroValue: { color: '#FFF', fontSize: 18, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'SFProDisplay-Regular', marginTop: 2 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 6 },
  section: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { fontSize: 15, fontFamily: 'SFProDisplay-Regular' },
  statValue: { fontSize: 15, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
});
