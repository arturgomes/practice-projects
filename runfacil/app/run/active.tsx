import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { useRun, Coordinate, RunStatus } from '@/store/RunContext';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { useRunCalculations } from '@/hooks/useRunCalculations';
import { RunMap } from '@/components/RunMap';
import { LiveStats } from '@/components/LiveStats';
import { RunControls } from '@/components/RunControls';
import { estimateCalories } from '@/constants/units';

function useElapsedSeconds(
  startedAt: number | null,
  pausedDuration: number,
  status: RunStatus
): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (status !== 'running' || !startedAt) {
      if (status === 'idle') setElapsed(0);
      return;
    }
    setElapsed(Math.floor((Date.now() - startedAt - pausedDuration) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt - pausedDuration) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startedAt, pausedDuration]);
  return elapsed;
}

export default function ActiveRunScreen() {
  useKeepAwake();
  const { colors, settings } = useSettings();
  const { state, dispatch } = useRun();
  const { saveRun } = useRunStorage();
  const { calculateDistance, calculatePace, resetPaceWindow } = useRunCalculations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const elapsed = useElapsedSeconds(state.startedAt, state.pausedDuration, state.status);

  const handleCoordinate = useCallback(
    (coord: Coordinate) => dispatch({ type: 'ADD_COORDINATE', payload: coord }),
    [dispatch]
  );

  const { status: gpsStatus, error: gpsError, startTracking, pauseTracking, resumeTracking, stopTracking } =
    useGPSTracking({ onCoordinate: handleCoordinate });

  // Recalculate distance + rolling pace after each new coordinate.
  useEffect(() => {
    if (state.status !== 'running' || state.coordinates.length < 2) return;
    const dist = calculateDistance(state.coordinates);
    dispatch({ type: 'SET_DISTANCE', payload: dist });
    const pace = calculatePace(dist);
    if (pace > 0) dispatch({ type: 'SET_PACE', payload: pace });
  }, [state.coordinates, state.status, calculateDistance, calculatePace, dispatch]);

  const handleStart = useCallback(async () => {
    dispatch({ type: 'START', payload: { timestamp: Date.now() } });
    resetPaceWindow();
    await startTracking();
  }, [dispatch, resetPaceWindow, startTracking]);

  const handlePause = useCallback(async () => {
    dispatch({ type: 'PAUSE', payload: { timestamp: Date.now() } });
    await pauseTracking();
  }, [dispatch, pauseTracking]);

  const handleResume = useCallback(async () => {
    dispatch({ type: 'RESUME', payload: { timestamp: Date.now() } });
    await resumeTracking();
  }, [dispatch, resumeTracking]);

  const handleFinish = useCallback(async () => {
    await stopTracking();
    dispatch({ type: 'FINISH' });
    const now = Date.now();
    const run: RunRecord = {
      id: `run_${now}`,
      startedAt: state.startedAt ?? now,
      finishedAt: now,
      durationSeconds: elapsed,
      distanceMeters: state.distance,
      avgPaceSecPerKm: state.distance > 0 ? (elapsed / state.distance) * 1000 : 0,
      bestPaceSecPerKm: state.pace,
      avgHeartRate: state.heartRate,
      maxHeartRate: state.heartRate,
      caloriesKcal: estimateCalories(elapsed, settings.weightKg),
      coordinates: state.coordinates,
    };
    await saveRun(run);
    dispatch({ type: 'RESET' });
    router.replace(`/run/summary/${run.id}`);
  }, [stopTracking, dispatch, state, elapsed, saveRun, router, settings.weightKg]);

  // Intercept hardware back button during active or paused run.
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.status !== 'running' && state.status !== 'paused') return false;
      Alert.alert(
        'Abandonar corrida?',
        'Os dados desta corrida serão perdidos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: async () => {
              await stopTracking();
              dispatch({ type: 'RESET' });
              router.back();
            },
          },
        ]
      );
      return true;
    });
    return () => handler.remove();
  }, [state.status, stopTracking, dispatch, router]);

  const isActive = state.status !== 'idle';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>

      {/* Map area: placeholder when idle, live map once running */}
      <View style={styles.mapWrapper}>
        {isActive ? (
          <>
            <RunMap coordinates={state.coordinates} mode='live' />
            {/* GPS status pill — top-right corner overlay */}
            <View style={[
              styles.gpsPill,
              { top: insets.top + 12, backgroundColor: colors.surface + 'EE' },
            ]}>
              <View style={[styles.gpsDot, {
                backgroundColor: gpsStatus === 'active' ? colors.success : colors.warning,
              }]} />
              <Text style={[styles.gpsLabel, { color: colors.text }]}>
                {gpsStatus === 'active' ? `${state.coordinates.length} pts` : 'GPS…'}
              </Text>
            </View>
            {gpsError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.danger }]}>
                <Text style={styles.errorBannerText}>{gpsError}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={[styles.idlePlaceholder, { backgroundColor: colors.card }]}>
            <Ionicons name='location-outline' size={52} color={colors.primary} />
            <Text style={[styles.idleTitle, { color: colors.text }]}>Pronto para correr?</Text>
            <Text style={[styles.idleHint, { color: colors.textSecondary }]}>
              {'Pressione Iniciar e o mapa\naparece automaticamente'}
            </Text>
          </View>
        )}
      </View>

      {/* Live stats — hidden until run starts */}
      {isActive && (
        <LiveStats
          distanceMeters={state.distance}
          paceSecPerKm={state.pace}
          durationSeconds={elapsed}
          heartRate={state.heartRate}
        />
      )}

      <View style={{ paddingBottom: insets.bottom + 8 }}>
        <RunControls
          status={state.status}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onFinish={handleFinish}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrapper: { flex: 1, position: 'relative' },
  idlePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  idleTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'SFProDisplay-Bold' },
  idleHint: { fontSize: 14, fontFamily: 'SFProDisplay-Regular', textAlign: 'center', lineHeight: 20 },
  gpsPill: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsLabel: { fontSize: 12, fontFamily: 'SFProDisplay-Medium' },
  errorBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  errorBannerText: { color: '#FFF', textAlign: 'center', fontSize: 13, fontFamily: 'SFProDisplay-Regular' },
});
