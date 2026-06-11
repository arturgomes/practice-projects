// Android Health Connect implementation via react-native-health-connect.
// Reads heart rate, active calories, and steps recorded during a run window
// (typically synced from a paired smartwatch's companion app).
import { useCallback } from 'react';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  aggregateRecord,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';
import type { HealthData, PostRunHealthData } from './useHealthData';
import { EMPTY_HEALTH_DATA } from './useHealthData';

const READ_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'Steps' },
];

async function isAvailable(): Promise<boolean> {
  try {
    return (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export function useHealthData(): HealthData {
  const requestPermissions = useCallback(async () => {
    if (!(await isAvailable())) return false;
    try {
      if (!(await initialize())) return false;
      const granted = await requestPermission(READ_PERMISSIONS);
      return granted.length > 0;
    } catch {
      return false;
    }
  }, []);

  const fetchPostRunData = useCallback(
    async (start: Date, end: Date): Promise<PostRunHealthData> => {
      if (!(await isAvailable())) return EMPTY_HEALTH_DATA;
      try {
        if (!(await initialize())) return EMPTY_HEALTH_DATA;
      } catch {
        return EMPTY_HEALTH_DATA;
      }
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      // Each aggregate throws when no data exists in range — isolate failures.
      const safe = async <T>(fn: () => Promise<T>): Promise<T | null> => {
        try {
          return await fn();
        } catch {
          return null;
        }
      };

      const [hr, energy, steps] = await Promise.all([
        safe(() => aggregateRecord({ recordType: 'HeartRate', timeRangeFilter })),
        safe(() => aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter })),
        safe(() => aggregateRecord({ recordType: 'Steps', timeRangeFilter })),
      ]);

      return {
        avgHeartRate: hr && hr.BPM_AVG > 0 ? Math.round(hr.BPM_AVG) : null,
        maxHeartRate: hr && hr.BPM_MAX > 0 ? Math.round(hr.BPM_MAX) : null,
        calories: energy ? Math.round(energy.ACTIVE_CALORIES_TOTAL.inKilocalories) : null,
        steps: steps && steps.COUNT_TOTAL > 0 ? steps.COUNT_TOTAL : null,
      };
    },
    []
  );

  return {
    // Resolved lazily per call; expose true so callers attempt a request.
    isAvailable: true,
    requestPermissions,
    fetchPostRunData,
  };
}
