// Apple HealthKit implementation via @kingstinct/react-native-healthkit.
// Reads heart rate, active energy, and steps recorded during a run window
// (typically synced from a paired Apple Watch).
import { useCallback } from 'react';
import {
  isHealthDataAvailable,
  requestAuthorization,
  queryStatisticsForQuantity,
} from '@kingstinct/react-native-healthkit';
import type {
  HealthData,
  PostRunHealthData,
} from './useHealthData';
import { EMPTY_HEALTH_DATA } from './useHealthData';

const HEART_RATE = 'HKQuantityTypeIdentifierHeartRate';
const ACTIVE_ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned';
const STEPS = 'HKQuantityTypeIdentifierStepCount';

const READ_TYPES = [HEART_RATE, ACTIVE_ENERGY, STEPS] as const;

const round = (q?: { quantity: number }) =>
  q ? Math.round(q.quantity) : null;

export function useHealthData(): HealthData {
  const requestPermissions = useCallback(async () => {
    if (!isHealthDataAvailable()) return false;
    try {
      return await requestAuthorization({ toRead: READ_TYPES });
    } catch {
      return false;
    }
  }, []);

  const fetchPostRunData = useCallback(
    async (start: Date, end: Date): Promise<PostRunHealthData> => {
      if (!isHealthDataAvailable()) return EMPTY_HEALTH_DATA;
      const filter = { date: { startDate: start, endDate: end } };
      try {
        const [hr, energy, steps] = await Promise.all([
          queryStatisticsForQuantity(HEART_RATE, ['discreteAverage', 'discreteMax'], {
            filter,
            unit: 'count/min',
          }),
          queryStatisticsForQuantity(ACTIVE_ENERGY, ['cumulativeSum'], {
            filter,
            unit: 'kcal',
          }),
          queryStatisticsForQuantity(STEPS, ['cumulativeSum'], {
            filter,
            unit: 'count',
          }),
        ]);
        return {
          avgHeartRate: round(hr.averageQuantity),
          maxHeartRate: round(hr.maximumQuantity),
          calories: round(energy.sumQuantity),
          steps: round(steps.sumQuantity),
        };
      } catch {
        return EMPTY_HEALTH_DATA;
      }
    },
    []
  );

  return { isAvailable: isHealthDataAvailable(), requestPermissions, fetchPostRunData };
}
