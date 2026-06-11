import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/hooks/useSettings';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RunCard } from '@/components/RunCard';
import { t } from '@/i18n';

export default function HistoryScreen() {
  const { colors } = useSettings();
  const { loadRuns } = useRunStorage();
  const insets = useSafeAreaInsets();
  const [runs, setRuns] = useState<RunRecord[]>([]);

  useEffect(() => { loadRuns().then(setRuns); }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader title={t('history.title')} />
      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RunCard run={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('history.empty')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 15, fontFamily: 'SFProDisplay-Regular' },
});
