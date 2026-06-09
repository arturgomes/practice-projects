import { useCallback } from 'react';
import { Platform } from 'react-native';

export type PostRunHealthData = {
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  steps: number | null;
  calories: number | null;
};

const empty: PostRunHealthData = {
  avgHeartRate: null,
  maxHeartRate: null,
  steps: null,
  calories: null,
};

function getHC() {
  if (Platform.OS !== 'android') return null;
  try {
    return require('react-native-health-connect');
  } catch {
    return null;
  }
}

export function useHealthConnect() {
  const isAvailable = useCallback(async (): Promise<boolean> => {
    const hc = getHC();
    if (!hc) return false;
    try {
      const status = await hc.getSdkStatus();
      return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }, []);

  const fetchPostRunData = useCallback(
    async (startTime: string, endTime: string): Promise<PostRunHealthData> => {
      if (!(await isAvailable())) return empty;
      const hc = getHC();
      if (!hc) return empty;

      try {
        const ok = await hc.initialize();
        if (!ok) return empty;

        await hc.requestPermission([
          { accessType: 'read', recordType: 'HeartRate' },
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        ]);

        const filter = { operator: 'between' as const, startTime, endTime };
        const [hrRes, stepsRes, calRes] = await Promise.all([
          hc.readRecords('HeartRate', { timeRangeFilter: filter }),
          hc.readRecords('Steps', { timeRangeFilter: filter }),
          hc.readRecords('ActiveCaloriesBurned', { timeRangeFilter: filter }),
        ]);

        const hrSamples: number[] = hrRes.records.flatMap(
          (r: any) => (r.samples ?? []).map((s: any) => s.beatsPerMinute as number)
        );
        const avgHeartRate = hrSamples.length
          ? Math.round(hrSamples.reduce((a, b) => a + b, 0) / hrSamples.length)
          : null;
        const maxHeartRate = hrSamples.length ? Math.max(...hrSamples) : null;
        const steps =
          stepsRes.records.reduce((s: number, r: any) => s + (r.count ?? 0), 0) || null;
        const calories =
          Math.round(
            calRes.records.reduce(
              (s: number, r: any) => s + (r.energy?.inKilocalories ?? 0),
              0
            )
          ) || null;

        return { avgHeartRate, maxHeartRate, steps, calories };
      } catch (err) {
        console.warn('[HealthConnect]', err);
        return empty;
      }
    },
    [isAvailable]
  );

  return { fetchPostRunData, isAvailable };
}
