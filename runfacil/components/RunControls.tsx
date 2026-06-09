import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/hooks/useSettings';
import { RunStatus } from '@/store/RunContext';

type Props = {
  status: RunStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
};

export function RunControls({ status, onStart, onPause, onResume, onFinish }: Props) {
  const { colors } = useSettings();

  const tap = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fn();
  };

  if (status === 'idle') {
    return (
      <View style={styles.single}>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: colors.primary }]}
          onPress={() => tap(onStart)}
          activeOpacity={0.85}
        >
          <Ionicons name='play' size={32} color='#FFF' />
          <Text style={styles.bigLabel}>Iniciar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'paused') {
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.halfBtn, { backgroundColor: colors.success }]}
          onPress={() => tap(onResume)}
          activeOpacity={0.85}
        >
          <Ionicons name='play' size={26} color='#FFF' />
          <Text style={styles.halfLabel}>Retomar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.halfBtn, { backgroundColor: colors.danger }]}
          onPress={() => tap(onFinish)}
          activeOpacity={0.85}
        >
          <Ionicons name='stop' size={26} color='#FFF' />
          <Text style={styles.halfLabel}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.halfBtn, { backgroundColor: colors.warning }]}
        onPress={() => tap(onPause)}
        activeOpacity={0.85}
      >
        <Ionicons name='pause' size={26} color='#FFF' />
        <Text style={styles.halfLabel}>Pausar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.halfBtn, { backgroundColor: colors.danger }]}
        onPress={() => tap(onFinish)}
        activeOpacity={0.85}
      >
        <Ionicons name='stop' size={26} color='#FFF' />
        <Text style={styles.halfLabel}>Finalizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  single: { padding: 20 },
  row: { flexDirection: 'row', gap: 12, padding: 20 },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 64,
    borderRadius: 32,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bigLabel: { color: '#FFF', fontSize: 20, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  halfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
  },
  halfLabel: { color: '#FFF', fontSize: 16, fontWeight: '600', fontFamily: 'SFProDisplay-Medium' },
});
