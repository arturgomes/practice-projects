import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '@/services/locationTask';

export type TrackingStatus = 'idle' | 'starting' | 'active' | 'paused' | 'error';

export function useGPSTracking() {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);

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
  }, [requestPermissions]);

  const stopTracking = useCallback(async () => {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    ).catch(() => false);
    if (isRunning) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setStatus('idle');
  }, []);

  return { status, error, startTracking, stopTracking };
}
