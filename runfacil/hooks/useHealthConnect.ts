// Phase 5: Android Health Connect integration via react-native-health-connect
// Reads heart rate, steps, and calories synced by the smartwatch companion app.
export function useHealthConnect() {
  const fetchPostRunData = async (
    _startTime: string,
    _endTime: string
  ): Promise<{
    avgHeartRate: number | null;
    maxHeartRate: number | null;
    steps: number | null;
    calories: number | null;
  }> => {
    return { avgHeartRate: null, maxHeartRate: null, steps: null, calories: null };
  };

  return { fetchPostRunData };
}
