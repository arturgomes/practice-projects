import { useState, useCallback, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { LOCATION_TASK_NAME, LOCATION_UPDATE_EVENT } from '@/services/locationTask';
import { Coordinate } from '@/store/RunContext';

export type TrackingStatus = 'idle' | 'starting' | 'active' | 'paused' | 'error';

type Options = {
  onCoordinate?: (coord: Coordinate) => void;
};

export function useGPSTracking({ onCoordinate }: Options = {}) {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<EmitterSubscription | null>(null);
  // Keep callback ref stable so the event listener always calls the latest version.
  const onCoordinateRef = useRef(onCoordinate);
  useEffect(() => { onCoordinateRef.current = onCoordinate; }, [onCoordinate]);

  const subscribe = useCallback(() => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = DeviceEventEmitter.addListener(
      LOCATION_UPDATE_EVENT,
      (coord: Coordinate) => onCoordinateRef.current?.(coord)
    );
  }, []);

  const unsubscribe = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return bg === 'granted';
  }, []);

  const startTracking = useCallback(async () => {
    setStatus('starting');
    setError(null);
    const granted = await requestPermissions();
    if (!granted) {
      setStatus('error');
      setError('Permissão de localização negada.');
      return;
    }
    subscribe();
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5,
      deferredUpdatesDistance: 10,
      foregroundService: {
        notificationTitle: 'RunFácil',
        notificationBody: 'Rastreando sua corrida…',
        notificationColor: '#FF6B35',
      },
    });
    setStatus('active');
  }, [requestPermissions, subscribe]);

  const pauseTracking = useCallback(async () => {
    unsubscribe();
    const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setStatus('paused');
  }, [unsubscribe]);

  const stopTracking = useCallback(async () => {
    unsubscribe();
    const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setStatus('idle');
  }, [unsubscribe]);

  // Cleanup on unmount
  useEffect(() => () => { unsubscribe(); }, [unsubscribe]);

  return { status, error, startTracking, pauseTracking, resumeTracking: startTracking, stopTracking };
}
