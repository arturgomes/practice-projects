import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useSettings } from '@/hooks/useSettings';
import { useRun, Coordinate, RunStatus } from '@/store/RunContext';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { useRunCalculations } from '@/hooks/useRunCalculations';
import { LiveStats } from '@/components/LiveStats';
import { RunControls } from '@/components/RunControls';
import { estimateCalories } from '@/constants/units';

// Computes elapsed run seconds, pausing the counter when status !== 'running'.
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
    // Compute immediately on resume so there's no 1-second lag.
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

  const { colors } = useSettings();
  const { settings } = useSettings();
  const { state, dispatch } = useRun();
  const { saveRun } = useRunStorage();
  const { calculateDistance, calculatePace, resetPaceWindow } = useRunCalculations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const elapsed = useElapsedSeconds(state.startedAt, state.pausedDuration, state.status);

  // Receive each GPS coordinate and append it to the run context.
  const handleCoordinate = useCallback(
    (coord: Coordinate) => dispatch({ type: 'ADD_COORDINATE', payload: coord }),
    [dispatch]
  );

  const { status: gpsStatus, error: gpsError, startTracking, pauseTracking, resumeTracking, stopTracking } =
    useGPSTracking({ onCoordinate: handleCoordinate });

  // Recalculate distance and rolling pace whenever coordinates array grows.
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

  // Intercept hardware back button during an active/paused run.
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

      {/* Map area — replaced with MapLibre in Phase 2 */}
      <View style={[styles.mapArea, { backgroundColor: colors.card }]}>
        {!isActive ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {'Pressione Iniciar\npara começar'}
          </Text>
        ) : (
          <View style={styles.gpsInfo}>
            <View style={[styles.gpsDot, {
              backgroundColor: gpsStatus === 'active' ? colors.success : colors.warning,
            }]} />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {gpsStatus === 'active'
                ? `${state.coordinates.length} pontos GPS capturados`
                : 'Aguardando GPS…'}
            </Text>
            {gpsError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{gpsError}</Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Stats panel — hidden until run starts */}
      {isActive && (
        <LiveStats
          distanceMeters={state.distance}
          paceSecPerKm={state.pace}
          durationSeconds={elapsed}
          heartRate={state.heartRate}
        />
      )}

      {/* Start / Pause / Resume / Finish controls */}
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
  mapArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gpsInfo: { alignItems: 'center', gap: 10 },
  gpsDot: { width: 14, height: 14, borderRadius: 7 },
  hint: { fontSize: 15, fontFamily: 'SFProDisplay-Regular', textAlign: 'center', lineHeight: 22 },
  errorText: { fontSize: 13, fontFamily: 'SFProDisplay-Regular', textAlign: 'center' },
});
