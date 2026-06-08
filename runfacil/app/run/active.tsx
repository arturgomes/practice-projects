import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/i18n';

// Phase 1: Background GPS tracking + coordinate logging
// Phase 2: MapLibre map with live polyline + run controls
export default function ActiveRunScreen() {
  const { colors } = useSettings();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader title={t('run.active.title')} showBack={false} />
      <View style={styles.center}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          {'Tela de corrida ativa\n(Fases 1 & 2)'}
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
