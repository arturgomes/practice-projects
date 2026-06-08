import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/i18n';

// Phase 3: Post-run summary — map replay, stats table, save/discard actions
export default function RunSummaryScreen() {
  const { colors } = useSettings();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader title={t('run.summary.title')} />
      <View style={styles.center}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          {'Resumo da corrida\n(Fase 3)'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16, textAlign: 'center', lineHeight: 24, fontFamily: 'SFProDisplay-Regular' },
});
