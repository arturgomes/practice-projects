import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/i18n';

// Phase 4: Run detail — static map of route, full stats breakdown, delete action
export default function RunDetailScreen() {
  const { colors } = useSettings();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader title={t('history.detail.title')} />
      <View style={styles.center}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          {'Detalhes da corrida\n(Fase 4)'}
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
