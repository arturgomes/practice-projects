// Cross-platform health data interface.
// Metro resolves platform variants automatically:
//   - iOS     -> useHealthData.ios.ts       (Apple HealthKit)
//   - Android -> useHealthData.android.ts   (Health Connect)
//   - other   -> this file                  (no-op fallback)

export type PostRunHealthData = {
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  steps: number | null;
  calories: number | null;
};

export const EMPTY_HEALTH_DATA: PostRunHealthData = {
  avgHeartRate: null,
  maxHeartRate: null,
  steps: null,
  calories: null,
};

export type HealthData = {
  /** Whether a health store is available on this platform/device. */
  isAvailable: boolean;
  /** Prompt for read permissions. Resolves true if the request completed. */
  requestPermissions: () => Promise<boolean>;
  /** Read aggregated metrics recorded during [start, end]. */
  fetchPostRunData: (start: Date, end: Date) => Promise<PostRunHealthData>;
};

export function useHealthData(): HealthData {
  return {
    isAvailable: false,
    requestPermissions: async () => false,
    fetchPostRunData: async () => EMPTY_HEALTH_DATA,
  };
}
