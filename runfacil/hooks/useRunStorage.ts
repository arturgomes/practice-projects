import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate } from '@/store/RunContext';

export type RunRecord = {
  id: string;
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecPerKm: number;
  bestPaceSecPerKm: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  caloriesKcal: number;
  coordinates: Coordinate[];
  notes?: string;
};

const STORAGE_KEY = '@runfacil/runs';

async function loadRuns(): Promise<RunRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as RunRecord[]) : [];
}

async function saveRun(run: RunRecord): Promise<void> {
  const runs = await loadRuns();
  runs.unshift(run);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

async function updateRun(id: string, patch: Partial<RunRecord>): Promise<void> {
  const runs = await loadRuns();
  const idx = runs.findIndex((r) => r.id === id);
  if (idx !== -1) {
    runs[idx] = { ...runs[idx], ...patch };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }
}

async function deleteRun(id: string): Promise<void> {
  const runs = await loadRuns();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(runs.filter((r) => r.id !== id))
  );
}

export function useRunStorage() {
  return { loadRuns, saveRun, updateRun, deleteRun };
}
