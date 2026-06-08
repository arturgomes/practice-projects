import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/hooks/useSettings';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { WeeklySummary } from '@/components/WeeklySummary';
import { RunCard } from '@/components/RunCard';
import { t } from '@/i18n';

export default function HomeScreen() {
  const { colors } = useSettings();
  const { loadRuns } = useRunStorage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRuns = async () => {
    const data = await loadRuns();
    setRuns(data);
  };

  useEffect(() => { fetchRuns(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRuns();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.logo, { color: colors.primary }]}>{t('app.name')}</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name='settings-outline' size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <WeeklySummary runs={runs} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('history.title').toUpperCase()}
          </Text>
          {runs.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('home.noRuns')}</Text>
          ) : (
            runs.slice(0, 10).map((run) => <RunCard key={run.id} run={run} />)
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 24 }]}
        onPress={() => router.push('/run/active')}
        activeOpacity={0.85}
      >
        <Ionicons name='play' size={26} color='#FFF' />
        <Text style={styles.fabLabel}>{t('home.startRun')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: { fontSize: 26, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    fontFamily: 'SFProDisplay-Medium',
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 40,
    fontFamily: 'SFProDisplay-Regular',
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 40,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabLabel: { color: '#FFF', fontSize: 17, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
});
