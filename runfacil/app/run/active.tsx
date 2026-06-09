import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { useRun, Coordinate, RunStatus } from '@/store/RunContext';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useRunStorage, RunRecord } from '@/hooks/useRunStorage';
import { useRunCalculations } from '@/hooks/useRunCalculations';
import { useAudioCues } from '@/hooks/useAudioCues';
import { useHeartRate } from '@/hooks/useHeartRate';
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
  const { checkMilestone, reset: resetAudioCues } = useAudioCues(settings.audioCuesEnabled);
  const { heartRate: bleHR, isConnected: bleConnected, isScanning: bleScanning, startScan, stopScan, disconnect: bleDisconnect } =
    useHeartRate();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const elapsed = useElapsedSeconds(state.startedAt, state.pausedDuration, state.status);

  const handleCoordinate = useCallback(
    (coord: Coordinate) => dispatch({ type: 'ADD_COORDINATE', payload: coord }),
    [dispatch]
  );

  const { status: gpsStatus, error: gpsError, startTracking, pauseTracking, resumeTracking, stopTracking } =
    useGPSTracking({ onCoordinate: handleCoordinate });

  // Sync live BLE heart rate into RunContext.
  useEffect(() => {
    if (bleHR !== null) dispatch({ type: 'SET_HEART_RATE', payload: bleHR });
  }, [bleHR, dispatch]);

  // Recalculate distance + rolling pace, then check km milestones.
  useEffect(() => {
    if (state.status !== 'running' || state.coordinates.length < 2) return;
    const dist = calculateDistance(state.coordinates);
    dispatch({ type: 'SET_DISTANCE', payload: dist });
    const pace = calculatePace(dist);
    if (pace > 0) {
      dispatch({ type: 'SET_PACE', payload: pace });
      checkMilestone(dist, pace);
    }
  }, [state.coordinates, state.status, calculateDistance, calculatePace, dispatch, checkMilestone]);

  const handleStart = useCallback(async () => {
    dispatch({ type: 'START', payload: { timestamp: Date.now() } });
    resetPaceWindow();
    resetAudioCues();
    await startTracking();
    // Attempt to connect to a nearby heart rate monitor automatically.
    startScan();
  }, [dispatch, resetPaceWindow, resetAudioCues, startTracking, startScan]);

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
    await bleDisconnect();
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
  }, [stopTracking, bleDisconnect, dispatch, state, elapsed, saveRun, router, settings.weightKg]);

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
              await bleDisconnect();
              dispatch({ type: 'RESET' });
              router.back();
            },
          },
        ]
      );
      return true;
    });
    return () => handler.remove();
  }, [state.status, stopTracking, bleDisconnect, dispatch, router]);

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
            {/* BLE heart rate pill — top-left corner overlay */}
            {(bleConnected || bleScanning) && (
              <View style={[
                styles.blePill,
                { top: insets.top + 12, backgroundColor: colors.surface + 'EE' },
              ]}>
                <Ionicons
                  name={bleConnected ? 'heart' : 'bluetooth'}
                  size={12}
                  color={bleConnected ? colors.heartRate : colors.warning}
                />
                <Text style={[styles.gpsLabel, { color: colors.text }]}>
                  {bleConnected ? `${state.heartRate ?? '–'} bpm` : 'BLE…'}
                </Text>
              </View>
            )}
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

            {/* BLE pairing button */}
            <TouchableOpacity
              style={[
                styles.bleBtn,
                {
                  backgroundColor: bleConnected ? colors.success + '22' : colors.surface,
                  borderColor: bleConnected ? colors.success : colors.border,
                },
              ]}
              onPress={bleConnected ? bleDisconnect : bleScanning ? stopScan : startScan}
              activeOpacity={0.75}
            >
              <Ionicons
                name={bleConnected ? 'heart' : bleScanning ? 'bluetooth' : 'watch-outline'}
                size={16}
                color={bleConnected ? colors.success : bleScanning ? colors.warning : colors.textSecondary}
              />
              <Text style={[styles.bleBtnLabel, { color: bleConnected ? colors.success : colors.textSecondary }]}>
                {bleConnected
                  ? 'Relógio conectado'
                  : bleScanning
                  ? 'Buscando relógio…'
                  : 'Conectar relógio'}
              </Text>
            </TouchableOpacity>
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
  blePill: {
    position: 'absolute',
    left: 12,
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
  bleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  bleBtnLabel: { fontSize: 13, fontFamily: 'SFProDisplay-Regular' },
});
